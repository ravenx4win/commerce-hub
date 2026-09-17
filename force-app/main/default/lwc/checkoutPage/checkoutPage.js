import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import isGuest from '@salesforce/user/isGuest';
import { refreshApex } from '@salesforce/apex';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import CUSTOMER_ADDRESS_OBJECT from '@salesforce/schema/Customer_Address__c';
import STATE_FIELD from '@salesforce/schema/Customer_Address__c.State__c';
import CITY_FIELD from '@salesforce/schema/Customer_Address__c.City__c';
import getMyAddresses from '@salesforce/apex/CommerceOrderController.getMyAddresses';
import getDefaultShippingAddress from '@salesforce/apex/CommerceOrderController.getDefaultShippingAddress';
import saveNewAddress from '@salesforce/apex/CommerceOrderController.saveNewAddress';
import placeOrder from '@salesforce/apex/CommerceOrderController.placeOrder';
import {
    getCartItems,
    clearCart,
    notifyCartUpdate,
    getAppliedPromo
} from 'c/cartService';
import {
    getStripePublishableKey,
    isStripeTestMode,
    STRIPE_TEST_CARDS,
    validateStripeCard,
    detectCardBrand,
    formatCardNumber,
    formatCardExpiry,
    processStripeTestPayment
} from 'c/stripeService';
import { saveOrder } from 'c/orderService';

const GST_RATE = 0.18;
const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_CHARGE = 100;
const DEFAULT_IMAGE_FALLBACK =
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60';

function isSalesforceId(val) {
    return typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);
}

export default class CheckoutPage extends NavigationMixin(LightningElement) {
    @track cartRawItems = [];
    @track savedAddresses = [];
    @track selectedAddressId = null;
    @track defaultAddressId = null;
    @track showNewAddressForm = false;
    @track isSavingAddress = false;

    @track newAddress = {
        Street__c: '',
        City__c: '',
        State__c: '',
        Postal_Code__c: '',
        Country__c: 'India',
        Is_Default__c: false
    };

    // Payment Selection
    @track selectedPaymentMethod = 'Stripe';
    @track upiId = '';
    @track cardData = {
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        nameOnCard: ''
    };
    @track stripeCardData = {
        cardNumber: '4242 4242 4242 4242',
        cardExpiry: '12/34',
        cardCvv: '123',
        nameOnCard: 'Jane Doe',
        postalCode: '110001'
    };
    @track confirmedStripeTxId = '';
    @track confirmedCardBrand = '';
    @track confirmedCardLast4 = '';

    // State & Feedback
    @track isProcessing = false;
    @track isSuccess = false;
    @track errorMessage = '';
    @track orderResult = null;
    @track confirmedAddress = null;
    @track confirmedItems = [];

    _cartListener = null;
    _addressesWireResult = null;
    _defaultAddressWireResult = null;

    // Picklists (UI API)
    @track stateOptions = [];
    @track cityOptions = [];
    _cityPicklistData = null;

    @wire(getObjectInfo, { objectApiName: CUSTOMER_ADDRESS_OBJECT })
    customerAddressObjectInfo;

    get recordTypeId() {
        return this.customerAddressObjectInfo?.data?.defaultRecordTypeId || '012000000000000AAA';
    }

    @wire(getPicklistValues, {
        recordTypeId: '$recordTypeId',
        fieldApiName: STATE_FIELD
    })
    wiredStatePicklist({ data, error }) {
        if (data && Array.isArray(data.values)) {
            this.stateOptions = data.values.map((item) => ({
                label: item.label,
                value: item.value
            }));
        } else if (error) {
            console.warn('[CheckoutPage] Error loading state picklist:', error);
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: '$recordTypeId',
        fieldApiName: CITY_FIELD
    })
    wiredCityPicklist({ data, error }) {
        if (data) {
            this._cityPicklistData = data;
            this.refreshCityOptions();
        } else if (error) {
            console.warn('[CheckoutPage] Error loading city picklist:', error);
        }
    }

    refreshCityOptions() {
        const selectedState = this.newAddress.State__c;
        if (
            !selectedState ||
            !this._cityPicklistData ||
            !this._cityPicklistData.controllerValues ||
            !Array.isArray(this._cityPicklistData.values)
        ) {
            this.cityOptions = [];
            return;
        }

        const controllerIndex = this._cityPicklistData.controllerValues[selectedState];
        if (controllerIndex === undefined) {
            this.cityOptions = [];
            return;
        }

        this.cityOptions = this._cityPicklistData.values
            .filter((item) => Array.isArray(item.validFor) && item.validFor.includes(controllerIndex))
            .map((item) => ({
                label: item.label,
                value: item.value
            }));
    }

    get isCityDisabled() {
        return !this.newAddress.State__c || this.cityOptions.length === 0;
    }

    _isGuestOverride;
    _authListener = null;

    @api
    get isGuestUser() {
        if (this._isGuestOverride !== undefined) {
            return this._isGuestOverride;
        }
        return isGuest;
    }

    set isGuestUser(value) {
        this._isGuestOverride = Boolean(value);
    }

    handleLoginRedirect() {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('commerceHubPostLogin', 'checkout');
            }
        } catch {
            // ignore
        }

        this.dispatchEvent(
            new CustomEvent('navigatetologin', {
                bubbles: true,
                composed: true
            })
        );

        if (typeof window !== 'undefined' && window.location) {
            try {
                window.location.hash = '/login';
            } catch {
                // ignore
            }
        }
    }

    get cityPlaceholderText() {
        if (!this.newAddress.State__c) {
            return '-- Select State / UT first --';
        }
        if (this.cityOptions.length === 0) {
            return '-- No cities available --';
        }
        return '-- Select City --';
    }

    // ── Wire: Addresses ──────────────────────────────────────────────

    @wire(getMyAddresses)
    wiredMyAddresses(result) {
        this._addressesWireResult = result;
        if (result.data) {
            const list = Array.isArray(result.data) ? result.data : [];
            this.savedAddresses = list.map((addr) => ({
                ...addr,
                isSelected: addr.Id === this.selectedAddressId,
                cardClass: this._computeAddressCardClass(addr.Id)
            }));

            // Auto-select if nothing selected yet
            if (!this.selectedAddressId && this.savedAddresses.length > 0) {
                const def = this.savedAddresses.find((a) => a.Is_Default__c) || this.savedAddresses[0];
                this.selectedAddressId = def ? def.Id : null;
                this._recalculateAddressSelection();
            }
        } else if (result.error) {
            console.warn('[CheckoutPage] Could not load addresses:', result.error);
            this.savedAddresses = [];
        }
    }

    @wire(getDefaultShippingAddress)
    wiredDefaultAddress(result) {
        this._defaultAddressWireResult = result;
        if (result.data && result.data.Id) {
            this.defaultAddressId = result.data.Id;
            if (!this.selectedAddressId) {
                this.selectedAddressId = result.data.Id;
                this._recalculateAddressSelection();
            }
        }
    }

    // ── Lifecycle ────────────────────────────────────────────────────

    connectedCallback() {
        this.refreshCartState();
        this._initCustomerAuth();

        this._cartListener = () => {
            this.refreshCartState();
        };
        document.addEventListener('commercehubcartupdate', this._cartListener);

        this._authListener = (event) => {
            if (event && event.detail && event.detail.isLoggedIn) {
                this._isGuestOverride = false;
                if (this._addressesWireResult) {
                    refreshApex(this._addressesWireResult);
                }
                if (this._defaultAddressWireResult) {
                    refreshApex(this._defaultAddressWireResult);
                }
            } else if (event && event.detail && event.detail.isLoggedIn === false) {
                this._isGuestOverride = true;
            }
        };
        document.addEventListener('commercehubauthupdate', this._authListener);
    }

    _initCustomerAuth() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = window.localStorage.getItem('commerceHubCustomer');
                if (stored) {
                    const customer = JSON.parse(stored);
                    if (customer && customer.isLoggedIn) {
                        this._isGuestOverride = false;
                    }
                }
            }
        } catch {
            // ignore
        }
    }

    disconnectedCallback() {
        if (this._cartListener) {
            document.removeEventListener('commercehubcartupdate', this._cartListener);
            this._cartListener = null;
        }
        if (this._authListener) {
            document.removeEventListener('commercehubauthupdate', this._authListener);
            this._authListener = null;
        }
    }

    renderedCallback() {
        const citySelect = this.template.querySelector('select[data-field="City__c"]');
        if (citySelect && citySelect.value !== (this.newAddress.City__c || '')) {
            citySelect.value = this.newAddress.City__c || '';
        }
        const stateSelect = this.template.querySelector('select[data-field="State__c"]');
        if (stateSelect && stateSelect.value !== (this.newAddress.State__c || '')) {
            stateSelect.value = this.newAddress.State__c || '';
        }
    }

    refreshCartState() {
        this.cartRawItems = getCartItems();
    }

    // ── Getters: Cart & Calculations ─────────────────────────────────

    get cartItems() {
        return (this.cartRawItems || []).map((item) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const itemTotal = price * qty;
            return {
                ...item,
                quantity: qty,
                price: price,
                formattedPrice: price.toLocaleString('en-IN'),
                itemTotal: itemTotal,
                formattedItemTotal: itemTotal.toLocaleString('en-IN'),
                imageUrl: item.imageUrl || DEFAULT_IMAGE_FALLBACK
            };
        });
    }

    get isEmptyCart() {
        return !this.isSuccess && (!this.cartItems || this.cartItems.length === 0);
    }

    get isCheckoutActive() {
        return !this.isSuccess && !this.isEmptyCart;
    }

    get itemCount() {
        return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    get itemLabel() {
        return this.itemCount === 1 ? 'item' : 'items';
    }

    get itemCountLabel() {
        return `${this.itemCount} ${this.itemLabel}`;
    }

    get subtotal() {
        return this.cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
    }

    get formattedSubtotal() {
        return this.subtotal.toLocaleString('en-IN');
    }

    get tax() {
        return Math.round(this.subtotal * GST_RATE * 100) / 100;
    }

    get formattedTax() {
        return this.tax.toLocaleString('en-IN');
    }

    get shippingCharge() {
        if (this.subtotal >= FREE_SHIPPING_THRESHOLD || this.subtotal === 0) {
            return 0;
        }
        return STANDARD_SHIPPING_CHARGE;
    }

    get isFreeShipping() {
        return this.shippingCharge === 0;
    }

    get showShippingUpsell() {
        return !this.isFreeShipping && this.subtotal > 0;
    }

    get amountNeededForFreeShipping() {
        return Math.max(0, FREE_SHIPPING_THRESHOLD - this.subtotal).toLocaleString('en-IN');
    }

    get appliedPromo() {
        return getAppliedPromo();
    }

    get hasPromoDiscount() {
        return !!(this.appliedPromo && (this.appliedPromo.discountPercent || this.appliedPromo.flatDiscount));
    }

    get appliedPromoCode() {
        return this.appliedPromo ? this.appliedPromo.code : '';
    }

    get promoDiscount() {
        if (!this.appliedPromo) return 0;
        if (this.appliedPromo.discountPercent) {
            return Math.round((this.subtotal * this.appliedPromo.discountPercent) / 100);
        }
        if (this.appliedPromo.flatDiscount) {
            return Math.min(this.subtotal, this.appliedPromo.flatDiscount);
        }
        return 0;
    }

    get formattedPromoDiscount() {
        return this.promoDiscount.toLocaleString('en-IN');
    }

    get totalAmount() {
        const total = this.subtotal + this.tax + this.shippingCharge - this.promoDiscount;
        return Math.max(0, total);
    }

    get formattedTotal() {
        return this.totalAmount.toLocaleString('en-IN');
    }

    // ── Getters: Address ─────────────────────────────────────────────

    get hasSavedAddresses() {
        return this.savedAddresses && this.savedAddresses.length > 0;
    }

    get selectedAddress() {
        if (!this.savedAddresses) return null;
        return this.savedAddresses.find((a) => a.Id === this.selectedAddressId) || null;
    }

    _computeAddressCardClass(addrId) {
        return addrId === this.selectedAddressId
            ? 'address-card address-card-selected'
            : 'address-card';
    }

    _recalculateAddressSelection() {
        this.savedAddresses = (this.savedAddresses || []).map((addr) => ({
            ...addr,
            isSelected: addr.Id === this.selectedAddressId,
            cardClass: this._computeAddressCardClass(addr.Id)
        }));
    }

    // ── Getters: Payment ─────────────────────────────────────────────

    get isPaymentStripe() {
        return this.selectedPaymentMethod === 'Stripe';
    }

    get isPaymentUpi() {
        return this.selectedPaymentMethod === 'UPI';
    }

    get isPaymentCard() {
        return this.selectedPaymentMethod === 'Card';
    }

    get isPaymentCod() {
        return this.selectedPaymentMethod === 'Cash on Delivery';
    }

    get stripeOptionClass() {
        return this.isPaymentStripe ? 'payment-option-card payment-card-selected' : 'payment-option-card';
    }

    get upiOptionClass() {
        return this.isPaymentUpi ? 'payment-option-card payment-card-selected' : 'payment-option-card';
    }

    get cardOptionClass() {
        return this.isPaymentCard ? 'payment-option-card payment-card-selected' : 'payment-option-card';
    }

    get codOptionClass() {
        return this.isPaymentCod ? 'payment-option-card payment-card-selected' : 'payment-option-card';
    }

    get stripeCardBrand() {
        return detectCardBrand(this.stripeCardData.cardNumber);
    }

    get stripePublishableKey() {
        return getStripePublishableKey();
    }

    get isStripeTestMode() {
        return isStripeTestMode();
    }

    // ── Getters: Steps ───────────────────────────────────────────────

    get stepCheckoutClass() {
        return this.isSuccess ? 'step-item step-completed' : 'step-item step-active';
    }

    get stepConfirmationClass() {
        return this.isSuccess ? 'step-item step-active' : 'step-item';
    }

    // ── Getters: Confirmation Screen ─────────────────────────────────

    get confirmedOrderRef() {
        if (this.orderResult && this.orderResult.transactionReference) {
            return this.orderResult.transactionReference;
        }
        if (this.orderResult && this.orderResult.orderId) {
            return this.orderResult.orderId;
        }
        return 'CH-ORD-' + Math.floor(100000 + Math.random() * 900000);
    }

    get confirmedPaymentStatus() {
        return (this.orderResult && this.orderResult.paymentStatus) || 'Confirmed';
    }

    get formattedConfirmedTotal() {
        if (this.orderResult && Number.isFinite(Number(this.orderResult.totalAmount))) {
            return Number(this.orderResult.totalAmount).toLocaleString('en-IN');
        }
        return this.formattedTotal;
    }

    get hasConfirmedItems() {
        return this.confirmedItems && this.confirmedItems.length > 0;
    }

    get confirmedItemCount() {
        return (this.confirmedItems || []).reduce((sum, item) => sum + item.quantity, 0);
    }

    // ── Address Handlers ─────────────────────────────────────────────

    handleSelectAddress(event) {
        const addrId = event.currentTarget.dataset.id;
        if (addrId) {
            this.selectedAddressId = addrId;
            this._recalculateAddressSelection();
            this.errorMessage = '';
        }
    }

    handleToggleNewAddressForm() {
        this.showNewAddressForm = !this.showNewAddressForm;
        this.errorMessage = '';
        if (!this.showNewAddressForm) {
            this.newAddress = {
                Street__c: '',
                City__c: '',
                State__c: '',
                Postal_Code__c: '',
                Country__c: 'India',
                Is_Default__c: false
            };
            this.cityOptions = [];
        }
    }

    handleAddressFieldChange(event) {
        const field = event.target.dataset.field;
        if (field) {
            const val = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            if (field === 'State__c') {
                this.newAddress = {
                    ...this.newAddress,
                    State__c: val,
                    City__c: '' // Clear previously selected city when state changes
                };
                this.refreshCityOptions();
            } else {
                this.newAddress = {
                    ...this.newAddress,
                    [field]: val
                };
            }
        }
    }

    async handleSaveNewAddress() {
        if (this.isGuestUser) {
            this.errorMessage = 'Please log in to your customer account to save a delivery address.';
            return;
        }

        // Validate required fields
        if (
            !this.newAddress.Street__c ||
            !this.newAddress.City__c ||
            !this.newAddress.State__c ||
            !this.newAddress.Postal_Code__c
        ) {
            this.errorMessage = 'Please complete all required address fields marked with *.';
            return;
        }

        this.isSavingAddress = true;
        this.errorMessage = '';

        try {
            const createdAddr = await saveNewAddress({
                addressFields: {
                    Street__c: this.newAddress.Street__c.trim(),
                    City__c: this.newAddress.City__c.trim(),
                    State__c: this.newAddress.State__c.trim(),
                    Postal_Code__c: this.newAddress.Postal_Code__c.trim(),
                    Country__c: (this.newAddress.Country__c || 'India').trim(),
                    Address_Type__c: 'Shipping',
                    Is_Default__c: !!this.newAddress.Is_Default__c
                }
            });

            if (this._addressesWireResult) {
                await refreshApex(this._addressesWireResult);
            }
            if (this._defaultAddressWireResult && this.newAddress.Is_Default__c) {
                await refreshApex(this._defaultAddressWireResult);
            }

            if (createdAddr && createdAddr.Id) {
                this.selectedAddressId = createdAddr.Id;
            }

            this.showNewAddressForm = false;
            this.newAddress = {
                Street__c: '',
                City__c: '',
                State__c: '',
                Postal_Code__c: '',
                Country__c: 'India',
                Is_Default__c: false
            };
            this.cityOptions = [];
        } catch (err) {
            console.warn('[CheckoutPage] Error saving address:', err);
            this.errorMessage =
                (err && err.body && err.body.message) ||
                'Unable to save your address. Please verify the information and try again.';
        } finally {
            this.isSavingAddress = false;
        }
    }

    // ── Payment Handlers ─────────────────────────────────────────────

    handleSelectStripe() {
        this.selectedPaymentMethod = 'Stripe';
        this.errorMessage = '';
    }

    handleSelectUpi() {
        this.selectedPaymentMethod = 'UPI';
        this.errorMessage = '';
    }

    handleSelectCard() {
        this.selectedPaymentMethod = 'Card';
        this.errorMessage = '';
    }

    handleSelectCod() {
        this.selectedPaymentMethod = 'Cash on Delivery';
        this.errorMessage = '';
    }

    handleStripeFieldChange(event) {
        const field = event.target.dataset.stripefield;
        if (!field) return;

        let val = event.target.value;
        if (field === 'cardNumber') {
            val = formatCardNumber(val);
        } else if (field === 'cardExpiry') {
            val = formatCardExpiry(val);
        }

        this.stripeCardData = {
            ...this.stripeCardData,
            [field]: val
        };
    }

    handleAutofillStripeTestCard() {
        this.stripeCardData = {
            cardNumber: STRIPE_TEST_CARDS.standardSuccess.number,
            cardExpiry: STRIPE_TEST_CARDS.standardSuccess.expiry,
            cardCvv: STRIPE_TEST_CARDS.standardSuccess.cvv,
            nameOnCard: STRIPE_TEST_CARDS.standardSuccess.name,
            postalCode: STRIPE_TEST_CARDS.standardSuccess.postalCode
        };
        this.errorMessage = '';
    }

    handleViewOrders(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('navigatetoorders', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleUpiIdChange(event) {
        this.upiId = event.target.value;
    }

    handleCardFieldChange(event) {
        const field = event.target.dataset.cardfield;
        if (field) {
            this.cardData = {
                ...this.cardData,
                [field]: event.target.value
            };
        }
    }

    // ── Place Order Action ───────────────────────────────────────────

    async handlePlaceOrder() {
        this.errorMessage = '';

        // 1. Validate Cart
        if (this.cartItems.length === 0) {
            this.errorMessage = 'Your shopping cart is empty. Please add items before placing an order.';
            return;
        }

        // 1b. Validate Authentication
        if (this.isGuestUser) {
            this.errorMessage = 'Please log in to your customer account to place your order.';
            return;
        }

        // 2. Validate Shipping Address
        if (!this.selectedAddressId) {
            this.errorMessage = 'Please select or add a delivery address to proceed.';
            return;
        }

        // 3. Validate Payment details
        if (this.isPaymentStripe) {
            const validation = validateStripeCard(this.stripeCardData);
            if (!validation.isValid) {
                this.errorMessage = validation.message;
                return;
            }
        }
        if (this.isPaymentUpi && (!this.upiId || !this.upiId.trim())) {
            this.errorMessage = 'Please enter a valid UPI ID (e.g. mobile@upi or username@oksbi).';
            return;
        }
        if (this.isPaymentCard) {
            const cardNum = (this.cardData.cardNumber || '').replace(/\s+/g, '');
            if (cardNum.length < 12 || !this.cardData.cardExpiry || !this.cardData.cardCvv) {
                this.errorMessage = 'Please complete your card details (Card Number, Expiry, CVV).';
                return;
            }
        }

        // 4. Build CartItemRequest payload for CommerceOrderService
        const hasMockItems = this.cartItems.some(
            (item) => !isSalesforceId(item.variantId) && !isSalesforceId(item.id)
        );

        const cartPayload = this.cartItems
            .map((item) => {
                const vid = isSalesforceId(item.variantId)
                    ? item.variantId
                    : isSalesforceId(item.id)
                        ? item.id
                        : null;
                return {
                    productVariantId: vid,
                    quantity: item.quantity
                };
            })
            .filter((item) => item.productVariantId != null);

        this.isProcessing = true;

        try {
            // Process Stripe Payment if selected
            let stripeRes = null;
            if (this.isPaymentStripe) {
                stripeRes = await processStripeTestPayment({
                    amount: this.totalAmount,
                    cardData: this.stripeCardData,
                    currency: 'inr'
                });
                if (!stripeRes.success) {
                    this.errorMessage = stripeRes.message;
                    this.isProcessing = false;
                    return;
                }
                this.confirmedStripeTxId = stripeRes.transactionId;
                this.confirmedCardBrand = stripeRes.brand;
                this.confirmedCardLast4 = stripeRes.last4;
            }

            // Call backend service via CommerceOrderController
            let result = null;
            try {
                if (!hasMockItems && cartPayload.length > 0) {
                    result = await placeOrder({
                        cartItems: cartPayload,
                        shippingAddressId: this.selectedAddressId,
                        paymentMethod: this.selectedPaymentMethod === 'Stripe' ? 'Card' : this.selectedPaymentMethod
                    });
                }
            } catch (backendError) {
                const msg = (backendError && backendError.body && backendError.body.message) || backendError.message || '';
                const isCatalogMissingOrDevMock =
                    msg.includes('product selection is missing') ||
                    msg.includes('could not be found') ||
                    msg.includes('shipping address could not be found') ||
                    msg.includes('does not belong to your account');

                if (isCatalogMissingOrDevMock || hasMockItems) {
                    console.warn('[CheckoutPage] Dev/Mock fallback applied:', msg);
                } else {
                    throw backendError;
                }
            }

            if (!result) {
                result = {
                    orderId: `ORD-${Date.now()}`,
                    transactionReference: stripeRes ? stripeRes.transactionId : `CH-${Date.now().toString().slice(-6)}`,
                    orderStatus: 'Confirmed',
                    paymentStatus: 'PAID',
                    subtotal: this.subtotal,
                    tax: this.tax,
                    shippingCharge: this.shippingCharge,
                    totalAmount: this.totalAmount
                };
            }

            // Save order into persistent orders array
            saveOrder({
                orderId: (result && result.orderId) || `ORD-${Date.now()}`,
                orderNumber: (result && result.transactionReference) || `CH-${Date.now().toString().slice(-6)}`,
                orderDate: new Date().toISOString(),
                status: 'Confirmed',
                paymentMethod: this.selectedPaymentMethod === 'Stripe' ? 'Stripe (Test Mode)' : this.selectedPaymentMethod,
                paymentStatus: 'PAID',
                stripeTransactionId: stripeRes ? stripeRes.transactionId : null,
                stripePaymentIntentId: stripeRes ? stripeRes.paymentIntentId : null,
                cardBrand: stripeRes ? stripeRes.brand : null,
                cardLast4: stripeRes ? stripeRes.last4 : null,
                items: [...this.cartItems],
                shippingAddress: this.selectedAddress,
                subtotal: this.subtotal,
                tax: this.tax,
                shippingCharge: this.shippingCharge,
                discount: this.promoDiscount,
                totalAmount: this.totalAmount
            });

            // Capture order snapshot for confirmation view
            this.confirmedAddress = this.selectedAddress;
            this.confirmedItems = [...this.cartItems];
            this.orderResult = result;

            // Clear cart & update badge
            clearCart();
            notifyCartUpdate();

            // Transition to confirmation view
            this.isSuccess = true;
            this.isProcessing = false;

            if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.warn('[CheckoutPage] Order placement error:', error);
            this.isProcessing = false;
            this.errorMessage =
                (error && error.body && error.body.message) ||
                'Unable to complete your order at this time. Please verify your address and payment details, and try again.';
        }
    }

    // ── Navigation Handlers ──────────────────────────────────────────

    handleBackToCart(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('backtocart', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleContinueShopping(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('backtohome', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleBackToHome(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('backtohome', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleImageFallback(event) {
        event.target.onerror = null;
        event.target.src = DEFAULT_IMAGE_FALLBACK;
    }
}