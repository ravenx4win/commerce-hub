import { createElement } from 'lwc';
import ProductDetail from 'c/productDetail';
import getProductDetails from '@salesforce/apex/CommerceProductController.getProductDetails';
import getDefaultShippingAddress from '@salesforce/apex/CommerceOrderController.getDefaultShippingAddress';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';

const getProductDetailsAdapter = registerApexTestWireAdapter(getProductDetails);
const getDefaultShippingAddressAdapter = registerApexTestWireAdapter(getDefaultShippingAddress);

const MOCK_PRODUCT_DETAILS = {
    product: {
        Id: '01tdL00000gwfnCQAQ',
        Name: 'Air Fryer',
        ProductCode: 'CH-APP001',
        Description: 'Touch control healthy air fryer with rapid air technology',
        IsActive: true,
        Commerce_Hub_Category__r: { Name: 'Appliances' }
    },
    variants: [
        {
            Id: 'var1',
            Name: 'Standard 4L',
            SKU__c: 'CH-APP001-STD',
            Price__c: 4499,
            Color__c: 'Black',
            Size__c: '4L',
            Active__c: true
        },
        {
            Id: 'var2',
            Name: 'Pro 6L',
            SKU__c: 'CH-APP001-PRO',
            Price__c: 5999,
            Color__c: 'Silver',
            Size__c: '6L',
            Active__c: true
        }
    ],
    images: [
        {
            Id: 'img1',
            Image_URL__c: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d',
            Alt_Text__c: 'Front View',
            Display_Order__c: 1,
            Active__c: true
        },
        {
            Id: 'img2',
            Image_URL__c: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b',
            Alt_Text__c: 'Side View',
            Display_Order__c: 2,
            Active__c: true
        }
    ]
};

describe('c-product-detail', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders error / not found state when productId is missing', () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        document.body.appendChild(element);

        const notFound = element.shadowRoot.querySelector('.not-found-title');
        expect(notFound).not.toBeNull();
        expect(notFound.textContent).toBe('Product Unavailable');
    });

    it('renders product details, pricing, variants, and gallery when data is loaded', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = '01tdL00000gwfnCQAQ';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getProductDetailsAdapter.emit(MOCK_PRODUCT_DETAILS);
        await Promise.resolve();

        const title = element.shadowRoot.querySelector('.pdp-product-title');
        expect(title).not.toBeNull();
        expect(title.textContent).toBe('Air Fryer');

        const price = element.shadowRoot.querySelector('.current-price');
        expect(price).not.toBeNull();
        expect(price.textContent).toContain('4,499');

        const variantPills = element.shadowRoot.querySelectorAll('.variant-pill');
        expect(variantPills.length).toBe(2);

        const thumbnails = element.shadowRoot.querySelectorAll('.thumb-btn');
        expect(thumbnails.length).toBe(2);
    });

    it('updates price and SKU when a variant is selected', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = '01tdL00000gwfnCQAQ';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getProductDetailsAdapter.emit(MOCK_PRODUCT_DETAILS);
        await Promise.resolve();

        const variantPills = element.shadowRoot.querySelectorAll('.variant-pill');
        // Click the second variant
        variantPills[1].click();
        await Promise.resolve();

        const price = element.shadowRoot.querySelector('.current-price');
        expect(price.textContent).toContain('5,999');

        const sku = element.shadowRoot.querySelector('.sku-label');
        expect(sku.textContent).toContain('CH-APP001-PRO');
    });

    it('increments and decrements quantity within limits (1 to 10)', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = '01tdL00000gwfnCQAQ';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getProductDetailsAdapter.emit(MOCK_PRODUCT_DETAILS);
        await Promise.resolve();

        const stepperButtons = element.shadowRoot.querySelectorAll('.qty-btn');
        const minusBtn = stepperButtons[0];
        const plusBtn = stepperButtons[1];
        const qtyDisplay = element.shadowRoot.querySelector('.qty-value');

        expect(qtyDisplay.textContent).toBe('1');
        expect(minusBtn.disabled).toBe(true);

        plusBtn.click();
        await Promise.resolve();
        expect(qtyDisplay.textContent).toBe('2');
        expect(minusBtn.disabled).toBe(false);

        minusBtn.click();
        await Promise.resolve();
        expect(qtyDisplay.textContent).toBe('1');
    });

    it('adds item to cart and shows toast feedback', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = '01tdL00000gwfnCQAQ';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getProductDetailsAdapter.emit(MOCK_PRODUCT_DETAILS);
        await Promise.resolve();

        const addToCartBtn = element.shadowRoot.querySelector('.add-to-cart-btn');
        addToCartBtn.click();
        await Promise.resolve();

        const toast = element.shadowRoot.querySelector('.pdp-toast');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain('Air Fryer added to cart!');
    });

    it('switches main image when thumbnail is clicked', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = '01tdL00000gwfnCQAQ';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getProductDetailsAdapter.emit(MOCK_PRODUCT_DETAILS);
        await Promise.resolve();

        const thumbnails = element.shadowRoot.querySelectorAll('.thumb-btn');
        thumbnails[1].click();
        await Promise.resolve();

        const mainImage = element.shadowRoot.querySelector('.main-image');
        expect(mainImage.src).toBe(MOCK_PRODUCT_DETAILS.images[1].Image_URL__c);
    });

    it('handles error state gracefully when Apex wire returns an error', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = 'invalid_id';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getProductDetailsAdapter.error({
            body: { message: 'Product not found or is not available.' }
        });
        await Promise.resolve();

        const notFound = element.shadowRoot.querySelector('.not-found-title');
        expect(notFound).not.toBeNull();
        expect(notFound.textContent).toBe('Product Unavailable');
    });

    it('displays saved delivery location when default address wire emits', async () => {
        const element = createElement('c-product-detail', {
            is: ProductDetail
        });
        element.productId = '01tdL00000gwfnCQAQ';
        element.categorySlug = 'appliances';
        document.body.appendChild(element);

        getDefaultShippingAddressAdapter.emit({
            City__c: 'Mumbai',
            PostalCode__c: '400001'
        });
        getProductDetailsAdapter.emit(MOCK_PRODUCT_DETAILS);
        await Promise.resolve();

        const deliveryBox = element.shadowRoot.querySelector('.pdp-delivery-box');
        expect(deliveryBox).not.toBeNull();
        expect(deliveryBox.textContent).toContain('Mumbai 400001');
    });
});
