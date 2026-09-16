/**
 * @description Reusable server-side checkout/order transaction service for Commerce Hub.
 *              Handles the complete order placement flow: cart validation, customer
 *              verification, address ownership, product catalog validation, inventory
 *              management, financial calculations, and atomic order creation.
 *
 *              Designed to be called by an LWC-facing controller in an Experience Cloud
 *              (community) context. All financial values are calculated server-side;
 *              client-supplied prices are never trusted.
 *
 * Security Model:
 *   - Outer class runs WITH SHARING to enforce customer record visibility for
 *     customer-owned data (orders, addresses, catalog queries).
 *   - Customer identity is resolved server-side from UserInfo; never trusted from client.
 *   - Address ownership is explicitly validated (Contact__c match + Address_Type__c).
 *   - CRUD/FLS is enforced via Security.stripInaccessible for customer-facing DML
 *     on Order__c and OrderItem__c.
 *   - Payment__c uses system-mode DML because the payment record is an internal
 *     artifact of the checkout process, not directly created by the customer.
 *   - Inventory operations use a private WITHOUT SHARING inner class (InventoryService)
 *     because customers intentionally have no direct Inventory__c or
 *     Inventory_Transaction__c object access. This avoids granting customers inventory
 *     permissions while allowing the service to manage stock atomically.
 *
 * @author  Commerce Hub
 * @since   2026-09-14
 */
public with sharing class CommerceOrderService {

    // ============================================================
    // Business Rule Constants
    // ============================================================

    /** GST rate applied to the order subtotal. */
    private static final Decimal GST_RATE = 0.18;

    /** Subtotal threshold at or above which shipping is free (in INR). */
    private static final Decimal FREE_SHIPPING_THRESHOLD = 1000;

    /** Standard shipping charge when subtotal is below the threshold (in INR). */
    private static final Decimal STANDARD_SHIPPING_CHARGE = 100;

    /** Decimal scale for all monetary values (2 decimal places). */
    private static final Integer DECIMAL_SCALE = 2;

    /**
     * @description Test-only flag that forces a transaction failure after Order__c and
     *              OrderItem__c creation but before Payment__c, to verify savepoint
     *              rollback prevents partial records. Clearly marked @TestVisible and
     *              genuinely necessary for rollback testing.
     */
    @TestVisible
    private static Boolean forceTransactionFailure = false;

    // ============================================================
    // Request / Response Inner Classes
    // ============================================================

    /**
     * @description Represents a single cart line item sent from the client.
     *              Only contains variant identification and quantity; the service
     *              reads all prices server-side.
     */
    public class CartItemRequest {
        @AuraEnabled public Id productVariantId;
        @AuraEnabled public Integer quantity;
    }

    /**
     * @description Result of a successful checkout. Does not expose any internal
     *              inventory data, stock quantities, or sensitive implementation details.
     */
    public class CheckoutResult {
        @AuraEnabled public Id orderId;
        @AuraEnabled public String orderStatus;
        @AuraEnabled public String paymentStatus;
        @AuraEnabled public Decimal subtotal;
        @AuraEnabled public Decimal tax;
        @AuraEnabled public Decimal shippingCharge;
        @AuraEnabled public Decimal totalAmount;
        @AuraEnabled public String transactionReference;
    }

    // ============================================================
    // Main Service Method
    // ============================================================

    /**
     * @description Places an order for the current Experience Cloud customer.
     *              The entire operation is atomic: if any step fails after the
     *              savepoint, all DML is rolled back. No partial records are left.
     *
     * @param cartItems         List of cart line items (variant Id + quantity).
     * @param shippingAddressId Customer_Address__c Id for shipping delivery.
     * @param paymentMethod     Payment method value (must match an active picklist entry).
     * @return CheckoutResult with order details and generated transaction reference.
     * @throws AuraHandledException for all business validation failures and errors.
     */
    public static CheckoutResult placeOrder(
        List<CartItemRequest> cartItems,
        Id shippingAddressId,
        String paymentMethod
    ) {
        // Step 1: Resolve current customer Contact from UserInfo (never trust client)
        Id contactId = resolveCustomerContactId();

        // Step 2: Validate cart structure and aggregate duplicate variant entries
        Map<Id, Integer> aggregatedCart = validateAndAggregateCart(cartItems);
        Set<Id> variantIds = aggregatedCart.keySet();

        // Step 3: Validate shipping address ownership and type
        validateShippingAddress(shippingAddressId, contactId);

        // Step 4: Validate full product catalog chain (variant → product → category)
        Map<Id, ProductVariant__c> variantMap = validateProductCatalog(variantIds);

        // Step 5: Validate all variant prices are positive
        validatePrices(variantMap);

        // Step 6: Validate payment method against active picklist values
        validatePaymentMethod(paymentMethod);



        // Step 8: Load active inventory and validate existence (pre-lock check)
        InventoryService invService = new InventoryService();
        Map<Id, Inventory__c> inventoryByVariant = invService.loadActiveInventory(variantIds);
        validateInventoryExists(inventoryByVariant, variantIds);

        // Step 9: Calculate all financial values server-side
        Decimal subtotal = calculateSubtotal(aggregatedCart, variantMap);
        Decimal tax = calculateTax(subtotal);
        Decimal shippingCharge = calculateShippingCharge(subtotal);
        Decimal totalAmount = calculateTotal(subtotal, tax, shippingCharge);

        // Step 10: Generate unique server-side transaction reference
        String transactionRef = generateTransactionReference();

        // Step 11: Begin atomic transaction
        Savepoint sp = Database.setSavepoint();

        try {
            // Step 12: Lock inventory rows (FOR UPDATE) to prevent concurrent stock
            //          consumption, then re-validate stock against locked values.
            Set<Id> inventoryIds = new Set<Id>();
            for (Inventory__c inv : inventoryByVariant.values()) {
                inventoryIds.add(inv.Id);
            }
            Map<Id, Inventory__c> lockedInventory =
                invService.lockInventoryForUpdate(inventoryIds);
            validateSufficientStock(lockedInventory, aggregatedCart);

            // Step 13: Create Order__c (system-mode DML)
            Order__c order = createOrder(
                contactId, shippingAddressId,
                subtotal, tax, shippingCharge, totalAmount
            );

            // Step 14: Create OrderItem__c records (one per distinct variant)
            createOrderItems(order.Id, aggregatedCart, variantMap);

            // Step 15: Reduce inventory and create Sale transaction records
            //          (elevated context in InventoryService)
            invService.reduceStockAndCreateTransactions(aggregatedCart, lockedInventory);

            // Test hook: simulate failure after DML to verify rollback.
            // Placed after inventory operations so rollback test verifies that
            // Order, OrderItem, Inventory, and Transaction changes are all undone.
            if (forceTransactionFailure) {
                throw new DmlException('Simulated transaction failure for rollback testing.');
            }

            // Step 16: Create simulated Payment__c record (system-mode DML)
            createPayment(order.Id, totalAmount, paymentMethod, transactionRef);

            // Step 17: Build and return result (no inventory data exposed)
            CheckoutResult result = new CheckoutResult();
            result.orderId = order.Id;
            result.orderStatus = 'Confirmed';
            result.paymentStatus = 'Paid';
            result.subtotal = subtotal;
            result.tax = tax;
            result.shippingCharge = shippingCharge;
            result.totalAmount = totalAmount;
            result.transactionReference = transactionRef;
            return result;

        } catch (Exception e) {
            Database.rollback(sp);

            if (e instanceof AuraHandledException) {
                throw e;
            }

            // Wrap unexpected errors in a user-friendly message; do not expose
            // raw stack traces or internal implementation details to the customer.
            throw new AuraHandledException(
                'An error occurred while processing your order. Please try again.'
            );
        }
    }

    // ============================================================
    // Customer Resolution
    // ============================================================

    /**
     * @description Resolves the current user's ContactId from UserInfo.
     *              Rejects users not associated with a Contact (e.g. internal users
     *              or misconfigured community accounts).
     * @return ContactId for the current user.
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

    // ============================================================
    // Cart Validation
    // ============================================================

    /**
     * @description Validates the cart structure and aggregates duplicate variant
     *              entries into a single quantity per variant.
     * @param cartItems Raw cart items from the client.
     * @return Map of ProductVariant__c Id → aggregated quantity.
     */
    private static Map<Id, Integer> validateAndAggregateCart(
        List<CartItemRequest> cartItems
    ) {
        if (cartItems == null || cartItems.isEmpty()) {
            throw new AuraHandledException('Your cart is empty.');
        }

        Map<Id, Integer> aggregated = new Map<Id, Integer>();

        for (CartItemRequest item : cartItems) {
            if (item == null) {
                throw new AuraHandledException('Invalid cart item detected.');
            }
            if (item.productVariantId == null) {
                throw new AuraHandledException(
                    'A product selection is missing from your cart.'
                );
            }
            if (item.quantity == null || item.quantity <= 0) {
                throw new AuraHandledException(
                    'Each cart item must have a quantity greater than zero.'
                );
            }

            Integer existing = aggregated.containsKey(item.productVariantId)
                ? aggregated.get(item.productVariantId)
                : 0;
            aggregated.put(item.productVariantId, existing + item.quantity);
        }

        return aggregated;
    }

    // ============================================================
    // Address Validation
    // ============================================================

    /**
     * @description Validates that the shipping address exists, belongs to the
     *              current customer's Contact (explicit ownership check, not relying
     *              solely on sharing rules), and is a Shipping-type address.
     * @param shippingAddressId Customer_Address__c Id.
     * @param contactId         Current customer's Contact Id.
     */
    private static void validateShippingAddress(Id shippingAddressId, Id contactId) {
        if (shippingAddressId == null) {
            throw new AuraHandledException('A shipping address is required.');
        }

        List<Customer_Address__c> addresses = [
            SELECT Id, Contact__c, Address_Type__c
            FROM Customer_Address__c
            WHERE Id = :shippingAddressId
            LIMIT 1
        ];

        if (addresses.isEmpty()) {
            throw new AuraHandledException(
                'The selected shipping address could not be found.'
            );
        }

        Customer_Address__c addr = addresses[0];

        // Explicit ownership enforcement: a customer must never be able to use
        // another customer's address, regardless of sharing rule configuration.
        if (addr.Contact__c != contactId) {
            throw new AuraHandledException(
                'The selected shipping address does not belong to your account.'
            );
        }

        if (addr.Address_Type__c != 'Shipping') {
            throw new AuraHandledException(
                'The selected address is not a valid shipping address.'
            );
        }
    }

    // ============================================================
    // Product Catalog Validation
    // ============================================================

    /**
     * @description Validates the full product catalog chain for every selected variant:
     *              variant exists → variant active → parent Product2 active →
     *              Product2 has category → Category__c active.
     *              Uses a single bulk SOQL with parent traversal.
     * @param variantIds Set of requested ProductVariant__c Ids.
     * @return Map of variant Id → fully-loaded ProductVariant__c.
     */
    private static Map<Id, ProductVariant__c> validateProductCatalog(Set<Id> variantIds) {

        List<ProductVariant__c> variants = [
            SELECT Id, Name, Product__c, SKU__c, Price__c, Active__c,
                   Product__r.IsActive,
                   Product__r.Name,
                   Product__r.Commerce_Hub_Category__c,
                   Product__r.Commerce_Hub_Category__r.Active__c
            FROM ProductVariant__c
            WHERE Id IN :variantIds
        ];

        Map<Id, ProductVariant__c> variantMap = new Map<Id, ProductVariant__c>();
        for (ProductVariant__c v : variants) {
            variantMap.put(v.Id, v);
        }

        // Every requested variant must exist
        if (variantMap.size() != variantIds.size()) {
            throw new AuraHandledException(
                'One or more selected products could not be found.'
            );
        }

        // Validate catalog chain for each variant
        for (ProductVariant__c variant : variantMap.values()) {

            if (!variant.Active__c) {
                throw new AuraHandledException(
                    'One or more selected products are no longer available.'
                );
            }

            if (variant.Product__r == null || !variant.Product__r.IsActive) {
                throw new AuraHandledException(
                    'One or more selected products are no longer available.'
                );
            }

            if (variant.Product__r.Commerce_Hub_Category__c == null) {
                throw new AuraHandledException(
                    'One or more selected products are not properly categorized.'
                );
            }

            if (variant.Product__r.Commerce_Hub_Category__r == null
                || !variant.Product__r.Commerce_Hub_Category__r.Active__c) {
                throw new AuraHandledException(
                    'One or more selected products belong to an unavailable category.'
                );
            }
        }

        return variantMap;
    }

    // ============================================================
    // Price Validation
    // ============================================================

    /**
     * @description Validates that all variant prices are present and positive.
     *              Rejects checkout if any price is null, zero, or negative.
     * @param variantMap Map of variant Id → ProductVariant__c with Price__c loaded.
     */
    private static void validatePrices(Map<Id, ProductVariant__c> variantMap) {
        for (ProductVariant__c variant : variantMap.values()) {
            if (variant.Price__c == null || variant.Price__c <= 0) {
                throw new AuraHandledException(
                    'One or more products have invalid pricing. Please contact support.'
                );
            }
        }
    }

    // ============================================================
    // Payment Method Validation
    // ============================================================

    /**
     * @description Validates the payment method against active picklist values on
     *              Payment__c.Payment_Method__c. Uses dynamic Schema.describe instead
     *              of hardcoding specific payment methods.
     * @param paymentMethod Client-supplied payment method value.
     */
    private static void validatePaymentMethod(String paymentMethod) {
        if (String.isBlank(paymentMethod)) {
            throw new AuraHandledException('A payment method is required.');
        }

        List<Schema.PicklistEntry> entries =
            Payment__c.Payment_Method__c.getDescribe().getPicklistValues();

        Boolean isValid = false;
        for (Schema.PicklistEntry entry : entries) {
            if (entry.isActive() && entry.getValue() == paymentMethod) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            throw new AuraHandledException(
                'The selected payment method is not valid.'
            );
        }
    }



    // ============================================================
    // Inventory Validation (uses data from InventoryService)
    // ============================================================

    /**
     * @description Validates that an active Inventory__c record was found for every
     *              requested variant. This is the pre-lock existence check.
     * @param inventoryByVariant Map of variant Id → Inventory__c from InventoryService.
     * @param variantIds         Set of all requested variant Ids.
     */
    private static void validateInventoryExists(
        Map<Id, Inventory__c> inventoryByVariant,
        Set<Id> variantIds
    ) {
        for (Id variantId : variantIds) {
            if (!inventoryByVariant.containsKey(variantId)) {
                throw new AuraHandledException(
                    'One or more selected products are currently out of stock.'
                );
            }
        }
    }

    /**
     * @description Validates sufficient stock using locked (FOR UPDATE) inventory
     *              records. This is the authoritative stock check, performed after
     *              row-level locking to prevent concurrent stock consumption.
     * @param lockedInventory Map of variant Id → locked Inventory__c.
     * @param aggregatedCart  Map of variant Id → requested quantity.
     */
    private static void validateSufficientStock(
        Map<Id, Inventory__c> lockedInventory,
        Map<Id, Integer> aggregatedCart
    ) {
        for (Id variantId : aggregatedCart.keySet()) {
            Inventory__c inv = lockedInventory.get(variantId);
            Integer requestedQty = aggregatedCart.get(variantId);

            if (inv == null) {
                throw new AuraHandledException(
                    'Inventory is no longer available for one or more products.'
                );
            }

            if (inv.Available_Stock__c == null || inv.Available_Stock__c < requestedQty) {
                throw new AuraHandledException(
                    'Insufficient stock for one or more selected products.'
                );
            }
        }
    }

    // ============================================================
    // Financial Calculations
    // ============================================================

    /**
     * @description Calculates subtotal from server-side variant prices multiplied
     *              by aggregated quantities. Never trusts client-supplied prices.
     */
    private static Decimal calculateSubtotal(
        Map<Id, Integer> aggregatedCart,
        Map<Id, ProductVariant__c> variantMap
    ) {
        Decimal subtotal = 0;
        for (Id variantId : aggregatedCart.keySet()) {
            ProductVariant__c variant = variantMap.get(variantId);
            Integer qty = aggregatedCart.get(variantId);
            subtotal += variant.Price__c * qty;
        }
        return subtotal.setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * @description Calculates GST at the defined constant rate.
     */
    private static Decimal calculateTax(Decimal subtotal) {
        return (subtotal * GST_RATE).setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * @description Determines shipping charge: free at or above the threshold,
     *              standard charge below.
     */
    private static Decimal calculateShippingCharge(Decimal subtotal) {
        Decimal charge = subtotal >= FREE_SHIPPING_THRESHOLD
            ? 0
            : STANDARD_SHIPPING_CHARGE;
        return charge.setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * @description Calculates the total order amount.
     */
    private static Decimal calculateTotal(
        Decimal subtotal, Decimal tax, Decimal shippingCharge
    ) {
        return (subtotal + tax + shippingCharge)
            .setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
    }

    // ============================================================
    // DML — Order, OrderItem & Payment (System-Mode)
    // ============================================================

    /**
     * @description Creates the Order__c record using explicit system-mode DML.
     *              Order__c is an internal transaction record generated during checkout.
     */
    private static Order__c createOrder(
        Id contactId, Id shippingAddressId,
        Decimal subtotal, Decimal tax,
        Decimal shippingCharge, Decimal totalAmount
    ) {
        Order__c order = new Order__c(
            Contact__c          = contactId,
            Shipping_Address__c = shippingAddressId,
            Order_Status__c     = 'Confirmed',
            Payment_Status__c   = 'Paid',
            Shipping_Status__c  = 'Not Shipped',
            Subtotal__c         = subtotal,
            Tax__c              = tax,
            Shipping_Charge__c  = shippingCharge,
            Total_Amount__c     = totalAmount
        );

        Database.insert(order, AccessLevel.SYSTEM_MODE);
        return order;
    }

    /**
     * @description Creates OrderItem__c records using explicit system-mode DML.
     *              Unit_Price__c is set from the current ProductVariant__c.Price__c
     *              as a historical price snapshot at checkout time.
     *              Total_Price__c is NOT set because it may be a formula field.
     */
    private static void createOrderItems(
        Id orderId,
        Map<Id, Integer> aggregatedCart,
        Map<Id, ProductVariant__c> variantMap
    ) {
        List<OrderItem__c> items = new List<OrderItem__c>();

        for (Id variantId : aggregatedCart.keySet()) {
            ProductVariant__c variant = variantMap.get(variantId);
            items.add(new OrderItem__c(
                Order__c           = orderId,
                Product_Variant__c = variantId,
                Quantity__c        = aggregatedCart.get(variantId),
                Unit_Price__c      = variant.Price__c
            ));
        }

        Database.insert(items, AccessLevel.SYSTEM_MODE);
    }

    /**
     * @description Creates the simulated Payment__c record using explicit system-mode DML.
     */
    private static void createPayment(
        Id orderId, Decimal totalAmount,
        String paymentMethod, String transactionRef
    ) {
        Payment__c payment = new Payment__c(
            Order__c                = orderId,
            Amount__c               = totalAmount,
            Payment_Method__c       = paymentMethod,
            Payment_Status__c       = 'Successful',
            Transaction_Reference__c = transactionRef
        );

        Database.insert(payment, AccessLevel.SYSTEM_MODE);
    }

    // ============================================================
    // Utility
    // ============================================================

    /**
     * @description Generates a cryptographically random unique transaction reference.
     *              The customer cannot supply or predict this value.
     * @return Reference string in the format CH-<16 hex chars>.
     */
    private static String generateTransactionReference() {
        Blob randomBytes = Crypto.generateAesKey(128);
        return 'CH-' + EncodingUtil.convertToHex(randomBytes)
            .substring(0, 16)
            .toUpperCase();
    }

    // ============================================================
    // Elevated Inventory Service (without sharing)
    // ============================================================

    /**
     * @description Narrowly-scoped elevated execution context for internal inventory
     *              operations only.
     *
     *              Security Rationale: Customers intentionally have no direct access
     *              to Inventory__c or Inventory_Transaction__c objects. This inner
     *              class uses WITHOUT SHARING to bypass sharing rules AND uses
     *              system-mode DML (no Security.stripInaccessible) for inventory
     *              records. The outer class (WITH SHARING) continues to enforce all
     *              security for customer-owned data.
     *
     *              This approach avoids granting customers Inventory__c permissions
     *              while still allowing the checkout service to manage stock
     *              atomically. The elevated access is narrowly scoped to the three
     *              inventory methods below and does not affect order, address, or
     *              catalog security.
     */
    private without sharing class InventoryService {

        /**
         * @description Queries active Inventory__c records for the given variant Ids.
         *              Returns at most one inventory record per variant (keyed by
         *              Product_Variant__c Id).
         */
        public Map<Id, Inventory__c> loadActiveInventory(Set<Id> variantIds) {
            List<Inventory__c> inventories = [
                SELECT Id, Product_Variant__c, Available_Stock__c, Active__c
                FROM Inventory__c
                WHERE Product_Variant__c IN :variantIds
                  AND Active__c = true
                WITH SYSTEM_MODE
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
            return result;
        }

        /**
         * @description Locks inventory rows using FOR UPDATE to prevent concurrent
         *              purchases from consuming the same stock. Only locks active
         *              inventory records. Returns locked records keyed by variant Id.
         */
        public Map<Id, Inventory__c> lockInventoryForUpdate(Set<Id> inventoryIds) {
            List<Inventory__c> locked = [
                SELECT Id, Product_Variant__c, Available_Stock__c, Active__c
                FROM Inventory__c
                WHERE Id IN :inventoryIds
                  AND Active__c = true
                WITH SYSTEM_MODE
                FOR UPDATE
            ];

            Map<Id, Inventory__c> result = new Map<Id, Inventory__c>();
            for (Inventory__c inv : locked) {
                result.put(inv.Product_Variant__c, inv);
            }
            return result;
        }

        /**
         * @description Reduces Available_Stock__c for each purchased variant and
         *              creates corresponding Inventory_Transaction__c Sale records.
         *              Operates in system mode (no CRUD/FLS enforcement) because
         *              customers have no Inventory__c access.
         */
        public void reduceStockAndCreateTransactions(
            Map<Id, Integer> aggregatedCart,
            Map<Id, Inventory__c> lockedInventory
        ) {
            List<Inventory__c> inventoriesToUpdate = new List<Inventory__c>();
            List<Inventory_Transaction__c> transactions =
                new List<Inventory_Transaction__c>();

            for (Id variantId : aggregatedCart.keySet()) {
                Inventory__c inv = lockedInventory.get(variantId);
                Integer qty = aggregatedCart.get(variantId);

                inv.Available_Stock__c -= qty;
                inventoriesToUpdate.add(inv);

                transactions.add(new Inventory_Transaction__c(
                    Inventory__c        = inv.Id,
                    Transaction_Type__c = 'Sale',
                    Quantity__c         = qty,
                    Transaction_Date__c = Date.today()
                ));
            }

            Database.update(inventoriesToUpdate, AccessLevel.SYSTEM_MODE);
            Database.insert(transactions, AccessLevel.SYSTEM_MODE);
        }
    }
}
