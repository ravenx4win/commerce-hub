import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_ELECTRONICS_PRODUCTS = [
    {
        "id": "ele-001",
        "productCode": "CH-ELE001",
        "categoryCode": "ELE",
        "name": "ProVision 4K Smart TV",
        "subcategory": "Monitors & Displays",
        "description": "55-inch Ultra HD 4K OLED Smart TV with Dolby Vision and hands-free voice control.",
        "price": 42999,
        "originalPrice": 64999,
        "discountPercent": 34,
        "rating": 4.8,
        "reviewsCount": 390,
        "badge": "4K OLED",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-002",
        "productCode": "CH-ELE002",
        "categoryCode": "ELE",
        "name": "Smart LED TV",
        "subcategory": "Monitors & Displays",
        "description": "43-inch Full HD bezel-less Smart LED TV with built-in Chromecast and stereo speakers.",
        "price": 24999,
        "originalPrice": 34999,
        "discountPercent": 29,
        "rating": 4.6,
        "reviewsCount": 510,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-003",
        "productCode": "CH-ELE003",
        "categoryCode": "ELE",
        "name": "Mirrorless Camera",
        "subcategory": "Cameras",
        "description": "24.2 MP full-frame mirrorless digital camera with in-body stabilization and 4K60p video.",
        "price": 89999,
        "originalPrice": 119999,
        "discountPercent": 25,
        "rating": 4.9,
        "reviewsCount": 140,
        "badge": "Pro Camera",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-004",
        "productCode": "CH-ELE004",
        "categoryCode": "ELE",
        "name": "DSLR Camera",
        "subcategory": "Cameras",
        "description": "Professional optical viewfinder DSLR with 18-55mm IS lens kit and dual pixel AF.",
        "price": 49999,
        "originalPrice": 65999,
        "discountPercent": 24,
        "rating": 4.7,
        "reviewsCount": 230,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-005",
        "productCode": "CH-ELE005",
        "categoryCode": "ELE",
        "name": "Action Camera",
        "subcategory": "Cameras",
        "description": "Waterproof 5.3K60 rugged action camera with front and rear touchscreens and hyper-smooth stabilization.",
        "price": 32999,
        "originalPrice": 44999,
        "discountPercent": 27,
        "rating": 4.8,
        "reviewsCount": 410,
        "badge": "Rugged",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-006",
        "productCode": "CH-ELE006",
        "categoryCode": "ELE",
        "name": "Digital Camera",
        "subcategory": "Cameras",
        "description": "Compact pocket vlogging camera with flip screen, high-speed burst, and 4K HDR recording.",
        "price": 28999,
        "originalPrice": 38999,
        "discountPercent": 26,
        "rating": 4.6,
        "reviewsCount": 180,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-007",
        "productCode": "CH-ELE007",
        "categoryCode": "ELE",
        "name": "Home Projector",
        "subcategory": "Monitors & Displays",
        "description": "Native 1080p Android TV home theater projector with 3000 lumens brightness and auto-focus.",
        "price": 18999,
        "originalPrice": 28999,
        "discountPercent": 34,
        "rating": 4.7,
        "reviewsCount": 220,
        "badge": "Cinema Feel",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-008",
        "productCode": "CH-ELE008",
        "categoryCode": "ELE",
        "name": "Streaming Device",
        "subcategory": "Smart Home",
        "description": "4K HDR high-speed streaming media box with Dolby Vision, Wi-Fi 6, and voice remote.",
        "price": 3499,
        "originalPrice": 4999,
        "discountPercent": 30,
        "rating": 4.7,
        "reviewsCount": 780,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-009",
        "productCode": "CH-ELE009",
        "categoryCode": "ELE",
        "name": "Smart Display",
        "subcategory": "Smart Home",
        "description": "8-inch HD smart touch display with video calling camera, calendar, and smart home hub controls.",
        "price": 6999,
        "originalPrice": 9999,
        "discountPercent": 30,
        "rating": 4.8,
        "reviewsCount": 340,
        "badge": "Smart Hub",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-010",
        "productCode": "CH-ELE010",
        "categoryCode": "ELE",
        "name": "Gaming Console",
        "subcategory": "Peripherals",
        "description": "Next-gen gaming console with custom ultra-fast SSD, ray tracing, and 4K 120FPS output.",
        "price": 49999,
        "originalPrice": 59999,
        "discountPercent": 17,
        "rating": 4.9,
        "reviewsCount": 920,
        "badge": "Flagship",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-011",
        "productCode": "CH-ELE011",
        "categoryCode": "ELE",
        "name": "Portable Monitor",
        "subcategory": "Monitors & Displays",
        "description": "15.6-inch Full HD IPS ultra-slim lightweight USB-C portable second screen for laptops.",
        "price": 11999,
        "originalPrice": 17999,
        "discountPercent": 33,
        "rating": 4.6,
        "reviewsCount": 260,
        "badge": "Productivity",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-012",
        "productCode": "CH-ELE012",
        "categoryCode": "ELE",
        "name": "Digital Photo Frame",
        "subcategory": "Smart Home",
        "description": "10.1-inch Wi-Fi cloud-connected IPS touch photo frame with instant mobile photo sharing.",
        "price": 4999,
        "originalPrice": 7499,
        "discountPercent": 33,
        "rating": 4.5,
        "reviewsCount": 190,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-013",
        "productCode": "CH-ELE013",
        "categoryCode": "ELE",
        "name": "Media Streaming Stick",
        "subcategory": "Smart Home",
        "description": "Plug-and-play 4K streaming stick with remote buttons for Netflix, Prime Video, and YouTube.",
        "price": 2799,
        "originalPrice": 3999,
        "discountPercent": 30,
        "rating": 4.7,
        "reviewsCount": 840,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-014",
        "productCode": "CH-ELE014",
        "categoryCode": "ELE",
        "name": "Smart Home Hub",
        "subcategory": "Smart Home",
        "description": "Zigbee & Thread matter-compatible universal wireless smart home automation bridge.",
        "price": 3999,
        "originalPrice": 5999,
        "discountPercent": 33,
        "rating": 4.6,
        "reviewsCount": 210,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "ele-015",
        "productCode": "CH-ELE015",
        "categoryCode": "ELE",
        "name": "Wireless Security Camera",
        "subcategory": "Smart Home",
        "description": "2K outdoor weatherproof AI motion detection security camera with color night vision.",
        "price": 3499,
        "originalPrice": 5499,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 390,
        "badge": "Security",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Electronics', value: 'All' },
    { id: 'cameras', label: 'Cameras', value: 'Cameras' },
    { id: 'watches', label: 'Smart Watches', value: 'Smart Watches' },
    { id: 'monitors', label: 'Monitors & Displays', value: 'Monitors & Displays' },
    { id: 'peripherals', label: 'Peripherals', value: 'Peripherals' },
    { id: 'smarthome', label: 'Smart Home', value: 'Smart Home' }
];

export default class ElectronicsPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_ELECTRONICS_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Electronics')
                .map((p, index) => {
                    const fallback =
                        DUMMY_ELECTRONICS_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_ELECTRONICS_PRODUCTS[index % DUMMY_ELECTRONICS_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-ELE${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_ELECTRONICS_PRODUCTS[index % DUMMY_ELECTRONICS_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'ELE',
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
            console.warn('[Electronics] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_ELECTRONICS_PRODUCTS;
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
        const urlSlug = `/electronics/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'electronics', url: urlSlug },
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
                console.warn('[ElectronicsPage] Product navigation error:', err);
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
                console.warn('[ElectronicsPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Electronics item';

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
        event.target.src = 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
