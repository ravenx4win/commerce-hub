/**
 * @description Comprehensive unit tests for CommerceOrderTrigger, CommerceOrderTriggerHandler,
 *              and CommerceOrderNotificationQueueable.
 *              Uses isolated test data (SeeAllData=false).
 *              Verifies trigger filtering, queueable email dispatch, bulk safety, email content,
 *              skipped contacts, update immunity, and end-to-end checkout integration.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
@IsTest
private class CommerceOrderTriggerTest {

    @TestSetup
    static void setupTestData() {
        // 1. Catalog & Inventory
        Category__c category = new Category__c(Name = 'Notif Category', Active__c = true);
        insert category;

        Product2 product = new Product2(Name = 'Notif Product', IsActive = true, Commerce_Hub_Category__c = category.Id);
        insert product;

        ProductVariant__c variant = new ProductVariant__c(
            Name = 'Notif Variant',
            Product__c = product.Id,
            SKU__c = 'NOTIF-VAR-1',
            Price__c = 1000.00,
            Active__c = true
        );
        insert variant;

        Inventory__c inv = new Inventory__c(
            Product_Variant__c = variant.Id,
            Available_Stock__c = 50,
            Active__c = true
        );
        insert inv;

        // 2. Accounts & Contacts
        Account acc = new Account(Name = 'Notification Customer Account');
        insert acc;

        Contact conWithEmail = new Contact(
            FirstName = 'Notif',
            LastName = 'Customer',
            AccountId = acc.Id,
            Email = 'notif.customer@test.com'
        );

        Contact conNoEmail = new Contact(
            FirstName = 'NoEmail',
            LastName = 'Customer',
            AccountId = acc.Id
        );
        insert new List<Contact>{ conWithEmail, conNoEmail };

        // 3. User & Address for End-to-End Checkout Test
        User adminUser = new User(Id = UserInfo.getUserId());
        User customerUser;

        System.runAs(adminUser) {
            Profile communityProfile = [
                SELECT Id FROM Profile WHERE Name = 'Customer Community User' LIMIT 1
            ];

            String orgId = UserInfo.getOrganizationId();

            customerUser = new User(
                FirstName = 'Notif',
                LastName = 'Customer',
                Email = 'notif.customer@test.com',
                Username = 'notif.cust.' + orgId + '@test.com',
                Alias = 'ncust',
                TimeZoneSidKey = 'Asia/Kolkata',
                LocaleSidKey = 'en_IN',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = communityProfile.Id,
                ContactId = conWithEmail.Id
            );
            insert customerUser;

            PermissionSet customerPS = [
                SELECT Id FROM PermissionSet WHERE Name = 'Commerce_Hub_Customer' LIMIT 1
            ];

            insert new PermissionSetAssignment(
                AssigneeId = customerUser.Id,
                PermissionSetId = customerPS.Id
            );
        }

        Customer_Address__c shippingAddr = new Customer_Address__c(
            Contact__c = conWithEmail.Id,
            OwnerId = customerUser.Id,
            Address_Type__c = 'Shipping',
            Street__c = '100 Notif Way',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400001',
            Country__c = 'India',
            Is_Default__c = true
        );
        insert shippingAddr;
    }

    private static Contact getContactWithEmail() {
        return [SELECT Id, Email FROM Contact WHERE LastName = 'Customer' AND Email != null LIMIT 1];
    }

    private static Contact getContactNoEmail() {
        return [SELECT Id FROM Contact WHERE FirstName = 'NoEmail' LIMIT 1];
    }

    private static User getCustomerUser() {
        return [SELECT Id, ContactId FROM User WHERE Alias = 'ncust' LIMIT 1];
    }

    private static Customer_Address__c getShippingAddress() {
        return [SELECT Id FROM Customer_Address__c WHERE Address_Type__c = 'Shipping' LIMIT 1];
    }

    private static ProductVariant__c getVariant() {
        return [SELECT Id FROM ProductVariant__c WHERE SKU__c = 'NOTIF-VAR-1' LIMIT 1];
    }

    @IsTest
    static void testSuccessfulConfirmedPaidOrder_SendsEmail() {
        Contact con = getContactWithEmail();
        Customer_Address__c addr = getShippingAddress();

        Order__c order = new Order__c(
            Contact__c = con.Id,
            Shipping_Address__c = addr.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert order;
        Test.stopTest();

        System.assertNotEquals(null, order.Id, 'Order should be inserted successfully.');
        System.assertNotEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'Sent email list should not be null.');
        System.assertEquals(1, CommerceOrderNotificationQueueable.lastSentEmails.size(), 'Exactly 1 email message should be constructed.');

        Messaging.SingleEmailMessage sentEmail = CommerceOrderNotificationQueueable.lastSentEmails[0];
        Order__c queriedOrder = [SELECT Name FROM Order__c WHERE Id = :order.Id];

        System.assertEquals(con.Email, sentEmail.getToAddresses()[0], 'Email recipient should match customer email.');
        System.assert(sentEmail.getSubject().contains(queriedOrder.Name), 'Subject should contain order number.');
        System.assert(sentEmail.getHtmlBody().contains('Notif Customer'), 'HTML body should contain customer name.');
        System.assert(sentEmail.getHtmlBody().contains('1180') || sentEmail.getHtmlBody().contains('1,180'), 'HTML body should contain total amount.');
        System.assert(sentEmail.getPlainTextBody().contains('Notif Customer'), 'Plain text body should contain customer name.');
        System.assert(sentEmail.getPlainTextBody().contains('1180') || sentEmail.getPlainTextBody().contains('1,180'), 'Plain text body should contain total amount.');

        // Verify inventory information is absent
        String htmlUpper = sentEmail.getHtmlBody().toUpperCase();
        System.assert(!htmlUpper.contains('INVENTORY'), 'Email body must not contain inventory information.');
        System.assert(!htmlUpper.contains('AVAILABLE_STOCK'), 'Email body must not contain inventory stock info.');
    }

    @IsTest
    static void testCancelledOrder_DoesNotSendEmail() {
        Contact con = getContactWithEmail();
        Customer_Address__c addr = getShippingAddress();

        Order__c order = new Order__c(
            Contact__c = con.Id,
            Shipping_Address__c = addr.Id,
            Order_Status__c = 'Cancelled',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert order;
        Test.stopTest();

        System.assertNotEquals(null, order.Id, 'Cancelled order should be created without failing.');
        System.assertEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'No emails should be dispatched for cancelled order.');
    }

    @IsTest
    static void testFailedPaymentOrder_DoesNotSendEmail() {
        Contact con = getContactWithEmail();
        Customer_Address__c addr = getShippingAddress();

        Order__c order = new Order__c(
            Contact__c = con.Id,
            Shipping_Address__c = addr.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Failed',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert order;
        Test.stopTest();

        System.assertNotEquals(null, order.Id, 'Failed payment order should be created without failing.');
        System.assertEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'No emails should be dispatched for failed payment order.');
    }

    @IsTest
    static void testMultipleQualifyingOrders_BulkTransactionEnqueuesSingleJob() {
        Contact con = getContactWithEmail();
        Customer_Address__c addr = getShippingAddress();

        List<Order__c> orders = new List<Order__c>{
            new Order__c(
                Contact__c = con.Id,
                Shipping_Address__c = addr.Id,
                Order_Status__c = 'Confirmed',
                Payment_Status__c = 'Paid',
                Shipping_Status__c = 'Not Shipped',
                Subtotal__c = 1000.00,
                Tax__c = 180.00,
                Shipping_Charge__c = 0.00,
                Total_Amount__c = 1180.00
            ),
            new Order__c(
                Contact__c = con.Id,
                Shipping_Address__c = addr.Id,
                Order_Status__c = 'Confirmed',
                Payment_Status__c = 'Paid',
                Shipping_Status__c = 'Not Shipped',
                Subtotal__c = 2000.00,
                Tax__c = 360.00,
                Shipping_Charge__c = 0.00,
                Total_Amount__c = 2360.00
            )
        };

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert orders;
        Test.stopTest();

        System.assertEquals(2, orders.size(), 'Bulk orders should be created successfully.');
        System.assertNotEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'Emails should be captured.');
        System.assertEquals(2, CommerceOrderNotificationQueueable.lastSentEmails.size(), 'Both orders should generate email messages.');
    }

    @IsTest
    static void testMissingContactEmail_SkipsSafely() {
        Contact conNoEmail = getContactNoEmail();
        Customer_Address__c addr = getShippingAddress();

        Order__c order = new Order__c(
            Contact__c = conNoEmail.Id,
            Shipping_Address__c = addr.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert order;
        Test.stopTest();

        System.assertNotEquals(null, order.Id, 'Order with no-email contact should complete safely.');
        System.assertEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'No emails should be stored.');
    }

    @IsTest
    static void testQueueableDirectExecution_ValidatesContentAndNoInventoryInfo() {
        Contact con = getContactWithEmail();
        Customer_Address__c addr = getShippingAddress();

        Order__c order = new Order__c(
            Contact__c = con.Id,
            Shipping_Address__c = addr.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );

        insert order;

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        CommerceOrderNotificationQueueable job = new CommerceOrderNotificationQueueable(new Set<Id>{ order.Id });
        System.enqueueJob(job);
        Test.stopTest();

        System.assertNotEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'Sent email list should be populated.');
        Messaging.SingleEmailMessage sentMail = CommerceOrderNotificationQueueable.lastSentEmails[0];

        Order__c queriedOrder = [SELECT Name FROM Order__c WHERE Id = :order.Id];
        System.assert(sentMail.getSubject().contains(queriedOrder.Name), 'Subject must contain order number.');
        System.assert(sentMail.getHtmlBody().contains('Notif Customer'), 'HTML body must contain customer name.');
        System.assert(sentMail.getHtmlBody().contains('1180') || sentMail.getHtmlBody().contains('1,180'), 'HTML body must contain total amount.');
        System.assert(!sentMail.getHtmlBody().contains('Inventory'), 'HTML body must not contain inventory info.');
    }

    @IsTest
    static void testQueueableEmptyOrderIds_ReturnsSafely() {
        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        CommerceOrderNotificationQueueable emptyJob = new CommerceOrderNotificationQueueable(new Set<Id>());
        emptyJob.execute(null);

        CommerceOrderNotificationQueueable nullJob = new CommerceOrderNotificationQueueable(null);
        nullJob.execute(null);
        Test.stopTest();

        System.assertEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'Empty or null order ID sets should return safely without sending emails.');
    }

    @IsTest
    static void testOrderUpdateDoesNotTriggerConfirmation() {
        Contact con = getContactWithEmail();
        Customer_Address__c addr = getShippingAddress();

        Order__c order = new Order__c(
            Contact__c = con.Id,
            Shipping_Address__c = addr.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );
        insert order;

        Test.startTest();
        order.Shipping_Status__c = 'Shipped';
        update order;
        System.assertEquals(0, Limits.getQueueableJobs(), 'Order update transaction must not enqueue queueable jobs.');
        Test.stopTest();

        Order__c updatedOrder = [SELECT Shipping_Status__c FROM Order__c WHERE Id = :order.Id];
        System.assertEquals('Shipped', updatedOrder.Shipping_Status__c, 'Order update should complete cleanly.');
    }

    @IsTest
    static void testExistingCommerceOrderServiceBehaviorUnchanged() {
        User customerUser = getCustomerUser();
        Customer_Address__c addr = getShippingAddress();
        ProductVariant__c variant = getVariant();

        CommerceOrderService.CartItemRequest itemReq = new CommerceOrderService.CartItemRequest();
        itemReq.productVariantId = variant.Id;
        itemReq.quantity = 2;

        CommerceOrderNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        CommerceOrderService.CheckoutResult result;
        System.runAs(customerUser) {
            result = CommerceOrderService.placeOrder(
                new List<CommerceOrderService.CartItemRequest>{ itemReq },
                addr.Id,
                getValidPaymentMethod()
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result, 'Checkout result should not be null.');
        System.assertNotEquals(null, result.orderId, 'Order Id should be populated.');
        System.assertEquals('Confirmed', result.orderStatus, 'Order status should be Confirmed.');
        System.assertEquals('Paid', result.paymentStatus, 'Payment status should be Paid.');
        System.assertNotEquals(null, CommerceOrderNotificationQueueable.lastSentEmails, 'Checkout should automatically dispatch order confirmation email.');
        System.assertEquals(1, CommerceOrderNotificationQueueable.lastSentEmails.size(), 'Checkout should dispatch 1 order confirmation email.');
    }

    private static String getValidPaymentMethod() {
        for (Schema.PicklistEntry entry : Payment__c.Payment_Method__c.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                return entry.getValue();
            }
        }
        return 'Credit Card';
    }
}
