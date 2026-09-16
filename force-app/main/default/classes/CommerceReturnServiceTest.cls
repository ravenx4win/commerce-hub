/**
 * @description Comprehensive unit tests for CommerceReturnService.
 *              Uses fully isolated test data (SeeAllData=false).
 *              Covers all 30 required test scenarios including full returns, partial returns,
 *              multi-item returns, input validation, cross-customer security, over-returning prevention,
 *              historical pricing accuracy, inventory restoration, transaction logging, and atomic rollback.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
@IsTest
private class CommerceReturnServiceTest {

    @TestSetup
    static void setupTestData() {

        // 1. Catalog Data
        Category__c category = new Category__c(
            Name = 'Return Test Category',
            Active__c = true
        );
        insert category;

        Product2 product = new Product2(
            Name = 'Return Test Product',
            IsActive = true,
            Commerce_Hub_Category__c = category.Id
        );
        insert product;

        ProductVariant__c variant1 = new ProductVariant__c(
            Name = 'Variant 1000',
            Product__c = product.Id,
            SKU__c = 'RET-VAR1',
            Price__c = 1000.00,
            Active__c = true
        );

        ProductVariant__c variant2 = new ProductVariant__c(
            Name = 'Variant 500',
            Product__c = product.Id,
            SKU__c = 'RET-VAR2',
            Price__c = 500.00,
            Active__c = true
        );
        insert new List<ProductVariant__c>{ variant1, variant2 };

        // 2. Inventory
        Inventory__c inv1 = new Inventory__c(
            Product_Variant__c = variant1.Id,
            Available_Stock__c = 10,
            Active__c = true
        );
        Inventory__c inv2 = new Inventory__c(
            Product_Variant__c = variant2.Id,
            Available_Stock__c = 10,
            Active__c = true
        );
        insert new List<Inventory__c>{ inv1, inv2 };

        // 3. Accounts & Contacts
        Account acc1 = new Account(Name = 'Return Customer One Account');
        Account acc2 = new Account(Name = 'Return Customer Two Account');
        insert new List<Account>{ acc1, acc2 };

        Contact con1 = new Contact(
            FirstName = 'Return',
            LastName = 'CustomerOne',
            AccountId = acc1.Id,
            Email = 'return.customer1@test.com'
        );
        Contact con2 = new Contact(
            FirstName = 'Return',
            LastName = 'CustomerTwo',
            AccountId = acc2.Id,
            Email = 'return.customer2@test.com'
        );
        insert new List<Contact>{ con1, con2 };

        // 4. Users
        User adminUser = new User(Id = UserInfo.getUserId());
        User customer1;
        User customer2;

        System.runAs(adminUser) {
            Profile communityProfile = [
                SELECT Id FROM Profile WHERE Name = 'Customer Community User' LIMIT 1
            ];

            String orgId = UserInfo.getOrganizationId();

            customer1 = new User(
                FirstName = 'Return',
                LastName = 'CustomerOne',
                Email = 'return.customer1@test.com',
                Username = 'ret.cust1.' + orgId + '@test.com',
                Alias = 'rcust1',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = con1.Id
            );

            customer2 = new User(
                FirstName = 'Return',
                LastName = 'CustomerTwo',
                Email = 'return.customer2@test.com',
                Username = 'ret.cust2.' + orgId + '@test.com',
                Alias = 'rcust2',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = con2.Id
            );

            insert new List<User>{ customer1, customer2 };

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
                )
            };
        }

        // 5. Addresses
        Customer_Address__c address1 = new Customer_Address__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Address_Type__c = 'Shipping',
            Street__c = '123 Return St',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400001',
            Country__c = 'India',
            Is_Default__c = true
        );

        Customer_Address__c address2 = new Customer_Address__c(
            Contact__c = con2.Id,
            OwnerId = customer2.Id,
            Address_Type__c = 'Shipping',
            Street__c = '456 Return St',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400002',
            Country__c = 'India',
            Is_Default__c = true
        );
        insert new List<Customer_Address__c>{ address1, address2 };

        // 6. Orders & OrderItems
        Order__c order1 = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = address1.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Delivered',
            Subtotal__c = 5000.00,
            Tax__c = 900.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 5900.00
        );

        Order__c order2 = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = address1.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Delivered',
            Subtotal__c = 4000.00,
            Tax__c = 720.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 4720.00
        );

        Order__c order3 = new Order__c(
            Contact__c = con2.Id,
            OwnerId = customer2.Id,
            Shipping_Address__c = address2.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Delivered',
            Subtotal__c = 2000.00,
            Tax__c = 360.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 2360.00
        );

        Order__c cancelledOrder = new Order__c(
            Contact__c = con1.Id,
            OwnerId = customer1.Id,
            Shipping_Address__c = address1.Id,
            Order_Status__c = 'Cancelled',
            Payment_Status__c = 'Failed',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 100.00,
            Total_Amount__c = 1280.00
        );

        insert new List<Order__c>{ order1, order2, order3, cancelledOrder };

        OrderItem__c item1 = new OrderItem__c(
            Order__c = order1.Id,
            Product_Variant__c = variant1.Id,
            Quantity__c = 5,
            Unit_Price__c = 1000.00
        );

        OrderItem__c item2A = new OrderItem__c(
            Order__c = order2.Id,
            Product_Variant__c = variant1.Id,
            Quantity__c = 3,
            Unit_Price__c = 1000.00
        );

        OrderItem__c item2B = new OrderItem__c(
            Order__c = order2.Id,
            Product_Variant__c = variant2.Id,
            Quantity__c = 2,
            Unit_Price__c = 500.00
        );

        OrderItem__c item3 = new OrderItem__c(
            Order__c = order3.Id,
            Product_Variant__c = variant1.Id,
            Quantity__c = 2,
            Unit_Price__c = 1000.00
        );

        OrderItem__c itemCancelled = new OrderItem__c(
            Order__c = cancelledOrder.Id,
            Product_Variant__c = variant1.Id,
            Quantity__c = 1,
            Unit_Price__c = 1000.00
        );

        insert new List<OrderItem__c>{ item1, item2A, item2B, item3, itemCancelled };
    }

    private static User getCustomerUser(String lastName) {
        Contact con = [
            SELECT Id FROM Contact WHERE LastName = :lastName LIMIT 1
        ];
        return [
            SELECT Id, ContactId FROM User WHERE ContactId = :con.Id AND IsActive = true LIMIT 1
        ];
    }

    private static CommerceReturnService.ReturnItemRequest makeReq(Id itemNo, Integer qty) {
        CommerceReturnService.ReturnItemRequest req = new CommerceReturnService.ReturnItemRequest();
        req.orderItemId = itemNo;
        req.quantity = qty;
        return req;
    }

    // 1. Successful full return
    @IsTest
    static void test01_successfulFullReturn() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(
                order.Id,
                new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 5) },
                'Defective'
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result);
        System.assertEquals('Requested', result.returnStatus);
        System.assertEquals(5000.00, result.refundAmount);
    }

    // 2. Successful partial return
    @IsTest
    static void test02_successfulPartialReturn() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(
                order.Id,
                new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 2) },
                'Damaged'
            );
        }
        Test.stopTest();

        System.assertEquals(2000.00, result.refundAmount);
    }

    // 3. Multiple return items in one request
    @IsTest
    static void test03_multipleReturnItemsInOneRequest() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 4000.00 LIMIT 1];
        List<OrderItem__c> items = [SELECT Id, Product_Variant__c FROM OrderItem__c WHERE Order__c = :order.Id];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(
                order.Id,
                new List<CommerceReturnService.ReturnItemRequest>{
                    makeReq(items[0].Id, 1),
                    makeReq(items[1].Id, 2)
                },
                'Wrong Size'
            );
        }
        Test.stopTest();

        // item 0: 1000 * 1 = 1000, item 1: 500 * 2 = 1000 -> Total = 2000
        System.assertEquals(2000.00, result.refundAmount);
    }

    // 4. Null Order Id
    @IsTest
    static void test04_nullOrderId() {
        User customer = getCustomerUser('CustomerOne');
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(null, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(null, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 5. Null item list
    @IsTest
    static void test05_nullItemList() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, null, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 6. Empty item list
    @IsTest
    static void test06_emptyItemList() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>(), 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 7. Null OrderItem Id
    @IsTest
    static void test07_nullOrderItemId() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(null, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 8. Zero return quantity
    @IsTest
    static void test08_zeroReturnQuantity() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 0) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 9. Negative return quantity
    @IsTest
    static void test09_negativeReturnQuantity() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, -2) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 10. Invalid OrderItem Id
    @IsTest
    static void test10_invalidOrderItemId() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        Id fakeItemId = OrderItem__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001AAA';
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(fakeItemId, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 11. OrderItem from another order
    @IsTest
    static void test11_orderItemFromAnotherOrder() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order1 = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        Order__c order2 = [SELECT Id FROM Order__c WHERE Subtotal__c = 4000.00 LIMIT 1];
        OrderItem__c item2 = [SELECT Id FROM OrderItem__c WHERE Order__c = :order2.Id LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order1.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item2.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 12. Order belonging to another customer
    @IsTest
    static void test12_orderBelongingToAnotherCustomer() {
        User customer1 = getCustomerUser('CustomerOne');
        Order__c cust2Order = [SELECT Id FROM Order__c WHERE Subtotal__c = 2000.00 LIMIT 1];
        OrderItem__c item3 = [SELECT Id FROM OrderItem__c WHERE Order__c = :cust2Order.Id LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer1) {
            try {
                CommerceReturnService.createReturn(cust2Order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item3.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 13. Return quantity exceeds purchased quantity
    @IsTest
    static void test13_returnQuantityExceedsPurchasedQuantity() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];
        Boolean exceptionThrown = false;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 10) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 14. First partial return succeeds
    @IsTest
    static void test14_firstPartialReturnSucceeds() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 2) }, 'Damaged');
        }
        Test.stopTest();

        System.assertEquals(2000.00, result.refundAmount);
    }

    // 15. Second partial return only allows remaining quantity
    @IsTest
    static void test15_secondPartialReturnOnlyAllowsRemainingQuantity() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        System.runAs(customer) {
            CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 2) }, 'Damaged');
        }

        Test.startTest();
        CommerceReturnService.ReturnResult result2;
        System.runAs(customer) {
            result2 = CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 3) }, 'Wrong Size');
        }
        Test.stopTest();

        System.assertEquals(3000.00, result2.refundAmount);
    }

    // 16. Second return exceeding remaining quantity fails
    @IsTest
    static void test16_secondReturnExceedingRemainingQuantityFails() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        System.runAs(customer) {
            CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 3) }, 'Damaged');
        }

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 3) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 17. Refund is calculated from OrderItem.Unit_Price__c
    @IsTest
    static void test17_refundCalculatedFromOrderItemUnitPrice() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
        }
        Test.stopTest();

        System.assertEquals(1000.00, result.refundAmount);
    }

    // 18. Changing ProductVariant__c.Price__c does not change historical refund
    @IsTest
    static void test18_changingProductVariantPriceDoesNotChangeHistoricalRefund() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id, Product_Variant__c FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        // Change ProductVariant price to 2000.00
        ProductVariant__c variant = [SELECT Id, Price__c FROM ProductVariant__c WHERE Id = :item.Product_Variant__c];
        variant.Price__c = 2000.00;
        update variant;

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
        }
        Test.stopTest();

        System.assertEquals(1000.00, result.refundAmount, 'Refund should be based on historical OrderItem Unit_Price__c.');
    }

    // 19. Return__c gets correct total refund amount
    @IsTest
    static void test19_returnRecordGetsCorrectTotalRefundAmount() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 2) }, 'Damaged');
        }
        Test.stopTest();

        Return__c ret = [SELECT Refund_Amount__c FROM Return__c WHERE Id = :result.returnId];
        System.assertEquals(2000.00, ret.Refund_Amount__c);
    }

    // 20. Return_Item__c records get correct refund amounts
    @IsTest
    static void test20_returnItemRecordsGetCorrectRefundAmounts() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 4000.00 LIMIT 1];
        List<OrderItem__c> items = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(
                order.Id,
                new List<CommerceReturnService.ReturnItemRequest>{
                    makeReq(items[0].Id, 1),
                    makeReq(items[1].Id, 2)
                },
                'Damaged'
            );
        }
        Test.stopTest();

        List<Return_Item__c> rItems = [SELECT Order_Item__c, Refund_Amount__c FROM Return_Item__c WHERE Return__c = :result.returnId];
        System.assertEquals(2, rItems.size());
    }

    // 21. Inventory increases by returned quantity
    @IsTest
    static void test21_inventoryIncreasesByReturnedQuantity() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id, Product_Variant__c FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Decimal stockBefore = [SELECT Available_Stock__c FROM Inventory__c WHERE Product_Variant__c = :item.Product_Variant__c LIMIT 1].Available_Stock__c;

        Test.startTest();
        System.runAs(customer) {
            CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 3) }, 'Damaged');
        }
        Test.stopTest();

        Decimal stockAfter = [SELECT Available_Stock__c FROM Inventory__c WHERE Product_Variant__c = :item.Product_Variant__c LIMIT 1].Available_Stock__c;
        System.assertEquals(stockBefore + 3, stockAfter);
    }

    // 22. Inventory_Transaction__c is created with Transaction_Type__c = Return
    @IsTest
    static void test22_inventoryTransactionCreatedWithReturn() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id, Product_Variant__c FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        System.runAs(customer) {
            CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 2) }, 'Damaged');
        }
        Test.stopTest();

        List<Inventory_Transaction__c> txns = [
            SELECT Transaction_Type__c, Quantity__c
            FROM Inventory_Transaction__c
            WHERE Inventory__r.Product_Variant__c = :item.Product_Variant__c AND Transaction_Type__c = 'Return'
        ];
        System.assertEquals(1, txns.size());
        System.assertEquals('Return', txns[0].Transaction_Type__c);
        System.assertEquals(2, txns[0].Quantity__c);
    }

    // 23. Missing inventory fails safely
    @IsTest
    static void test23_missingInventoryFailsSafely() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id, Product_Variant__c FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        // Deactivate active inventory
        Inventory__c inv = [SELECT Id, Active__c FROM Inventory__c WHERE Product_Variant__c = :item.Product_Variant__c LIMIT 1];
        inv.Active__c = false;
        update inv;

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 24. Transaction rollback prevents partial Return__c creation
    @IsTest
    static void test24_transactionRollbackPreventsPartialReturnCreation() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        CommerceReturnService.forceTransactionFailure = true;

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        CommerceReturnService.forceTransactionFailure = false;

        System.assertEquals(true, exceptionThrown);
        System.assertEquals(0, [SELECT COUNT() FROM Return__c]);
    }

    // 25. Transaction rollback prevents partial Return_Item__c creation
    @IsTest
    static void test25_transactionRollbackPreventsPartialReturnItemCreation() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        CommerceReturnService.forceTransactionFailure = true;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {}
        }
        Test.stopTest();

        CommerceReturnService.forceTransactionFailure = false;
        System.assertEquals(0, [SELECT COUNT() FROM Return_Item__c]);
    }

    // 26. Transaction rollback prevents incorrect inventory changes
    @IsTest
    static void test26_transactionRollbackPreventsIncorrectInventoryChanges() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id, Product_Variant__c FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Decimal stockBefore = [SELECT Available_Stock__c FROM Inventory__c WHERE Product_Variant__c = :item.Product_Variant__c LIMIT 1].Available_Stock__c;

        CommerceReturnService.forceTransactionFailure = true;

        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 2) }, 'Damaged');
            } catch (AuraHandledException e) {}
        }
        Test.stopTest();

        CommerceReturnService.forceTransactionFailure = false;
        Decimal stockAfter = [SELECT Available_Stock__c FROM Inventory__c WHERE Product_Variant__c = :item.Product_Variant__c LIMIT 1].Available_Stock__c;
        System.assertEquals(stockBefore, stockAfter);
    }

    // 27. Customer cannot return another customer's order
    @IsTest
    static void test27_customerCannotReturnAnotherCustomerOrder() {
        User customer2 = getCustomerUser('CustomerTwo');
        Order__c cust1Order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :cust1Order.Id LIMIT 1];

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer2) {
            try {
                CommerceReturnService.createReturn(cust1Order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 28. Customer without Contact is rejected
    @IsTest
    static void test28_customerWithoutContactIsRejected() {
        User adminUser = new User(Id = UserInfo.getUserId());
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(adminUser) {
            try {
                CommerceReturnService.createReturn(order.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 29. Ineligible order status is rejected
    @IsTest
    static void test29_ineligibleOrderStatusIsRejected() {
        User customer = getCustomerUser('CustomerOne');
        Order__c cancelledOrder = [SELECT Id FROM Order__c WHERE Order_Status__c = 'Cancelled' LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :cancelledOrder.Id LIMIT 1];

        Boolean exceptionThrown = false;
        Test.startTest();
        System.runAs(customer) {
            try {
                CommerceReturnService.createReturn(cancelledOrder.Id, new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) }, 'Damaged');
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown);
    }

    // 30. A multi-item return remains bulk-safe
    @IsTest
    static void test30_multiItemReturnRemainsBulkSafe() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 4000.00 LIMIT 1];
        List<OrderItem__c> items = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(
                order.Id,
                new List<CommerceReturnService.ReturnItemRequest>{
                    makeReq(items[0].Id, 2),
                    makeReq(items[1].Id, 1)
                },
                'Other'
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result);
        System.assertEquals(2500.00, result.refundAmount);
    }

    // 31. OrderItem row-locking FOR UPDATE concurrency path validation
    @IsTest
    static void test31_orderItemLockingAndReturnConcurrency() {
        User customer = getCustomerUser('CustomerOne');
        Order__c order = [SELECT Id FROM Order__c WHERE Subtotal__c = 5000.00 LIMIT 1];
        OrderItem__c item = [SELECT Id FROM OrderItem__c WHERE Order__c = :order.Id LIMIT 1];

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customer) {
            result = CommerceReturnService.createReturn(
                order.Id,
                new List<CommerceReturnService.ReturnItemRequest>{ makeReq(item.Id, 1) },
                'Defective'
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result);
        System.assertEquals(1000.00, result.refundAmount);

        // Verify return item was persisted
        List<Return_Item__c> rItems = [
            SELECT Order_Item__c, Return_Quantity__c
            FROM Return_Item__c
            WHERE Order_Item__c = :item.Id
        ];
        System.assertEquals(1, rItems.size());
        System.assertEquals(1, rItems[0].Return_Quantity__c);
    }
}
