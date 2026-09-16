/**
 * @description Server-side service handling customer order return transactions.
 *              Validates customer identity, order ownership, eligibility, item validity,
 *              and remaining returnable quantities.
 *              Calculates refund amounts from historical OrderItem prices.
 *              Restores inventory stock and logs Return inventory transactions.
 *              All operations run atomically within a Database savepoint.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceReturnService {

    /**
     * @description Test-only flag to simulate a transaction failure after DML
     *              to verify savepoint rollback undoes all changes.
     */
    @TestVisible
    private static Boolean forceTransactionFailure = false;

    /**
     * @description Request item wrapper sent from client.
     */
    public class ReturnItemRequest {
        @AuraEnabled public Id orderItemId;
        @AuraEnabled public Integer quantity;
    }

    /**
     * @description Return processing result wrapper.
     */
    public class ReturnResult {
        @AuraEnabled public Id returnId;
        @AuraEnabled public String returnStatus;
        @AuraEnabled public Decimal refundAmount;
    }

    /**
     * @description Processes a customer return request atomically.
     * @param orderId Target Order__c Id.
     * @param items List of ReturnItemRequest items.
     * @param returnReason Reason string matching an active Return_Reason__c picklist value.
     * @return ReturnResult summary object.
     */
    @AuraEnabled
    public static ReturnResult createReturn(
        Id orderId,
        List<ReturnItemRequest> items,
        String returnReason
    ) {
        // Step 1: Resolve customer ContactId from UserInfo (never trust client)
        Id contactId = resolveCustomerContactId();

        // Step 2: Validate inputs
        if (orderId == null) {
            throw new AuraHandledException('Order ID is required.');
        }
        if (items == null || items.isEmpty()) {
            throw new AuraHandledException('Return item list cannot be empty.');
        }
        validateReturnReason(returnReason);

        Map<Id, Integer> requestedQtyByOrderItemId = validateAndAggregateItems(items);
        Set<Id> requestedOrderItemIds = requestedQtyByOrderItemId.keySet();

        // Step 3 & 4: Validate order ownership and return eligibility
        Order__c order = validateOrderOwnershipAndEligibility(orderId, contactId);

        // Step 5: Load OrderItems and verify they belong to requested order
        Map<Id, OrderItem__c> orderItemMap = validateOrderItems(orderId, requestedOrderItemIds);

        // Step 6: Over-returning prevention (check remaining returnable quantity)
        validateRemainingQuantities(orderItemMap, requestedQtyByOrderItemId);

        // Step 7: Refund calculation using historical OrderItem Unit_Price__c
        Decimal totalRefundAmount = 0;
        Map<Id, Decimal> itemRefundMap = new Map<Id, Decimal>();

        for (Id oiId : requestedOrderItemIds) {
            OrderItem__c oi = orderItemMap.get(oiId);
            Integer returnQty = requestedQtyByOrderItemId.get(oiId);
            Decimal itemRefund = (oi.Unit_Price__c * returnQty).setScale(2, System.RoundingMode.HALF_UP);
            itemRefundMap.put(oiId, itemRefund);
            totalRefundAmount += itemRefund;
        }
        totalRefundAmount = totalRefundAmount.setScale(2, System.RoundingMode.HALF_UP);

        // Step 8, 9, 10, 11: Atomic execution with Savepoint
        Savepoint sp = Database.setSavepoint();

        try {
            Return__c returnRecord = new Return__c(
                Order__c = orderId,
                Return_Status__c = 'Requested',
                Return_Reason__c = returnReason,
                Return_Date__c = Date.today(),
                Refund_Amount__c = totalRefundAmount
            );
            List<Return_Item__c> returnItems = new List<Return_Item__c>();
            for (Id oiId : requestedOrderItemIds) {
                returnItems.add(new Return_Item__c(
                    Return__c = null,
                    Order_Item__c = oiId,
                    Return_Quantity__c = requestedQtyByOrderItemId.get(oiId),
                    Refund_Amount__c = itemRefundMap.get(oiId)
                ));
            }

            OrderItemService oiService = new OrderItemService();
            oiService.insertReturnRecords(returnRecord, returnItems);

            // Aggregate returned variant quantities for stock restoration
            Map<Id, Integer> qtyByVariantId = new Map<Id, Integer>();
            for (Id oiId : requestedOrderItemIds) {
                OrderItem__c oi = orderItemMap.get(oiId);
                Integer returnQty = requestedQtyByOrderItemId.get(oiId);
                Id variantId = oi.Product_Variant__c;
                Integer existing = qtyByVariantId.containsKey(variantId) ? qtyByVariantId.get(variantId) : 0;
                qtyByVariantId.put(variantId, existing + returnQty);
            }

            // Restore inventory & log return transactions in elevated InventoryService
            InventoryService invService = new InventoryService();
            Map<Id, Inventory__c> lockedInventory = invService.loadAndLockInventoryForUpdate(qtyByVariantId.keySet());
            invService.restoreStockAndCreateTransactions(qtyByVariantId, lockedInventory);

            if (forceTransactionFailure) {
                throw new DmlException('Simulated transaction failure for rollback testing.');
            }

            ReturnResult result = new ReturnResult();
            result.returnId = returnRecord.Id;
            result.returnStatus = 'Requested';
            result.refundAmount = totalRefundAmount;
            return result;

        } catch (Exception e) {
            Database.rollback(sp);
            if (e instanceof AuraHandledException) {
                throw e;
            }
            throw new AuraHandledException(
                'An error occurred while processing your return request. Please try again.'
            );
        }
    }

    /**
     * @description Resolves logged-in customer's ContactId.
     */
    private static Id resolveCustomerContactId() {
        Id userId = UserInfo.getUserId();
        List<User> users = [
            SELECT ContactId
            FROM User
            WHERE Id = :userId
            LIMIT 1
        ];
        if (users.isEmpty() || users[0].ContactId == null) {
            throw new AuraHandledException(
                'Your account is not associated with a customer profile. Please contact support.'
            );
        }
        return users[0].ContactId;
    }

    /**
     * @description Validates that returnReason matches an active picklist value.
     */
    private static void validateReturnReason(String returnReason) {
        if (String.isBlank(returnReason)) {
            throw new AuraHandledException('A valid return reason is required.');
        }
        List<Schema.PicklistEntry> entries = Return__c.Return_Reason__c.getDescribe().getPicklistValues();
        Boolean isValid = false;
        for (Schema.PicklistEntry entry : entries) {
            if (entry.isActive() && entry.getValue() == returnReason) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            throw new AuraHandledException('The selected return reason is invalid.');
        }
    }

    /**
     * @description Validates item parameters and aggregates duplicate OrderItem IDs.
     */
    private static Map<Id, Integer> validateAndAggregateItems(List<ReturnItemRequest> items) {
        Map<Id, Integer> aggregated = new Map<Id, Integer>();
        for (ReturnItemRequest item : items) {
            if (item == null) {
                throw new AuraHandledException('Invalid return item detected.');
            }
            if (item.orderItemId == null) {
                throw new AuraHandledException('An order item selection is missing.');
            }
            if (item.quantity == null || item.quantity <= 0) {
                throw new AuraHandledException('Return quantity must be greater than zero.');
            }
            Integer existing = aggregated.containsKey(item.orderItemId) ? aggregated.get(item.orderItemId) : 0;
            aggregated.put(item.orderItemId, existing + item.quantity);
        }
        return aggregated;
    }

    /**
     * @description Validates order existence, customer ownership, and eligibility.
     */
    private static Order__c validateOrderOwnershipAndEligibility(Id orderId, Id contactId) {
        List<Order__c> orders = [
            SELECT Id, Contact__c, Order_Status__c
            FROM Order__c
            WHERE Id = :orderId
            LIMIT 1
        ];
        if (orders.isEmpty()) {
            throw new AuraHandledException('The specified order could not be found.');
        }
        Order__c order = orders[0];
        if (order.Contact__c != contactId) {
            throw new AuraHandledException('You cannot return an order that does not belong to your account.');
        }
        if (order.Order_Status__c == 'Cancelled') {
            throw new AuraHandledException('Cancelled orders are not eligible for return.');
        }
        return order;
    }

    /**
     * @description Validates requested OrderItems exist and belong to specified order.
     *              Locks the OrderItem__c rows using FOR UPDATE via narrow OrderItemService helper.
     */
    private static Map<Id, OrderItem__c> validateOrderItems(Id orderId, Set<Id> requestedOrderItemIds) {
        OrderItemService service = new OrderItemService();
        Map<Id, OrderItem__c> itemMap = service.loadAndLockOrderItems(requestedOrderItemIds);

        if (itemMap.size() != requestedOrderItemIds.size()) {
            throw new AuraHandledException('One or more selected order items could not be found.');
        }
        for (OrderItem__c oi : itemMap.values()) {
            if (oi.Order__c != orderId) {
                throw new AuraHandledException('One or more items do not belong to the specified order.');
            }
        }
        return itemMap;
    }

    /**
     * @description Calculates remaining returnable quantity for each item and prevents over-returning.
     */
    private static void validateRemainingQuantities(
        Map<Id, OrderItem__c> orderItemMap,
        Map<Id, Integer> requestedQtyByOrderItemId
    ) {
        Set<Id> oiIds = orderItemMap.keySet();
        OrderItemService service = new OrderItemService();
        List<Return_Item__c> previousReturns = service.loadPreviousReturns(oiIds);

        Map<Id, Decimal> previouslyReturnedQtyMap = new Map<Id, Decimal>();
        for (Return_Item__c ri : previousReturns) {
            Decimal currentSum = previouslyReturnedQtyMap.containsKey(ri.Order_Item__c)
                ? previouslyReturnedQtyMap.get(ri.Order_Item__c)
                : 0;
            previouslyReturnedQtyMap.put(ri.Order_Item__c, currentSum + (ri.Return_Quantity__c != null ? ri.Return_Quantity__c : 0));
        }

        for (Id oiId : oiIds) {
            OrderItem__c oi = orderItemMap.get(oiId);
            Decimal purchasedQty = oi.Quantity__c != null ? oi.Quantity__c : 0;
            Decimal prevReturnedQty = previouslyReturnedQtyMap.containsKey(oiId)
                ? previouslyReturnedQtyMap.get(oiId)
                : 0;
            Decimal remainingQty = purchasedQty - prevReturnedQty;
            Integer requestedQty = requestedQtyByOrderItemId.get(oiId);

            if (requestedQty > remainingQty) {
                throw new AuraHandledException(
                    'Return quantity exceeds the remaining eligible quantity for one or more items.'
                );
            }
        }
    }

    /**
     * @description Narrow internal helper with without sharing context to load and lock
     *              OrderItem__c and Return_Item__c records for ALREADY AUTHORIZED orders.
     *              Order ownership is validated server-side by the caller before invoking this helper.
     */
    private without sharing class OrderItemService {

        /**
         * @description Loads requested OrderItems and acquires row-level locks (FOR UPDATE).
         */
        public Map<Id, OrderItem__c> loadAndLockOrderItems(Set<Id> requestedOrderItemIds) {
            List<OrderItem__c> items = [
                SELECT Id, Order__c, Product_Variant__c, Quantity__c, Unit_Price__c
                FROM OrderItem__c
                WHERE Id IN :requestedOrderItemIds
                WITH SYSTEM_MODE
                FOR UPDATE
            ];
            Map<Id, OrderItem__c> itemMap = new Map<Id, OrderItem__c>();
            for (OrderItem__c oi : items) {
                itemMap.put(oi.Id, oi);
            }
            return itemMap;
        }

        /**
         * @description Queries previous Return_Item__c records for the specified OrderItems.
         */
        public List<Return_Item__c> loadPreviousReturns(Set<Id> oiIds) {
            return [
                SELECT Order_Item__c, Return_Quantity__c
                FROM Return_Item__c
                WHERE Order_Item__c IN :oiIds
                WITH SYSTEM_MODE
            ];
        }

        /**
         * @description Inserts Return__c and Return_Item__c records in system mode (without sharing)
         *              to prevent INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY checks on OrderItem__c lookup.
         */
        public void insertReturnRecords(Return__c returnRecord, List<Return_Item__c> returnItems) {
            Database.insert(returnRecord, AccessLevel.SYSTEM_MODE);
            for (Return_Item__c ri : returnItems) {
                if (ri.Return__c == null) {
                    ri.Return__c = returnRecord.Id;
                }
            }
            Database.insert(returnItems, AccessLevel.SYSTEM_MODE);
        }
    }

    /**
     * @description Elevated inner service for internal inventory management.
     *              Customers do not have direct access to Inventory__c / Inventory_Transaction__c.
     */
    private without sharing class InventoryService {

        public Map<Id, Inventory__c> loadAndLockInventoryForUpdate(Set<Id> variantIds) {
            List<Inventory__c> inventories = [
                SELECT Id, Product_Variant__c, Available_Stock__c, Active__c
                FROM Inventory__c
                WHERE Product_Variant__c IN :variantIds
                  AND Active__c = true
                WITH SYSTEM_MODE
                FOR UPDATE
            ];
            Map<Id, Inventory__c> result = new Map<Id, Inventory__c>();
            for (Inventory__c inv : inventories) {
                if (result.containsKey(inv.Product_Variant__c)) {
                    throw new AuraHandledException(
                        'Multiple active inventory records exist for a product variant.'
                    );
                }
                result.put(inv.Product_Variant__c, inv);
            }
            if (result.size() != variantIds.size()) {
                throw new AuraHandledException(
                    'Active inventory record missing for one or more returned products.'
                );
            }
            return result;
        }

        public void restoreStockAndCreateTransactions(
            Map<Id, Integer> qtyByVariantId,
            Map<Id, Inventory__c> lockedInventory
        ) {
            List<Inventory__c> inventoriesToUpdate = new List<Inventory__c>();
            List<Inventory_Transaction__c> transactions = new List<Inventory_Transaction__c>();

            for (Id variantId : qtyByVariantId.keySet()) {
                Inventory__c inv = lockedInventory.get(variantId);
                Integer qty = qtyByVariantId.get(variantId);

                inv.Available_Stock__c = (inv.Available_Stock__c != null ? inv.Available_Stock__c : 0) + qty;
                inventoriesToUpdate.add(inv);

                transactions.add(new Inventory_Transaction__c(
                    Inventory__c = inv.Id,
                    Transaction_Type__c = 'Return',
                    Quantity__c = qty,
                    Transaction_Date__c = Date.today()
                ));
            }

            Database.update(inventoriesToUpdate, AccessLevel.SYSTEM_MODE);
            Database.insert(transactions, AccessLevel.SYSTEM_MODE);
        }
    }
}
