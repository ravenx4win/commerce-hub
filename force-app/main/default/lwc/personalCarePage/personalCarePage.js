import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_CARE_PRODUCTS = [
    {
        "id": "per-001",
        "productCode": "CH-PER001",
        "categoryCode": "PER",
        "name": "Electric Trimmer",
        "subcategory": "Grooming",
        "description": "IPX7 cordless beard trimmer with self-sharpening titanium blades and 40 length settings.",
        "price": 1899,
        "originalPrice": 2999,
        "discountPercent": 37,
        "rating": 4.8,
        "reviewsCount": 580,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-002",
        "productCode": "CH-PER002",
        "categoryCode": "PER",
        "name": "Electric Toothbrush",
        "subcategory": "Oral Care",
        "description": "Sonic 40,000 VPM rechargeable toothbrush with 5 cleaning modes and 2-minute timer.",
        "price": 1999,
        "originalPrice": 3499,
        "discountPercent": 43,
        "rating": 4.9,
        "reviewsCount": 710,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-003",
        "productCode": "CH-PER003",
        "categoryCode": "PER",
        "name": "Grooming Kit",
        "subcategory": "Grooming",
        "description": "Multi-functional all-in-one grooming kit with nose, body, and beard detail attachments.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 380,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-004",
        "productCode": "CH-PER004",
        "categoryCode": "PER",
        "name": "Hair Dryer",
        "subcategory": "Hair Styling",
        "description": "Ionic 2200W salon-grade professional blow dryer with diffuser nozzle and cool shot.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 420,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-005",
        "productCode": "CH-PER005",
        "categoryCode": "PER",
        "name": "Hair Straightener",
        "subcategory": "Hair Styling",
        "description": "Keratin ceramic infused floating plates hair straightener with rapid 15s heat-up.",
        "price": 1799,
        "originalPrice": 2999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 360,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-006",
        "productCode": "CH-PER006",
        "categoryCode": "PER",
        "name": "Beard Trimmer",
        "subcategory": "Grooming",
        "description": "Ergonomic quick-charge stubble trimmer with washable head and micro-precision guide.",
        "price": 1499,
        "originalPrice": 2499,
        "discountPercent": 40,
        "rating": 4.5,
        "reviewsCount": 490,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-007",
        "productCode": "CH-PER007",
        "categoryCode": "PER",
        "name": "Body Groomer",
        "subcategory": "Grooming",
        "description": "Skin-friendly rounded contour blades for safe, gentle below-the-neck body trimming.",
        "price": 1999,
        "originalPrice": 3199,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 280,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-008",
        "productCode": "CH-PER008",
        "categoryCode": "PER",
        "name": "Facial Steamer",
        "subcategory": "Wellness",
        "description": "Nano-ionic warm mist facial steamer for deep pore cleansing and skin hydration.",
        "price": 1599,
        "originalPrice": 2599,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 310,
        "badge": "New",
        "badgeClass": "badge-new",
        "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-009",
        "productCode": "CH-PER009",
        "categoryCode": "PER",
        "name": "Massage Gun",
        "subcategory": "Wellness",
        "description": "Deep tissue percussion massage gun with 6 interchangeable heads and brushless motor.",
        "price": 3499,
        "originalPrice": 5999,
        "discountPercent": 42,
        "rating": 4.9,
        "reviewsCount": 480,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-010",
        "productCode": "CH-PER010",
        "categoryCode": "PER",
        "name": "Foot Massager",
        "subcategory": "Wellness",
        "description": "Deep kneading heated shiatsu foot massager with selectable vibration intensity.",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 160,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-011",
        "productCode": "CH-PER011",
        "categoryCode": "PER",
        "name": "Electric Shaver",
        "subcategory": "Grooming",
        "description": "Wet and dry 4D floating rotary shaver with pop-up sideburn precision trimmer.",
        "price": 2799,
        "originalPrice": 4299,
        "discountPercent": 35,
        "rating": 4.6,
        "reviewsCount": 340,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-012",
        "productCode": "CH-PER012",
        "categoryCode": "PER",
        "name": "Nose Trimmer",
        "subcategory": "Grooming",
        "description": "Rotary dual-edge hypoallergenic blades for painless ear and nose hair trimming.",
        "price": 599,
        "originalPrice": 999,
        "discountPercent": 40,
        "rating": 4.4,
        "reviewsCount": 520,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-013",
        "productCode": "CH-PER013",
        "categoryCode": "PER",
        "name": "Hair Clipper",
        "subcategory": "Hair Styling",
        "description": "Professional corded/cordless hair clipper with stainless blades and guide combs.",
        "price": 2199,
        "originalPrice": 3499,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 290,
        "badge": "Popular",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-014",
        "productCode": "CH-PER014",
        "categoryCode": "PER",
        "name": "Travel Grooming Kit",
        "subcategory": "Grooming",
        "description": "Compact TSA-friendly zipper grooming case with manicure and styling essentials.",
        "price": 999,
        "originalPrice": 1699,
        "discountPercent": 41,
        "rating": 4.5,
        "reviewsCount": 210,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1583001809873-a128495da465?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "per-015",
        "productCode": "CH-PER015",
        "categoryCode": "PER",
        "name": "Care Organizer",
        "subcategory": "Wellness",
        "description": "Water-resistant acrylic multi-compartment countertop cosmetic and care organizer.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 180,
        "badge": "New",
        "badgeClass": "badge-new",
        "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Personal Care', value: 'All' },
    { id: 'grooming', label: 'Grooming', value: 'Grooming' },
    { id: 'oral', label: 'Oral Care', value: 'Oral Care' },
    { id: 'styling', label: 'Hair Styling', value: 'Hair Styling' },
    { id: 'wellness', label: 'Wellness', value: 'Wellness' },
    { id: 'skincare', label: 'Skincare Tools', value: 'Skincare Tools' }
];

export default class PersonalCarePage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_CARE_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Personal Care')
                .map((p, index) => {
                    const fallback =
                        DUMMY_CARE_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_CARE_PRODUCTS[index % DUMMY_CARE_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-PER${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_CARE_PRODUCTS[index % DUMMY_CARE_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'PER',
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
            console.warn('[Personal Care] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_CARE_PRODUCTS;
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
        const urlSlug = `/personal-care/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'personal-care', url: urlSlug },
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
                console.warn('[PersonalCarePage] Product navigation error:', err);
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
                console.warn('[PersonalCarePage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Care product';

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
        event.target.src = 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
