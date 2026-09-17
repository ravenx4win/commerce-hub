import { LightningElement, api, wire, track } from 'lwc';
import getProductDetails from '@salesforce/apex/CommerceProductController.getProductDetails';
import getDefaultShippingAddress from '@salesforce/apex/CommerceOrderController.getDefaultShippingAddress';
import { addToCart } from 'c/cartService';

const CATEGORY_NAMES = {
    'appliances': 'Appliances',
    'audio': 'Audio',
    'beauty': 'Beauty',
    'books': 'Books',
    'clothing': 'Clothing',
    'electronics': 'Electronics',
    'food-grocery': 'Food & Grocery',
    'furniture': 'Furniture',
    'home': 'Home',
    'home-living': 'Home',
    'kitchen-dining': 'Kitchen & Dining',
    'laptops-computers': 'Laptops & Computers',
    'mobiles': 'Mobiles',
    'personal-care': 'Personal Care',
    'sports-fitness': 'Sports & Fitness',
    'toys-games': 'Toys & Games',
    'travel-luggage': 'Travel & Luggage',
    'watches-accessories': 'Watches & Accessories'
};

const DEFAULT_IMAGE_FALLBACK =
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=60';

export default class ProductDetail extends LightningElement {
    @api productId;
    @api categorySlug = '';

    @track product = null;
    @track variants = [];
    @track images = [];
    @track selectedVariantId = null;
    @track activeImageUrl = '';
    @track activeImageAlt = '';
    @track quantity = 1;
    @track isLoading = true;
    @track isError = false;
    @track errorMessage = '';

    @track showToast = false;
    @track toastMessage = '';
    _toastTimer = null;

    @track defaultAddress = null;

    @wire(getDefaultShippingAddress)
    wiredAddress({ data }) {
        if (data) {
            this.defaultAddress = data;
        }
    }

    @wire(getProductDetails, { productId: '$productId' })
    wiredProductDetails({ error, data }) {
        this.isLoading = true;
        this.isError = false;

        if (data) {
            this._processApexData(data);
            this.isLoading = false;
        } else if (error) {
            this._handleLoadError(error);
            this.isLoading = false;
        }
    }

    connectedCallback() {
        // If no valid Product2 Id is provided yet, set initial loading or error
        if (!this.productId) {
            this.isLoading = false;
            this.isError = true;
        }
    }

    disconnectedCallback() {
        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
        }
    }

    // ── Data Processing ──────────────────────────────────────────────

    _processApexData(data) {
        if (!data || !data.product) {
            this.isError = true;
            return;
        }

        this.product = data.product;
        this.variants = Array.isArray(data.variants) ? data.variants : [];
        this.images = Array.isArray(data.images) ? data.images : [];

        // Set default variant
        if (this.variants.length > 0) {
            const firstActive = this.variants.find((v) => v.Active__c) || this.variants[0];
            this.selectedVariantId = firstActive ? firstActive.Id : this.variants[0].Id;
        } else {
            this.selectedVariantId = null;
        }

        // Set default primary image
        if (this.images.length > 0) {
            const firstImg = this.images[0];
            this.activeImageUrl = firstImg.Image_URL__c || DEFAULT_IMAGE_FALLBACK;
            this.activeImageAlt = firstImg.Alt_Text__c || this.product.Name || 'Product Image';
        } else {
            this.activeImageUrl = DEFAULT_IMAGE_FALLBACK;
            this.activeImageAlt = this.product.Name || 'Product Image';
        }
    }

    _handleLoadError(error) {
        console.warn('[ProductDetail] Error loading product details:', error);
        this.product = null;
        this.variants = [];
        this.images = [];
        this.isError = true;
        this.errorMessage =
            (error && error.body && error.body.message) ||
            'Unable to load product details at this time.';
    }

    // ── Getters ──────────────────────────────────────────────────────

    get hasProductData() {
        return !this.isLoading && !this.isError && this.product != null;
    }

    get productName() {
        return this.product ? this.product.Name : '';
    }

    get productCode() {
        return this.product ? this.product.ProductCode || 'CH-001' : '';
    }

    get productDescription() {
        return this.product && this.product.Description
            ? this.product.Description
            : 'Premium quality product manufactured to the highest standards with guaranteed reliability and performance.';
    }

    get categoryDisplayName() {
        if (this.product && this.product.Commerce_Hub_Category__r && this.product.Commerce_Hub_Category__r.Name) {
            return this.product.Commerce_Hub_Category__r.Name;
        }
        if (this.categorySlug && CATEGORY_NAMES[this.categorySlug.toLowerCase()]) {
            return CATEGORY_NAMES[this.categorySlug.toLowerCase()];
        }
        return 'Category';
    }

    get categoryHref() {
        const slug = this.categorySlug || 'appliances';
        return `#/${slug}`;
    }

    get selectedVariant() {
        if (!this.variants || this.variants.length === 0) return null;
        return this.variants.find((v) => v.Id === this.selectedVariantId) || this.variants[0];
    }

    get currentPriceNumber() {
        const v = this.selectedVariant;
        if (v && Number.isFinite(Number(v.Price__c))) {
            return Number(v.Price__c);
        }
        return 0;
    }

    get formattedPrice() {
        return '₹' + this.currentPriceNumber.toLocaleString('en-IN');
    }

    get hasOriginalPrice() {
        return false;
    }

    get formattedOriginalPrice() {
        return '';
    }

    get currentSku() {
        const v = this.selectedVariant;
        if (v && v.SKU__c) return v.SKU__c;
        return this.productCode;
    }

    get isStockActive() {
        const v = this.selectedVariant;
        return v ? v.Active__c !== false : true;
    }

    get hasVariants() {
        return this.variants && this.variants.length > 1;
    }

    get selectedVariantName() {
        const v = this.selectedVariant;
        return v ? v.Name || v.SKU__c : '';
    }

    get selectedVariantColor() {
        const v = this.selectedVariant;
        return v && v.Color__c ? v.Color__c : null;
    }

    get selectedVariantSize() {
        const v = this.selectedVariant;
        return v && v.Size__c ? v.Size__c : null;
    }

    get formattedVariants() {
        return this.variants.map((v) => {
            const isSelected = v.Id === this.selectedVariantId;
            let label = v.Name || v.SKU__c;
            if (v.Color__c && v.Size__c) {
                label = `${v.Color__c} / ${v.Size__c}`;
            } else if (v.Color__c) {
                label = v.Color__c;
            } else if (v.Size__c) {
                label = v.Size__c;
            }

            const priceNum = Number.isFinite(Number(v.Price__c)) ? Number(v.Price__c) : 0;
            return {
                id: v.Id,
                label,
                formattedPrice: '₹' + priceNum.toLocaleString('en-IN'),
                isSelected,
                cssClass: isSelected ? 'variant-pill active' : 'variant-pill'
            };
        });
    }

    get hasMultipleImages() {
        return this.images && this.images.length > 1;
    }

    get galleryImages() {
        return this.images.map((img) => {
            const url = img.Image_URL__c || DEFAULT_IMAGE_FALLBACK;
            const isSelected = url === this.activeImageUrl;
            return {
                id: img.Id,
                url,
                alt: img.Alt_Text__c || this.productName,
                isSelected,
                cssClass: isSelected ? 'thumb-btn active' : 'thumb-btn'
            };
        });
    }

    get deliveryLocationSummary() {
        if (this.defaultAddress) {
            const city = this.defaultAddress.City__c || this.defaultAddress.City || '';
            const postal = this.defaultAddress.PostalCode__c || this.defaultAddress.Postal_Code__c || '';
            if (city || postal) {
                return `${city} ${postal}`.trim();
            }
        }
        return 'India (All Pin Codes)';
    }

    get isMinQuantity() {
        return this.quantity <= 1;
    }

    get isMaxQuantity() {
        return this.quantity >= 10;
    }

    get isAddToCartDisabled() {
        return !this.isStockActive || this.isLoading;
    }

    // ── Interaction Handlers ─────────────────────────────────────────

    handleThumbnailClick(event) {
        const url = event.currentTarget.dataset.url;
        if (url) {
            this.activeImageUrl = url;
        }
    }

    handleVariantSelect(event) {
        const variantId = event.currentTarget.dataset.id;
        this.selectedVariantId = variantId;
    }

    handleDecreaseQuantity() {
        if (this.quantity > 1) {
            this.quantity -= 1;
        }
    }

    handleIncreaseQuantity() {
        if (this.quantity < 10) {
            this.quantity += 1;
        }
    }

    handleAddToCart() {
        const variant = this.selectedVariant;
        const price = this.currentPriceNumber;

        // Build cart payload using ProductVariant__c as the item added to cart
        const cartItemPayload = {
            id: variant ? variant.Id : this.product.Id,
            name: variant && variant.Name && variant.Name !== this.product.Name
                ? `${this.product.Name} (${variant.Name})`
                : this.product.Name,
            price: price,
            originalPrice: price,
            imageUrl: this.activeImageUrl,
            category: this.categoryDisplayName,
            variantId: variant ? variant.Id : null,
            sku: this.currentSku
        };

        // Reuse existing Commerce Hub cart mechanism
        addToCart(cartItemPayload, this.quantity);

        this._showToastNotification(`${this.productName} added to cart!`);
    }

    handleHomeClick(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(new CustomEvent('backtohome', { bubbles: true, composed: true }));
    }

    handleCategoryClick(event) {
        if (event && event.preventDefault) event.preventDefault();
        const category = this.categorySlug || 'appliances';
        this.dispatchEvent(
            new CustomEvent('backtocategory', {
                detail: { category },
                bubbles: true,
                composed: true
            })
        );
    }

    handleImageError(event) {
        event.target.onerror = null;
        event.target.src = DEFAULT_IMAGE_FALLBACK;
    }

    handleThumbError(event) {
        event.target.onerror = null;
        event.target.src = DEFAULT_IMAGE_FALLBACK;
    }

    _showToastNotification(msg) {
        this.toastMessage = msg;
        this.showToast = true;
        if (this._toastTimer) clearTimeout(this._toastTimer);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._toastTimer = setTimeout(() => {
            this.showToast = false;
        }, 3000);
    }
}
