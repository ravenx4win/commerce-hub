/**
 * @description Trigger handler for CommerceReturnTrigger. Identifies qualifying customer return
 *              requests after insertion and enqueues an asynchronous notification job.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceReturnTriggerHandler {

    /**
     * @description Handles after-insert events for Return__c records.
     * @param newReturns Collection of newly inserted Return__c records.
     */
    public static void handleAfterInsert(List<Return__c> newReturns) {
        if (newReturns == null || newReturns.isEmpty()) {
            return;
        }

        Set<Id> qualifyingReturnIds = new Set<Id>();
        for (Return__c ret : newReturns) {
            if (ret != null && ret.Id != null && ret.Return_Status__c == 'Requested') {
                qualifyingReturnIds.add(ret.Id);
            }
        }

        if (!qualifyingReturnIds.isEmpty()) {
            System.enqueueJob(new CommerceReturnNotificationQueueable(qualifyingReturnIds));
        }
    }
}
