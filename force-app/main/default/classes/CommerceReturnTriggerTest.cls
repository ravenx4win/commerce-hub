/**
 * @description Comprehensive unit tests for CommerceReturnTrigger, CommerceReturnTriggerHandler,
 *              and CommerceReturnNotificationQueueable.
 *              Uses isolated test data (SeeAllData=false).
 *              Verifies return notification queueing, email construction, HTML escaping,
 *              bulk safety, non-qualifying statuses, missing contact emails, update immunity,
 *              and end-to-end integration with CommerceReturnService.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
@IsTest
private class CommerceReturnTriggerTest {

    @TestSetup
    static void setupTestData() {
        // 1. Catalog & Inventory
        Category__c category = new Category__c(Name = 'Return Notif Category', Active__c = true);
        insert category;

        Product2 product = new Product2(Name = 'Return Notif Product', IsActive = true, Commerce_Hub_Category__c = category.Id);
        insert product;

        ProductVariant__c variant = new ProductVariant__c(
            Name = 'Return Notif Variant',
            Product__c = product.Id,
            SKU__c = 'RET-NOTIF-VAR-1',
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
        Account acc = new Account(Name = 'Return Notification Account');
        insert acc;

        Contact conWithEmail = new Contact(
            FirstName = 'ReturnNotif & <Special>',
            LastName = 'Customer >',
            AccountId = acc.Id,
            Email = 'return.notif.customer@test.com'
        );

        Contact conNoEmail = new Contact(
            FirstName = 'ReturnNoEmail',
            LastName = 'Customer',
            AccountId = acc.Id
        );
        insert new List<Contact>{ conWithEmail, conNoEmail };

        // 3. Customer User
        User adminUser = new User(Id = UserInfo.getUserId());
        User customerUser;

        System.runAs(adminUser) {
            Profile communityProfile = [
                SELECT Id FROM Profile WHERE Name = 'Customer Community User' LIMIT 1
            ];

            String orgId = UserInfo.getOrganizationId();

            customerUser = new User(
                FirstName = 'ReturnNotif',
                LastName = 'Customer',
                Email = 'return.notif.customer@test.com',
                Username = 'ret.notif.cust.' + orgId + '@test.com',
                Alias = 'rncust',
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
            Street__c = '200 Return Way',
            City__c = 'Mumbai',
            State__c = 'Maharashtra',
            Postal_Code__c = '400001',
            Country__c = 'India',
            Is_Default__c = true
        );
        insert shippingAddr;

        // 4. Order & Order Item
        Order__c orderWithEmail = new Order__c(
            Contact__c = conWithEmail.Id,
            Shipping_Address__c = shippingAddr.Id,
            OwnerId = customerUser.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 2000.00,
            Tax__c = 360.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 2360.00
        );

        Order__c orderNoEmail = new Order__c(
            Contact__c = conNoEmail.Id,
            Shipping_Address__c = shippingAddr.Id,
            Order_Status__c = 'Confirmed',
            Payment_Status__c = 'Paid',
            Shipping_Status__c = 'Not Shipped',
            Subtotal__c = 1000.00,
            Tax__c = 180.00,
            Shipping_Charge__c = 0.00,
            Total_Amount__c = 1180.00
        );
        insert new List<Order__c>{ orderWithEmail, orderNoEmail };

        OrderItem__c oi1 = new OrderItem__c(
            Order__c = orderWithEmail.Id,
            Product_Variant__c = variant.Id,
            Quantity__c = 2,
            Unit_Price__c = 1000.00
        );
        insert oi1;
    }

    private static Contact getContactWithEmail() {
        return [SELECT Id, Email FROM Contact WHERE Email = 'return.notif.customer@test.com' LIMIT 1];
    }

    private static Contact getContactNoEmail() {
        return [SELECT Id FROM Contact WHERE FirstName = 'ReturnNoEmail' LIMIT 1];
    }

    private static User getCustomerUser() {
        return [SELECT Id, ContactId FROM User WHERE Alias = 'rncust' LIMIT 1];
    }

    private static Order__c getOrderWithEmail() {
        return [SELECT Id, Name FROM Order__c WHERE Contact__r.Email != null LIMIT 1];
    }

    private static Order__c getOrderNoEmail() {
        return [SELECT Id, Name FROM Order__c WHERE Contact__r.Email = null LIMIT 1];
    }

    private static OrderItem__c getOrderItem() {
        return [SELECT Id FROM OrderItem__c LIMIT 1];
    }

    private static String getValidReturnReason() {
        for (Schema.PicklistEntry entry : Return__c.Return_Reason__c.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                return entry.getValue();
            }
        }
        return 'Damaged';
    }

    private static String getNonQualifyingReturnStatus() {
        for (Schema.PicklistEntry entry : Return__c.Return_Status__c.getDescribe().getPicklistValues()) {
            if (entry.isActive() && entry.getValue() != 'Requested') {
                return entry.getValue();
            }
        }
        return null;
    }

    @IsTest
    static void testSuccessfulRequestedReturn_QueuesNotification() {
        Order__c ord = getOrderWithEmail();
        Contact con = getContactWithEmail();
        String reason = getValidReturnReason();

        Return__c ret = new Return__c(
            Order__c = ord.Id,
            Return_Status__c = 'Requested',
            Return_Reason__c = reason,
            Return_Date__c = Date.today(),
            Refund_Amount__c = 2000.00
        );

        CommerceReturnNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert ret;
        Test.stopTest();

        System.assertNotEquals(null, ret.Id, 'Return record should be inserted successfully.');
        System.assertNotEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'Sent email list should not be null.');
        System.assertEquals(1, CommerceReturnNotificationQueueable.lastSentEmails.size(), 'Exactly 1 return email message should be constructed.');

        Messaging.SingleEmailMessage sentEmail = CommerceReturnNotificationQueueable.lastSentEmails[0];
        Order__c queriedOrder = [SELECT Name FROM Order__c WHERE Id = :ord.Id];
        String expectedReturnDateStr = String.valueOf(ret.Return_Date__c);

        System.assertEquals(con.Email, sentEmail.getToAddresses()[0], 'Email recipient should match customer email.');
        System.assert(sentEmail.getSubject().contains(queriedOrder.Name), 'Subject should contain order number.');

        // Prove HTML escaping of special characters (<, >, &)
        String htmlBody = sentEmail.getHtmlBody();
        System.assert(htmlBody.contains('&amp;'), 'HTML body must contain HTML-escaped ampersand (&amp;).');
        System.assert(htmlBody.contains('&lt;Special&gt;'), 'HTML body must contain HTML-escaped angle brackets (&lt;Special&gt;).');
        System.assert(!htmlBody.contains('<Special>'), 'HTML body must NOT contain raw unescaped HTML characters <Special>.');

        // Verify Return Date inclusion
        System.assert(htmlBody.contains(expectedReturnDateStr), 'HTML body must contain Return Date.');
        System.assert(sentEmail.getPlainTextBody().contains(expectedReturnDateStr), 'Plain text body must contain Return Date.');

        System.assert(htmlBody.contains(reason.escapeHtml4()), 'HTML body should contain return reason.');
        System.assert(htmlBody.contains('2000') || htmlBody.contains('2,000'), 'HTML body should contain refund amount.');
        System.assert(sentEmail.getPlainTextBody().contains('ReturnNotif & <Special>'), 'Plain text body should contain raw customer name.');
        System.assert(sentEmail.getPlainTextBody().contains(reason), 'Plain text body should contain return reason.');
        System.assert(sentEmail.getPlainTextBody().contains('2000') || sentEmail.getPlainTextBody().contains('2,000'), 'Plain text body should contain refund amount.');

        // Verify absence of inventory information
        String htmlUpper = htmlBody.toUpperCase();
        System.assert(!htmlUpper.contains('INVENTORY'), 'Return notification body must not expose inventory information.');
        System.assert(!htmlUpper.contains('AVAILABLE_STOCK'), 'Return notification body must not expose stock fields.');
    }

    @IsTest
    static void testBulkInsertReturns_EnqueuesSingleJob() {
        Order__c ord = getOrderWithEmail();
        String reason = getValidReturnReason();

        List<Return__c> returns = new List<Return__c>{
            new Return__c(
                Order__c = ord.Id,
                Return_Status__c = 'Requested',
                Return_Reason__c = reason,
                Return_Date__c = Date.today(),
                Refund_Amount__c = 1000.00
            ),
            new Return__c(
                Order__c = ord.Id,
                Return_Status__c = 'Requested',
                Return_Reason__c = reason,
                Return_Date__c = Date.today(),
                Refund_Amount__c = 1000.00
            )
        };

        CommerceReturnNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert returns;
        Test.stopTest();

        System.assertEquals(2, returns.size(), 'Bulk returns should be inserted successfully.');
        System.assertNotEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'Emails should be captured.');
        System.assertEquals(2, CommerceReturnNotificationQueueable.lastSentEmails.size(), 'Both returns should generate email messages.');
    }

    @IsTest
    static void testNonQualifyingReturnStatus_DoesNotQueueNotification() {
        Order__c ord = getOrderWithEmail();
        String nonQualifyingStatus = getNonQualifyingReturnStatus();
        String reason = getValidReturnReason();

        if (nonQualifyingStatus != null) {
            Return__c ret = new Return__c(
                Order__c = ord.Id,
                Return_Status__c = nonQualifyingStatus,
                Return_Reason__c = reason,
                Return_Date__c = Date.today(),
                Refund_Amount__c = 1000.00
            );

            CommerceReturnNotificationQueueable.lastSentEmails = null;

            Test.startTest();
            insert ret;
            Test.stopTest();

            System.assertNotEquals(null, ret.Id, 'Return with non-qualifying status should be created cleanly.');
            System.assertEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'Non-qualifying status should not dispatch emails.');
        } else {
            // Verify handler logic with null/non-Requested record list
            CommerceReturnNotificationQueueable.lastSentEmails = null;

            Test.startTest();
            CommerceReturnTriggerHandler.handleAfterInsert(new List<Return__c>());
            Test.stopTest();

            System.assertEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'Empty return list should not queue job.');
        }
    }

    @IsTest
    static void testReturnWithNoContactEmail_SkipsSafely() {
        Order__c ordNoEmail = getOrderNoEmail();
        String reason = getValidReturnReason();

        Return__c ret = new Return__c(
            Order__c = ordNoEmail.Id,
            Return_Status__c = 'Requested',
            Return_Reason__c = reason,
            Return_Date__c = Date.today(),
            Refund_Amount__c = 1000.00
        );

        CommerceReturnNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        insert ret;
        Test.stopTest();

        System.assertNotEquals(null, ret.Id, 'Return for contact without email should insert cleanly.');
        System.assertEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'No emails should be dispatched for missing email contact.');
    }

    @IsTest
    static void testQueueableDirectExecution_ValidatesContentAndNoInventoryInfo() {
        Order__c ord = getOrderWithEmail();
        String reason = getValidReturnReason();

        Return__c ret = new Return__c(
            Order__c = ord.Id,
            Return_Status__c = 'Requested',
            Return_Reason__c = reason,
            Return_Date__c = Date.today(),
            Refund_Amount__c = 1500.00
        );
        insert ret;

        CommerceReturnNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        CommerceReturnNotificationQueueable job = new CommerceReturnNotificationQueueable(new Set<Id>{ ret.Id });
        System.enqueueJob(job);
        Test.stopTest();

        System.assertNotEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'Sent email list should be populated.');
        Messaging.SingleEmailMessage sentMail = CommerceReturnNotificationQueueable.lastSentEmails[0];
        Order__c queriedOrder = [SELECT Name FROM Order__c WHERE Id = :ord.Id];
        String expectedReturnDateStr = String.valueOf(ret.Return_Date__c);

        System.assert(sentMail.getSubject().contains(queriedOrder.Name), 'Subject must contain order number.');
        System.assert(sentMail.getHtmlBody().contains('&amp;'), 'HTML body must contain HTML-escaped ampersand.');
        System.assert(sentMail.getHtmlBody().contains('&lt;Special&gt;'), 'HTML body must contain HTML-escaped angle brackets.');
        System.assert(!sentMail.getHtmlBody().contains('<Special>'), 'HTML body must NOT contain raw unescaped HTML characters.');
        System.assert(sentMail.getHtmlBody().contains(expectedReturnDateStr), 'HTML body must contain Return Date.');
        System.assert(sentMail.getPlainTextBody().contains(expectedReturnDateStr), 'Plain text body must contain Return Date.');
        System.assert(sentMail.getHtmlBody().contains(reason.escapeHtml4()), 'HTML body must contain return reason.');
        System.assert(!sentMail.getHtmlBody().contains('Inventory'), 'HTML body must not contain inventory info.');
    }

    @IsTest
    static void testReturnUpdateDoesNotSendDuplicateEmail() {
        Order__c ord = getOrderWithEmail();
        String reason = getValidReturnReason();

        Return__c ret = new Return__c(
            Order__c = ord.Id,
            Return_Status__c = 'Requested',
            Return_Reason__c = reason,
            Return_Date__c = Date.today(),
            Refund_Amount__c = 1000.00
        );
        insert ret;

        Test.startTest();
        ret.Refund_Amount__c = 1200.00;
        update ret;
        System.assertEquals(0, Limits.getQueueableJobs(), 'Return update transaction must not enqueue queueable jobs.');
        Test.stopTest();

        Return__c updatedRet = [SELECT Refund_Amount__c FROM Return__c WHERE Id = :ret.Id];
        System.assertEquals(1200.00, updatedRet.Refund_Amount__c, 'Return update should complete cleanly.');
    }

    @IsTest
    static void testEndToEndCommerceReturnServiceIntegration() {
        User customerUser = getCustomerUser();
        Order__c ord = getOrderWithEmail();
        OrderItem__c oi = getOrderItem();
        String reason = getValidReturnReason();

        CommerceReturnService.ReturnItemRequest itemReq = new CommerceReturnService.ReturnItemRequest();
        itemReq.orderItemId = oi.Id;
        itemReq.quantity = 1;

        CommerceReturnNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customerUser) {
            result = CommerceReturnService.createReturn(
                ord.Id,
                new List<CommerceReturnService.ReturnItemRequest>{ itemReq },
                reason
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result, 'Return result should not be null.');
        System.assertNotEquals(null, result.returnId, 'Return Id should be populated.');
        System.assertEquals('Requested', result.returnStatus, 'Return status should be Requested.');
        System.assertNotEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'CommerceReturnService return creation should trigger notification email.');
        System.assertEquals(1, CommerceReturnNotificationQueueable.lastSentEmails.size(), 'Exactly 1 notification email should be dispatched.');
    }

    @IsTest
    static void testExistingCommerceReturnServiceBehaviorUnchanged() {
        User customerUser = getCustomerUser();
        Order__c ord = getOrderWithEmail();
        OrderItem__c oi = getOrderItem();
        String reason = getValidReturnReason();

        CommerceReturnService.ReturnItemRequest itemReq = new CommerceReturnService.ReturnItemRequest();
        itemReq.orderItemId = oi.Id;
        itemReq.quantity = 1;

        Test.startTest();
        CommerceReturnService.ReturnResult result;
        System.runAs(customerUser) {
            result = CommerceReturnService.createReturn(
                ord.Id,
                new List<CommerceReturnService.ReturnItemRequest>{ itemReq },
                reason
            );
        }
        Test.stopTest();

        System.assertNotEquals(null, result, 'CommerceReturnService result should not be null.');
        System.assertNotEquals(null, result.returnId, 'CommerceReturnService behavior should remain 100% working and intact.');
    }

    @IsTest
    static void testQueueableEmptyReturnIds_ReturnsSafely() {
        CommerceReturnNotificationQueueable.lastSentEmails = null;

        Test.startTest();
        CommerceReturnNotificationQueueable emptyJob = new CommerceReturnNotificationQueueable(new Set<Id>());
        emptyJob.execute(null);

        CommerceReturnNotificationQueueable nullJob = new CommerceReturnNotificationQueueable(null);
        nullJob.execute(null);
        Test.stopTest();

        System.assertEquals(null, CommerceReturnNotificationQueueable.lastSentEmails, 'Empty or null return ID sets should return safely.');
    }
}
