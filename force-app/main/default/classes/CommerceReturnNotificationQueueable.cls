/**
 * @description Queueable Apex job for constructing and sending return confirmation emails asynchronously.
 *              Retrieves Return__c, Order__c, and Contact details in bulk, formats HTML and plain-text
 *              return confirmation notifications, and dispatches them safely.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceReturnNotificationQueueable implements Queueable {

    private final Set<Id> returnIds;

    @TestVisible
    private static List<Messaging.SingleEmailMessage> lastSentEmails;

    /**
     * @description Constructor accepting a collection of qualifying Return IDs.
     * @param returnIds Set of Return__c record Ids to send confirmation emails for.
     */
    public CommerceReturnNotificationQueueable(Set<Id> returnIds) {
        this.returnIds = returnIds;
    }

    /**
     * @description Executes the asynchronous queueable job.
     * @param context Queueable execution context.
     */
    public void execute(QueueableContext context) {
        if (this.returnIds == null || this.returnIds.isEmpty()) {
            return;
        }

        List<Return__c> returnRecords = [
            SELECT
                Id,
                Name,
                Return_Status__c,
                Return_Reason__c,
                Return_Date__c,
                Refund_Amount__c,
                Order__c,
                Order__r.Name,
                Order__r.Contact__c,
                Order__r.Contact__r.FirstName,
                Order__r.Contact__r.LastName,
                Order__r.Contact__r.Email
            FROM Return__c
            WHERE Id IN :this.returnIds
        ];

        List<Messaging.SingleEmailMessage> emailList = new List<Messaging.SingleEmailMessage>();

        for (Return__c ret : returnRecords) {
            if (ret.Order__r == null || ret.Order__r.Contact__c == null || String.isBlank(ret.Order__r.Contact__r.Email)) {
                continue;
            }

            String firstName = ret.Order__r.Contact__r.FirstName;
            String lastName = ret.Order__r.Contact__r.LastName;
            String customerName = String.isNotBlank(firstName)
                ? firstName + ' ' + (lastName != null ? lastName : '')
                : (lastName != null ? lastName : 'Customer');

            String orderNumber = ret.Order__r.Name != null ? ret.Order__r.Name : 'Order';
            String returnDateStr = ret.Return_Date__c != null ? String.valueOf(ret.Return_Date__c) : '';
            String safeCustomerName = customerName != null ? customerName.escapeHtml4() : '';
            String safeOrderNumber = orderNumber != null ? orderNumber.escapeHtml4() : '';
            String safeReturnDate = returnDateStr != null ? returnDateStr.escapeHtml4() : '';
            String safeReturnStatus = ret.Return_Status__c != null ? ret.Return_Status__c.escapeHtml4() : '';
            String safeReturnReason = ret.Return_Reason__c != null ? ret.Return_Reason__c.escapeHtml4() : '';
            String refundStr = formatCurrency(ret.Refund_Amount__c);

            String htmlBody = '<html><body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">'
                + '<h2 style="color: #0052cc;">Commerce Hub — Return Request Received</h2>'
                + '<p>Hi ' + safeCustomerName + ',</p>'
                + '<p>We\'ve received your return request for order <strong>' + safeOrderNumber + '</strong>.</p>'
                + '<table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 20px;">'
                + '<tr style="background-color: #f4f6f9;"><th style="padding: 10px; text-align: left;" colspan="2">Return Summary</th></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Order Number:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeOrderNumber + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Return Date:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeReturnDate + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Return Status:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeReturnStatus + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Reason:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeReturnReason + '</td></tr>'
                + '<tr style="font-weight: bold;"><td style="padding: 10px; border-top: 2px solid #333333;">Refund Amount:</td><td style="padding: 10px; border-top: 2px solid #333333;">₹' + refundStr + '</td></tr>'
                + '</table>'
                + '<p style="margin-top: 20px;">Your return request has been received successfully and will now be processed. We will keep you updated as the return progresses.</p>'
                + '<p>Thank you for shopping with Commerce Hub.</p>'
                + '<p>Best regards,<br/><strong>Commerce Hub Team</strong></p>'
                + '</body></html>';

            String plainTextBody = 'Commerce Hub — Return Request Received\n\n'
                + 'Hi ' + customerName + ',\n\n'
                + 'We\'ve received your return request for order ' + orderNumber + '.\n\n'
                + 'Return Summary:\n'
                + 'Order Number: ' + orderNumber + '\n'
                + 'Return Date: ' + returnDateStr + '\n'
                + 'Return Status: ' + ret.Return_Status__c + '\n'
                + 'Reason: ' + ret.Return_Reason__c + '\n'
                + 'Refund Amount: ₹' + refundStr + '\n\n'
                + 'Your return request has been received successfully and will now be processed. We will keep you updated as the return progresses.\n\n'
                + 'Thank you for shopping with Commerce Hub.\n\n'
                + 'Best regards,\nCommerce Hub Team';

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new List<String>{ ret.Order__r.Contact__r.Email });
            mail.setSubject('Commerce Hub — Return Request Received: ' + orderNumber);
            mail.setHtmlBody(htmlBody);
            mail.setPlainTextBody(plainTextBody);

            emailList.add(mail);
        }

        if (!emailList.isEmpty()) {
            lastSentEmails = emailList;
            Messaging.sendEmail(emailList);
        }
    }

    private static String formatCurrency(Decimal val) {
        return val != null ? val.setScale(2).format() : '0.00';
    }
}
