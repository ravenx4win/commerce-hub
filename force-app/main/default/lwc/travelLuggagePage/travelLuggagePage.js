import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_TRAVEL_PRODUCTS = [
    {
        "id": "trv-001",
        "productCode": "CH-TRV001",
        "categoryCode": "TRV",
        "name": "Cabin Backpack",
        "subcategory": "Backpacks",
        "description": "40L flight-approved carry-on backpack with 180-degree suitcase opening and padded 17in laptop slot.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 620,
        "badge": "Flight Approved",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-002",
        "productCode": "CH-TRV002",
        "categoryCode": "TRV",
        "name": "Hardshell Carry-On",
        "subcategory": "Suitcases",
        "description": "20-inch indestructible 100% Makrolon polycarbonate spinner suitcase with recessed TSA lock.",
        "price": 3999,
        "originalPrice": 5999,
        "discountPercent": 33,
        "rating": 4.9,
        "reviewsCount": 780,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-003",
        "productCode": "CH-TRV003",
        "categoryCode": "TRV",
        "name": "Canvas Duffle",
        "subcategory": "Duffles",
        "description": "Vintage waxed heavy cotton canvas weekend travel duffle bag with full-grain leather straps.",
        "price": 2799,
        "originalPrice": 4299,
        "discountPercent": 35,
        "rating": 4.7,
        "reviewsCount": 390,
        "badge": "Vintage Waxed",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-004",
        "productCode": "CH-TRV004",
        "categoryCode": "TRV",
        "name": "Check-In Suitcase",
        "subcategory": "Suitcases",
        "description": "28-inch large capacity expandable 8-wheel whisper-silent spinner trolley suitcase.",
        "price": 5499,
        "originalPrice": 8499,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 490,
        "badge": "Spacious 28in",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-005",
        "productCode": "CH-TRV005",
        "categoryCode": "TRV",
        "name": "Travel Organizer",
        "subcategory": "Organizers",
        "description": "Electronic cables and tech gadgets travel organizer case with water-resistant nylon padding.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 520,
        "badge": "Organized",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-006",
        "productCode": "CH-TRV006",
        "categoryCode": "TRV",
        "name": "Packing Cubes",
        "subcategory": "Organizers",
        "description": "Set of 6 ultra-lightweight double-zipper compression packing cubes for wrinkle-free suitcases.",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.9,
        "reviewsCount": 840,
        "badge": "Compression",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-007",
        "productCode": "CH-TRV007",
        "categoryCode": "TRV",
        "name": "Passport Holder",
        "subcategory": "Accessories",
        "description": "RFID blocking genuine leather family passport travel wallet case with boarding pass sleeve.",
        "price": 599,
        "originalPrice": 999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 610,
        "badge": "RFID Safe",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-008",
        "productCode": "CH-TRV008",
        "categoryCode": "TRV",
        "name": "Toiletry Kit",
        "subcategory": "Organizers",
        "description": "Hanging waterproof travel cosmetic and shaving toiletry kit with 360-degree swivel hook.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.7,
        "reviewsCount": 480,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-009",
        "productCode": "CH-TRV009",
        "categoryCode": "TRV",
        "name": "Travel Adapter",
        "subcategory": "Accessories",
        "description": "All-in-one international universal travel power adapter with 4 USB ports and 65W GaN Type-C.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 730,
        "badge": "65W GaN",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-010",
        "productCode": "CH-TRV010",
        "categoryCode": "TRV",
        "name": "Neck Pillow",
        "subcategory": "Accessories",
        "description": "Ergonomic 100% pure memory foam travel neck pillow with 360-degree head support & washable cover.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.6,
        "reviewsCount": 560,
        "badge": "Memory Foam",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-011",
        "productCode": "CH-TRV011",
        "categoryCode": "TRV",
        "name": "Luggage Strap",
        "subcategory": "Accessories",
        "description": "Heavy duty cross adjustable luggage strap with 3-dial TSA combination lock and name tag.",
        "price": 499,
        "originalPrice": 799,
        "discountPercent": 38,
        "rating": 4.5,
        "reviewsCount": 290,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-012",
        "productCode": "CH-TRV012",
        "categoryCode": "TRV",
        "name": "Travel Wallet",
        "subcategory": "Accessories",
        "description": "Zippered clutch travel document organizer for currency, passports, SIM cards, and keys.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 340,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-013",
        "productCode": "CH-TRV013",
        "categoryCode": "TRV",
        "name": "Laptop Bag",
        "subcategory": "Backpacks",
        "description": "Executive water-resistant slim laptop briefcase bag with luggage pass-through strap.",
        "price": 1999,
        "originalPrice": 3199,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 420,
        "badge": "Executive",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-014",
        "productCode": "CH-TRV014",
        "categoryCode": "TRV",
        "name": "Foldable Bag",
        "subcategory": "Duffles",
        "description": "Packable ultralight 32L gym & travel duffel bag folding flat into a tiny zippered pocket.",
        "price": 899,
        "originalPrice": 1399,
        "discountPercent": 36,
        "rating": 4.6,
        "reviewsCount": 310,
        "badge": "Packable",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "trv-015",
        "productCode": "CH-TRV015",
        "categoryCode": "TRV",
        "name": "Anti-Theft Bag",
        "subcategory": "Backpacks",
        "description": "Slash-proof hidden zipper travel backpack with integrated USB charging port and secret card pockets.",
        "price": 2699,
        "originalPrice": 4299,
        "discountPercent": 37,
        "rating": 4.9,
        "reviewsCount": 510,
        "badge": "Anti-Theft",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES_LIST = [
    { id: 'sub-all', label: 'All Luggage', value: 'All' },
    { id: 'sub-suitcases', label: 'Suitcases', value: 'Suitcases' },
    { id: 'sub-backpacks', label: 'Backpacks', value: 'Backpacks' },
    { id: 'sub-duffles', label: 'Duffles', value: 'Duffles' },
    { id: 'sub-organizers', label: 'Organizers', value: 'Organizers' },
    { id: 'sub-accessories', label: 'Accessories', value: 'Accessories' }
];

export default class TravelLuggagePage extends NavigationMixin(LightningElement) {
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
                (p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Travel & Luggage'
            );
            if (catList.length > 0) {
                this._allProducts = catList.map((p, index) => this.transformApexProduct(p, index));
            } else {
                this._allProducts = DUMMY_TRAVEL_PRODUCTS.map((p) => this.formatProduct(p));
            }
        } else {
            if (error) {
                console.warn('[Travel & Luggage] Apex error, fallback to dummy data:', error);
            }
            this._allProducts = DUMMY_TRAVEL_PRODUCTS.map((p) => this.formatProduct(p));
        }
        this.applyFiltersAndSort();
    }

    connectedCallback() {
        if (!this._allProducts || this._allProducts.length === 0) {
            this._allProducts = DUMMY_TRAVEL_PRODUCTS.map((p) => this.formatProduct(p));
            this.applyFiltersAndSort();
        }
    }

    transformApexProduct(apexProduct, index = 0) {
        const fallback =
            DUMMY_TRAVEL_PRODUCTS.find(
                (def) =>
                    (apexProduct.ProductCode && def.productCode && apexProduct.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                    (apexProduct.Name && def.name && apexProduct.Name.toLowerCase() === def.name.toLowerCase()) ||
                    (apexProduct.Name && def.name && (apexProduct.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(apexProduct.Name.toLowerCase())))
            ) || DUMMY_TRAVEL_PRODUCTS[index % DUMMY_TRAVEL_PRODUCTS.length] || {};

        const price = apexProduct.Price__c || fallback.price || 2499;
        const origPrice = fallback.originalPrice || Math.round(price * 1.5);
        const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : fallback.discountPercent || 0;
        const code = apexProduct.ProductCode || fallback.productCode || `CH-TRV${String(index + 1).padStart(3, '0')}`;
        const img = (apexProduct.Product_Images__r && apexProduct.Product_Images__r.length > 0 && apexProduct.Product_Images__r[0].Image_URL__c && !apexProduct.Product_Images__r[0].Image_URL__c.includes('placehold.co'))
            ? apexProduct.Product_Images__r[0].Image_URL__c
            : (fallback.imageUrl || 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500&auto=format&fit=crop&q=60');

        return {
            id: apexProduct.Id || fallback.id,
            name: apexProduct.Name || fallback.name,
            productCode: code,
            categoryCode: 'TRV',
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
            productCode: prod.productCode || `CH-TRV001`,
            categoryCode: 'TRV',
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
        const urlSlug = `/travel-luggage/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'travel-luggage', url: urlSlug },
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
                console.warn('[TravelLuggagePage] Product navigation error:', err);
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
                console.warn('[TravelLuggagePage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Luggage item';

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
        event.target.src = 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
