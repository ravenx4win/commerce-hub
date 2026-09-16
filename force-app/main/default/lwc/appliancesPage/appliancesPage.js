import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';

const DEFAULT_APPLIANCES = [
    {
        id: 'APP001',
        name: 'Air Fryer',
        productCode: 'CH-APP001',
        subCategory: 'Kitchen',
        description: 'Rapid air circulation technology with touch controls for healthy, oil-free frying.',
        price: 4499,
        originalPrice: 6999,
        discount: '35% OFF',
        rating: '4.7',
        ratingCount: 420,
        badge: 'Best Seller',
        badgeClass: 'badge-tag bestseller',
        isKitchen: true
    },
    {
        id: 'APP002',
        name: 'Mixer Grinder',
        productCode: 'CH-APP002',
        subCategory: 'Kitchen',
        description: '750W heavy duty copper motor with 3 stainless steel jars for tough grinding.',
        price: 2999,
        originalPrice: 4499,
        discount: '33% OFF',
        rating: '4.5',
        ratingCount: 310,
        badge: 'Top Rated',
        badgeClass: 'badge-tag toprated',
        isKitchen: true
    },
    {
        id: 'APP003',
        name: 'Microwave Oven',
        productCode: 'CH-APP003',
        subCategory: 'Kitchen',
        description: '28L convection microwave with auto-cook menus, defrost and baking functions.',
        price: 7990,
        originalPrice: 11990,
        discount: '33% OFF',
        rating: '4.6',
        ratingCount: 185,
        badge: 'Festive Deal',
        badgeClass: 'badge-tag festivedeal',
        isKitchen: true
    },
    {
        id: 'APP004',
        name: 'Electric Kettle',
        productCode: 'CH-APP004',
        subCategory: 'Kitchen',
        description: '1.8L fast-boil stainless steel kettle with auto shut-off and dry-boil safety.',
        price: 1199,
        originalPrice: 1999,
        discount: '40% OFF',
        rating: '4.4',
        ratingCount: 650,
        badge: 'Popular',
        badgeClass: 'badge-tag popular',
        isKitchen: true
    },
    {
        id: 'APP005',
        name: 'Induction Cooktop',
        productCode: 'CH-APP005',
        subCategory: 'Kitchen',
        description: '2000W electromagnetic induction stove with preset Indian cooking menus.',
        price: 2499,
        originalPrice: 3999,
        discount: '37% OFF',
        rating: '4.3',
        ratingCount: 240,
        isKitchen: true
    },
    {
        id: 'APP006',
        name: 'Toaster',
        productCode: 'CH-APP006',
        subCategory: 'Kitchen',
        description: '2-slice pop-up toaster with 7 variable browning controls and removable crumb tray.',
        price: 1499,
        originalPrice: 2299,
        discount: '34% OFF',
        rating: '4.2',
        ratingCount: 190,
        isKitchen: true
    },
    {
        id: 'APP007',
        name: 'Hand Blender',
        productCode: 'CH-APP007',
        subCategory: 'Kitchen',
        description: 'Ergonomic 400W immersion hand blender with dual-speed control and stainless steel blades.',
        price: 1299,
        originalPrice: 1899,
        discount: '31% OFF',
        rating: '4.5',
        ratingCount: 275,
        isKitchen: true
    },
    {
        id: 'APP008',
        name: 'Rice Cooker',
        productCode: 'CH-APP008',
        subCategory: 'Kitchen',
        description: 'Automatic electric rice cooker with keep-warm function and anodized aluminum bowl.',
        price: 2199,
        originalPrice: 3299,
        discount: '33% OFF',
        rating: '4.4',
        ratingCount: 160,
        isKitchen: true
    },
    {
        id: 'APP009',
        name: 'Coffee Maker',
        productCode: 'CH-APP009',
        subCategory: 'Kitchen',
        description: 'Drip espresso & filter coffee brewer with reusable mesh filter and anti-drip valve.',
        price: 3899,
        originalPrice: 5999,
        discount: '35% OFF',
        rating: '4.8',
        ratingCount: 310,
        badge: 'Top Rated',
        badgeClass: 'badge-tag toprated',
        isKitchen: true
    },
    {
        id: 'APP010',
        name: 'Sandwich Maker',
        productCode: 'CH-APP010',
        subCategory: 'Kitchen',
        description: 'Non-stick grill plates with thermostatic temperature control for crispy grilled sandwiches.',
        price: 1399,
        originalPrice: 2199,
        discount: '36% OFF',
        rating: '4.3',
        ratingCount: 220,
        isKitchen: true
    },
    {
        id: 'APP011',
        name: 'Electric Iron',
        productCode: 'CH-APP011',
        subCategory: 'Home Care',
        description: 'Lightweight dry iron with American non-stick coating and 360-degree swivel cord.',
        price: 899,
        originalPrice: 1499,
        discount: '40% OFF',
        rating: '4.3',
        ratingCount: 520,
        isHomeCare: true
    },
    {
        id: 'APP012',
        name: 'Room Heater',
        productCode: 'CH-APP012',
        subCategory: 'Climate',
        description: 'PTC ceramic oscillating room heater with dual wattage heat settings and overheat trip.',
        price: 1899,
        originalPrice: 2999,
        discount: '36% OFF',
        rating: '4.4',
        ratingCount: 195,
        isClimate: true
    },
    {
        id: 'APP013',
        name: 'Air Purifier',
        productCode: 'CH-APP013',
        subCategory: 'Climate',
        description: 'True HEPA H13 filtration removes 99.97% of PM2.5 pollutants, allergens, and odors.',
        price: 8499,
        originalPrice: 12999,
        discount: '34% OFF',
        rating: '4.7',
        ratingCount: 340,
        badge: 'Festive Deal',
        badgeClass: 'badge-tag festivedeal',
        isClimate: true
    },
    {
        id: 'APP014',
        name: 'Robot Vacuum',
        productCode: 'CH-APP014',
        subCategory: 'Cleaning',
        description: 'Smart LiDAR navigation 2-in-1 sweeping and mopping robot with smartphone app integration.',
        price: 18999,
        originalPrice: 26999,
        discount: '29% OFF',
        rating: '4.9',
        ratingCount: 410,
        badge: 'Best Seller',
        badgeClass: 'badge-tag bestseller',
        isCleaning: true
    },
    {
        id: 'APP015',
        name: 'Portable Fan',
        productCode: 'CH-APP015',
        subCategory: 'Climate',
        description: 'Rechargeable ultra-quiet high velocity table fan with 4 speed modes and USB-C charging.',
        price: 999,
        originalPrice: 1599,
        discount: '37% OFF',
        rating: '4.2',
        ratingCount: 290,
        isClimate: true
    }
];

export default class AppliancesPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DEFAULT_APPLIANCES;
    @track _activeFilter = 'All';
    @track _searchTerm = '';
    @track _sortBy = 'featured';
    @track _toastMessage = '';
    @track _showToast = false;
    _toastTimeout;

    @track filterPills = [
        { label: 'All Appliances', value: 'All', active: true, activeClass: 'pill-btn active' },
        { label: 'Kitchen', value: 'Kitchen', active: false, activeClass: 'pill-btn' },
        { label: 'Climate & Cooling', value: 'Climate', active: false, activeClass: 'pill-btn' },
        { label: 'Cleaning & Robot', value: 'Cleaning', active: false, activeClass: 'pill-btn' },
        { label: 'Home Care', value: 'Home Care', active: false, activeClass: 'pill-btn' }
    ];

    get toastMessage() {
        return this._toastMessage;
    }

    @wire(getProducts)
    wiredProducts({ data, error }) {
        if (data && data.length > 0) {
            // Filter products belonging to Appliances category
            const applianceList = data.filter(
                (p) =>
                    p &&
                    p.Commerce_Hub_Category__r &&
                    p.Commerce_Hub_Category__r.Name === 'Appliances'
            );

            if (applianceList.length > 0) {
                this._allProducts = applianceList.map((p) => {
                    const fallback =
                        DEFAULT_APPLIANCES.find(
                            (def) => def.name.toLowerCase() === p.Name.toLowerCase()
                        ) || {};
                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: p.ProductCode || fallback.productCode || 'CH-APP',
                        description: p.Description || fallback.description || 'High quality appliance.',
                        subCategory: fallback.subCategory || 'Kitchen',
                        price: fallback.price || 1999,
                        originalPrice: fallback.originalPrice || 2999,
                        discount: fallback.discount || '30% OFF',
                        rating: fallback.rating || '4.5',
                        ratingCount: fallback.ratingCount || 100,
                        badge: fallback.badge || null,
                        badgeClass: fallback.badgeClass || null
                    };
                });
            }
        } else if (error) {
            // Graceful fallback to default appliances catalog
            this._allProducts = DEFAULT_APPLIANCES;
        }
    }

    // ── Getters for Filtered and Sorted Products ───────────────────────

    get displayedProducts() {
        let list = [...this._allProducts];

        // 1. Filter by subcategory pill
        if (this._activeFilter !== 'All') {
            list = list.filter((item) => item.subCategory === this._activeFilter);
        }

        // 2. Filter by search query
        const term = (this._searchTerm || '').trim().toLowerCase();
        if (term) {
            list = list.filter(
                (item) =>
                    (item.name && item.name.toLowerCase().includes(term)) ||
                    (item.description && item.description.toLowerCase().includes(term)) ||
                    (item.productCode && item.productCode.toLowerCase().includes(term))
            );
        }

        // 3. Sorting
        if (this._sortBy === 'price-low') {
            list.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (this._sortBy === 'price-high') {
            list.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (this._sortBy === 'rating') {
            list.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
        } else if (this._sortBy === 'name-asc') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        return list.map((item) => ({
            ...item,
            formattedPrice: `₹${Number(item.price).toLocaleString('en-IN')}`,
            formattedOriginalPrice: `₹${Number(item.originalPrice).toLocaleString('en-IN')}`
        }));
    }

    get totalCount() {
        return this.displayedProducts.length;
    }

    get hasProducts() {
        return this.displayedProducts.length > 0;
    }

    // ── Interaction Handlers ──────────────────────────────────────────

    handleFilterClick(event) {
        const value = event.currentTarget.dataset.filter;
        this._activeFilter = value;
        this.filterPills = this.filterPills.map((pill) => ({
            ...pill,
            active: pill.value === value,
            activeClass: pill.value === value ? 'pill-btn active' : 'pill-btn'
        }));
    }

    handleSearchInput(event) {
        this._searchTerm = event.target.value;
    }

    handleSortChange(event) {
        this._sortBy = event.target.value;
    }

    handleResetFilters() {
        this._searchTerm = '';
        this._activeFilter = 'All';
        this._sortBy = 'featured';
        this.filterPills = this.filterPills.map((pill) => ({
            ...pill,
            active: pill.value === 'All',
            activeClass: pill.value === 'All' ? 'pill-btn active' : 'pill-btn'
        }));
        const input = this.template.querySelector('.search-input');
        if (input) input.value = '';
        const sort = this.template.querySelector('.sort-select');
        if (sort) sort.value = 'featured';
    }

    handleProductClick(event) {
        const productId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'Product_Detail' },
            state: { productId }
        });
    }

    handleHomeClick(event) {
        if (event && event.preventDefault) event.preventDefault();
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'Home' }
        });
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId);
        const name = prod ? prod.name : 'Item';

        // Dispatch cart sync event across components
        document.dispatchEvent(
            new CustomEvent('commercehubcartupdate', {
                detail: { count: 1, productId },
                bubbles: true,
                composed: true
            })
        );

        this._showFeedback(`${name} added to cart!`);
    }

    _showFeedback(msg) {
        this._toastMessage = msg;
        this._showToast = true;
        if (this._toastTimeout) clearTimeout(this._toastTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._toastTimeout = setTimeout(() => {
            this._showToast = false;
        }, 3000);
    }
}
