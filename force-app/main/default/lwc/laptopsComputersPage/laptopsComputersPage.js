import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_LAPTOPS_PRODUCTS = [
    {
        "id": "lap-001",
        "productCode": "CH-LAP001",
        "categoryCode": "LAP",
        "name": "Carbon Productivity Laptop",
        "subcategory": "Laptops",
        "description": "14-inch FHD IPS thin and light laptop with Intel Core i5, 16GB RAM, and 512GB NVMe SSD.",
        "price": 52999,
        "originalPrice": 69999,
        "discountPercent": 24,
        "rating": 4.8,
        "reviewsCount": 420,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-002",
        "productCode": "CH-LAP002",
        "categoryCode": "LAP",
        "name": "Performance Laptop",
        "subcategory": "Laptops",
        "description": "16-inch 2.5K 120Hz creator laptop with Ryzen 7 processor, 32GB RAM, and 1TB SSD.",
        "price": 74999,
        "originalPrice": 94999,
        "discountPercent": 21,
        "rating": 4.9,
        "reviewsCount": 280,
        "badge": "High Power",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-003",
        "productCode": "CH-LAP003",
        "categoryCode": "LAP",
        "name": "Ultrabook",
        "subcategory": "Laptops",
        "description": "13.3-inch edge-to-edge OLED 1kg featherweight ultrabook with all-day 18-hour battery life.",
        "price": 68999,
        "originalPrice": 89999,
        "discountPercent": 23,
        "rating": 4.8,
        "reviewsCount": 310,
        "badge": "Featherlight",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-004",
        "productCode": "CH-LAP004",
        "categoryCode": "LAP",
        "name": "Gaming Laptop",
        "subcategory": "Gaming Rigs",
        "description": "15.6-inch 165Hz QHD gaming beast with RTX 4060 graphics, RGB keyboard, and liquid cooling.",
        "price": 89999,
        "originalPrice": 119999,
        "discountPercent": 25,
        "rating": 4.9,
        "reviewsCount": 520,
        "badge": "RTX 4060",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-005",
        "productCode": "CH-LAP005",
        "categoryCode": "LAP",
        "name": "Student Laptop",
        "subcategory": "Laptops",
        "description": "15.6-inch anti-glare everyday study laptop with fast Wi-Fi 6 and HD webcam with privacy shutter.",
        "price": 38999,
        "originalPrice": 49999,
        "discountPercent": 22,
        "rating": 4.6,
        "reviewsCount": 460,
        "badge": "Budget Pick",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-006",
        "productCode": "CH-LAP006",
        "categoryCode": "LAP",
        "name": "Business Laptop",
        "subcategory": "Laptops",
        "description": "Military-spec durable business notebook with fingerprint sensor, TPM 2.0, and cellular SIM.",
        "price": 64999,
        "originalPrice": 82999,
        "discountPercent": 22,
        "rating": 4.8,
        "reviewsCount": 190,
        "badge": "Secure",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-007",
        "productCode": "CH-LAP007",
        "categoryCode": "LAP",
        "name": "Wireless Keyboard",
        "subcategory": "Peripherals",
        "description": "Slim rechargeable multi-device wireless Bluetooth keyboard with scissor-switch keys.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 610,
        "badge": "Multi-Device",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-008",
        "productCode": "CH-LAP008",
        "categoryCode": "LAP",
        "name": "Gaming Keyboard",
        "subcategory": "Peripherals",
        "description": "Tenkeyless mechanical gaming keyboard with hot-swappable linear red switches and per-key RGB.",
        "price": 4999,
        "originalPrice": 7499,
        "discountPercent": 33,
        "rating": 4.8,
        "reviewsCount": 380,
        "badge": "Mechanical",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-009",
        "productCode": "CH-LAP009",
        "categoryCode": "LAP",
        "name": "Wireless Mouse",
        "subcategory": "Peripherals",
        "description": "Silent-click ultra-slim ambidextrous wireless optical mouse with 18-month battery.",
        "price": 999,
        "originalPrice": 1599,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 840,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-010",
        "productCode": "CH-LAP010",
        "categoryCode": "LAP",
        "name": "Ergonomic Mouse",
        "subcategory": "Peripherals",
        "description": "Natural handshake position vertical ergonomic wireless mouse preventing wrist strain.",
        "price": 2999,
        "originalPrice": 4499,
        "discountPercent": 33,
        "rating": 4.8,
        "reviewsCount": 290,
        "badge": "Ergonomic",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-011",
        "productCode": "CH-LAP011",
        "categoryCode": "LAP",
        "name": "27-inch Monitor",
        "subcategory": "Monitors",
        "description": "27-inch 4K UHD IPS color-calibrated monitor with USB-C 65W power delivery and height-adjust stand.",
        "price": 24999,
        "originalPrice": 34999,
        "discountPercent": 29,
        "rating": 4.9,
        "reviewsCount": 340,
        "badge": "4K IPS",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-012",
        "productCode": "CH-LAP012",
        "categoryCode": "LAP",
        "name": "24-inch Monitor",
        "subcategory": "Monitors",
        "description": "24-inch Full HD 100Hz frameless office monitor with low blue light and HDMI ports.",
        "price": 9499,
        "originalPrice": 13999,
        "discountPercent": 32,
        "rating": 4.7,
        "reviewsCount": 480,
        "badge": "FHD 100Hz",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-013",
        "productCode": "CH-LAP013",
        "categoryCode": "LAP",
        "name": "USB-C Dock",
        "subcategory": "Accessories",
        "description": "10-in-1 triple display USB-C docking station with Gigabit Ethernet, HDMI 4K, and 100W PD.",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 270,
        "badge": "10-in-1",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-014",
        "productCode": "CH-LAP014",
        "categoryCode": "LAP",
        "name": "External SSD",
        "subcategory": "Accessories",
        "description": "1TB ultra-fast 1050MB/s USB 3.2 Gen 2 shock-resistant external pocket solid state drive.",
        "price": 7499,
        "originalPrice": 11999,
        "discountPercent": 38,
        "rating": 4.9,
        "reviewsCount": 540,
        "badge": "1050 MB/s",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "lap-015",
        "productCode": "CH-LAP015",
        "categoryCode": "LAP",
        "name": "Cooling Pad",
        "subcategory": "Accessories",
        "description": "Laptop cooling stand with 5 high-speed quiet fans, dual USB ports, and adjustable angle legs.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.5,
        "reviewsCount": 390,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Computers', value: 'All' },
    { id: 'laptops', label: 'Laptops', value: 'Laptops' },
    { id: 'gaming', label: 'Gaming Rigs', value: 'Gaming Rigs' },
    { id: 'monitors', label: 'Monitors', value: 'Monitors' },
    { id: 'peripherals', label: 'Peripherals', value: 'Peripherals' },
    { id: 'accessories', label: 'Accessories', value: 'Accessories' }
];

export default class LaptopsComputersPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_LAPTOPS_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Laptops & Computers')
                .map((p, index) => {
                    const fallback =
                        DUMMY_LAPTOPS_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_LAPTOPS_PRODUCTS[index % DUMMY_LAPTOPS_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-LAP${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_LAPTOPS_PRODUCTS[index % DUMMY_LAPTOPS_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'LAP',
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
            console.warn('[Laptops & Computers] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_LAPTOPS_PRODUCTS;
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
        const urlSlug = `/laptops-computers/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'laptops-computers', url: urlSlug },
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
                console.warn('[LaptopsComputersPage] Product navigation error:', err);
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
                console.warn('[LaptopsComputersPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Computing item';

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
        event.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
