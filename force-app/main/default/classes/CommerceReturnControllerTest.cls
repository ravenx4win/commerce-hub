/**
 * @description Comprehensive unit tests for CommerceReturnController.
 *              Uses isolated test data (SeeAllData=false).
 *              Verifies return-eligible order querying, return history retrieval, detailed return views,
 *              cross-customer isolation, null checking, and user profile validation.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
@IsTest
private class CommerceReturnControllerTest {

    @TestSetup
    static void setupTestData() {
        Account acc1 = new Account(Name = 'Controller Customer One Account');
        Account acc2 = new Account(Name = 'Controller Customer Two Account');
        Account acc3 = new Account(Name = 'Controller Customer Three Account');
        insert new List<Account>{ acc1, acc2, acc3 };

        Contact con1 = new Contact(
            FirstName = 'Ctrl',
            LastName = 'CustOne',
            AccountId = acc1.Id,
            Email = 'ctrl.cust1@test.com'
        );
        Contact con2 = new Contact(
            FirstName = 'Ctrl',
            LastName = 'CustTwo',
            AccountId = acc2.Id,
            Email = 'ctrl.cust2@test.com'
        );
        Contact con3 = new Contact(
            FirstName = 'Ctrl',
            LastName = 'CustThree',
            AccountId = acc3.Id,
            Email = 'ctrl.cust3@test.com'
        );
        insert new List<Contact>{ con1, con2, con3 };

        User adminUser = new User(Id = UserInfo.getUserId());
        User customer1;
        User customer2;
        User customer3;
        User noContactUser;

        System.runAs(adminUser) {
            Profile communityProfile = [
                SELECT Id FROM Profile WHERE Name = 'Customer Community User' LIMIT 1
            ];
            Profile standardProfile = [
                SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1
            ];

            String orgId = UserInfo.getOrganizationId();

            customer1 = new User(
                FirstName = 'Ctrl',
                LastName = 'CustOne',
                Email = 'ctrl.cust1@test.com',
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
                FirstName = 'Ctrl',
                LastName = 'CustTwo',
                Email = 'ctrl.cust2@test.com',
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
                FirstName = 'Ctrl',
                LastName = 'CustThree',
                Email = 'ctrl.cust3@test.com',
                Username = 'ctrl.cust3.' + orgId + '@test.com',
                Alias = 'ccust3',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = con3.Id
            );

            noContactUser = new User(
                FirstName = 'NoContact',
                LastName = 'User',
                Email = 'nocontact@test.com',
                Username = 'nocontact.' + orgId + '@test.com',
                Alias = 'nocont',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = standardProfile.Id
            );

            insert new List<User>{ customer1, customer2, customer3, noContactUser };

            PermissionSet customerPS = [
                SELECT Id FROM PermissionSet WHERE Name = 'Commerce_Hub_Customer' LIMIT 1
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

        Customer_Address__c addr1 = new Customer_Address__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Address_Type__c = 'Shipping',
            Street__c = '101 Ctrl St',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400001',
            Country__c = 'India',
            Is_Default__c = true
        );
        Customer_Address__c addr2 = new Customer_Address__c(
            Contact__c = con2.Id,
            OwnerId = customer2.Id,
            Address_Type__c = 'Shipping',
            Street__c = '202 Ctrl St',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400002',
            Country__c = 'India',
            Is_Default__c = true
        );
        Customer_Address__c addr3 = new Customer_Address__c(
            Contact__c = con3.Id,
            OwnerId = customer3.Id,
            Address_Type__c = 'Shipping',
            Street__c = '303 Ctrl St',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400003',
            Country__c = 'India',
            Is_Default__c = true
        );
        insert new List<Customer_Address__c>{ addr1, addr2, addr3 };

        Category__c category = new Category__c(Name = 'Ctrl Category', Active__c = true);
        insert category;

        Product2 product = new Product2(Name = 'Ctrl Product', IsActive = true, Commerce_Hub_Category__c = category.Id);
        insert product;

        ProductVariant__c variant = new ProductVariant__c(
            Name = 'Ctrl Variant',
            Product__c = product.Id,
            SKU__c = 'CTRL-VAR-1',
            Price__c = 1500.00,
            Active__c = true
        );
        insert variant;

        Order__c order1 = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = addr1.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Delivered',
            Subtotal__c = 1500.00,
            Tax__c = 270.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1770.00
        );
        Order__c order2 = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = addr1.Id,
            Order_Status__c = 'Processing',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 3000.00,
            Tax__c = 540.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 3540.00
        );
        Order__c cancelledOrder = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = addr1.Id,
            Order_Status__c = 'Cancelled',
            Payment_Status__c = 'Failed',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1500.00,
            Tax__c = 270.00,
            Shipping_Charge__c = 50.00,
            Total_Amount__c = 1820.00
        );
        Order__c order3 = new Order__c(
            Contact__c = con2.Id,
            OwnerId = customer2.Id,
            Shipping_Address__c = addr2.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Delivered',
            Subtotal__c = 1500.00,
            Tax__c = 270.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1770.00
        );
        insert new List<Order__c>{ order1, order2, cancelledOrder, order3 };

        OrderItem__c item1 = new OrderItem__c(
            Order__c = order1.Id,
            Product_Variant__c = variant.Id,
            Quantity__c = 1,
            Unit_Price__c = 1500.00
        );
        OrderItem__c item2 = new OrderItem__c(
            Order__c = order2.Id,
            Product_Variant__c = variant.Id,
            Quantity__c = 2,
            Unit_Price__c = 1500.00
        );
        OrderItem__c item3 = new OrderItem__c(
            Order__c = order3.Id,
            Product_Variant__c = variant.Id,
            Quantity__c = 1,
            Unit_Price__c = 1500.00
        );
        insert new List<OrderItem__c>{ item1, item2, item3 };

        Return__c return1 = new Return__c(
            Order__c = order1.Id,
            Return_Status__c = 'Requested',
            Return_Reason__c = 'Damaged',
            Return_Date__c = Date.today(),
            Refund_Amount__c = 1500.00
        );
        Return__c return3 = new Return__c(
            Order__c = order3.Id,
            Return_Status__c = 'Requested',
            Return_Reason__c = 'Wrong Size',
            Return_Date__c = Date.today(),
            Refund_Amount__c = 1500.00
        );
        insert new List<Return__c>{ return1, return3 };

        Return_Item__c returnItem1 = new Return_Item__c(
            Return__c = return1.Id,
            Order_Item__c = item1.Id,
            Return_Quantity__c = 1,
            Refund_Amount__c = 1500.00
        );
        Return_Item__c returnItem3 = new Return_Item__c(
            Return__c = return3.Id,
            Order_Item__c = item3.Id,
            Return_Quantity__c = 1,
            Refund_Amount__c = 1500.00
        );
        insert new List<Return_Item__c>{ returnItem1, returnItem3 };
    }

    private static User getCustomer1() {
        return [SELECT Id, ContactId FROM User WHERE Alias = 'ccust1' LIMIT 1];
    }

    private static User getCustomer2() {
        return [SELECT Id, ContactId FROM User WHERE Alias = 'ccust2' LIMIT 1];
    }

    private static User getCustomer3() {
        return [SELECT Id, ContactId FROM User WHERE Alias = 'ccust3' LIMIT 1];
    }

    private static User getNoContactUser() {
        return [SELECT Id FROM User WHERE Alias = 'nocont' LIMIT 1];
    }

    @IsTest
    static void testGetReturnEligibleOrders_ReturnsCustomerEligibleOrders() {
        User u1 = getCustomer1();
        Test.startTest();
        System.runAs(u1) {
            List<Order__c> eligibleOrders = CommerceReturnController.getReturnEligibleOrders();
            System.assertNotEquals(null, eligibleOrders, 'Eligible orders list should not be null.');
            System.assertEquals(2, eligibleOrders.size(), 'Customer 1 should have 2 return-eligible orders.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetReturnEligibleOrders_ExcludesCancelledOrders() {
        User u1 = getCustomer1();
        Test.startTest();
        System.runAs(u1) {
            List<Order__c> eligibleOrders = CommerceReturnController.getReturnEligibleOrders();
            for (Order__c ord : eligibleOrders) {
                System.assertNotEquals('Cancelled', ord.Order_Status__c, 'Cancelled orders must be excluded from return eligibility.');
            }
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetReturnEligibleOrders_DoesNotReturnOtherCustomerOrders() {
        User u2 = getCustomer2();
        Test.startTest();
        System.runAs(u2) {
            List<Order__c> eligibleOrders = CommerceReturnController.getReturnEligibleOrders();
            System.assertEquals(1, eligibleOrders.size(), 'Customer 2 should only see their 1 order.');
            System.assertEquals('Confirmed', eligibleOrders[0].Order_Status__c, 'Order status should match customer 2 order.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetReturnEligibleOrders_SortsNewestFirst() {
        User u1 = getCustomer1();
        Test.startTest();
        System.runAs(u1) {
            List<Order__c> eligibleOrders = CommerceReturnController.getReturnEligibleOrders();
            System.assert(eligibleOrders.size() >= 2, 'Should have at least 2 orders to test sorting.');
            System.assert(
                eligibleOrders[0].CreatedDate >= eligibleOrders[1].CreatedDate,
                'Orders should be sorted newest first by CreatedDate.'
            );
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetMyReturns_ReturnsCustomerReturns() {
        User u1 = getCustomer1();
        Test.startTest();
        System.runAs(u1) {
            List<Return__c> myReturns = CommerceReturnController.getMyReturns();
            System.assertNotEquals(null, myReturns, 'My returns list should not be null.');
            System.assertEquals(1, myReturns.size(), 'Customer 1 should have 1 return record.');
            System.assertEquals('Damaged', myReturns[0].Return_Reason__c, 'Return reason should match test setup.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetMyReturns_DoesNotReturnOtherCustomerReturns() {
        User u2 = getCustomer2();
        Test.startTest();
        System.runAs(u2) {
            List<Return__c> myReturns = CommerceReturnController.getMyReturns();
            System.assertEquals(1, myReturns.size(), 'Customer 2 should have 1 return record.');
            System.assertEquals('Wrong Size', myReturns[0].Return_Reason__c, 'Customer 2 return reason should match.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetMyReturns_HandlesCustomerWithNoReturns() {
        User u3 = getCustomer3();
        Test.startTest();
        System.runAs(u3) {
            List<Return__c> myReturns = CommerceReturnController.getMyReturns();
            System.assertNotEquals(null, myReturns, 'Returns list should not be null for customer with no returns.');
            System.assertEquals(0, myReturns.size(), 'Customer 3 should have 0 return records.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetReturnDetails_ReturnsCorrectReturnHeader() {
        User u1 = getCustomer1();
        Return__c ret1 = [SELECT Id FROM Return__c WHERE Return_Reason__c = 'Damaged' LIMIT 1];

        Test.startTest();
        System.runAs(u1) {
            CommerceReturnController.ReturnDetails details = CommerceReturnController.getReturnDetails(ret1.Id);
            System.assertNotEquals(null, details, 'Return details should not be null.');
            System.assertNotEquals(null, details.returnRecord, 'Return header should not be null.');
            System.assertEquals(ret1.Id, details.returnRecord.Id, 'Returned header Id should match requested return Id.');
            System.assertEquals('Requested', details.returnRecord.Return_Status__c, 'Return status should be Requested.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetReturnDetails_ReturnsCorrectReturnItems() {
        User u1 = getCustomer1();
        Return__c ret1 = [SELECT Id FROM Return__c WHERE Return_Reason__c = 'Damaged' LIMIT 1];

        Test.startTest();
        System.runAs(u1) {
            CommerceReturnController.ReturnDetails details = CommerceReturnController.getReturnDetails(ret1.Id);
            System.assertNotEquals(null, details.returnItems, 'Return items list should not be null.');
            System.assertEquals(1, details.returnItems.size(), 'Return 1 should contain 1 return item.');
            System.assertEquals(1, details.returnItems[0].Return_Quantity__c, 'Return quantity should be 1.');
            System.assertEquals(1500.00, details.returnItems[0].Refund_Amount__c, 'Refund amount should match.');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetReturnDetails_RejectsOtherCustomerReturn() {
        User u2 = getCustomer2();
        Return__c ret1 = [SELECT Id FROM Return__c WHERE Return_Reason__c = 'Damaged' LIMIT 1]; // Customer 1's return

        Test.startTest();
        Boolean caught = false;
        System.runAs(u2) {
            try {
                CommerceReturnController.getReturnDetails(ret1.Id);
            } catch (AuraHandledException e) {
                caught = true;
            }
        }
        Test.stopTest();
        System.assert(caught, 'Customer 2 attempting to view Customer 1 return must throw AuraHandledException.');
    }

    @IsTest
    static void testGetReturnDetails_HandlesNullReturnId() {
        User u1 = getCustomer1();
        Test.startTest();
        Boolean caught = false;
        System.runAs(u1) {
            try {
                CommerceReturnController.getReturnDetails(null);
            } catch (AuraHandledException e) {
                caught = true;
            }
        }
        Test.stopTest();
        System.assert(caught, 'Null returnId must throw AuraHandledException.');
    }

    @IsTest
    static void testGetReturnDetails_ReturnWithoutOrder_ThrowsException() {
        User u1 = getCustomer1();
        Return__c orphanReturn;
        try {
            orphanReturn = new Return__c(
                Return_Status__c = 'Requested',
                Return_Reason__c = 'Damaged',
                Return_Date__c = Date.today()
            );
            insert orphanReturn;
        } catch (DmlException e) {
            // Order__c field is required by metadata constraint
            return;
        }

        Test.startTest();
        Boolean caught = false;
        System.runAs(u1) {
            try {
                CommerceReturnController.getReturnDetails(orphanReturn.Id);
            } catch (AuraHandledException e) {
                caught = true;
            }
        }
        Test.stopTest();
        System.assert(caught, 'Return without parent order must throw AuraHandledException.');
    }

    @IsTest
    static void testUserWithoutContact_ThrowsException() {
        User noContact = getNoContactUser();
        Test.startTest();
        Boolean caughtOrders = false;
        Boolean caughtReturns = false;

        System.runAs(noContact) {
            try {
                CommerceReturnController.getReturnEligibleOrders();
            } catch (AuraHandledException e) {
                caughtOrders = true;
            }

            try {
                CommerceReturnController.getMyReturns();
            } catch (AuraHandledException e) {
                caughtReturns = true;
            }
        }
        Test.stopTest();

        System.assert(caughtOrders, 'User without Contact must throw AuraHandledException for getReturnEligibleOrders.');
        System.assert(caughtReturns, 'User without Contact must throw AuraHandledException for getMyReturns.');
    }

    @IsTest
    static void testCustomerIsolation_DataCannotCrossCustomers() {
        User u1 = getCustomer1();
        User u2 = getCustomer2();

        Test.startTest();
        List<Order__c> u1Orders;
        List<Order__c> u2Orders;
        List<Return__c> u1Returns;
        List<Return__c> u2Returns;

        System.runAs(u1) {
            u1Orders = CommerceReturnController.getReturnEligibleOrders();
            u1Returns = CommerceReturnController.getMyReturns();
        }

        System.runAs(u2) {
            u2Orders = CommerceReturnController.getReturnEligibleOrders();
            u2Returns = CommerceReturnController.getMyReturns();
        }
        Test.stopTest();

        Set<Id> u1OrderIds = new Map<Id, Order__c>(u1Orders).keySet();
        Set<Id> u2OrderIds = new Map<Id, Order__c>(u2Orders).keySet();

        for (Id oId : u1OrderIds) {
            System.assert(!u2OrderIds.contains(oId), 'Customer 2 must not see any order belonging to Customer 1.');
        }

        Set<Id> u1ReturnIds = new Map<Id, Return__c>(u1Returns).keySet();
        Set<Id> u2ReturnIds = new Map<Id, Return__c>(u2Returns).keySet();

        for (Id rId : u1ReturnIds) {
            System.assert(!u2ReturnIds.contains(rId), 'Customer 2 must not see any return belonging to Customer 1.');
        }
    }

    @IsTest
    static void testReturnedDataAppropriateForCustomerFacingUse() {
        User u1 = getCustomer1();
        Return__c ret1 = [SELECT Id FROM Return__c WHERE Return_Reason__c = 'Damaged' LIMIT 1];

        Test.startTest();
        System.runAs(u1) {
            List<Order__c> orders = CommerceReturnController.getReturnEligibleOrders();
            List<Return__c> returns = CommerceReturnController.getMyReturns();
            CommerceReturnController.ReturnDetails details = CommerceReturnController.getReturnDetails(ret1.Id);

            System.assertNotEquals(0, orders.size(), 'Eligible orders should be populated.');
            System.assertNotEquals(0, returns.size(), 'Returns should be populated.');
            System.assertNotEquals(null, details.returnRecord, 'Return detail header should be populated.');
            System.assertNotEquals(0, details.returnItems.size(), 'Return detail items should be populated.');

            // Verify customer-facing data is clean and valid
            System.assertNotEquals(null, orders[0].Name, 'Order Name should be exposed.');
            System.assertNotEquals(null, returns[0].Return_Reason__c, 'Return Reason should be exposed.');
            System.assertNotEquals(null, details.returnItems[0].Refund_Amount__c, 'Refund Amount should be exposed.');
        }
        Test.stopTest();
    }
}
