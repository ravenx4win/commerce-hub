/**
 * @description LWC-facing controller for customer return read operations.
 *              Provides read-only access to a customer's return-eligible orders,
 *              return history, and return detail views.
 *              Enforces customer ownership server-side via UserInfo; never trusts client-supplied Contact IDs.
 *              All queries enforce FLS/CRUD security via Security.stripInaccessible.
 *
 * @author Commerce Hub
 * @since 2026-09-15
 */
public with sharing class CommerceReturnController {

    /**
     * @description Wrapper containing a Return record and its line items for detailed view.
     */
    public class ReturnDetails {
        @AuraEnabled
        public Return__c returnRecord;

        @AuraEnabled
        public List<Return_Item__c> returnItems;
    }

    /**
     * @description Returns orders belonging to the current customer that are eligible for return.
     *              Filters out cancelled orders and orders belonging to other customers.
     *              Ordered newest first.
     * @return List of return-eligible Order__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Order__c> getReturnEligibleOrders() {
        Id contactId = resolveCustomerContactId();

        List<Order__c> orders = [
            SELECT
                Id,
                Name,
                Contact__c,
                Order_Status__c,
                Payment_Status__c,
                Shipping_Status__c,
                Subtotal__c,
                Tax__c,
                Shipping_Charge__c,
                Total_Amount__c,
                CreatedDate
            FROM Order__c
            WHERE Contact__c = :contactId
              AND Order_Status__c != 'Cancelled'
            ORDER BY CreatedDate DESC
        ];

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            orders
        );

        return (List<Order__c>) decision.getRecords();
    }

    /**
     * @description Returns all Return__c records for orders belonging to the current customer.
     *              Ordered newest returns first.
     * @return List of Return__c records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Return__c> getMyReturns() {
        Id contactId = resolveCustomerContactId();

        ReturnReader reader = new ReturnReader();
        List<Return__c> returns = reader.getReturnsForContact(contactId);

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            returns
        );

        return (List<Return__c>) decision.getRecords();
    }

    /**
     * @description Returns detailed return information including line items for a specific return.
     *              Verifies server-side that the requested return's parent order belongs to the current customer.
     * @param returnId Target Return__c record Id.
     * @return ReturnDetails wrapper object.
     */
    @AuraEnabled(cacheable=true)
    public static ReturnDetails getReturnDetails(Id returnId) {
        if (returnId == null) {
            throw new AuraHandledException('Return ID is required.');
        }

        Id contactId = resolveCustomerContactId();

        ReturnReader reader = new ReturnReader();
        List<Return__c> returns = reader.getReturnHeader(returnId);

        if (returns.isEmpty() || returns[0].Order__r == null || returns[0].Order__r.Contact__c != contactId) {
            throw new AuraHandledException(
                'Return record not found or you do not have permission to view this return.'
            );
        }

        SObjectAccessDecision headerDecision = Security.stripInaccessible(
            AccessType.READABLE,
            returns
        );
        Return__c cleanHeader = (Return__c) headerDecision.getRecords()[0];

        List<Return_Item__c> items = reader.getReturnItems(returnId);

        SObjectAccessDecision itemDecision = Security.stripInaccessible(
            AccessType.READABLE,
            items
        );
        List<Return_Item__c> cleanItems = (List<Return_Item__c>) itemDecision.getRecords();

        ReturnDetails details = new ReturnDetails();
        details.returnRecord = cleanHeader;
        details.returnItems = cleanItems;

        return details;
    }

    /**
     * @description Resolves the current logged-in user's ContactId.
     *              Throws an AuraHandledException if the user is not associated with a Contact.
     * @return ContactId for the logged-in User.
     */
    private static Id resolveCustomerContactId() {
        Id userId = UserInfo.getUserId();

        List<User> users = [
            SELECT ContactId
            FROM User
            WHERE Id = :userId
            LIMIT 1
        ];

        if (users.isEmpty() || users[0].ContactId == null) {
            throw new AuraHandledException(
                'Your account is not associated with a customer profile. Please contact support.'
            );
        }

        return users[0].ContactId;
    }

    /**
     * @description Internal helper with without sharing context to read Return_Item__c records
     *              for parent returns that have ALREADY been validated for customer ownership server-side.
     */
    private without sharing class ReturnReader {

        public List<Return__c> getReturnsForContact(Id contactId) {
            return [
                SELECT
                    Id,
                    Name,
                    Order__c,
                    Order__r.Name,
                    Return_Status__c,
                    Return_Reason__c,
                    Return_Date__c,
                    Refund_Amount__c,
                    CreatedDate
                FROM Return__c
                WHERE Order__r.Contact__c = :contactId
                WITH SYSTEM_MODE
                ORDER BY CreatedDate DESC
            ];
        }

        public List<Return__c> getReturnHeader(Id returnId) {
            return [
                SELECT
                    Id,
                    Name,
                    Order__c,
                    Order__r.Name,
                    Return_Status__c,
                    Return_Reason__c,
                    Return_Date__c,
                    Refund_Amount__c,
                    CreatedDate,
                    Order__r.Contact__c
                FROM Return__c
                WHERE Id = :returnId
                WITH SYSTEM_MODE
                LIMIT 1
            ];
        }

        public List<Return_Item__c> getReturnItems(Id returnId) {
            return [
                SELECT
                    Id,
                    Return__c,
                    Order_Item__c,
                    Return_Quantity__c,
                    Refund_Amount__c,
                    CreatedDate,
                    Order_Item__r.Unit_Price__c,
                    Order_Item__r.Product_Variant__r.Name,
                    Order_Item__r.Product_Variant__r.SKU__c,
                    Order_Item__r.Product_Variant__r.Color__c,
                    Order_Item__r.Product_Variant__r.Size__c,
                    Order_Item__r.Product_Variant__r.Product__r.Name
                FROM Return_Item__c
                WHERE Return__c = :returnId
                WITH SYSTEM_MODE
                ORDER BY CreatedDate ASC
            ];
        }
    }
}
