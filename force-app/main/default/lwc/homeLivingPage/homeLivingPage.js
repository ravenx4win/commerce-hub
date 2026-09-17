import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_HOME_PRODUCTS = [
    {
        "id": "hom-001",
        "productCode": "CH-HOM001",
        "categoryCode": "HOM",
        "name": "Ceramic Table Lamp",
        "subcategory": "Lighting",
        "description": "Modern ceramic base bedside table lamp with linen drum fabric shade and warm LED.",
        "price": 1499,
        "originalPrice": 2499,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 430,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-002",
        "productCode": "CH-HOM002",
        "categoryCode": "HOM",
        "name": "Wall Clock",
        "subcategory": "Home Decor",
        "description": "12-inch silent non-ticking quartz movement minimalist wooden wall clock.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.7,
        "reviewsCount": 520,
        "badge": "Silent",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-003",
        "productCode": "CH-HOM003",
        "categoryCode": "HOM",
        "name": "Premium Bedsheet",
        "subcategory": "Bedding",
        "description": "400 thread-count 100% pure Egyptian cotton king size flat bedsheet with 2 pillow covers.",
        "price": 1899,
        "originalPrice": 2999,
        "discountPercent": 37,
        "rating": 4.9,
        "reviewsCount": 680,
        "badge": "400 TC",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-004",
        "productCode": "CH-HOM004",
        "categoryCode": "HOM",
        "name": "Cushion Set",
        "subcategory": "Home Decor",
        "description": "Set of 5 bohemian embroidered textured velvet square throw cushion covers (16x16 in).",
        "price": 999,
        "originalPrice": 1699,
        "discountPercent": 41,
        "rating": 4.6,
        "reviewsCount": 340,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-005",
        "productCode": "CH-HOM005",
        "categoryCode": "HOM",
        "name": "Floor Lamp",
        "subcategory": "Lighting",
        "description": "Architectural arched standing floor lamp with heavy marble base and foot-switch.",
        "price": 3499,
        "originalPrice": 5499,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 240,
        "badge": "Modern",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-006",
        "productCode": "CH-HOM006",
        "categoryCode": "HOM",
        "name": "Decorative Mirror",
        "subcategory": "Home Decor",
        "description": "24-inch round brushed gold brass metal framed vanity and living room accent mirror.",
        "price": 2199,
        "originalPrice": 3499,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 190,
        "badge": "Trending",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-007",
        "productCode": "CH-HOM007",
        "categoryCode": "HOM",
        "name": "Storage Organizer",
        "subcategory": "Storage",
        "description": "Foldable fabric closet storage organizer bins with clear viewing window (Pack of 3).",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.6,
        "reviewsCount": 470,
        "badge": "Tidy",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-008",
        "productCode": "CH-HOM008",
        "categoryCode": "HOM",
        "name": "Laundry Basket",
        "subcategory": "Storage",
        "description": "Natural woven bamboo collapsible dirty clothes laundry hamper with removable canvas liner.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.7,
        "reviewsCount": 380,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-009",
        "productCode": "CH-HOM009",
        "categoryCode": "HOM",
        "name": "Curtain Set",
        "subcategory": "Living Room",
        "description": "Thermal insulated blackout window drapes with antique brass grommets (Set of 2 panels).",
        "price": 1699,
        "originalPrice": 2699,
        "discountPercent": 37,
        "rating": 4.8,
        "reviewsCount": 310,
        "badge": "Blackout",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-010",
        "productCode": "CH-HOM010",
        "categoryCode": "HOM",
        "name": "Shoe Organizer",
        "subcategory": "Storage",
        "description": "Over-the-door 24 breathable mesh pocket hanging shoe and accessory rack organizer.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.5,
        "reviewsCount": 510,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-011",
        "productCode": "CH-HOM011",
        "categoryCode": "HOM",
        "name": "Aroma Diffuser",
        "subcategory": "Home Decor",
        "description": "Ultrasonic essential oil cool mist aromatherapy diffuser with 7 soothing ambient LED colors.",
        "price": 1599,
        "originalPrice": 2499,
        "discountPercent": 36,
        "rating": 4.9,
        "reviewsCount": 420,
        "badge": "Aroma",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-012",
        "productCode": "CH-HOM012",
        "categoryCode": "HOM",
        "name": "Wall Shelf",
        "subcategory": "Home Decor",
        "description": "Rustic floating wooden display wall shelves with heavy-duty concealed brackets (Set of 3).",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 330,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-013",
        "productCode": "CH-HOM013",
        "categoryCode": "HOM",
        "name": "Study Lamp",
        "subcategory": "Lighting",
        "description": "Dimmable flexible gooseneck LED desk study lamp with built-in smartphone wireless charger.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.6,
        "reviewsCount": 290,
        "badge": "Touch Control",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-014",
        "productCode": "CH-HOM014",
        "categoryCode": "HOM",
        "name": "Alarm Clock",
        "subcategory": "Home Decor",
        "description": "Wood-grain digital LED bedside alarm clock displaying time, temperature, and humidity.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.5,
        "reviewsCount": 260,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "hom-015",
        "productCode": "CH-HOM015",
        "categoryCode": "HOM",
        "name": "Storage Box",
        "subcategory": "Storage",
        "description": "Reinforced stackable plastic multipurpose storage container with latching handles (45L).",
        "price": 649,
        "originalPrice": 999,
        "discountPercent": 35,
        "rating": 4.6,
        "reviewsCount": 390,
        "badge": "Sturdy",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Home & Living', value: 'All' },
    { id: 'lighting', label: 'Lighting', value: 'Lighting' },
    { id: 'decor', label: 'Home Decor', value: 'Home Decor' },
    { id: 'bedding', label: 'Bedding', value: 'Bedding' },
    { id: 'living', label: 'Living Room', value: 'Living Room' },
    { id: 'storage', label: 'Storage', value: 'Storage' }
];

export default class HomeLivingPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_HOME_PRODUCTS;
    @track _activeFilter = 'All';
    @track _searchTerm = '';
    @track _sortBy = 'featured';

    @track showCartToast = false;
    @track toastMessage = '';
    _toastTimeout;

    @wire(getProducts)
    wiredProducts({ data, error }) {
        if (data && data.length > 0) {
            const catList = data
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Home')
                .map((p, index) => {
                    const fallback =
                        DUMMY_HOME_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_HOME_PRODUCTS[index % DUMMY_HOME_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-HOM${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_HOME_PRODUCTS[index % DUMMY_HOME_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'HOM',
                        subcategory: p.Subcategory__c || fallback.subcategory || 'General',
                        description: p.Description || fallback.description || 'Premium quality product.',
                        price: priceVal,
                        originalPrice: origVal,
                        discountPercent: fallback.discountPercent || Math.round(((origVal - priceVal) / origVal) * 100),
                        rating: fallback.rating || 4.7,
                        reviewsCount: fallback.reviewsCount || 120,
                        badge: fallback.badge || null,
                        badgeClass: fallback.badgeClass || '',
                        imageUrl: img
                    };
                });

            if (catList.length > 0) {
                this._allProducts = catList;
            }
        } else if (error) {
            console.warn('[Home] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_HOME_PRODUCTS;
        }
    }

    get subcategories() {
        return SUBCATEGORIES.map((cat) => {
            const count =
                cat.value === 'All'
                    ? this._allProducts.length
                    : this._allProducts.filter((p) => p.subcategory === cat.value).length;
            const active = this._activeFilter === cat.value;
            return {
                ...cat,
                count,
                active,
                activeClass: active ? 'pill-btn active' : 'pill-btn'
            };
        });
    }

    get filteredProducts() {
        let list = [...this._allProducts];

        if (this._activeFilter !== 'All') {
            list = list.filter((p) => p.subcategory === this._activeFilter);
        }

        if (this._searchTerm && this._searchTerm.trim() !== '') {
            const term = this._searchTerm.trim().toLowerCase();
            list = list.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(term)) ||
                    (p.description && p.description.toLowerCase().includes(term)) ||
                    (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
                    (p.productCode && p.productCode.toLowerCase().includes(term))
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
            case 'featured':
            default:
                break;
        }

        return list.map((p) => ({
            ...p,
            formattedPrice: p.price ? p.price.toLocaleString('en-IN') : '0',
            formattedOriginalPrice: p.originalPrice ? p.originalPrice.toLocaleString('en-IN') : null,
            ratingLabel: `${p.rating} out of 5 stars from ${p.reviewsCount} reviews`,
            detailsAriaLabel: `View details for ${p.name}`,
            addToCartAriaLabel: `Add ${p.name} to cart`
        }));
    }

    get hasProducts() {
        return this.filteredProducts.length > 0;
    }

    get displayedProductsCount() {
        return this.filteredProducts.length;
    }

    get searchTerm() {
        return this._searchTerm;
    }

    get hasSearchTerm() {
        return Boolean(this._searchTerm && this._searchTerm.length > 0);
    }

    get hasActiveFilters() {
        return this._activeFilter !== 'All' || Boolean(this._searchTerm);
    }

    handlePillClick(event) {
        const filter = event.currentTarget.dataset.filter;
        if (filter) {
            this._activeFilter = filter;
        }
    }

    handleSearchInput(event) {
        this._searchTerm = event.target.value;
    }

    handleClearSearch() {
        this._searchTerm = '';
        const input = this.template.querySelector('.search-input');
        if (input) input.value = '';
    }

    handleSortChange(event) {
        this._sortBy = event.target.value;
    }

    handleResetFilters() {
        this._activeFilter = 'All';
        this._searchTerm = '';
        this._sortBy = 'featured';
        const input = this.template.querySelector('.search-input');
        if (input) input.value = '';
        const sort = this.template.querySelector('.sort-select');
        if (sort) sort.value = 'featured';
    }

    handleProductClick(event) {
        const productId = event.currentTarget.dataset.id;
        const urlSlug = `/home/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'home', url: urlSlug },
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
                console.warn('[HomeLivingPage] Product navigation error:', err);
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
                console.warn('[HomeLivingPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Home item';

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
        event.target.src = 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
