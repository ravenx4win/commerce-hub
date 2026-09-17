import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_MOBILES_PRODUCTS = [
    {
        "id": "mob-001",
        "productCode": "CH-MOB001",
        "categoryCode": "MOB",
        "name": "OnePlus flagship",
        "subcategory": "Flagships",
        "description": "Snapdragon 8 Gen 3 flagship with Hasselblad camera, 100W SuperVOOC, and 120Hz 2K AMOLED.",
        "price": 64999,
        "originalPrice": 69999,
        "discountPercent": 7,
        "rating": 4.8,
        "reviewsCount": 880,
        "badge": "Flagship",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-002",
        "productCode": "CH-MOB002",
        "categoryCode": "MOB",
        "name": "Google Pixel",
        "subcategory": "Camera Phones",
        "description": "Google Tensor G3 chip, best-in-class AI computational photography, and 7 years of OS updates.",
        "price": 75999,
        "originalPrice": 79999,
        "discountPercent": 5,
        "rating": 4.9,
        "reviewsCount": 670,
        "badge": "Best Camera",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-003",
        "productCode": "CH-MOB003",
        "categoryCode": "MOB",
        "name": "Nothing Phone",
        "subcategory": "Mid-Range",
        "description": "Iconic transparent back with customizable Glyph interface LED lights and clean Nothing OS.",
        "price": 36999,
        "originalPrice": 44999,
        "discountPercent": 18,
        "rating": 4.7,
        "reviewsCount": 420,
        "badge": "Glyph LED",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-004",
        "productCode": "CH-MOB004",
        "categoryCode": "MOB",
        "name": "Motorola Edge",
        "subcategory": "Mid-Range",
        "description": "Curved 144Hz pOLED display, 50MP OIS camera, IP68 water resistance, and 68W TurboPower.",
        "price": 29999,
        "originalPrice": 35999,
        "discountPercent": 17,
        "rating": 4.6,
        "reviewsCount": 380,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-005",
        "productCode": "CH-MOB005",
        "categoryCode": "MOB",
        "name": "Samsung Galaxy A",
        "subcategory": "Mid-Range",
        "description": "Vibrant 120Hz Super AMOLED screen, 50MP triple camera, 5000mAh battery, and Knox Vault.",
        "price": 31999,
        "originalPrice": 38999,
        "discountPercent": 18,
        "rating": 4.7,
        "reviewsCount": 750,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-006",
        "productCode": "CH-MOB006",
        "categoryCode": "MOB",
        "name": "Samsung Galaxy M",
        "subcategory": "Budget 5G",
        "description": "Monster 6000mAh long-lasting battery with FHD+ sAMOLED+ display and expandable storage.",
        "price": 18999,
        "originalPrice": 24999,
        "discountPercent": 24,
        "rating": 4.5,
        "reviewsCount": 890,
        "badge": "Monster Battery",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-007",
        "productCode": "CH-MOB007",
        "categoryCode": "MOB",
        "name": "OnePlus Nord",
        "subcategory": "Mid-Range",
        "description": "Smooth 120Hz Fluid AMOLED, Sony IMX main sensor, dual stereo speakers, and 80W flash charging.",
        "price": 28999,
        "originalPrice": 32999,
        "discountPercent": 12,
        "rating": 4.7,
        "reviewsCount": 620,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-008",
        "productCode": "CH-MOB008",
        "categoryCode": "MOB",
        "name": "Vivo V series",
        "subcategory": "Camera Phones",
        "description": "Studio-grade Aura Light portrait system with ultra-slim featherweight curved body.",
        "price": 33999,
        "originalPrice": 39999,
        "discountPercent": 15,
        "rating": 4.6,
        "reviewsCount": 410,
        "badge": "Portrait Pro",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-009",
        "productCode": "CH-MOB009",
        "categoryCode": "MOB",
        "name": "Oppo Reno",
        "subcategory": "Camera Phones",
        "description": "Telephoto portrait lens with AI eraser, glossy glass-gradient back, and 67W flash charging.",
        "price": 32999,
        "originalPrice": 38999,
        "discountPercent": 15,
        "rating": 4.6,
        "reviewsCount": 340,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-010",
        "productCode": "CH-MOB010",
        "categoryCode": "MOB",
        "name": "Realme Pro",
        "subcategory": "Budget 5G",
        "description": "Curved 120Hz display with 200MP SuperZoom OIS camera and vegan leather luxury back.",
        "price": 23999,
        "originalPrice": 29999,
        "discountPercent": 20,
        "rating": 4.7,
        "reviewsCount": 580,
        "badge": "200 MP",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-011",
        "productCode": "CH-MOB011",
        "categoryCode": "MOB",
        "name": "Redmi Note",
        "subcategory": "Budget 5G",
        "description": "Classic value champion with 1.5K AMOLED display, 120W HyperCharge, and IP68 seal.",
        "price": 21999,
        "originalPrice": 27999,
        "discountPercent": 21,
        "rating": 4.6,
        "reviewsCount": 950,
        "badge": "Value King",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-012",
        "productCode": "CH-MOB012",
        "categoryCode": "MOB",
        "name": "iQOO Neo",
        "subcategory": "Mid-Range",
        "description": "Dedicated gaming display chip with Snapdragon flagship silicon, vapor chamber cooling, and 120W power.",
        "price": 35999,
        "originalPrice": 41999,
        "discountPercent": 14,
        "rating": 4.8,
        "reviewsCount": 460,
        "badge": "Gaming Power",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1530319067432-f2a729c03db5?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-013",
        "productCode": "CH-MOB013",
        "categoryCode": "MOB",
        "name": "Asus ROG",
        "subcategory": "Flagships",
        "description": "Ultimate hardcore esports phone with AirTrigger ultrasonic buttons, 165Hz AMOLED, and 6000mAh battery.",
        "price": 69999,
        "originalPrice": 79999,
        "discountPercent": 13,
        "rating": 4.9,
        "reviewsCount": 220,
        "badge": "Esports Ready",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-014",
        "productCode": "CH-MOB014",
        "categoryCode": "MOB",
        "name": "Rugged Phone",
        "subcategory": "Budget 5G",
        "description": "Drop-proof IP69K military outdoor smartphone with night vision camera and massive 10,000mAh capacity.",
        "price": 26999,
        "originalPrice": 34999,
        "discountPercent": 23,
        "rating": 4.7,
        "reviewsCount": 160,
        "badge": "Rugged IP69K",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "mob-015",
        "productCode": "CH-MOB015",
        "categoryCode": "MOB",
        "name": "Foldable Phone",
        "subcategory": "Foldables",
        "description": "Groundbreaking zero-gap fold design with 7.8-inch inner tablet screen and aerospace titanium hinge.",
        "price": 119999,
        "originalPrice": 139999,
        "discountPercent": 14,
        "rating": 4.9,
        "reviewsCount": 310,
        "badge": "Next-Gen Fold",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Mobiles', value: 'All' },
    { id: 'flagships', label: 'Flagships', value: 'Flagships' },
    { id: 'foldables', label: 'Foldables', value: 'Foldables' },
    { id: 'midrange', label: 'Mid-Range', value: 'Mid-Range' },
    { id: 'camera', label: 'Camera Phones', value: 'Camera Phones' },
    { id: 'budget', label: 'Budget 5G', value: 'Budget 5G' }
];

export default class MobilesPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_MOBILES_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Mobiles')
                .map((p, index) => {
                    const fallback =
                        DUMMY_MOBILES_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_MOBILES_PRODUCTS[index % DUMMY_MOBILES_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-MOB${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_MOBILES_PRODUCTS[index % DUMMY_MOBILES_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'MOB',
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
            console.warn('[Mobiles] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_MOBILES_PRODUCTS;
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
        const urlSlug = `/mobiles/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'mobiles', url: urlSlug },
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
                console.warn('[MobilesPage] Product navigation error:', err);
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
                console.warn('[MobilesPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Smartphone';

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
        event.target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
