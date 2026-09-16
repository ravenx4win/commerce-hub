@IsTest
private class CommerceProductControllerTest {

    @TestSetup
    static void setupTestData() {

        // ============================================================
        // 1. Categories
        // ============================================================

        Category__c activeCategory = new Category__c(
            Name = 'Test Electronics',
            Active__c = true,
            Description__c = 'Active test category'
        );

        Category__c inactiveCategory = new Category__c(
            Name = 'Test Inactive Category',
            Active__c = false,
            Description__c = 'Inactive test category'
        );

        insert new List<Category__c>{
            activeCategory,
            inactiveCategory
        };


        // ============================================================
        // 2. Products
        // ============================================================

        Product2 activeProduct = new Product2(
            Name = 'Test Active Product',
            IsActive = true,
            Commerce_Hub_Category__c = activeCategory.Id
        );

        Product2 inactiveProduct = new Product2(
            Name = 'Test Inactive Product',
            IsActive = false,
            Commerce_Hub_Category__c = activeCategory.Id
        );

        Product2 inactiveCategoryProduct = new Product2(
            Name = 'Test Inactive Category Product',
            IsActive = true,
            Commerce_Hub_Category__c = inactiveCategory.Id
        );

        insert new List<Product2>{
            activeProduct,
            inactiveProduct,
            inactiveCategoryProduct
        };


        // ============================================================
        // 3. Product Variants
        // ============================================================

        ProductVariant__c variantBlack = new ProductVariant__c(
            Name = 'Black Variant',
            Product__c = activeProduct.Id,
            SKU__c = 'TEST-SKU-BLK',
            Price__c = 1000,
            Color__c = 'Black',
            Size__c = 'Medium',
            Active__c = true
        );

        ProductVariant__c variantBlue = new ProductVariant__c(
            Name = 'Blue Variant',
            Product__c = activeProduct.Id,
            SKU__c = 'TEST-SKU-BLU',
            Price__c = 1200,
            Color__c = 'Blue',
            Size__c = 'Large',
            Active__c = true
        );

        ProductVariant__c inactiveVariant = new ProductVariant__c(
            Name = 'Inactive Variant',
            Product__c = activeProduct.Id,
            SKU__c = 'TEST-SKU-INACTIVE',
            Price__c = 1500,
            Color__c = 'Red',
            Size__c = 'Small',
            Active__c = false
        );

        insert new List<ProductVariant__c>{
            variantBlack,
            variantBlue,
            inactiveVariant
        };


        // ============================================================
        // 4. Product Images
        // ============================================================

        ProductImage__c imageFirst = new ProductImage__c(
            Name = 'First Image',
            Product__c = activeProduct.Id,
            Image_URL__c = 'https://example.com/image-first.jpg',
            Alt_Text__c = 'First product image',
            Display_Order__c = 1,
            Active__c = true
        );

        ProductImage__c imageSecond = new ProductImage__c(
            Name = 'Second Image',
            Product__c = activeProduct.Id,
            Image_URL__c = 'https://example.com/image-second.jpg',
            Alt_Text__c = 'Second product image',
            Display_Order__c = 2,
            Active__c = true
        );

        ProductImage__c inactiveImage = new ProductImage__c(
            Name = 'Inactive Image',
            Product__c = activeProduct.Id,
            Image_URL__c = 'https://example.com/image-inactive.jpg',
            Alt_Text__c = 'Inactive product image',
            Display_Order__c = 3,
            Active__c = false
        );

        insert new List<ProductImage__c>{
            imageFirst,
            imageSecond,
            inactiveImage
        };
    }


    // ================================================================
    // getProducts()
    // ================================================================

    @IsTest
    static void getProducts_returnsOnlyValidCommerceHubProducts() {

        Test.startTest();
        List<Product2> results = CommerceProductController.getProducts();
        Test.stopTest();

        System.assertNotEquals(
            null,
            results,
            'getProducts should never return null.'
        );

        System.assertEquals(
            1,
            results.size(),
            'Only the active product with an active category should be returned.'
        );

        System.assertEquals(
            'Test Active Product',
            results[0].Name,
            'The valid active Commerce Hub product should be returned.'
        );

        System.assertEquals(
            true,
            results[0].IsActive,
            'Returned product must be active.'
        );
    }


    @IsTest
    static void getProducts_excludesInactiveProduct() {

        Test.startTest();
        List<Product2> results = CommerceProductController.getProducts();
        Test.stopTest();

        for (Product2 product : results) {
            System.assertNotEquals(
                'Test Inactive Product',
                product.Name,
                'Inactive products must not be returned.'
            );
        }
    }


    @IsTest
    static void getProducts_excludesProductWithInactiveCategory() {

        Test.startTest();
        List<Product2> results = CommerceProductController.getProducts();
        Test.stopTest();

        for (Product2 product : results) {
            System.assertNotEquals(
                'Test Inactive Category Product',
                product.Name,
                'Products belonging to inactive categories must not be returned.'
            );
        }
    }


    @IsTest
    static void getProducts_handlesBulkSizedDataset() {

        Category__c activeCategory = [
            SELECT Id
            FROM Category__c
            WHERE Name = 'Test Electronics'
            LIMIT 1
        ];

        List<Product2> bulkProducts = new List<Product2>();

        for (Integer i = 1; i <= 200; i++) {
            bulkProducts.add(
                new Product2(
                    Name = 'Bulk Test Product ' + i,
                    IsActive = true,
                    Commerce_Hub_Category__c = activeCategory.Id
                )
            );
        }

        insert bulkProducts;

        Test.startTest();
        List<Product2> results = CommerceProductController.getProducts();
        Test.stopTest();

        System.assertEquals(
            201,
            results.size(),
            'The controller should correctly return a bulk-sized product dataset.'
        );
    }


    // ================================================================
    // getProductDetails()
    // ================================================================

    @IsTest
    static void getProductDetails_returnsActiveVariantsOnly() {

        Product2 activeProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Active Product'
            LIMIT 1
        ];

        Test.startTest();
        CommerceProductController.ProductDetails result =
            CommerceProductController.getProductDetails(activeProduct.Id);
        Test.stopTest();

        System.assertNotEquals(
            null,
            result,
            'Product details wrapper should not be null.'
        );

        System.assertEquals(
            2,
            result.variants.size(),
            'Only active variants should be returned.'
        );

        for (ProductVariant__c variant : result.variants) {
            System.assertEquals(
                true,
                variant.Active__c,
                'Inactive variants must not be returned.'
            );
        }
    }


    @IsTest
    static void getProductDetails_returnsVariantsInNameOrder() {

        Product2 activeProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Active Product'
            LIMIT 1
        ];

        Test.startTest();
        CommerceProductController.ProductDetails result =
            CommerceProductController.getProductDetails(activeProduct.Id);
        Test.stopTest();

        System.assertEquals(
            2,
            result.variants.size(),
            'Exactly two active variants should be returned.'
        );

        System.assertEquals(
            'Black Variant',
            result.variants[0].Name,
            'Variants should be returned in Name ascending order.'
        );

        System.assertEquals(
            'Blue Variant',
            result.variants[1].Name,
            'Variants should be returned in Name ascending order.'
        );
    }


    @IsTest
    static void getProductDetails_returnsActiveImagesOnly() {

        Product2 activeProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Active Product'
            LIMIT 1
        ];

        Test.startTest();
        CommerceProductController.ProductDetails result =
            CommerceProductController.getProductDetails(activeProduct.Id);
        Test.stopTest();

        System.assertEquals(
            2,
            result.images.size(),
            'Only active images should be returned.'
        );

        for (ProductImage__c image : result.images) {
            System.assertEquals(
                true,
                image.Active__c,
                'Inactive images must not be returned.'
            );
        }
    }


    @IsTest
    static void getProductDetails_imagesOrderedByDisplayOrder() {

        Product2 activeProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Active Product'
            LIMIT 1
        ];

        Test.startTest();
        CommerceProductController.ProductDetails result =
            CommerceProductController.getProductDetails(activeProduct.Id);
        Test.stopTest();

        System.assertEquals(
            2,
            result.images.size(),
            'Two active images should be returned.'
        );

        System.assertEquals(
            1,
            result.images[0].Display_Order__c,
            'First image should have display order 1.'
        );

        System.assertEquals(
            2,
            result.images[1].Display_Order__c,
            'Second image should have display order 2.'
        );
    }


    @IsTest
    static void getProductDetails_returnsCompleteWrapper() {

        Product2 activeProduct = [
            SELECT Id, Name, IsActive, Commerce_Hub_Category__c
            FROM Product2
            WHERE Name = 'Test Active Product'
            LIMIT 1
        ];

        Test.startTest();
        CommerceProductController.ProductDetails result =
            CommerceProductController.getProductDetails(activeProduct.Id);
        Test.stopTest();

        System.assertNotEquals(
            null,
            result,
            'Wrapper should not be null.'
        );

        System.assertNotEquals(
            null,
            result.product,
            'Wrapper should contain the product.'
        );

        System.assertNotEquals(
            null,
            result.variants,
            'Wrapper should contain the variant list.'
        );

        System.assertNotEquals(
            null,
            result.images,
            'Wrapper should contain the image list.'
        );

        System.assertEquals(
            activeProduct.Id,
            result.product.Id,
            'Returned product Id should match the requested product.'
        );

        System.assertEquals(
            2,
            result.variants.size(),
            'Wrapper should contain two active variants.'
        );

        System.assertEquals(
            2,
            result.images.size(),
            'Wrapper should contain two active images.'
        );
    }


    // ================================================================
    // Error / Negative Tests
    // ================================================================

    @IsTest
    static void getProductDetails_nullIdThrowsControlledError() {

        Boolean exceptionThrown = false;

        Test.startTest();

        try {
            CommerceProductController.getProductDetails(null);
        } catch (AuraHandledException e) {
            exceptionThrown = true;
        }

        Test.stopTest();

        System.assertEquals(
            true,
            exceptionThrown,
            'A null product Id should produce a controlled AuraHandledException.'
        );
    }


    @IsTest
    static void getProductDetails_inactiveProductThrowsControlledError() {

        Product2 inactiveProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Inactive Product'
            LIMIT 1
        ];

        Boolean exceptionThrown = false;

        Test.startTest();

        try {
            CommerceProductController.getProductDetails(inactiveProduct.Id);
        } catch (AuraHandledException e) {
            exceptionThrown = true;
        }

        Test.stopTest();

        System.assertEquals(
            true,
            exceptionThrown,
            'Inactive products should produce a controlled AuraHandledException.'
        );
    }


    @IsTest
    static void getProductDetails_inactiveCategoryProductThrowsControlledError() {

        Product2 inactiveCategoryProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Inactive Category Product'
            LIMIT 1
        ];

        Boolean exceptionThrown = false;

        Test.startTest();

        try {
            CommerceProductController.getProductDetails(
                inactiveCategoryProduct.Id
            );
        } catch (AuraHandledException e) {
            exceptionThrown = true;
        }

        Test.stopTest();

        System.assertEquals(
            true,
            exceptionThrown,
            'Products with inactive categories should produce a controlled AuraHandledException.'
        );
    }


    // ================================================================
    // Final wrapper validation
    // ================================================================

    @IsTest
    static void getProductDetails_validProductReturnsExpectedData() {

        Product2 activeProduct = [
            SELECT Id
            FROM Product2
            WHERE Name = 'Test Active Product'
            LIMIT 1
        ];

        Test.startTest();
        CommerceProductController.ProductDetails result =
            CommerceProductController.getProductDetails(activeProduct.Id);
        Test.stopTest();

        System.assertEquals(
            activeProduct.Id,
            result.product.Id,
            'Returned product must match requested product.'
        );

        System.assertEquals(
            2,
            result.variants.size(),
            'There should be two active variants.'
        );

        System.assertEquals(
            2,
            result.images.size(),
            'There should be two active images.'
        );
    }
}