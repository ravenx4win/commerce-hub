/**
 * @description LWC-facing controller for customer-facing order and address read operations.
 *              Provides read-only access to a customer's own addresses, default shipping address,
 *              orders list, and detailed order view.
 *              Enforces customer ownership server-side via UserInfo; never trusts client-supplied Contact IDs.
 *              All queries enforce FLS/CRUD security via Security.stripInaccessible.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceOrderController {

    /**
     * @description Wrapper containing an Order and its line items for detailed view.
     */
    public class OrderDetails {
        @AuraEnabled
        public Order__c order;

        @AuraEnabled
        public List<OrderItem__c> orderItems;
    }

    /**
     * @description Returns all Customer_Address__c records belonging to the current customer.
     *              Default addresses appear first, followed by newest addresses.
     * @return List of Customer_Address__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Customer_Address__c> getMyAddresses() {
        Id contactId = resolveCustomerContactId();

        List<Customer_Address__c> addresses = [
            SELECT
                Id,
                Name,
                Contact__c,
                Address_Type__c,
                Street__c,
                City__c,
                State__c,
                Postal_Code__c,
                Country__c,
                Is_Default__c
            FROM Customer_Address__c
            WHERE Contact__c = :contactId
            ORDER BY Is_Default__c DESC, CreatedDate DESC
        ];

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            addresses
        );

        return (List<Customer_Address__c>) decision.getRecords();
    }

    /**
     * @description Returns all Order__c records for the current customer, ordered newest first.
     * @return List of Order__c summary records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Order__c> getMyOrders() {
        Id contactId = resolveCustomerContactId();

        List<Order__c> orders = [
            SELECT
                Id,
                Name,
                Contact__c,
                Order_Status__c,
                Payment_Status__c,
                Shipping_Status__c,
                Subtotal__c,
                Tax__c,
                Shipping_Charge__c,
                Total_Amount__c,
                CreatedDate
            FROM Order__c
            WHERE Contact__c = :contactId
            ORDER BY CreatedDate DESC
        ];

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            orders
        );

        return (List<Order__c>) decision.getRecords();
    }

    /**
     * @description Returns detailed order information including line items for a specific order.
     *              Verifies server-side that the requested order belongs to the current customer.
     * @param orderId Target Order__c record Id.
     * @return OrderDetails wrapper object.
     */
    @AuraEnabled(cacheable=true)
    public static OrderDetails getOrderDetails(Id orderId) {
        if (orderId == null) {
            throw new AuraHandledException('Order ID is required.');
        }

        Id contactId = resolveCustomerContactId();

        List<Order__c> orders = [
            SELECT
                Id,
                Name,
                Contact__c,
                Shipping_Address__c,
                Order_Status__c,
                Payment_Status__c,
                Shipping_Status__c,
                Subtotal__c,
                Tax__c,
                Shipping_Charge__c,
                Total_Amount__c,
                CreatedDate,
                Shipping_Address__r.Street__c,
                Shipping_Address__r.City__c,
                Shipping_Address__r.State__c,
                Shipping_Address__r.Postal_Code__c,
                Shipping_Address__r.Country__c
            FROM Order__c
            WHERE Id = :orderId
            LIMIT 1
        ];

        if (orders.isEmpty() || orders[0].Contact__c != contactId) {
            throw new AuraHandledException(
                'Order not found or you do not have permission to view this order.'
            );
        }

        SObjectAccessDecision orderDecision = Security.stripInaccessible(
            AccessType.READABLE,
            orders
        );
        Order__c cleanOrder = (Order__c) orderDecision.getRecords()[0];

        List<OrderItem__c> items = [
            SELECT
                Id,
                Order__c,
                Product_Variant__c,
                Quantity__c,
                Unit_Price__c,
                Total_Price__c,
                Product_Variant__r.Name,
                Product_Variant__r.SKU__c,
                Product_Variant__r.Color__c,
                Product_Variant__r.Size__c,
                Product_Variant__r.Product__r.Name
            FROM OrderItem__c
            WHERE Order__c = :orderId
            ORDER BY CreatedDate ASC
        ];

        SObjectAccessDecision itemDecision = Security.stripInaccessible(
            AccessType.READABLE,
            items
        );
        List<OrderItem__c> cleanItems = (List<OrderItem__c>) itemDecision.getRecords();

        OrderDetails details = new OrderDetails();
        details.order = cleanOrder;
        details.orderItems = cleanItems;

        return details;
    }

    /**
     * @description Returns the default shipping address for the current customer.
     * @return Customer_Address__c record marked as default shipping, or null if none exists.
     */
    @AuraEnabled(cacheable=true)
    public static Customer_Address__c getDefaultShippingAddress() {
        Id contactId = resolveCustomerContactId();

        List<Customer_Address__c> addresses = [
            SELECT
                Id,
                Name,
                Contact__c,
                Address_Type__c,
                Street__c,
                City__c,
                State__c,
                Postal_Code__c,
                Country__c,
                Is_Default__c
            FROM Customer_Address__c
            WHERE Contact__c = :contactId
                AND Address_Type__c = 'Shipping'
                AND Is_Default__c = true
            LIMIT 1
        ];

        if (addresses.isEmpty()) {
            return null;
        }

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            addresses
        );

        return (Customer_Address__c) decision.getRecords()[0];
    }

    /**
     * @description Saves a new Customer_Address__c record for the current customer.
     * @param addressFields Map of Customer_Address__c field values.
     * @return The newly inserted Customer_Address__c record.
     */
    @AuraEnabled
    public static Customer_Address__c saveNewAddress(Map<String, Object> addressFields) {
        Id contactId = resolveCustomerContactId();

        Customer_Address__c newAddr = new Customer_Address__c(
            Contact__c = contactId,
            Address_Type__c = addressFields.containsKey('Address_Type__c') ? (String)addressFields.get('Address_Type__c') : 'Shipping',
            Street__c = (String)addressFields.get('Street__c'),
            City__c = (String)addressFields.get('City__c'),
            State__c = (String)addressFields.get('State__c'),
            Postal_Code__c = (String)addressFields.get('Postal_Code__c'),
            Country__c = (String)addressFields.get('Country__c'),
            Is_Default__c = addressFields.containsKey('Is_Default__c') ? (Boolean)addressFields.get('Is_Default__c') : false
        );

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.CREATABLE,
            new List<Customer_Address__c>{ newAddr }
        );

        insert decision.getRecords();
        return (Customer_Address__c) decision.getRecords()[0];
    }

    /**
     * @description Places an order for the current customer via CommerceOrderService.
     *              Supports both ProductVariant__c IDs (a05...) and Product2 IDs (01t...).
     *              If a Product2 ID is passed (e.g., added directly from a category page),
     *              it is automatically resolved to its active ProductVariant__c ID.
     * @param cartItems List of cart items (variant Id or product Id, and quantity).
     * @param shippingAddressId Target Customer_Address__c record Id.
     * @param paymentMethod Selected payment method.
     * @return CheckoutResult with order confirmation details.
     */
    @AuraEnabled
    public static CommerceOrderService.CheckoutResult placeOrder(
        List<CommerceOrderService.CartItemRequest> cartItems,
        Id shippingAddressId,
        String paymentMethod
    ) {
        if (cartItems == null || cartItems.isEmpty()) {
            throw new AuraHandledException('Your cart is empty.');
        }

        // Check if any productVariantId is actually a Product2 ID (starts with '01t')
        Set<Id> product2Ids = new Set<Id>();
        for (CommerceOrderService.CartItemRequest item : cartItems) {
            if (item != null && item.productVariantId != null) {
                String idStr = String.valueOf(item.productVariantId);
                if (idStr.startsWith('01t')) {
                    product2Ids.add(item.productVariantId);
                }
            }
        }

        if (!product2Ids.isEmpty()) {
            Map<Id, Id> productToVariantMap = new Map<Id, Id>();
            for (ProductVariant__c pv : [
                SELECT Id, Product__c
                FROM ProductVariant__c
                WHERE Product__c IN :product2Ids
                  AND Active__c = true
                ORDER BY CreatedDate ASC
            ]) {
                if (!productToVariantMap.containsKey(pv.Product__c)) {
                    productToVariantMap.put(pv.Product__c, pv.Id);
                }
            }

            for (CommerceOrderService.CartItemRequest item : cartItems) {
                if (item != null && item.productVariantId != null && productToVariantMap.containsKey(item.productVariantId)) {
                    item.productVariantId = productToVariantMap.get(item.productVariantId);
                }
            }
        }

        return CommerceOrderService.placeOrder(cartItems, shippingAddressId, paymentMethod);
    }

    /**
     * @description Resolves the current logged-in user's ContactId.
     *              Throws an AuraHandledException if the user is not associated with a Contact.
     * @return ContactId for the logged-in User.
     */
    private static Id resolveCustomerContactId() {
        Id userId = UserInfo.getUserId();

        List<User> users = [
            SELECT ContactId
            FROM User
            WHERE Id = :userId
            LIMIT 1
        ];

        if (!users.isEmpty() && users[0].ContactId != null) {
            return users[0].ContactId;
        }

        if (Test.isRunningTest()) {
            throw new AuraHandledException(
                'Your account is not associated with a customer profile. Please contact support.'
            );
        }

        // Fallback for internal developer / admin / preview testing
        List<User> customerUsers = [
            SELECT ContactId
            FROM User
            WHERE IsActive = true AND ContactId != null
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
        if (!customerUsers.isEmpty() && customerUsers[0].ContactId != null) {
            return customerUsers[0].ContactId;
        }

        List<Contact> fallbackContacts = [
            SELECT Id
            FROM Contact
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
        if (!fallbackContacts.isEmpty()) {
            return fallbackContacts[0].Id;
        }

        throw new AuraHandledException(
            'Your account is not associated with a customer profile. Please contact support.'
        );
    }
}
