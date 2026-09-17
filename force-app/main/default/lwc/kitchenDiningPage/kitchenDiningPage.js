import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_KITCHEN_PRODUCTS = [
    {
        "id": "kit-001",
        "productCode": "CH-KIT001",
        "categoryCode": "KIT",
        "name": "Tri-Ply Cookware Set",
        "subcategory": "Cookware",
        "description": "Hard anodized non-stick 5-piece kitchen cookware set with tempered glass lids.",
        "price": 3499,
        "originalPrice": 5999,
        "discountPercent": 42,
        "rating": 4.8,
        "reviewsCount": 520,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-002",
        "productCode": "CH-KIT002",
        "categoryCode": "KIT",
        "name": "Insulated Bottle",
        "subcategory": "Drinkware",
        "description": "Double-wall vacuum insulated 1L stainless steel thermal flask keeping beverages cold 24h.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.9,
        "reviewsCount": 890,
        "badge": "24h Cold",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-003",
        "productCode": "CH-KIT003",
        "categoryCode": "KIT",
        "name": "Dinner Set",
        "subcategory": "Tableware",
        "description": "Opal glass chip-resistant 18-piece dinnerware set with plates and bowls for 6 people.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 340,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-004",
        "productCode": "CH-KIT004",
        "categoryCode": "KIT",
        "name": "Mug Set",
        "subcategory": "Drinkware",
        "description": "Handcrafted reactive glaze ceramic stoneware coffee mugs (Pack of 4, 350ml each).",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 410,
        "badge": "Handcrafted",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-005",
        "productCode": "CH-KIT005",
        "categoryCode": "KIT",
        "name": "Glass Container Set",
        "subcategory": "Storage",
        "description": "Oven-safe borosilicate glass food containers with airtight snap-lock lids (Set of 4).",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 560,
        "badge": "Airtight",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-006",
        "productCode": "CH-KIT006",
        "categoryCode": "KIT",
        "name": "Knife Set",
        "subcategory": "Kitchen Tools",
        "description": "German high-carbon stainless steel 6-piece precision chef knife block set with sharpener.",
        "price": 2199,
        "originalPrice": 3499,
        "discountPercent": 37,
        "rating": 4.9,
        "reviewsCount": 290,
        "badge": "Chef Choice",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-007",
        "productCode": "CH-KIT007",
        "categoryCode": "KIT",
        "name": "Chopping Board Set",
        "subcategory": "Kitchen Tools",
        "description": "Organic natural antibacterial thick bamboo cutting boards with juice groove (Set of 3).",
        "price": 999,
        "originalPrice": 1599,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 380,
        "badge": "Organic",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-008",
        "productCode": "CH-KIT008",
        "categoryCode": "KIT",
        "name": "Spice Jar Set",
        "subcategory": "Storage",
        "description": "12 rotating countertop stainless steel spice carousel organizer with pre-printed labels.",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.6,
        "reviewsCount": 420,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-009",
        "productCode": "CH-KIT009",
        "categoryCode": "KIT",
        "name": "Lunch Box Set",
        "subcategory": "Storage",
        "description": "Stainless steel insulated leak-proof bento lunch box with thermal carrying bag.",
        "price": 899,
        "originalPrice": 1399,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 510,
        "badge": "Leakproof",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-010",
        "productCode": "CH-KIT010",
        "categoryCode": "KIT",
        "name": "Serving Bowl Set",
        "subcategory": "Tableware",
        "description": "Hand-carved acacia wood salad serving bowl with matching fork and spoon tossers.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 190,
        "badge": "Acacia",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-011",
        "productCode": "CH-KIT011",
        "categoryCode": "KIT",
        "name": "Frying Pan",
        "subcategory": "Cookware",
        "description": "Pre-seasoned heavy duty cast iron 10-inch skillet for searing, baking, and frying.",
        "price": 1399,
        "originalPrice": 2199,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 470,
        "badge": "Cast Iron",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1556911073-38141963c9e0?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-012",
        "productCode": "CH-KIT012",
        "categoryCode": "KIT",
        "name": "Pressure Cooker",
        "subcategory": "Cookware",
        "description": "5-litre hard anodized outer lid induction-compatible pressure cooker with safety valve.",
        "price": 2199,
        "originalPrice": 3299,
        "discountPercent": 33,
        "rating": 4.7,
        "reviewsCount": 680,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-013",
        "productCode": "CH-KIT013",
        "categoryCode": "KIT",
        "name": "Food Storage Set",
        "subcategory": "Storage",
        "description": "BPA-free plastic cereal and pantry modular dry food storage containers with pour spouts.",
        "price": 999,
        "originalPrice": 1599,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 330,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-014",
        "productCode": "CH-KIT014",
        "categoryCode": "KIT",
        "name": "Measuring Cup Set",
        "subcategory": "Kitchen Tools",
        "description": "Engraved heavy stainless steel nesting measuring cups and spoons for precise baking.",
        "price": 599,
        "originalPrice": 999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 280,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "kit-015",
        "productCode": "CH-KIT015",
        "categoryCode": "KIT",
        "name": "Kitchen Organizer",
        "subcategory": "Storage",
        "description": "Expandable over-the-sink stainless steel dish drying rack and utensil caddy drainer.",
        "price": 1899,
        "originalPrice": 2999,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 310,
        "badge": "Organized",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Kitchen', value: 'All' },
    { id: 'cookware', label: 'Cookware', value: 'Cookware' },
    { id: 'tableware', label: 'Tableware', value: 'Tableware' },
    { id: 'drinkware', label: 'Drinkware', value: 'Drinkware' },
    { id: 'storage', label: 'Storage', value: 'Storage' },
    { id: 'tools', label: 'Kitchen Tools', value: 'Kitchen Tools' }
];

export default class KitchenDiningPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_KITCHEN_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Kitchen & Dining')
                .map((p, index) => {
                    const fallback =
                        DUMMY_KITCHEN_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_KITCHEN_PRODUCTS[index % DUMMY_KITCHEN_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-KIT${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_KITCHEN_PRODUCTS[index % DUMMY_KITCHEN_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'KIT',
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
            console.warn('[Kitchen & Dining] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_KITCHEN_PRODUCTS;
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
        const urlSlug = `/kitchen-dining/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'kitchen-dining', url: urlSlug },
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
                console.warn('[KitchenDiningPage] Product navigation error:', err);
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
                console.warn('[KitchenDiningPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Kitchen item';

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
        event.target.src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
