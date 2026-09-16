/**
 * @description Comprehensive test class for CommerceOrderService.
 *              Uses fully isolated test data (no SeeAllData). Covers all 30+
 *              required test scenarios including happy path, error conditions,
 *              transaction rollback, bulk processing, and inventory locking.
 *
 *              Uses System.runAs with community users to simulate Experience Cloud
 *              customer context. Assertions query outside System.runAs so that
 *              Inventory__c and other internal objects remain accessible to the
 *              test-running admin user.
 *
 * @author  Commerce Hub
 * @since   2026-09-14
 */
@IsTest
private class CommerceOrderServiceTest {

    // ================================================================
    // Test Data Setup
    // ================================================================

    @TestSetup
    static void setupTestData() {

        // ============================================================
        // 1. Categories
        // ============================================================

        Category__c activeCategory = new Category__c(
            Name        = 'Test Electronics',
            Active__c   = true,
            Description__c = 'Active test category'
        );

        Category__c inactiveCategory = new Category__c(
            Name        = 'Test Inactive Category',
            Active__c   = false,
            Description__c = 'Inactive test category'
        );

        insert new List<Category__c>{ activeCategory, inactiveCategory };

        // ============================================================
        // 2. Products
        // ============================================================

        Product2 activeProduct = new Product2(
            Name                    = 'Test Smartphone',
            IsActive                = true,
            Commerce_Hub_Category__c = activeCategory.Id
        );

        Product2 inactiveProduct = new Product2(
            Name                    = 'Test Inactive Phone',
            IsActive                = false,
            Commerce_Hub_Category__c = activeCategory.Id
        );

        Product2 inactiveCatProduct = new Product2(
            Name                    = 'Test Clearance Item',
            IsActive                = true,
            Commerce_Hub_Category__c = inactiveCategory.Id
        );

        insert new List<Product2>{
            activeProduct, inactiveProduct, inactiveCatProduct
        };

        // ============================================================
        // 3. Product Variants
        // ============================================================

        // Active variants with different price points for financial tests
        ProductVariant__c variantBlack = new ProductVariant__c(
            Name       = 'Black 500',
            Product__c = activeProduct.Id,
            SKU__c     = 'TST-BLK',
            Price__c   = 500,
            Color__c   = 'Black',
            Size__c    = 'Medium',
            Active__c  = true
        );

        ProductVariant__c variantBlue = new ProductVariant__c(
            Name       = 'Blue 1000',
            Product__c = activeProduct.Id,
            SKU__c     = 'TST-BLU',
            Price__c   = 1000,
            Color__c   = 'Blue',
            Size__c    = 'Large',
            Active__c  = true
        );

        ProductVariant__c variantRed = new ProductVariant__c(
            Name       = 'Red 1500',
            Product__c = activeProduct.Id,
            SKU__c     = 'TST-RED',
            Price__c   = 1500,
            Color__c   = 'Red',
            Size__c    = 'Small',
            Active__c  = true
        );

        // Low-stock variant for insufficient stock test
        ProductVariant__c variantGold = new ProductVariant__c(
            Name       = 'Gold Low Stock',
            Product__c = activeProduct.Id,
            SKU__c     = 'TST-GLD',
            Price__c   = 200,
            Color__c   = 'Gold',
            Size__c    = 'Medium',
            Active__c  = true
        );

        // Variant with no inventory record (for missing inventory test)
        ProductVariant__c variantSilver = new ProductVariant__c(
            Name       = 'Silver No Inventory',
            Product__c = activeProduct.Id,
            SKU__c     = 'TST-SLV',
            Price__c   = 300,
            Color__c   = 'Silver',
            Size__c    = 'Large',
            Active__c  = true
        );

        // Inactive variant
        ProductVariant__c variantInactive = new ProductVariant__c(
            Name       = 'Inactive Variant',
            Product__c = activeProduct.Id,
            SKU__c     = 'TST-INAC',
            Price__c   = 400,
            Color__c   = 'Green',
            Size__c    = 'Small',
            Active__c  = false
        );

        // Variant on inactive product
        ProductVariant__c variantInactiveProd = new ProductVariant__c(
            Name       = 'Inactive Product Variant',
            Product__c = inactiveProduct.Id,
            SKU__c     = 'TST-INPD',
            Price__c   = 600,
            Color__c   = 'White',
            Size__c    = 'Medium',
            Active__c  = true
        );

        // Variant on inactive-category product
        ProductVariant__c variantInactiveCat = new ProductVariant__c(
            Name       = 'Inactive Cat Variant',
            Product__c = inactiveCatProduct.Id,
            SKU__c     = 'TST-INCT',
            Price__c   = 700,
            Color__c   = 'Purple',
            Size__c    = 'Large',
            Active__c  = true
        );

        insert new List<ProductVariant__c>{
            variantBlack, variantBlue, variantRed, variantGold,
            variantSilver, variantInactive, variantInactiveProd, variantInactiveCat
        };

        // ============================================================
        // 4. Inventory (only for valid active variants)
        // ============================================================

        insert new List<Inventory__c>{
            new Inventory__c(
                Product_Variant__c = variantBlack.Id,
                Available_Stock__c = 100,
                Active__c          = true
            ),
            new Inventory__c(
                Product_Variant__c = variantBlue.Id,
                Available_Stock__c = 50,
                Active__c          = true
            ),
            new Inventory__c(
                Product_Variant__c = variantRed.Id,
                Available_Stock__c = 20,
                Active__c          = true
            ),
            new Inventory__c(
                Product_Variant__c = variantGold.Id,
                Available_Stock__c = 2,
                Active__c          = true
            )
            // No inventory for variantSilver — exercises missing inventory path
        };

        // ============================================================
        // 5. Accounts & Contacts (two separate customers)
        // ============================================================

        Account acc1 = new Account(Name = 'Customer One Account');
        Account acc2 = new Account(Name = 'Customer Two Account');
        insert new List<Account>{ acc1, acc2 };

        Contact con1 = new Contact(
            FirstName = 'Test',
            LastName  = 'CustomerOne',
            AccountId = acc1.Id,
            Email     = 'customer1@commercehub.test'
        );

        Contact con2 = new Contact(
            FirstName = 'Test',
            LastName  = 'CustomerTwo',
            AccountId = acc2.Id,
            Email     = 'customer2@commercehub.test'
        );

        insert new List<Contact>{ con1, con2 };

        // ============================================================
        // 6. Community Users (System.runAs avoids mixed DML)
        // ============================================================

        User adminUser = new User(Id = UserInfo.getUserId());

        User customer1;
        User customer2;

        System.runAs(adminUser) {

            Profile communityProfile = [
                SELECT Id
                FROM Profile
                WHERE Name = 'Customer Community User'
                LIMIT 1
            ];

            String orgId = UserInfo.getOrganizationId();

            customer1 = new User(
                FirstName        = 'Test',
                LastName         = 'CustomerOne',
                Email            = 'customer1@commercehub.test',
                Username         = 'ch.customer1.' + orgId + '@test.com',
                Alias            = 'cust1',
                TimeZoneSidKey   = 'Asia/Kolkata',
                LocaleSidKey     = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId        = communityProfile.Id,
                ContactId        = con1.Id
            );

            customer2 = new User(
                FirstName        = 'Test',
                LastName         = 'CustomerTwo',
                Email            = 'customer2@commercehub.test',
                Username         = 'ch.customer2.' + orgId + '@test.com',
                Alias            = 'cust2',
                TimeZoneSidKey   = 'Asia/Kolkata',
                LocaleSidKey     = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId        = communityProfile.Id,
                ContactId        = con2.Id
            );

            insert new List<User>{ customer1, customer2 };

            PermissionSet customerPS = [
                SELECT Id
                FROM PermissionSet
                WHERE Name = 'Commerce_Hub_Customer'
                LIMIT 1
            ];

            insert new List<PermissionSetAssignment>{
                new PermissionSetAssignment(
                    AssigneeId      = customer1.Id,
                    PermissionSetId = customerPS.Id
                ),
                new PermissionSetAssignment(
                    AssigneeId      = customer2.Id,
                    PermissionSetId = customerPS.Id
                )
            };
        }

        // ============================================================
        // 7. Customer Addresses (assigned directly to community user owners)
        // ============================================================

        Customer_Address__c shipping1 = new Customer_Address__c(
            Contact__c      = con1.Id,
            OwnerId         = customer1.Id,
            Address_Type__c = 'Shipping',
            Street__c       = '123 Test Street',
            City__c         = 'Mumbai',
            State__c        = 'Maharashtra',
            Postal_Code__c  = '400001',
            Country__c      = 'India',
            Is_Default__c   = true
        );

        Customer_Address__c billing1 = new Customer_Address__c(
            Contact__c      = con1.Id,
            OwnerId         = customer1.Id,
            Address_Type__c = 'Billing',
            Street__c       = '456 Billing Lane',
            City__c         = 'Mumbai',
            State__c        = 'Maharashtra',
            Postal_Code__c  = '400002',
            Country__c      = 'India',
            Is_Default__c   = false
        );

        Customer_Address__c shipping2 = new Customer_Address__c(
            Contact__c      = con2.Id,
            OwnerId         = customer2.Id,
            Address_Type__c = 'Shipping',
            Street__c       = '789 Other Street',
            City__c         = 'Mumbai',
            State__c        = 'Maharashtra',
            Postal_Code__c  = '400002',
            Country__c      = 'India',
            Is_Default__c   = true
        );

        insert new List<Customer_Address__c>{ shipping1, billing1, shipping2 };
    }

    // ================================================================
    // Helper Methods
    // ================================================================

    /**
     * @description Retrieves the community user linked to the given Contact lastName.
     */
    private static User getCustomerUser(String contactLastName) {
        Contact con = [
            SELECT Id
            FROM Contact
            WHERE LastName = :contactLastName
            LIMIT 1
        ];
        return [
            SELECT Id, ContactId
            FROM User
            WHERE ContactId = :con.Id AND IsActive = true
            LIMIT 1
        ];
    }

    /**
     * @description Retrieves the Shipping address Id for a given Contact.
     */
    private static Id getShippingAddressId(Id contactId) {
        return [
            SELECT Id
            FROM Customer_Address__c
            WHERE Contact__c = :contactId
              AND Address_Type__c = 'Shipping'
            LIMIT 1
        ].Id;
    }

    /**
     * @description Retrieves the Billing address Id for a given Contact.
     */
    private static Id getBillingAddressId(Id contactId) {
        return [
            SELECT Id
            FROM Customer_Address__c
            WHERE Contact__c = :contactId
              AND Address_Type__c = 'Billing'
            LIMIT 1
        ].Id;
    }

    /**
     * @description Returns the first active Payment_Method__c picklist value.
     */
    private static String getValidPaymentMethod() {
        for (Schema.PicklistEntry entry :
            Payment__c.Payment_Method__c.getDescribe().getPicklistValues()
        ) {
            if (entry.isActive()) {
                return entry.getValue();
            }
        }
        return null;
    }

    /**
     * @description Creates a CartItemRequest instance.
     */
    private static CommerceOrderService.CartItemRequest cartItem(
        Id variantId, Integer quantity
    ) {
        CommerceOrderService.CartItemRequest item =
            new CommerceOrderService.CartItemRequest();
        item.productVariantId = variantId;
        item.quantity = quantity;
        return item;
    }

    /**
     * @description Retrieves a ProductVariant__c Id by name.
     */
    private static Id variantId(String variantName) {
        return [
            SELECT Id FROM ProductVariant__c
            WHERE Name = :variantName LIMIT 1
        ].Id;
    }


    // ================================================================
    // 1. Successful Checkout (covers scenarios 1,4,6,7,8,9,10,11,12,13,14)
    // ================================================================

    @IsTest
    static void successfulCheckout_allRecordsCreatedCorrectly() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        // Capture pre-checkout inventory
        Decimal stockBefore = [
            SELECT Available_Stock__c
            FROM Inventory__c
            WHERE Product_Variant__c = :blueId AND Active__c = true
            LIMIT 1
        ].Available_Stock__c;

        List<CommerceOrderService.CartItemRequest> cart =
            new List<CommerceOrderService.CartItemRequest>{ cartItem(blueId, 1) };

        CommerceOrderService.CheckoutResult result;
        Date expectedDate;

        System.runAs(customer) {
            Test.startTest();
            result = CommerceOrderService.placeOrder(cart, addressId, method);
            expectedDate = Date.today();
            Test.stopTest();
        }

        // ---- CheckoutResult assertions ----
        System.assertNotEquals(null, result, 'Result should not be null.');
        System.assertNotEquals(null, result.orderId, 'Order Id should be set.');
        System.assertEquals('Confirmed', result.orderStatus, 'Order status should be Confirmed.');
        System.assertEquals('Paid', result.paymentStatus, 'Payment status should be Paid.');

        // Financial: Subtotal=1000, GST=180, Shipping=0 (>=1000), Total=1180
        System.assertEquals(1000.00, result.subtotal, 'Subtotal should be 1000.');
        System.assertEquals(180.00, result.tax, 'Tax (GST 18%) should be 180.');
        System.assertEquals(0.00, result.shippingCharge, 'Free shipping at threshold.');
        System.assertEquals(1180.00, result.totalAmount, 'Total should be 1180.');
        System.assertNotEquals(null, result.transactionReference,
            'Transaction reference should be generated.');
        System.assert(result.transactionReference.startsWith('CH-'),
            'Reference should start with CH-.');

        // ---- Order__c assertions ----
        Order__c order = [
            SELECT Contact__c, Shipping_Address__c, Order_Status__c,
                   Payment_Status__c, Shipping_Status__c, Subtotal__c,
                   Tax__c, Shipping_Charge__c, Total_Amount__c
            FROM Order__c
            WHERE Id = :result.orderId
        ];
        System.assertEquals(customer.ContactId, order.Contact__c, 'Order Contact mismatch.');
        System.assertEquals(addressId, order.Shipping_Address__c, 'Order address mismatch.');
        System.assertEquals('Confirmed', order.Order_Status__c);
        System.assertEquals('Paid', order.Payment_Status__c);
        System.assertEquals('Not Shipped', order.Shipping_Status__c);
        System.assertEquals(1000.00, order.Subtotal__c);
        System.assertEquals(180.00, order.Tax__c);
        System.assertEquals(0.00, order.Shipping_Charge__c);
        System.assertEquals(1180.00, order.Total_Amount__c);

        // ---- OrderItem__c assertions (price snapshot) ----
        List<OrderItem__c> items = [
            SELECT Product_Variant__c, Quantity__c, Unit_Price__c
            FROM OrderItem__c
            WHERE Order__c = :result.orderId
        ];
        System.assertEquals(1, items.size(), 'Should have 1 order item.');
        System.assertEquals(blueId, items[0].Product_Variant__c);
        System.assertEquals(1, items[0].Quantity__c);
        System.assertEquals(1000.00, items[0].Unit_Price__c,
            'Unit price should snapshot variant Price__c.');

        // ---- Payment__c assertions ----
        List<Payment__c> payments = [
            SELECT Order__c, Amount__c, Payment_Method__c,
                   Payment_Status__c, Transaction_Reference__c
            FROM Payment__c
            WHERE Order__c = :result.orderId
        ];
        System.assertEquals(1, payments.size(), 'Should have 1 payment.');
        System.assertEquals(1180.00, payments[0].Amount__c);
        System.assertEquals(method, payments[0].Payment_Method__c);
        System.assertEquals('Successful', payments[0].Payment_Status__c);
        System.assertNotEquals(null, payments[0].Transaction_Reference__c);

        // ---- Inventory deduction ----
        Decimal stockAfter = [
            SELECT Available_Stock__c
            FROM Inventory__c
            WHERE Product_Variant__c = :blueId AND Active__c = true
            LIMIT 1
        ].Available_Stock__c;
        System.assertEquals(stockBefore - 1, stockAfter,
            'Inventory should be reduced by ordered quantity.');

        // ---- Inventory_Transaction__c assertions ----
        List<Inventory_Transaction__c> txns = [
            SELECT Inventory__c, Transaction_Type__c, Quantity__c, Transaction_Date__c
            FROM Inventory_Transaction__c
            WHERE Inventory__c IN (
                SELECT Id FROM Inventory__c WHERE Product_Variant__c = :blueId
            )
        ];
        System.assertEquals(1, txns.size(), 'Should have 1 sale transaction.');
        System.assertEquals('Sale', txns[0].Transaction_Type__c);
        System.assertEquals(1, txns[0].Quantity__c);
        System.assertEquals(
            expectedDate,
            txns[0].Transaction_Date__c,
            'Inventory transaction date should be today.'
        );
    }


    // ================================================================
    // 2. Multiple Cart Lines
    // ================================================================

    @IsTest
    static void multipleCartLines_createsDistinctOrderItems() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blackId    = variantId('Black 500');
        Id redId      = variantId('Red 1500');

        List<CommerceOrderService.CartItemRequest> cart =
            new List<CommerceOrderService.CartItemRequest>{
                cartItem(blackId, 1),
                cartItem(redId, 2)
            };

        CommerceOrderService.CheckoutResult result;

        System.runAs(customer) {
            Test.startTest();
            result = CommerceOrderService.placeOrder(cart, addressId, method);
            Test.stopTest();
        }

        // Subtotal = 500*1 + 1500*2 = 3500, Tax=630, Ship=0, Total=4130
        System.assertEquals(3500.00, result.subtotal);
        System.assertEquals(630.00, result.tax);
        System.assertEquals(0.00, result.shippingCharge);
        System.assertEquals(4130.00, result.totalAmount);

        List<OrderItem__c> items = [
            SELECT Product_Variant__c, Quantity__c, Unit_Price__c
            FROM OrderItem__c
            WHERE Order__c = :result.orderId
            ORDER BY Unit_Price__c ASC
        ];
        System.assertEquals(2, items.size(), 'Should have 2 distinct order items.');
        System.assertEquals(blackId, items[0].Product_Variant__c);
        System.assertEquals(1, items[0].Quantity__c);
        System.assertEquals(500.00, items[0].Unit_Price__c);
        System.assertEquals(redId, items[1].Product_Variant__c);
        System.assertEquals(2, items[1].Quantity__c);
        System.assertEquals(1500.00, items[1].Unit_Price__c);
    }


    // ================================================================
    // 3. Duplicate Cart Lines Aggregated
    // ================================================================

    @IsTest
    static void duplicateCartLines_aggregatedIntoSingleOrderItem() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blackId    = variantId('Black 500');

        List<CommerceOrderService.CartItemRequest> cart =
            new List<CommerceOrderService.CartItemRequest>{
                cartItem(blackId, 2),
                cartItem(blackId, 3)
            };

        CommerceOrderService.CheckoutResult result;

        System.runAs(customer) {
            Test.startTest();
            result = CommerceOrderService.placeOrder(cart, addressId, method);
            Test.stopTest();
        }

        // Subtotal = 500 * 5 = 2500
        System.assertEquals(2500.00, result.subtotal);

        List<OrderItem__c> items = [
            SELECT Quantity__c, Unit_Price__c
            FROM OrderItem__c
            WHERE Order__c = :result.orderId
        ];
        System.assertEquals(1, items.size(),
            'Duplicate variants should produce a single OrderItem.');
        System.assertEquals(5, items[0].Quantity__c,
            'Quantities should be aggregated.');
        System.assertEquals(500.00, items[0].Unit_Price__c);
    }


    // ================================================================
    // 5. Shipping Charge Below ₹1000 Threshold
    // ================================================================

    @IsTest
    static void shippingBelowThreshold_chargesStandardRate() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blackId    = variantId('Black 500');

        List<CommerceOrderService.CartItemRequest> cart =
            new List<CommerceOrderService.CartItemRequest>{ cartItem(blackId, 1) };

        CommerceOrderService.CheckoutResult result;

        System.runAs(customer) {
            Test.startTest();
            result = CommerceOrderService.placeOrder(cart, addressId, method);
            Test.stopTest();
        }

        // Subtotal=500, Tax=90, Shipping=100, Total=690
        System.assertEquals(500.00, result.subtotal);
        System.assertEquals(90.00, result.tax);
        System.assertEquals(100.00, result.shippingCharge,
            'Shipping should be charged below threshold.');
        System.assertEquals(690.00, result.totalAmount);
    }


    // ================================================================
    // 15. Empty Cart Rejection
    // ================================================================

    @IsTest
    static void emptyCart_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>(),
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Empty cart should throw AuraHandledException.');
    }


    // ================================================================
    // 15b. Null Cart Rejection
    // ================================================================

    @IsTest
    static void nullCart_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(null, addressId, method);
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Null cart should throw AuraHandledException.');
    }


    // ================================================================
    // 16. Zero Quantity Rejection
    // ================================================================

    @IsTest
    static void zeroQuantity_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 0)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Zero quantity should throw AuraHandledException.');
    }


    // ================================================================
    // 17. Negative Quantity Rejection
    // ================================================================

    @IsTest
    static void negativeQuantity_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, -5)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Negative quantity should throw AuraHandledException.');
    }


    // ================================================================
    // 18. Missing Variant Id Rejection
    // ================================================================

    @IsTest
    static void missingVariantId_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(null, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Null variant Id should throw AuraHandledException.');
    }


    // ================================================================
    // 19. Inactive Variant Rejection
    // ================================================================

    @IsTest
    static void inactiveVariant_throwsException() {

        User customer    = getCustomerUser('CustomerOne');
        Id addressId     = getShippingAddressId(customer.ContactId);
        String method    = getValidPaymentMethod();
        Id inactiveVarId = variantId('Inactive Variant');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(inactiveVarId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Inactive variant should throw AuraHandledException.');
    }


    // ================================================================
    // 20. Inactive Product Rejection
    // ================================================================

    @IsTest
    static void inactiveProduct_throwsException() {

        User customer       = getCustomerUser('CustomerOne');
        Id addressId        = getShippingAddressId(customer.ContactId);
        String method       = getValidPaymentMethod();
        Id inactiveProdVarId = variantId('Inactive Product Variant');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(inactiveProdVarId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Variant on inactive product should throw AuraHandledException.');
    }


    // ================================================================
    // 21. Inactive Category Rejection
    // ================================================================

    @IsTest
    static void inactiveCategory_throwsException() {

        User customer      = getCustomerUser('CustomerOne');
        Id addressId       = getShippingAddressId(customer.ContactId);
        String method      = getValidPaymentMethod();
        Id inactiveCatVarId = variantId('Inactive Cat Variant');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(inactiveCatVarId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Variant with inactive category should throw AuraHandledException.');
    }


    // ================================================================
    // 22. Missing Inventory Rejection
    // ================================================================

    @IsTest
    static void missingInventory_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id silverId   = variantId('Silver No Inventory');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(silverId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Missing inventory should throw AuraHandledException.');
    }


    // ================================================================
    // 23. Insufficient Stock Rejection
    // ================================================================

    @IsTest
    static void insufficientStock_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id goldId     = variantId('Gold Low Stock');

        // Gold has stock=2, requesting 10
        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(goldId, 10)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Insufficient stock should throw AuraHandledException.');
    }


    // ================================================================
    // 24. Other Customer's Address Rejection
    // ================================================================

    @IsTest
    static void otherCustomerAddress_throwsException() {

        User customer1       = getCustomerUser('CustomerOne');
        User customer2       = getCustomerUser('CustomerTwo');
        Id customer2Address  = getShippingAddressId(customer2.ContactId);
        String method        = getValidPaymentMethod();
        Id blueId            = variantId('Blue 1000');

        // Customer 1 tries to use Customer 2's address
        Boolean exceptionThrown = false;

        System.runAs(customer1) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    customer2Address, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Using another customer\'s address should throw AuraHandledException.');
    }


    // ================================================================
    // 25. Non-Shipping Address Rejection
    // ================================================================

    @IsTest
    static void nonShippingAddress_throwsException() {

        User customer    = getCustomerUser('CustomerOne');
        Id billingAddrId = getBillingAddressId(customer.ContactId);
        String method    = getValidPaymentMethod();
        Id blueId        = variantId('Blue 1000');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    billingAddrId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Billing address should throw AuraHandledException.');
    }


    // ================================================================
    // 25b. Null Shipping Address Rejection
    // ================================================================

    @IsTest
    static void nullShippingAddress_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    null, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Null shipping address should throw AuraHandledException.');
    }


    // ================================================================
    // 26. Invalid Payment Method Rejection
    // ================================================================

    @IsTest
    static void invalidPaymentMethod_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        Id blueId     = variantId('Blue 1000');

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    addressId,
                    'COMPLETELY_INVALID_METHOD_XYZ'
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Invalid payment method should throw AuraHandledException.');
    }


    // ================================================================
    // 27. User Without Contact Rejection
    // ================================================================

    @IsTest
    static void userWithoutContact_throwsException() {

        // Run as the admin/test-running user who has no ContactId
        User currentUser = new User(Id = UserInfo.getUserId());
        Id addressId     = getShippingAddressId(
            [SELECT Id FROM Contact WHERE LastName = 'CustomerOne' LIMIT 1].Id
        );
        String method    = getValidPaymentMethod();
        Id blueId        = variantId('Blue 1000');

        Boolean exceptionThrown = false;

        System.runAs(currentUser) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'User without Contact should throw AuraHandledException.');
    }


    // ================================================================
    // 28. Transaction Rollback — No Partial Records
    // ================================================================

    @IsTest
    static void transactionRollback_noPartialRecordsCreated() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        Decimal stockBefore = [
            SELECT Available_Stock__c
            FROM Inventory__c
            WHERE Product_Variant__c = :blueId AND Active__c = true
            LIMIT 1
        ].Available_Stock__c;

        // Activate the test hook that throws after Order + OrderItem + Inventory DML
        CommerceOrderService.forceTransactionFailure = true;

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Forced failure should throw AuraHandledException.');

        // Verify no partial records remain after rollback
        System.assertEquals(0,
            [SELECT COUNT() FROM Order__c],
            'No Order should exist after rollback.');
        System.assertEquals(0,
            [SELECT COUNT() FROM OrderItem__c],
            'No OrderItem should exist after rollback.');
        System.assertEquals(0,
            [SELECT COUNT() FROM Payment__c],
            'No Payment should exist after rollback.');
        System.assertEquals(0,
            [SELECT COUNT() FROM Inventory_Transaction__c],
            'No Inventory Transaction should exist after rollback.');

        // Verify inventory stock is unchanged
        Decimal stockAfter = [
            SELECT Available_Stock__c
            FROM Inventory__c
            WHERE Product_Variant__c = :blueId AND Active__c = true
            LIMIT 1
        ].Available_Stock__c;
        System.assertEquals(stockBefore, stockAfter,
            'Inventory should be unchanged after rollback.');
    }


    // ================================================================
    // 29. Bulk-Sized Cart Processing
    // ================================================================

    @IsTest
    static void bulkCart_processesWithinGovernorLimits() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();

        Product2 product = [
            SELECT Id FROM Product2 WHERE Name = 'Test Smartphone' LIMIT 1
        ];

        // Create 50 additional variants with inventory
        List<ProductVariant__c> bulkVariants = new List<ProductVariant__c>();
        for (Integer i = 1; i <= 50; i++) {
            bulkVariants.add(new ProductVariant__c(
                Name       = 'Bulk Variant ' + i,
                Product__c = product.Id,
                SKU__c     = 'BULK-' + i,
                Price__c   = 100 + i,
                Color__c   = 'Bulk',
                Size__c    = 'Standard',
                Active__c  = true
            ));
        }
        insert bulkVariants;

        List<Inventory__c> bulkInventory = new List<Inventory__c>();
        for (ProductVariant__c v : bulkVariants) {
            bulkInventory.add(new Inventory__c(
                Product_Variant__c = v.Id,
                Available_Stock__c = 100,
                Active__c          = true
            ));
        }
        insert bulkInventory;

        // Build cart with all 50 variants
        List<CommerceOrderService.CartItemRequest> cart =
            new List<CommerceOrderService.CartItemRequest>();
        for (ProductVariant__c v : bulkVariants) {
            cart.add(cartItem(v.Id, 1));
        }

        CommerceOrderService.CheckoutResult result;

        System.runAs(customer) {
            Test.startTest();
            result = CommerceOrderService.placeOrder(cart, addressId, method);
            Test.stopTest();
        }

        System.assertNotEquals(null, result, 'Bulk checkout should succeed.');
        System.assertNotEquals(null, result.orderId);

        Integer itemCount = [
            SELECT COUNT() FROM OrderItem__c WHERE Order__c = :result.orderId
        ];
        System.assertEquals(50, itemCount,
            'Should create 50 distinct order items.');
    }


    // ================================================================
    // 30. Inventory Row Locking Exercised During Placement
    // ================================================================

    @IsTest
    static void inventoryLocking_correctStockDeduction() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        Decimal stockBefore = [
            SELECT Available_Stock__c
            FROM Inventory__c
            WHERE Product_Variant__c = :blueId AND Active__c = true
            LIMIT 1
        ].Available_Stock__c;

        Integer orderQty = 5;

        CommerceOrderService.CheckoutResult result;
        Date expectedDate;

        System.runAs(customer) {
            Test.startTest();
            result = CommerceOrderService.placeOrder(
                new List<CommerceOrderService.CartItemRequest>{
                    cartItem(blueId, orderQty)
                },
                addressId, method
            );
            expectedDate = Date.today();
            Test.stopTest();
        }

        // Verify stock correctly deducted through the FOR UPDATE path
        Decimal stockAfter = [
            SELECT Available_Stock__c
            FROM Inventory__c
            WHERE Product_Variant__c = :blueId AND Active__c = true
            LIMIT 1
        ].Available_Stock__c;

        System.assertEquals(stockBefore - orderQty, stockAfter,
            'Stock should be deducted by order quantity through locking path.');

        // Verify the inventory transaction record
        List<Inventory_Transaction__c> txns = [
            SELECT Quantity__c, Transaction_Type__c, Transaction_Date__c
            FROM Inventory_Transaction__c
            WHERE Inventory__c IN (
                SELECT Id FROM Inventory__c WHERE Product_Variant__c = :blueId
            )
        ];
        System.assertEquals(1, txns.size());
        System.assertEquals('Sale', txns[0].Transaction_Type__c);
        System.assertEquals(orderQty, txns[0].Quantity__c);
        System.assertEquals(expectedDate, txns[0].Transaction_Date__c);
    }


    // ================================================================
    // 31. Duplicate Active Inventory Record Rejection
    // ================================================================

    @IsTest
    static void duplicateActiveInventory_throwsException() {

        User customer = getCustomerUser('CustomerOne');
        Id addressId  = getShippingAddressId(customer.ContactId);
        String method = getValidPaymentMethod();
        Id blueId     = variantId('Blue 1000');

        // Insert a second active inventory record for the same product variant
        insert new Inventory__c(
            Product_Variant__c = blueId,
            Available_Stock__c = 30,
            Active__c          = true
        );

        Boolean exceptionThrown = false;

        System.runAs(customer) {
            Test.startTest();
            try {
                CommerceOrderService.placeOrder(
                    new List<CommerceOrderService.CartItemRequest>{
                        cartItem(blueId, 1)
                    },
                    addressId, method
                );
            } catch (AuraHandledException e) {
                exceptionThrown = true;
            }
            Test.stopTest();
        }

        System.assertEquals(true, exceptionThrown,
            'Duplicate active inventory records should throw AuraHandledException.');
    }
}
