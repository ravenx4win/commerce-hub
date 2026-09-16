/**
 * @description Trigger handler for Order__c after-insert events.
 *              Filters successful Commerce Hub orders and enqueues order confirmation notification job.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceOrderTriggerHandler {

    /**
     * @description Handles after-insert trigger event on Order__c records.
     * @param newOrders List of newly inserted Order__c records from Trigger.new.
     */
    public static void handleAfterInsert(List<Order__c> newOrders) {
        if (newOrders == null || newOrders.isEmpty()) {
            return;
        }

        Set<Id> qualifyingOrderIds = new Set<Id>();

        for (Order__c ord : newOrders) {
            if (ord.Contact__c != null
                && ord.Order_Status__c == 'Confirmed'
                && ord.Payment_Status__c == 'Paid') {
                qualifyingOrderIds.add(ord.Id);
            }
        }

        if (!qualifyingOrderIds.isEmpty()) {
            System.enqueueJob(new CommerceOrderNotificationQueueable(qualifyingOrderIds));
        }
    }
}
