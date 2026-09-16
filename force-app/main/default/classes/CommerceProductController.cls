/**
 * @description Controller for Commerce Hub product catalog operations.
 *              Provides read-only data for the customer-facing storefront.
 *              Inventory quantity and internal operational data are never exposed.
 * @author      Commerce Hub
 * @since       2026-09-14
 */
public with sharing class CommerceProductController {

    /**
     * @description Wrapper containing a product and its storefront data.
     */
    public class ProductDetails {
        @AuraEnabled
        public Product2 product;

        @AuraEnabled
        public List<ProductVariant__c> variants;

        @AuraEnabled
        public List<ProductImage__c> images;
    }

    /**
     * @description Returns active Commerce Hub products belonging to an active category.
     * @return Active Commerce Hub products ordered by name.
     */
    @AuraEnabled(cacheable=true)
    public static List<Product2> getProducts() {

        if (!Schema.sObjectType.Product2.isAccessible()
            || !Schema.sObjectType.Category__c.isAccessible()) {
            throw new AuraHandledException(
                'You do not have permission to view the product catalog.'
            );
        }

        List<Product2> products = [
            SELECT
                Id,
                Name,
                ProductCode,
                Description,
                IsActive,
                Commerce_Hub_Category__c,
                Commerce_Hub_Category__r.Name
            FROM Product2
            WHERE IsActive = true
                AND Commerce_Hub_Category__c != null
                AND Commerce_Hub_Category__r.Active__c = true
            ORDER BY Name ASC
        ];

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            products
        );

        return (List<Product2>) decision.getRecords();
    }

    /**
     * @description Returns one active Commerce Hub product with its active variants
     *              and active images.
     * @param productId Product2 record Id.
     * @return ProductDetails wrapper.
     */
    @AuraEnabled(cacheable=true)
    public static ProductDetails getProductDetails(Id productId) {

        if (productId == null) {
            throw new AuraHandledException('Product ID is required.');
        }

        if (!Schema.sObjectType.Product2.isAccessible()
            || !Schema.sObjectType.ProductVariant__c.isAccessible()
            || !Schema.sObjectType.ProductImage__c.isAccessible()
            || !Schema.sObjectType.Category__c.isAccessible()) {
            throw new AuraHandledException(
                'You do not have permission to view product details.'
            );
        }

        List<Product2> products = [
            SELECT
                Id,
                Name,
                ProductCode,
                Description,
                IsActive,
                Commerce_Hub_Category__c,
                Commerce_Hub_Category__r.Name
            FROM Product2
            WHERE Id = :productId
                AND IsActive = true
                AND Commerce_Hub_Category__c != null
                AND Commerce_Hub_Category__r.Active__c = true
            LIMIT 1
        ];

        if (products.isEmpty()) {
            throw new AuraHandledException(
                'Product not found or is not available.'
            );
        }

        SObjectAccessDecision productDecision =
            Security.stripInaccessible(
                AccessType.READABLE,
                products
            );

        Product2 product =
            (Product2) productDecision.getRecords()[0];

        List<ProductVariant__c> variants = [
            SELECT
                Id,
                Name,
                Product__c,
                SKU__c,
                Price__c,
                Color__c,
                Size__c,
                Active__c
            FROM ProductVariant__c
            WHERE Product__c = :productId
                AND Active__c = true
            ORDER BY Name ASC
        ];

        SObjectAccessDecision variantDecision =
            Security.stripInaccessible(
                AccessType.READABLE,
                variants
            );

        List<ProductImage__c> images = [
            SELECT
                Id,
                Name,
                Product__c,
                Image_URL__c,
                Alt_Text__c,
                Display_Order__c,
                Active__c
            FROM ProductImage__c
            WHERE Product__c = :productId
                AND Active__c = true
            ORDER BY Display_Order__c ASC
        ];

        SObjectAccessDecision imageDecision =
            Security.stripInaccessible(
                AccessType.READABLE,
                images
            );

        ProductDetails details = new ProductDetails();
        details.product = product;
        details.variants =
            (List<ProductVariant__c>) variantDecision.getRecords();
        details.images =
            (List<ProductImage__c>) imageDecision.getRecords();

        return details;
    }
}