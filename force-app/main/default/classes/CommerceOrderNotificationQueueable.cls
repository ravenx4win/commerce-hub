/**
 * @description Queueable Apex job for constructing and sending order confirmation emails asynchronously.
 *              Retrieves order details and customer contact information in bulk, formats HTML and plain-text
 *              confirmation messages, and dispatches email notifications safely.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceOrderNotificationQueueable implements Queueable {

    private final Set<Id> orderIds;

    @TestVisible
    private static List<Messaging.SingleEmailMessage> lastSentEmails;

    /**
     * @description Constructor accepting a collection of qualifying Order IDs.
     * @param orderIds Set of Order__c record Ids to send confirmation emails for.
     */
    public CommerceOrderNotificationQueueable(Set<Id> orderIds) {
        this.orderIds = orderIds;
    }

    /**
     * @description Executes the asynchronous queueable job.
     * @param context Queueable execution context.
     */
    public void execute(QueueableContext context) {
        if (this.orderIds == null || this.orderIds.isEmpty()) {
            return;
        }

        List<Order__c> orders = [
            SELECT
                Id,
                Name,
                CreatedDate,
                Order_Status__c,
                Payment_Status__c,
                Shipping_Status__c,
                Subtotal__c,
                Tax__c,
                Shipping_Charge__c,
                Total_Amount__c,
                Contact__c,
                Contact__r.FirstName,
                Contact__r.LastName,
                Contact__r.Email
            FROM Order__c
            WHERE Id IN :this.orderIds
        ];

        List<Messaging.SingleEmailMessage> emailList = new List<Messaging.SingleEmailMessage>();

        for (Order__c ord : orders) {
            if (ord.Contact__c == null || String.isBlank(ord.Contact__r.Email)) {
                continue;
            }

            String customerName = String.isNotBlank(ord.Contact__r.FirstName)
                ? ord.Contact__r.FirstName + ' ' + (ord.Contact__r.LastName != null ? ord.Contact__r.LastName : '')
                : (ord.Contact__r.LastName != null ? ord.Contact__r.LastName : 'Customer');

            String orderNumber = ord.Name != null ? ord.Name : 'Order';
            String orderDateStr = ord.CreatedDate != null ? ord.CreatedDate.format('yyyy-MM-dd') : '';

            String safeCustomerName = customerName != null ? customerName.escapeHtml4() : '';
            String safeOrderNumber = orderNumber != null ? orderNumber.escapeHtml4() : '';
            String safeOrderStatus = ord.Order_Status__c != null ? ord.Order_Status__c.escapeHtml4() : '';
            String safePaymentStatus = ord.Payment_Status__c != null ? ord.Payment_Status__c.escapeHtml4() : '';
            String safeShippingStatus = ord.Shipping_Status__c != null ? ord.Shipping_Status__c.escapeHtml4() : '';

            String htmlBody = '<html><body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">'
                + '<h2 style="color: #0052cc;">Commerce Hub Order Confirmation</h2>'
                + '<p>Dear ' + safeCustomerName + ',</p>'
                + '<p>Thank you for your order! We are pleased to confirm that your order <strong>' + safeOrderNumber + '</strong> has been placed successfully.</p>'
                + '<table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 20px;">'
                + '<tr style="background-color: #f4f6f9;"><th style="padding: 10px; text-align: left;" colspan="2">Order Summary</th></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Order Number:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeOrderNumber + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Order Date:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + orderDateStr + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Order Status:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeOrderStatus + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Payment Status:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safePaymentStatus + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Shipping Status:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">' + safeShippingStatus + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Subtotal:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">₹' + formatCurrency(ord.Subtotal__c) + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">GST / Tax:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">₹' + formatCurrency(ord.Tax__c) + '</td></tr>'
                + '<tr><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">Shipping Charge:</td><td style="padding: 8px; border-bottom: 1px solid #eeeeee;">₹' + formatCurrency(ord.Shipping_Charge__c) + '</td></tr>'
                + '<tr style="font-weight: bold;"><td style="padding: 10px; border-top: 2px solid #333333;">Total Amount:</td><td style="padding: 10px; border-top: 2px solid #333333;">₹' + formatCurrency(ord.Total_Amount__c) + '</td></tr>'
                + '</table>'
                + '<p style="margin-top: 20px;">We appreciate your business with Commerce Hub.</p>'
                + '<p>Best regards,<br/><strong>Commerce Hub Team</strong></p>'
                + '</body></html>';

            String plainTextBody = 'Commerce Hub Order Confirmation\n\n'
                + 'Dear ' + customerName + ',\n\n'
                + 'Thank you for your order! Your order ' + orderNumber + ' has been placed successfully.\n\n'
                + 'Order Summary:\n'
                + 'Order Number: ' + orderNumber + '\n'
                + 'Order Date: ' + orderDateStr + '\n'
                + 'Order Status: ' + ord.Order_Status__c + '\n'
                + 'Payment Status: ' + ord.Payment_Status__c + '\n'
                + 'Shipping Status: ' + ord.Shipping_Status__c + '\n'
                + 'Subtotal: ₹' + formatCurrency(ord.Subtotal__c) + '\n'
                + 'GST / Tax: ₹' + formatCurrency(ord.Tax__c) + '\n'
                + 'Shipping Charge: ₹' + formatCurrency(ord.Shipping_Charge__c) + '\n'
                + 'Total Amount: ₹' + formatCurrency(ord.Total_Amount__c) + '\n\n'
                + 'Thank you for shopping with Commerce Hub.\n\n'
                + 'Best regards,\nCommerce Hub Team';

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new List<String>{ ord.Contact__r.Email });
            mail.setSubject('Order Confirmation - ' + orderNumber);
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
