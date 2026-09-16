/**
 * @description Order__c trigger delegating after-insert events to CommerceOrderTriggerHandler.
 *              Contains no SOQL, DML, or email logic.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
trigger CommerceOrderTrigger on Order__c (after insert) {
    if (Trigger.isAfter && Trigger.isInsert) {
        CommerceOrderTriggerHandler.handleAfterInsert(Trigger.new);
    }
}
