import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_WATCHES_PRODUCTS = [
    {
        "id": "wat-001",
        "productCode": "CH-WAT001",
        "categoryCode": "WAT",
        "name": "Analog Watch",
        "subcategory": "Minimalist",
        "description": "Sleek stainless steel case analog watch with sapphire crystal glass and Japanese quartz movement.",
        "price": 2999,
        "originalPrice": 4999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 520,
        "badge": "Classic",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-002",
        "productCode": "CH-WAT002",
        "categoryCode": "WAT",
        "name": "Fitness Watch",
        "subcategory": "Smartwatches",
        "description": "1.43-inch AMOLED smartwatch with 24/7 heart rate, SpO2, GPS tracking, and 12-day battery.",
        "price": 3499,
        "originalPrice": 5999,
        "discountPercent": 42,
        "rating": 4.7,
        "reviewsCount": 890,
        "badge": "AMOLED",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1510017803434-a899398421b3?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-003",
        "productCode": "CH-WAT003",
        "categoryCode": "WAT",
        "name": "Minimalist Watch",
        "subcategory": "Minimalist",
        "description": "Ultra-thin 6mm matte black sunray dial watch with quick-release mesh steel strap.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 410,
        "badge": "Ultra-Thin",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-004",
        "productCode": "CH-WAT004",
        "categoryCode": "WAT",
        "name": "Chronograph Watch",
        "subcategory": "Chronographs",
        "description": "Triple sub-dial precision stopwatch chronograph with tachymeter bezel and luminescent hands.",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.9,
        "reviewsCount": 380,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-005",
        "productCode": "CH-WAT005",
        "categoryCode": "WAT",
        "name": "Leather Watch",
        "subcategory": "Luxury Analog",
        "description": "Vintage cream dial dress watch with hand-stitched Italian genuine leather alligator grain band.",
        "price": 3299,
        "originalPrice": 5199,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 340,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-006",
        "productCode": "CH-WAT006",
        "categoryCode": "WAT",
        "name": "Metal Bracelet Watch",
        "subcategory": "Luxury Analog",
        "description": "Brushed and polished two-tone 5-link jubilee metal bracelet watch with deployant push buckle.",
        "price": 3799,
        "originalPrice": 5999,
        "discountPercent": 37,
        "rating": 4.8,
        "reviewsCount": 290,
        "badge": "Jubilee",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1619134778706-7015533a6150?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-007",
        "productCode": "CH-WAT007",
        "categoryCode": "WAT",
        "name": "Digital Watch",
        "subcategory": "Smartwatches",
        "description": "Retro 80s gold stainless steel digital alarm chronograph watch with amber EL backlight.",
        "price": 1899,
        "originalPrice": 2899,
        "discountPercent": 34,
        "rating": 4.6,
        "reviewsCount": 650,
        "badge": "Retro 80s",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-008",
        "productCode": "CH-WAT008",
        "categoryCode": "WAT",
        "name": "Activity Watch",
        "subcategory": "Smartwatches",
        "description": "Rugged GPS outdoor adventure watch with barometric altimeter, compass, and 50m water resistance.",
        "price": 5999,
        "originalPrice": 8999,
        "discountPercent": 33,
        "rating": 4.9,
        "reviewsCount": 310,
        "badge": "Rugged 50m",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-009",
        "productCode": "CH-WAT009",
        "categoryCode": "WAT",
        "name": "Travel Case",
        "subcategory": "Straps & Cases",
        "description": "Handmade genuine leather 3-watch roll travel storage case with slide-in cushioned pillows.",
        "price": 1499,
        "originalPrice": 2499,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 220,
        "badge": "Leather Roll",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-010",
        "productCode": "CH-WAT010",
        "categoryCode": "WAT",
        "name": "Leather Strap",
        "subcategory": "Straps & Cases",
        "description": "Premium quick-release 20mm/22mm top-grain padded leather replacement watch band.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 430,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-011",
        "productCode": "CH-WAT011",
        "categoryCode": "WAT",
        "name": "Metal Strap",
        "subcategory": "Straps & Cases",
        "description": "Solid stainless steel mesh Milanese magnetic loop watch band with infinite size adjustment.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.6,
        "reviewsCount": 370,
        "badge": "Milanese",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-012",
        "productCode": "CH-WAT012",
        "categoryCode": "WAT",
        "name": "Casual Watch",
        "subcategory": "Minimalist",
        "description": "Military field watch with durable nylon NATO olive strap and 100m water resistant case.",
        "price": 1999,
        "originalPrice": 3199,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 480,
        "badge": "NATO Strap",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-013",
        "productCode": "CH-WAT013",
        "categoryCode": "WAT",
        "name": "Formal Watch",
        "subcategory": "Luxury Analog",
        "description": "Roman numeral sunburst dial slim executive dress watch with sapphire coated glass.",
        "price": 4299,
        "originalPrice": 6999,
        "discountPercent": 39,
        "rating": 4.8,
        "reviewsCount": 260,
        "badge": "Executive",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1509941943102-10c232535736?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-014",
        "productCode": "CH-WAT014",
        "categoryCode": "WAT",
        "name": "Unisex Watch",
        "subcategory": "Minimalist",
        "description": "Bauhaus clean geometry white dial watch with interchangeable tan leather strap.",
        "price": 2799,
        "originalPrice": 4299,
        "discountPercent": 35,
        "rating": 4.7,
        "reviewsCount": 390,
        "badge": "Bauhaus",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "wat-015",
        "productCode": "CH-WAT015",
        "categoryCode": "WAT",
        "name": "Dress Watch",
        "subcategory": "Luxury Analog",
        "description": "Open-heart skeleton automatic mechanical self-winding watch with exhibition glass back.",
        "price": 7999,
        "originalPrice": 12999,
        "discountPercent": 38,
        "rating": 4.9,
        "reviewsCount": 310,
        "badge": "Automatic",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1518131672697-613becd4fab5?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES_LIST = [
    { id: 'sub-all', label: 'All Timepieces', value: 'All' },
    { id: 'sub-chronographs', label: 'Chronographs', value: 'Chronographs' },
    { id: 'sub-minimalist', label: 'Minimalist', value: 'Minimalist' },
    { id: 'sub-smartwatches', label: 'Smartwatches', value: 'Smartwatches' },
    { id: 'sub-luxury', label: 'Luxury Analog', value: 'Luxury Analog' },
    { id: 'sub-straps', label: 'Straps & Cases', value: 'Straps & Cases' }
];

export default class WatchesAccessoriesPage extends NavigationMixin(LightningElement) {
    @track products = [];
    @track filteredProducts = [];
    @track showCartToast = false;
    @track toastMessage = '';

    _activeFilter = 'All';
    _searchTerm = '';
    _sortBy = 'featured';
    _allProducts = [];
    _toastTimeout = null;

    @wire(getProducts)
    wiredProducts({ data, error }) {
        if (data && data.length > 0) {
            const catList = data.filter(
                (p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Watches & Accessories'
            );
            if (catList.length > 0) {
                this._allProducts = catList.map((p, index) => this.transformApexProduct(p, index));
            } else {
                this._allProducts = DUMMY_WATCHES_PRODUCTS.map((p) => this.formatProduct(p));
            }
        } else {
            if (error) {
                console.warn('[Watches & Accessories] Apex error, fallback to dummy data:', error);
            }
            this._allProducts = DUMMY_WATCHES_PRODUCTS.map((p) => this.formatProduct(p));
        }
        this.applyFiltersAndSort();
    }

    connectedCallback() {
        if (!this._allProducts || this._allProducts.length === 0) {
            this._allProducts = DUMMY_WATCHES_PRODUCTS.map((p) => this.formatProduct(p));
            this.applyFiltersAndSort();
        }
    }

    transformApexProduct(apexProduct, index = 0) {
        const fallback =
            DUMMY_WATCHES_PRODUCTS.find(
                (def) =>
                    (apexProduct.ProductCode && def.productCode && apexProduct.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                    (apexProduct.Name && def.name && apexProduct.Name.toLowerCase() === def.name.toLowerCase()) ||
                    (apexProduct.Name && def.name && (apexProduct.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(apexProduct.Name.toLowerCase())))
            ) || DUMMY_WATCHES_PRODUCTS[index % DUMMY_WATCHES_PRODUCTS.length] || {};

        const price = apexProduct.Price__c || fallback.price || 2499;
        const origPrice = fallback.originalPrice || Math.round(price * 1.5);
        const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : fallback.discountPercent || 0;
        const code = apexProduct.ProductCode || fallback.productCode || `CH-WAT${String(index + 1).padStart(3, '0')}`;
        const img = (apexProduct.Product_Images__r && apexProduct.Product_Images__r.length > 0 && apexProduct.Product_Images__r[0].Image_URL__c && !apexProduct.Product_Images__r[0].Image_URL__c.includes('placehold.co'))
            ? apexProduct.Product_Images__r[0].Image_URL__c
            : (fallback.imageUrl || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=60');

        return {
            id: apexProduct.Id || fallback.id,
            name: apexProduct.Name || fallback.name,
            productCode: code,
            categoryCode: 'WAT',
            subcategory: fallback.subcategory || 'General',
            description: apexProduct.Description || fallback.description || 'Premium gear engineered for seamless performance.',
            price,
            originalPrice: origPrice,
            discountPercent: discount,
            rating: fallback.rating || 4.8,
            reviewsCount: fallback.reviewsCount || 250,
            badge: fallback.badge || null,
            badgeClass: fallback.badgeClass || '',
            imageUrl: img,
            formattedPrice: price.toLocaleString('en-IN'),
            formattedOriginalPrice: origPrice.toLocaleString('en-IN'),
            ratingLabel: `Rated ${fallback.rating || 4.8} out of 5 stars`,
            detailsAriaLabel: `View details for ${apexProduct.Name || fallback.name}`,
            addToCartAriaLabel: `Add ${apexProduct.Name || fallback.name} to cart`
        };
    }

    formatProduct(prod) {
        return {
            ...prod,
            productCode: prod.productCode || `CH-WAT001`,
            categoryCode: 'WAT',
            formattedPrice: prod.price.toLocaleString('en-IN'),
            formattedOriginalPrice: prod.originalPrice ? prod.originalPrice.toLocaleString('en-IN') : null,
            ratingLabel: `Rated ${prod.rating} out of 5 stars`,
            detailsAriaLabel: `View details for ${prod.name}`,
            addToCartAriaLabel: `Add ${prod.name} to cart`
        };
    }

    get subcategories() {
        return SUBCATEGORIES_LIST.map((sub) => {
            const count =
                sub.value === 'All'
                    ? this._allProducts.length
                    : this._allProducts.filter((p) => p.subcategory === sub.value).length;
            const isActive = this._activeFilter === sub.value;
            return {
                ...sub,
                count,
                active: isActive,
                activeClass: isActive ? 'pill-btn pill-btn--active' : 'pill-btn'
            };
        });
    }

    get searchTerm() {
        return this._searchTerm;
    }

    get hasSearchTerm() {
        return Boolean(this._searchTerm && this._searchTerm.length > 0);
    }

    get hasProducts() {
        return this.filteredProducts && this.filteredProducts.length > 0;
    }

    get displayedProductsCount() {
        return this.filteredProducts ? this.filteredProducts.length : 0;
    }

    get hasActiveFilters() {
        return this._activeFilter !== 'All' || Boolean(this._searchTerm) || this._sortBy !== 'featured';
    }

    applyFiltersAndSort() {
        let list = [...this._allProducts];

        if (this._activeFilter && this._activeFilter !== 'All') {
            list = list.filter((p) => p.subcategory === this._activeFilter);
        }

        if (this._searchTerm && this._searchTerm.trim() !== '') {
            const term = this._searchTerm.toLowerCase().trim();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.description.toLowerCase().includes(term) ||
                    p.subcategory.toLowerCase().includes(term)
            );
        }

        switch (this._sortBy) {
            case 'price-asc':
                list.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                list.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                list.sort((a, b) => b.rating - a.rating);
                break;
            case 'name-asc':
                list.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }

        this.filteredProducts = list;
    }

    handlePillClick(event) {
        const filter = event.currentTarget.dataset.filter;
        this._activeFilter = filter;
        this.applyFiltersAndSort();
    }

    handleSearchInput(event) {
        this._searchTerm = event.target.value;
        this.applyFiltersAndSort();
    }

    handleClearSearch() {
        this._searchTerm = '';
        const input = this.template.querySelector('.search-input');
        if (input) input.value = '';
        this.applyFiltersAndSort();
    }

    handleSortChange(event) {
        this._sortBy = event.target.value;
        this.applyFiltersAndSort();
    }

    handleResetFilters() {
        this._activeFilter = 'All';
        this._searchTerm = '';
        this._sortBy = 'featured';
        const input = this.template.querySelector('.search-input');
        if (input) input.value = '';
        const sort = this.template.querySelector('.sort-select');
        if (sort) sort.value = 'featured';
        this.applyFiltersAndSort();
    }

    handleProductClick(event) {
        const productId = event.currentTarget.dataset.id;
        const urlSlug = `/watches-accessories/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'watches-accessories', url: urlSlug },
                bubbles: true,
                composed: true
            })
        );

        const isLocalDev = typeof window !== 'undefined' && 
            window.location && 
            window.location.href && 
            window.location.href.includes('localdev-preview');
        if (!isLocalDev) {
            try {
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { url: urlSlug }
                });
            } catch (err) {
                console.warn('[WatchesAccessoriesPage] Product navigation error:', err);
            }
        }
    }

    handleHomeClick(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(new CustomEvent('backtohome', { bubbles: true, composed: true }));
        const isLocalDev = typeof window !== 'undefined' && 
            window.location && 
            window.location.href && 
            window.location.href.includes('localdev-preview');
        if (!isLocalDev) {
            try {
                this[NavigationMixin.Navigate]({
                    type: 'comm__namedPage',
                    attributes: { name: 'Home' }
                });
            } catch (err) {
                console.warn('[WatchesAccessoriesPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Watch item';

        if (prod) {
            addToCart(prod, 1);
        } else {
            document.dispatchEvent(
                new CustomEvent('commercehubcartupdate', {
                    detail: { count: 1, productId },
                    bubbles: true,
                    composed: true
                })
            );
        }

        this.toastMessage = `"${name}" added to cart!`;
        this.showCartToast = true;

        if (this._toastTimeout) clearTimeout(this._toastTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._toastTimeout = setTimeout(() => {
            this.showCartToast = false;
        }, 2600);
    }

    handleImageError(event) {
        event.target.src = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
