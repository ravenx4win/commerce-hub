/**
 * @description Trigger on Return__c for handling post-insert customer notifications.
 *              Delegates execution immediately to CommerceReturnTriggerHandler.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
trigger CommerceReturnTrigger on Return__c (after insert) {
    CommerceReturnTriggerHandler.handleAfterInsert(Trigger.new);
}
