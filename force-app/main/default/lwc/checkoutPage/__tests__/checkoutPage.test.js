import { createElement } from 'lwc';
import CheckoutPage from 'c/checkoutPage';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
import getMyAddresses from '@salesforce/apex/CommerceOrderController.getMyAddresses';
import getDefaultShippingAddress from '@salesforce/apex/CommerceOrderController.getDefaultShippingAddress';
import placeOrder from '@salesforce/apex/CommerceOrderController.placeOrder';
import saveNewAddress from '@salesforce/apex/CommerceOrderController.saveNewAddress';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

const getMyAddressesAdapter = registerApexTestWireAdapter(getMyAddresses);
const getDefaultShippingAddressAdapter = registerApexTestWireAdapter(getDefaultShippingAddress);

const mockNavigate = jest.fn();
jest.mock(
    'lightning/navigation',
    () => {
        const Navigate = Symbol('Navigate');
        const GenerateUrl = Symbol('GenerateUrl');
        const NavigationMixin = (Base) => {
            return class extends Base {
                [Navigate](...args) {
                    return mockNavigate(...args);
                }
                [GenerateUrl]() {
                    return Promise.resolve('https://www.example.com');
                }
            };
        };
        NavigationMixin.Navigate = Navigate;
        NavigationMixin.GenerateUrl = GenerateUrl;
        return {
            NavigationMixin
        };
    },
    { virtual: true }
);

const MOCK_STATE_PICKLIST = {
    controllerValues: {},
    defaultValue: null,
    values: [
        { label: 'Maharashtra', value: 'Maharashtra', validFor: [] },
        { label: 'Karnataka', value: 'Karnataka', validFor: [] },
        { label: 'Himachal Pradesh', value: 'Himachal Pradesh', validFor: [] }
    ]
};

const MOCK_CITY_PICKLIST = {
    controllerValues: {
        Maharashtra: 0,
        Karnataka: 1,
        'Himachal Pradesh': 2
    },
    defaultValue: null,
    values: [
        { label: 'Mumbai', value: 'Mumbai', validFor: [0] },
        { label: 'Pune', value: 'Pune', validFor: [0] },
        { label: 'Bengaluru', value: 'Bengaluru', validFor: [1] },
        { label: 'Mysuru', value: 'Mysuru', validFor: [1] },
        { label: 'Shimla', value: 'Shimla', validFor: [2] },
        { label: 'Dharamshala', value: 'Dharamshala', validFor: [2] }
    ]
};

function emitPicklists() {
    getPicklistValues.emit(MOCK_STATE_PICKLIST, (config) =>
        String(config.fieldApiName?.fieldApiName || config.fieldApiName).includes('State__c')
    );
    getPicklistValues.emit(MOCK_CITY_PICKLIST, (config) =>
        String(config.fieldApiName?.fieldApiName || config.fieldApiName).includes('City__c')
    );
}

jest.mock(
    '@salesforce/apex/CommerceOrderController.placeOrder',
    () => ({
        default: jest.fn()
    }),
    { virtual: true }
);

jest.mock(
    '@salesforce/apex/CommerceOrderController.saveNewAddress',
    () => ({
        default: jest.fn()
    }),
    { virtual: true }
);

const MOCK_ADDRESSES = [
    {
        Id: 'a09dL00000UJmVtQAL',
        Name: 'ADDR-001',
        Street__c: '124 Mall Road',
        City__c: 'Jamshedpur',
        State__c: 'Jharkhand',
        Postal_Code__c: '831001',
        Country__c: 'India',
        Address_Type__c: 'Shipping',
        Is_Default__c: true
    },
    {
        Id: 'a09dL00000UJmKbQAL',
        Name: 'ADDR-002',
        Street__c: '123 Mall Road',
        City__c: 'Kangra',
        State__c: 'Himachal Pradesh',
        Postal_Code__c: '176001',
        Country__c: 'India',
        Address_Type__c: 'Shipping',
        Is_Default__c: false
    }
];

const MOCK_CART_ITEMS = [
    {
        id: 'a05dL00000aBcDeF',
        name: 'RC Racing Car',
        price: 1500,
        quantity: 1,
        variantId: 'a05dL00000aBcDeF',
        sku: 'CH-TOY001-RED',
        imageUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500'
    }
];

describe('c-checkout-page', () => {
    beforeEach(() => {
        localStorage.clear();
        window.scrollTo = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders empty cart state when no items in cart', async () => {
        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        await Promise.resolve();

        const emptyTitle = element.shadowRoot.querySelector('.empty-title');
        expect(emptyTitle).not.toBeNull();
        expect(emptyTitle.textContent).toBe('Your Cart is Empty');
    });

    it('renders cart items, addresses, and price summary with free shipping', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        // Emit wired addresses
        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        getDefaultShippingAddressAdapter.emit(MOCK_ADDRESSES[0]);

        await Promise.resolve();

        // 1. Verify items rendered
        const itemRows = element.shadowRoot.querySelectorAll('.checkout-item-row');
        expect(itemRows.length).toBe(1);

        const itemName = element.shadowRoot.querySelector('.item-name');
        expect(itemName.textContent).toBe('RC Racing Car');

        // 2. Verify addresses rendered
        const addrCards = element.shadowRoot.querySelectorAll('.address-card');
        expect(addrCards.length).toBe(2);

        // 3. Verify price calculations (Subtotal: 1500, Tax: 270 (18%), Shipping: FREE, Total: 1770)
        const totalVal = element.shadowRoot.querySelector('.total-value');
        expect(totalVal.textContent).toContain('1,770');

        const freeBadge = element.shadowRoot.querySelector('.free-shipping-badge');
        expect(freeBadge).not.toBeNull();
        expect(freeBadge.textContent).toBe('FREE');
    });

    it('charges standard shipping for orders below threshold', async () => {
        const lowValueCart = [
            {
                id: 'a05dL00000lowVal',
                name: 'Small Toy',
                price: 500,
                quantity: 1,
                variantId: 'a05dL00000lowVal'
            }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(lowValueCart));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        await Promise.resolve();

        // Subtotal: 500, Tax: 90, Shipping: 100, Total: 690
        const totalVal = element.shadowRoot.querySelector('.total-value');
        expect(totalVal.textContent).toContain('690');
    });

    it('allows selecting an address from the saved list', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        getDefaultShippingAddressAdapter.emit(MOCK_ADDRESSES[0]);

        await Promise.resolve();

        const addrCards = element.shadowRoot.querySelectorAll('.address-card');
        // Click the second address
        addrCards[1].click();

        await Promise.resolve();

        // The second card should now be selected
        expect(addrCards[1].className).toContain('address-card-selected');
    });

    it('toggles payment methods between Stripe, UPI, Card, and Cash on Delivery', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        await Promise.resolve();

        // By default Stripe is selected
        const stripeCardInput = element.shadowRoot.querySelector('input[data-stripefield="cardNumber"]');
        expect(stripeCardInput).not.toBeNull();

        const cardOptions = element.shadowRoot.querySelectorAll('.payment-option-card');
        expect(cardOptions.length).toBe(4);

        // Click UPI option (index 1)
        cardOptions[1].click();
        await Promise.resolve();
        const upiInput = element.shadowRoot.querySelector('.upi-input');
        expect(upiInput).not.toBeNull();

        // Click Card option (index 2)
        cardOptions[2].click();
        await Promise.resolve();
        const cardInput = element.shadowRoot.querySelector('.card-num-input');
        expect(cardInput).not.toBeNull();

        // Click COD option (index 3)
        cardOptions[3].click();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('.card-num-input')).toBeNull();
    });

    it('successfully places an order with Stripe test payment and records in order history', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        placeOrder.mockResolvedValue({
            orderId: 'a06dL00000orderStripe123',
            orderStatus: 'Confirmed',
            paymentStatus: 'Paid',
            subtotal: 1500,
            tax: 270,
            shippingCharge: 0,
            totalAmount: 1770,
            transactionReference: 'TXN-STRIPE-8891'
        });

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        getDefaultShippingAddressAdapter.emit(MOCK_ADDRESSES[0]);
        await Promise.resolve();

        // Test autofill button
        const autofillBtn = element.shadowRoot.querySelector('.btn-autofill-test');
        expect(autofillBtn).not.toBeNull();
        autofillBtn.click();
        await Promise.resolve();

        // Listen for navigatetoorders
        const navHandler = jest.fn();
        element.addEventListener('navigatetoorders', navHandler);

        // Click Place Order with default Stripe payment
        const placeOrderBtn = element.shadowRoot.querySelector('.btn-place-order');
        placeOrderBtn.click();

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        // Check that placeOrder was called with Card (Apex picklist)
        expect(placeOrder).toHaveBeenCalledWith({
            cartItems: [
                {
                    productVariantId: 'a05dL00000aBcDeF',
                    quantity: 1
                }
            ],
            shippingAddressId: 'a09dL00000UJmVtQAL',
            paymentMethod: 'Card'
        });

        // Cart should be cleared
        expect(localStorage.getItem('commerceHubCart')).toBe('[]');

        // Order should be stored in persistent orders array
        const rawOrders = localStorage.getItem('commerceHubOrders');
        expect(rawOrders).not.toBeNull();
        const savedOrders = JSON.parse(rawOrders);
        expect(savedOrders.length).toBeGreaterThan(0);
        expect(savedOrders[0].items[0].name).toBe('RC Racing Car');
        expect(savedOrders[0].stripeTransactionId).toMatch(/^ch_test_/);

        // Order confirmation view should be visible
        const headline = element.shadowRoot.querySelector('.success-headline');
        expect(headline).not.toBeNull();
        expect(headline.textContent).toBe('Order Placed Successfully!');

        // Stripe reference should be shown
        const stripeRefEl = element.shadowRoot.querySelector('.stripe-tx-code');
        expect(stripeRefEl).not.toBeNull();
        expect(stripeRefEl.textContent).toMatch(/^ch_test_/);

        // Test clicking "View in My Orders"
        const viewOrdersBtn = element.shadowRoot.querySelector('.confirmation-actions .btn-primary');
        expect(viewOrdersBtn).not.toBeNull();
        expect(viewOrdersBtn.textContent).toContain('View in My Orders');
        viewOrdersBtn.click();

        expect(navHandler).toHaveBeenCalled();
    });

    it('displays friendly error message when order placement fails', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        placeOrder.mockRejectedValue({
            body: {
                message: 'Insufficient inventory available for RC Racing Car.'
            }
        });

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        getDefaultShippingAddressAdapter.emit(MOCK_ADDRESSES[0]);
        await Promise.resolve();

        // Select UPI (index 1)
        const cardOptions = element.shadowRoot.querySelectorAll('.payment-option-card');
        cardOptions[1].click();
        await Promise.resolve();

        const upiInput = element.shadowRoot.querySelector('.upi-input');
        upiInput.value = 'customer@upi';
        upiInput.dispatchEvent(new CustomEvent('input'));
        await Promise.resolve();

        const placeOrderBtn = element.shadowRoot.querySelector('.btn-place-order');
        placeOrderBtn.click();

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        const errorBanner = element.shadowRoot.querySelector('.error-banner');
        expect(errorBanner).not.toBeNull();
        expect(errorBanner.textContent).toContain('Insufficient inventory available for RC Racing Car.');
    });

    it('saves a new address successfully and selects it', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        saveNewAddress.mockResolvedValue({
            Id: 'a09dL00000newAddr1',
            Street__c: '55 MG Road',
            City__c: 'Bengaluru',
            State__c: 'Karnataka',
            Postal_Code__c: '560001',
            Country__c: 'India',
            Is_Default__c: false
        });

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        await Promise.resolve();
        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        emitPicklists();
        await Promise.resolve();

        // Open new address form
        const addAddrBtn = element.shadowRoot.querySelector('.btn-outline');
        addAddrBtn.click();
        await Promise.resolve();

        // Fill fields
        const streetInput = element.shadowRoot.querySelector('[data-field="Street__c"]');
        streetInput.value = '55 MG Road';
        streetInput.dispatchEvent(new CustomEvent('input'));

        const stateInput = element.shadowRoot.querySelector('[data-field="State__c"]');
        stateInput.value = 'Karnataka';
        stateInput.dispatchEvent(new CustomEvent('change'));
        await Promise.resolve();

        const cityInput = element.shadowRoot.querySelector('[data-field="City__c"]');
        cityInput.value = 'Bengaluru';
        cityInput.dispatchEvent(new CustomEvent('change'));

        const postalInput = element.shadowRoot.querySelector('[data-field="Postal_Code__c"]');
        postalInput.value = '560001';
        postalInput.dispatchEvent(new CustomEvent('input'));

        await Promise.resolve();

        // Submit
        const saveBtn = element.shadowRoot.querySelector('.new-address-form-box .btn-primary');
        saveBtn.click();

        await Promise.resolve();
        await Promise.resolve();

        expect(saveNewAddress).toHaveBeenCalledWith({
            addressFields: {
                Street__c: '55 MG Road',
                City__c: 'Bengaluru',
                State__c: 'Karnataka',
                Postal_Code__c: '560001',
                Country__c: 'India',
                Address_Type__c: 'Shipping',
                Is_Default__c: false
            }
        });
    });

    it('loads State picklist and keeps City dropdown disabled until State is selected', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        await Promise.resolve();
        emitPicklists();
        await Promise.resolve();

        // Open new address form
        const addAddrBtn = element.shadowRoot.querySelector('.btn-outline');
        addAddrBtn.click();
        await Promise.resolve();

        // Country should be India and readonly
        const countryInput = element.shadowRoot.querySelector('[data-field="Country__c"]');
        expect(countryInput.value).toBe('India');
        expect(countryInput.readOnly).toBe(true);

        // State select should have options
        const stateSelect = element.shadowRoot.querySelector('[data-field="State__c"]');
        expect(stateSelect).not.toBeNull();
        const stateOptionElements = stateSelect.querySelectorAll('option');
        // 1 placeholder + 3 states
        expect(stateOptionElements.length).toBe(4);

        // City select should be disabled initially
        const citySelect = element.shadowRoot.querySelector('[data-field="City__c"]');
        expect(citySelect).not.toBeNull();
        expect(citySelect.disabled).toBe(true);
        expect(citySelect.textContent).toContain('Select State / UT first');
    });

    it('filters City options by State and clears City when State changes', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        await Promise.resolve();
        emitPicklists();
        await Promise.resolve();

        // Open new address form
        element.shadowRoot.querySelector('.btn-outline').click();
        await Promise.resolve();

        const stateSelect = element.shadowRoot.querySelector('[data-field="State__c"]');
        const citySelect = element.shadowRoot.querySelector('[data-field="City__c"]');

        // Select Maharashtra
        stateSelect.value = 'Maharashtra';
        stateSelect.dispatchEvent(new CustomEvent('change'));
        await Promise.resolve();

        // City should now be enabled and have Mumbai & Pune
        expect(citySelect.disabled).toBe(false);
        let cityOptions = citySelect.querySelectorAll('option');
        // 1 placeholder + 2 cities
        expect(cityOptions.length).toBe(3);
        expect(citySelect.textContent).toContain('Mumbai');
        expect(citySelect.textContent).toContain('Pune');
        expect(citySelect.textContent).not.toContain('Bengaluru');

        // Select Mumbai
        citySelect.value = 'Mumbai';
        citySelect.dispatchEvent(new CustomEvent('change'));
        await Promise.resolve();

        // Now change State to Karnataka
        stateSelect.value = 'Karnataka';
        stateSelect.dispatchEvent(new CustomEvent('change'));
        await Promise.resolve();

        // Previous city must be cleared
        expect(citySelect.value).toBe('');

        // City options must now be Bengaluru and Mysuru
        cityOptions = citySelect.querySelectorAll('option');
        expect(cityOptions.length).toBe(3);
        expect(citySelect.textContent).toContain('Bengaluru');
        expect(citySelect.textContent).toContain('Mysuru');
        expect(citySelect.textContent).not.toContain('Mumbai');
    });

    it('dispatches backtocart and backtohome events', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        document.body.appendChild(element);

        const backToCartHandler = jest.fn();
        element.addEventListener('backtocart', backToCartHandler);

        await Promise.resolve();

        const returnLink = element.shadowRoot.querySelector('.btn-text-link');
        returnLink.click();

        expect(backToCartHandler).toHaveBeenCalled();
    });

    it('displays guest login notice when user is guest and navigates to Login page on click', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        element.isGuestUser = true;
        document.body.appendChild(element);

        await Promise.resolve();

        const banner = element.shadowRoot.querySelector('.guest-login-banner');
        expect(banner).not.toBeNull();
        expect(banner.textContent).toContain('Have a Commerce Hub customer account?');

        const loginBtn = banner.querySelector('.btn-login-checkout');
        expect(loginBtn).not.toBeNull();

        const navigateToLoginHandler = jest.fn();
        element.addEventListener('navigatetologin', navigateToLoginHandler);

        loginBtn.click();
        await Promise.resolve();

        expect(navigateToLoginHandler).toHaveBeenCalled();
        expect(sessionStorage.getItem('commerceHubPostLogin')).toBe('checkout');
    });

    it('prevents guest users from placing orders and prompts them to log in', async () => {
        localStorage.setItem('commerceHubCart', JSON.stringify(MOCK_CART_ITEMS));

        const element = createElement('c-checkout-page', {
            is: CheckoutPage
        });
        element.isGuestUser = true;
        document.body.appendChild(element);

        getMyAddressesAdapter.emit(MOCK_ADDRESSES);
        getDefaultShippingAddressAdapter.emit(MOCK_ADDRESSES[0]);

        await Promise.resolve();

        const placeOrderBtn = element.shadowRoot.querySelector('.btn-place-order');
        expect(placeOrderBtn).not.toBeNull();
        placeOrderBtn.click();

        await Promise.resolve();
        await Promise.resolve();

        expect(placeOrder).not.toHaveBeenCalled();
        const alertBox = element.shadowRoot.querySelector('.error-banner');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('Please log in to your customer account to place your order.');
    });
});
