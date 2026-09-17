import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_SPORTS_PRODUCTS = [
    {
        "id": "spt-001",
        "productCode": "CH-SPT001",
        "categoryCode": "SPT",
        "name": "Yoga Mat",
        "subcategory": "Yoga & Pilates",
        "description": "6mm non-slip eco-friendly high-density TPE cushioned exercise yoga mat with carry strap.",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.8,
        "reviewsCount": 890,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-002",
        "productCode": "CH-SPT002",
        "categoryCode": "SPT",
        "name": "Dumbbell Set",
        "subcategory": "Strength Training",
        "description": "Hexagonal anti-roll rubber coated dumbbell pair with knurled ergonomic steel handles.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.9,
        "reviewsCount": 650,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-003",
        "productCode": "CH-SPT003",
        "categoryCode": "SPT",
        "name": "Resistance Band",
        "subcategory": "Fitness Gear",
        "description": "Set of 5 natural latex loop resistance bands with varying tension levels for full body workouts.",
        "price": 599,
        "originalPrice": 999,
        "discountPercent": 40,
        "rating": 4.7,
        "reviewsCount": 780,
        "badge": "Set of 5",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-004",
        "productCode": "CH-SPT004",
        "categoryCode": "SPT",
        "name": "Kettlebell",
        "subcategory": "Strength Training",
        "description": "Cast iron solid kettlebell with wide textured grip handle for crossfit swings and snatches.",
        "price": 1699,
        "originalPrice": 2499,
        "discountPercent": 32,
        "rating": 4.8,
        "reviewsCount": 310,
        "badge": "Cast Iron",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-005",
        "productCode": "CH-SPT005",
        "categoryCode": "SPT",
        "name": "Cricket Bat",
        "subcategory": "Cricket",
        "description": "Handcrafted grade 1 English willow cricket bat with thick power edges and sweet spot balance.",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 420,
        "badge": "Grade 1 Willow",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1589801258579-18e091f4ca26?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-006",
        "productCode": "CH-SPT006",
        "categoryCode": "SPT",
        "name": "Cricket Ball",
        "subcategory": "Cricket",
        "description": "Four-piece alum tanned genuine leather match cricket ball with hand-stitched seam (Pack of 2).",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.6,
        "reviewsCount": 380,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-007",
        "productCode": "CH-SPT007",
        "categoryCode": "SPT",
        "name": "Football",
        "subcategory": "Team Sports",
        "description": "FIFA quality pro thermally bonded seamless match football with high-rebound bladder.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 560,
        "badge": "FIFA Grade",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-008",
        "productCode": "CH-SPT008",
        "categoryCode": "SPT",
        "name": "Basketball",
        "subcategory": "Team Sports",
        "description": "Deep channel composite leather indoor/outdoor official size 7 grip basketball.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.7,
        "reviewsCount": 440,
        "badge": "Official Size",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-009",
        "productCode": "CH-SPT009",
        "categoryCode": "SPT",
        "name": "Skipping Rope",
        "subcategory": "Fitness Gear",
        "description": "High-speed 360-degree ball bearing steel cable jump rope with aluminum non-slip handles.",
        "price": 499,
        "originalPrice": 799,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 890,
        "badge": "High Speed",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-010",
        "productCode": "CH-SPT010",
        "categoryCode": "SPT",
        "name": "Fitness Gloves",
        "subcategory": "Strength Training",
        "description": "Padded microfiber weightlifting gym gloves with integrated wrist wrap support.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.6,
        "reviewsCount": 510,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-011",
        "productCode": "CH-SPT011",
        "categoryCode": "SPT",
        "name": "Foam Roller",
        "subcategory": "Fitness Gear",
        "description": "High density trigger point grid foam roller for deep muscle recovery and back pain relief.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 390,
        "badge": "Recovery",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-012",
        "productCode": "CH-SPT012",
        "categoryCode": "SPT",
        "name": "Gym Bag",
        "subcategory": "Fitness Gear",
        "description": "Waterproof duffel gym bag with ventilated separate shoe compartment and wet pocket.",
        "price": 1399,
        "originalPrice": 2199,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 460,
        "badge": "Shoe Pocket",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-013",
        "productCode": "CH-SPT013",
        "categoryCode": "SPT",
        "name": "Running Belt",
        "subcategory": "Fitness Gear",
        "description": "Bounce-free slim elastic runner waist pack pouch holding phones up to 6.8 inches.",
        "price": 499,
        "originalPrice": 799,
        "discountPercent": 38,
        "rating": 4.5,
        "reviewsCount": 330,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-014",
        "productCode": "CH-SPT014",
        "categoryCode": "SPT",
        "name": "Exercise Bench",
        "subcategory": "Strength Training",
        "description": "Heavy-duty adjustable flat/incline/decline multi-position foldable home workout bench.",
        "price": 6499,
        "originalPrice": 9999,
        "discountPercent": 35,
        "rating": 4.9,
        "reviewsCount": 210,
        "badge": "Heavy Duty",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "spt-015",
        "productCode": "CH-SPT015",
        "categoryCode": "SPT",
        "name": "Water Bottle",
        "subcategory": "Fitness Gear",
        "description": "BPA-free 2.2L motivational half-gallon fitness water jug with time markers and straw.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 720,
        "badge": "Motivational",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Sports', value: 'All' },
    { id: 'strength', label: 'Strength Training', value: 'Strength Training' },
    { id: 'yoga', label: 'Yoga & Pilates', value: 'Yoga & Pilates' },
    { id: 'cricket', label: 'Cricket', value: 'Cricket' },
    { id: 'team', label: 'Team Sports', value: 'Team Sports' },
    { id: 'gear', label: 'Fitness Gear', value: 'Fitness Gear' }
];

export default class SportsFitnessPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_SPORTS_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Sports & Fitness')
                .map((p, index) => {
                    const fallback =
                        DUMMY_SPORTS_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_SPORTS_PRODUCTS[index % DUMMY_SPORTS_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-SPT${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_SPORTS_PRODUCTS[index % DUMMY_SPORTS_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'SPT',
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
            console.warn('[Sports & Fitness] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_SPORTS_PRODUCTS;
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
        const urlSlug = `/sports-fitness/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'sports-fitness', url: urlSlug },
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
                console.warn('[SportsFitnessPage] Product navigation error:', err);
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
                console.warn('[SportsFitnessPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Sports equipment';

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
        event.target.src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
