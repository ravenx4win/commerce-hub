/**
 * @description Comprehensive unit tests for CommerceOrderController.
 *              Uses isolated test data (SeeAllData=false).
 *              Simulates Experience Cloud customer context using System.runAs with Community Users.
 *              Verifies strict customer data isolation, default address handling, order query sorting,
 *              and unauthorized access rejection.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
@IsTest
private class CommerceOrderControllerTest {

    @TestSetup
    static void setupTestData() {

        // 1. Catalog Data
        Category__c category = new Category__c(
            Name = 'Electronics',
            Active__c = true
        );
        insert category;

        Product2 product = new Product2(
            Name = 'Smartphone',
            IsActive = true,
            Commerce_Hub_Category__c = category.Id
        );
        insert product;

        ProductVariant__c variant = new ProductVariant__c(
            Name = 'Black 128GB',
            Product__c = product.Id,
            SKU__c = 'SP-BLK-128',
            Price__c = 1000.00,
            Active__c = true
        );
        insert variant;

        Inventory__c inv = new Inventory__c(
            Product_Variant__c = variant.Id,
            Available_Stock__c = 100,
            Active__c = true
        );
        insert inv;

        // 2. Accounts & Contacts for two distinct customers
        Account acc1 = new Account(Name = 'Customer One Account');
        Account acc2 = new Account(Name = 'Customer Two Account');
        Account acc3 = new Account(Name = 'Customer Three Account');
        insert new List<Account>{ acc1, acc2, acc3 };

        Contact con1 = new Contact(
            FirstName = 'Customer',
            LastName = 'One',
            AccountId = acc1.Id,
            Email = 'customer1.ctrl@test.com'
        );
        Contact con2 = new Contact(
            FirstName = 'Customer',
            LastName = 'Two',
            AccountId = acc2.Id,
            Email = 'customer2.ctrl@test.com'
        );
        Contact con3 = new Contact(
            FirstName = 'Customer',
            LastName = 'Three',
            AccountId = acc3.Id,
            Email = 'customer3.ctrl@test.com'
        );
        insert new List<Contact>{ con1, con2, con3 };

        // 3. Community Users
        User adminUser = new User(Id = UserInfo.getUserId());
        User customer1;
        User customer2;
        User customer3;

        System.runAs(adminUser) {
            Profile communityProfile = [
                SELECT Id
                FROM Profile
                WHERE Name = 'Customer Community User'
                LIMIT 1
            ];

            String orgId = UserInfo.getOrganizationId();

            customer1 = new User(
                FirstName = 'Customer',
                LastName = 'One',
                Email = 'customer1.ctrl@test.com',
                Username = 'ctrl.cust1.' + orgId + '@test.com',
                Alias = 'ccust1',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = con1.Id
            );

            customer2 = new User(
                FirstName = 'Customer',
                LastName = 'Two',
                Email = 'customer2.ctrl@test.com',
                Username = 'ctrl.cust2.' + orgId + '@test.com',
                Alias = 'ccust2',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = con2.Id
            );

            customer3 = new User(
                FirstName = 'Customer',
                LastName = 'Three',
                Email = 'customer3.ctrl@test.com',
                Username = 'ctrl.cust3.' + orgId + '@test.com',
                Alias = 'ccust3',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = con3.Id
            );

            insert new List<User>{ customer1, customer2, customer3 };

            PermissionSet customerPS = [
                SELECT Id
                FROM PermissionSet
                WHERE Name = 'Commerce_Hub_Customer'
                LIMIT 1
            ];

            insert new List<PermissionSetAssignment>{
                new PermissionSetAssignment(
                    AssigneeId = customer1.Id,
                    PermissionSetId = customerPS.Id
                ),
                new PermissionSetAssignment(
                    AssigneeId = customer2.Id,
                    PermissionSetId = customerPS.Id
                ),
                new PermissionSetAssignment(
                    AssigneeId = customer3.Id,
                    PermissionSetId = customerPS.Id
                )
            };
        }

        // 4. Addresses
        Customer_Address__c shipping1 = new Customer_Address__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Address_Type__c = 'Shipping',
            Street__c = '100 Main St',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400001',
            Country__c = 'India',
            Is_Default__c = true
        );

        Customer_Address__c billing1 = new Customer_Address__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Address_Type__c = 'Billing',
            Street__c = '200 Finance Rd',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400002',
            Country__c = 'India',
            Is_Default__c = false
        );

        Customer_Address__c shipping2 = new Customer_Address__c(
            Contact__c = con2.Id,
            OwnerId = customer2.Id,
            Address_Type__c = 'Shipping',
            Street__c = '300 Other Rd',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400002',
            Country__c = 'India',
            Is_Default__c = true
        );

        insert new List<Customer_Address__c>{ shipping1, billing1, shipping2 };

        // 5. Orders & Order Items
        Order__c order1 = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = shipping1.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );

        Order__c order2 = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = shipping1.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 500.00,
            Tax__c = 90.00,
            Shipping_Charge__c = 100.00,
            Total_Amount__c = 690.00
        );

        Order__c order3 = new Order__c(
            Contact__c = con2.Id,
            OwnerId = customer2.Id,
            Shipping_Address__c = shipping2.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1500.00,
            Tax__c = 270.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1770.00
        );

        insert new List<Order__c>{ order1, order2, order3 };

        OrderItem__c item1 = new OrderItem__c(
            Order__c = order1.Id,
            Product_Variant__c = variant.Id,
            Quantity__c = 1,
            Unit_Price__c = 1000.00
        );

        OrderItem__c item3 = new OrderItem__c(
            Order__c = order3.Id,
            Product_Variant__c = variant.Id,
            Quantity__c = 1,
            Unit_Price__c = 1500.00
        );

        insert new List<OrderItem__c>{ item1, item3 };
    }

    private static User getCustomerUser(String lastName) {
        Contact con = [
            SELECT Id
            FROM Contact
            WHERE LastName = :lastName
            LIMIT 1
        ];
        return [
            SELECT Id, ContactId
            FROM User
            WHERE ContactId = :con.Id AND IsActive = true
            LIMIT 1
        ];
    }

    @IsTest
    static void getMyAddresses_returnsCurrentCustomerAddresses() {
        User customer1 = getCustomerUser('One');

        Test.startTest();
        List<Customer_Address__c> addresses;
        System.runAs(customer1) {
            addresses = CommerceOrderController.getMyAddresses();
        }
        Test.stopTest();

        System.assertEquals(2, addresses.size(), 'Customer One should have 2 addresses.');
        System.assertEquals(true, addresses[0].Is_Default__c, 'Default address should appear first.');
        System.assertEquals('Shipping', addresses[0].Address_Type__c);
    }

    @IsTest
    static void getMyAddresses_doesNotReturnOtherCustomerAddresses() {
        User customer1 = getCustomerUser('One');
        User customer2 = getCustomerUser('Two');

        Customer_Address__c cust2Address = [
            SELECT Id FROM Customer_Address__c WHERE OwnerId = :customer2.Id LIMIT 1
        ];

        Test.startTest();
        List<Customer_Address__c> addresses;
        System.runAs(customer1) {
            addresses = CommerceOrderController.getMyAddresses();
        }
        Test.stopTest();

        Set<Id> addressIds = new Map<Id, Customer_Address__c>(addresses).keySet();
        System.assert(!addressIds.contains(cust2Address.Id), 'Customer 1 should not see Customer 2 address.');
    }

    @IsTest
    static void getMyAddresses_userWithoutContact_throwsException() {
        User adminUser = new User(Id = UserInfo.getUserId());

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(adminUser) {
            try {
                CommerceOrderController.getMyAddresses();
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown, 'User without Contact should throw exception.');
    }

    @IsTest
    static void getDefaultShippingAddress_returnsCorrectAddress() {
        User customer1 = getCustomerUser('One');

        Test.startTest();
        Customer_Address__c defaultAddr;
        System.runAs(customer1) {
            defaultAddr = CommerceOrderController.getDefaultShippingAddress();
        }
        Test.stopTest();

        System.assertNotEquals(null, defaultAddr, 'Default shipping address should be found.');
        System.assertEquals('Shipping', defaultAddr.Address_Type__c);
        System.assertEquals(true, defaultAddr.Is_Default__c);
    }

    @IsTest
    static void getDefaultShippingAddress_doesNotReturnOtherCustomerAddress() {
        User customer1 = getCustomerUser('One');
        User customer2 = getCustomerUser('Two');

        Customer_Address__c cust1Default = [
            SELECT Id FROM Customer_Address__c WHERE OwnerId = :customer1.Id AND Is_Default__c = true LIMIT 1
        ];

        Test.startTest();
        Customer_Address__c cust2Default;
        System.runAs(customer2) {
            cust2Default = CommerceOrderController.getDefaultShippingAddress();
        }
        Test.stopTest();

        System.assertNotEquals(cust1Default.Id, cust2Default.Id, 'Customer 2 default should not be Customer 1 default.');
    }

    @IsTest
    static void getDefaultShippingAddress_noDefault_returnsNull() {
        User customer3 = getCustomerUser('Three');

        Test.startTest();
        Customer_Address__c defaultAddr;
        System.runAs(customer3) {
            defaultAddr = CommerceOrderController.getDefaultShippingAddress();
        }
        Test.stopTest();

        System.assertEquals(null, defaultAddr, 'Customer without default shipping address should return null.');
    }

    @IsTest
    static void getMyOrders_returnsOnlyCurrentCustomerOrders() {
        User customer1 = getCustomerUser('One');

        Test.startTest();
        List<Order__c> orders;
        System.runAs(customer1) {
            orders = CommerceOrderController.getMyOrders();
        }
        Test.stopTest();

        System.assertEquals(2, orders.size(), 'Customer One should have 2 orders.');
    }

    @IsTest
    static void getMyOrders_returnsOrdersNewestFirst() {
        User customer1 = getCustomerUser('One');

        Test.startTest();
        List<Order__c> orders;
        System.runAs(customer1) {
            orders = CommerceOrderController.getMyOrders();
        }
        Test.stopTest();

        System.assert(orders.size() >= 2, 'Customer 1 should have at least 2 orders.');
        System.assert(orders[0].CreatedDate >= orders[1].CreatedDate, 'Orders should be sorted newest first.');
    }

    @IsTest
    static void getOrderDetails_returnsCorrectOrderAndItems() {
        User customer1 = getCustomerUser('One');

        Order__c targetOrder = [
            SELECT Id FROM Order__c WHERE OwnerId = :customer1.Id LIMIT 1
        ];

        Test.startTest();
        CommerceOrderController.OrderDetails details;
        System.runAs(customer1) {
            details = CommerceOrderController.getOrderDetails(targetOrder.Id);
        }
        Test.stopTest();

        System.assertNotEquals(null, details, 'Order details should not be null.');
        System.assertEquals(targetOrder.Id, details.order.Id, 'Should return correct order.');
        System.assertNotEquals(null, details.orderItems, 'Order items list should not be null.');
    }

    @IsTest
    static void getOrderDetails_rejectsOtherCustomerOrder() {
        User customer1 = getCustomerUser('One');
        User customer2 = getCustomerUser('Two');

        Order__c cust2Order = [
            SELECT Id FROM Order__c WHERE OwnerId = :customer2.Id LIMIT 1
        ];

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer1) {
            try {
                CommerceOrderController.getOrderDetails(cust2Order.Id);
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown, 'Customer 1 requesting Customer 2 order must throw exception.');
    }

    @IsTest
    static void getOrderDetails_nullOrderId_throwsException() {
        User customer1 = getCustomerUser('One');

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer1) {
            try {
                CommerceOrderController.getOrderDetails(null);
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown, 'Null orderId should throw exception.');
    }

    @IsTest
    static void customerDataIsolation_verifiedBetweenCustomers() {
        User customer1 = getCustomerUser('One');
        User customer2 = getCustomerUser('Two');

        List<Order__c> cust1Orders;
        List<Order__c> cust2Orders;

        Test.startTest();
        System.runAs(customer1) {
            cust1Orders = CommerceOrderController.getMyOrders();
        }
        System.runAs(customer2) {
            cust2Orders = CommerceOrderController.getMyOrders();
        }
        Test.stopTest();

        Set<Id> cust1OrderIds = new Map<Id, Order__c>(cust1Orders).keySet();
        for (Order__c o : cust2Orders) {
            System.assert(!cust1OrderIds.contains(o.Id), 'Customer 2 orders must never overlap Customer 1 orders.');
        }
    }

    @IsTest
    static void saveNewAddress_createsAndReturnsAddress() {
        User customer1 = getCustomerUser('One');
        Customer_Address__c result;

        Test.startTest();
        System.runAs(customer1) {
            Map<String, Object> fields = new Map<String, Object>{
                'Street__c' => '456 Marine Drive',
                'City__c' => 'Mumbai',
                'State__c' => 'Maharashtra',
                'Postal_Code__c' => '400020',
                'Country__c' => 'India',
                'Is_Default__c' => false
            };
            result = CommerceOrderController.saveNewAddress(fields);
        }
        Test.stopTest();

        System.assertNotEquals(null, result, 'Expected saved address to be returned');
        System.assertNotEquals(null, result.Id, 'Expected record Id on saved address');
        System.assertEquals('456 Marine Drive', result.Street__c, 'Street should match');
    }

    @IsTest
    static void placeOrder_emptyCart_throwsException() {
        User customer1 = getCustomerUser('One');
        Customer_Address__c addr = [SELECT Id FROM Customer_Address__c WHERE Contact__c = :customer1.ContactId AND Is_Default__c = true LIMIT 1];

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer1) {
            try {
                CommerceOrderController.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>(),
                    addr.Id,
                    'UPI'
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown, 'Empty cart should throw AuraHandledException');
    }

    @IsTest
    static void placeOrder_withProduct2Id_resolvesVariantAndPlacesOrder() {
        User customer1 = getCustomerUser('One');
        Customer_Address__c addr = [SELECT Id FROM Customer_Address__c WHERE Contact__c = :customer1.ContactId AND Is_Default__c = true LIMIT 1];
        Product2 prod = [SELECT Id FROM Product2 WHERE Name = 'Smartphone' LIMIT 1];

        CommerceOrderService.CartItemRequest item = new CommerceOrderService.CartItemRequest();
        item.productVariantId = prod.Id; // Passing Product2 ID
        item.quantity = 1;

        Test.startTest();
        CommerceOrderService.CheckoutResult result;
        System.runAs(customer1) {
            result = CommerceOrderController.placeOrder(
                new List<CommerceOrderService.CartItemRequest>{ item },
                addr.Id,
                'Card'
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result, 'Order should be created');
        System.assertNotEquals(null, result.orderId, 'Order ID should be returned');
        System.assertEquals('Confirmed', result.orderStatus);
    }
}

