import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_BEAUTY_PRODUCTS = [
    {
        "id": "bea-001",
        "productCode": "CH-BEA001",
        "categoryCode": "BEA",
        "name": "GlowRadiance Face Serum",
        "subcategory": "Skincare",
        "description": "Hyaluronic acid and niacinamide hydrating serum for luminous skin texture.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 650,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-002",
        "productCode": "CH-BEA002",
        "categoryCode": "BEA",
        "name": "Vitamin C Serum",
        "subcategory": "Skincare",
        "description": "20% active Vitamin C glowing serum with ferulic acid to fade dark spots.",
        "price": 999,
        "originalPrice": 1799,
        "discountPercent": 44,
        "rating": 4.9,
        "reviewsCount": 420,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-003",
        "productCode": "CH-BEA003",
        "categoryCode": "BEA",
        "name": "Face Cleanser",
        "subcategory": "Skincare",
        "description": "Gentle clarifying pH-balanced gel facial cleanser with salicylic acid.",
        "price": 549,
        "originalPrice": 899,
        "discountPercent": 39,
        "rating": 4.7,
        "reviewsCount": 380,
        "badge": "Gentle",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-004",
        "productCode": "CH-BEA004",
        "categoryCode": "BEA",
        "name": "Foaming Cleanser",
        "subcategory": "Skincare",
        "description": "Rich foaming botanical wash that removes makeup and excess sebum effortlessly.",
        "price": 649,
        "originalPrice": 999,
        "discountPercent": 35,
        "rating": 4.6,
        "reviewsCount": 290,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-005",
        "productCode": "CH-BEA005",
        "categoryCode": "BEA",
        "name": "Skin Cream",
        "subcategory": "Skincare",
        "description": "Ultra-nourishing ceramide moisturizing day cream for 24-hour hydration barrier.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 510,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-006",
        "productCode": "CH-BEA006",
        "categoryCode": "BEA",
        "name": "Sunscreen Lotion",
        "subcategory": "Skincare",
        "description": "SPF 50+ PA++++ ultralight aqua gel sunscreen with zero white cast and sweat resistance.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 780,
        "badge": "SPF 50+",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-007",
        "productCode": "CH-BEA007",
        "categoryCode": "BEA",
        "name": "Night Cream",
        "subcategory": "Skincare",
        "description": "Retinol rejuvenating night cream to restore firmness and reduce fine lines overnight.",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 340,
        "badge": "Restorative",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-008",
        "productCode": "CH-BEA008",
        "categoryCode": "BEA",
        "name": "Aloe Face Gel",
        "subcategory": "Skincare",
        "description": "Pure organic 99% soothing aloe vera gel for irritated or sunburnt sensitive skin.",
        "price": 399,
        "originalPrice": 649,
        "discountPercent": 39,
        "rating": 4.6,
        "reviewsCount": 410,
        "badge": "Organic",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-009",
        "productCode": "CH-BEA009",
        "categoryCode": "BEA",
        "name": "Matte Lip Color",
        "subcategory": "Makeup",
        "description": "Transfer-proof velvet matte liquid lipstick with 16-hour smudge-free wear.",
        "price": 599,
        "originalPrice": 999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 620,
        "badge": "Trending",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-010",
        "productCode": "CH-BEA010",
        "categoryCode": "BEA",
        "name": "Lip Balm",
        "subcategory": "Makeup",
        "description": "Shea butter and SPF tinted nourishing lip balm for soft, hydrated lips.",
        "price": 299,
        "originalPrice": 499,
        "discountPercent": 40,
        "rating": 4.5,
        "reviewsCount": 530,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1617897903246-719242758050?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-011",
        "productCode": "CH-BEA011",
        "categoryCode": "BEA",
        "name": "Kajal Pencil",
        "subcategory": "Makeup",
        "description": "Intense jet black waterproof smudge-proof 24h kajal eyeliner pencil.",
        "price": 349,
        "originalPrice": 599,
        "discountPercent": 42,
        "rating": 4.7,
        "reviewsCount": 890,
        "badge": "All Day",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-012",
        "productCode": "CH-BEA012",
        "categoryCode": "BEA",
        "name": "Compact Powder",
        "subcategory": "Makeup",
        "description": "Silky micro-fine oil control matte compact powder with mirror and puff applicator.",
        "price": 649,
        "originalPrice": 999,
        "discountPercent": 35,
        "rating": 4.6,
        "reviewsCount": 310,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-013",
        "productCode": "CH-BEA013",
        "categoryCode": "BEA",
        "name": "Foundation",
        "subcategory": "Makeup",
        "description": "Weightless medium-to-full buildable natural finish foundation for all skin tones.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 470,
        "badge": "Flawless",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-014",
        "productCode": "CH-BEA014",
        "categoryCode": "BEA",
        "name": "Makeup Brush Set",
        "subcategory": "Makeup",
        "description": "12-piece professional synthetic cruelty-free cosmetic brush collection with cylinder case.",
        "price": 1499,
        "originalPrice": 2499,
        "discountPercent": 40,
        "rating": 4.9,
        "reviewsCount": 360,
        "badge": "Pro Kit",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bea-015",
        "productCode": "CH-BEA015",
        "categoryCode": "BEA",
        "name": "Face Mask Set",
        "subcategory": "Skincare",
        "description": "Pack of 5 bio-cellulose sheet masks enriched with collagen, peptides, and green tea.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 280,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Beauty', value: 'All' },
    { id: 'skincare', label: 'Skincare', value: 'Skincare' },
    { id: 'haircare', label: 'Haircare', value: 'Haircare' },
    { id: 'makeup', label: 'Makeup', value: 'Makeup' },
    { id: 'fragrances', label: 'Fragrances', value: 'Fragrances' },
    { id: 'bath-body', label: 'Bath & Body', value: 'Bath & Body' }
];

export default class BeautyPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_BEAUTY_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Beauty')
                .map((p, index) => {
                    const fallback =
                        DUMMY_BEAUTY_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_BEAUTY_PRODUCTS[index % DUMMY_BEAUTY_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-BEA${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_BEAUTY_PRODUCTS[index % DUMMY_BEAUTY_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'BEA',
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
            console.warn('[Beauty] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_BEAUTY_PRODUCTS;
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
        const urlSlug = `/beauty/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'beauty', url: urlSlug },
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
                console.warn('[BeautyPage] Product navigation error:', err);
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
                console.warn('[BeautyPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Beauty item';

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
        event.target.src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
