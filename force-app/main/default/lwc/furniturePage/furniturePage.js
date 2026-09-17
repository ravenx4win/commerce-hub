import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_FURNITURE_PRODUCTS = [
    {
        "id": "fur-001",
        "productCode": "CH-FUR001",
        "categoryCode": "FUR",
        "name": "Office Chair",
        "subcategory": "Office",
        "description": "Ergonomic breathable mesh high-back executive desk chair with adjustable lumbar support.",
        "price": 7999,
        "originalPrice": 12999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 610,
        "badge": "Ergonomic",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-002",
        "productCode": "CH-FUR002",
        "categoryCode": "FUR",
        "name": "Study Table",
        "subcategory": "Office",
        "description": "Solid engineered wood minimalist computer study desk with cable management port.",
        "price": 5499,
        "originalPrice": 8999,
        "discountPercent": 39,
        "rating": 4.7,
        "reviewsCount": 390,
        "badge": "Sturdy",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-003",
        "productCode": "CH-FUR003",
        "categoryCode": "FUR",
        "name": "Bedside Table",
        "subcategory": "Bedroom",
        "description": "Mid-century modern 2-drawer nightstand with tapered natural wood legs.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 280,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-004",
        "productCode": "CH-FUR004",
        "categoryCode": "FUR",
        "name": "Bookshelf",
        "subcategory": "Living Room",
        "description": "5-tier open industrial metal frame and rustic wood display bookshelf.",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 310,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1594652634010-275456c808d0?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-005",
        "productCode": "CH-FUR005",
        "categoryCode": "FUR",
        "name": "Coffee Table",
        "subcategory": "Living Room",
        "description": "Oval tempered glass and walnut wood coffee table for modern living rooms.",
        "price": 6499,
        "originalPrice": 9999,
        "discountPercent": 35,
        "rating": 4.7,
        "reviewsCount": 220,
        "badge": "Modern",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-006",
        "productCode": "CH-FUR006",
        "categoryCode": "FUR",
        "name": "TV Unit",
        "subcategory": "Living Room",
        "description": "Contemporary low-profile entertainment media console with slatted sliding doors.",
        "price": 8999,
        "originalPrice": 14999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 195,
        "badge": "Spacious",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-007",
        "productCode": "CH-FUR007",
        "categoryCode": "FUR",
        "name": "Shoe Cabinet",
        "subcategory": "Storage",
        "description": "3-tier flip-drawer slim entryway shoe storage cabinet holding up to 18 pairs.",
        "price": 3999,
        "originalPrice": 6299,
        "discountPercent": 37,
        "rating": 4.5,
        "reviewsCount": 340,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-008",
        "productCode": "CH-FUR008",
        "categoryCode": "FUR",
        "name": "Dining Chair",
        "subcategory": "Dining",
        "description": "Upholstered velvet dining chair with black powder-coated steel legs (Set of 2).",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 260,
        "badge": "Comfort",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-009",
        "productCode": "CH-FUR009",
        "categoryCode": "FUR",
        "name": "Teak Wood Dining Table",
        "subcategory": "Dining",
        "description": "6-seater natural sheesham wood rectangular dining table with walnut matte polish.",
        "price": 18999,
        "originalPrice": 28999,
        "discountPercent": 34,
        "rating": 4.9,
        "reviewsCount": 140,
        "badge": "Solid Wood",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-010",
        "productCode": "CH-FUR010",
        "categoryCode": "FUR",
        "name": "Lounge Chair",
        "subcategory": "Living Room",
        "description": "Scandinavian accent armchair with deep high-density foam cushioning.",
        "price": 9999,
        "originalPrice": 15999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 210,
        "badge": "Accent",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-011",
        "productCode": "CH-FUR011",
        "categoryCode": "FUR",
        "name": "Computer Desk",
        "subcategory": "Office",
        "description": "Electric motorized height-adjustable sit-stand ergonomic desk with digital memory preset.",
        "price": 19999,
        "originalPrice": 29999,
        "discountPercent": 33,
        "rating": 4.9,
        "reviewsCount": 180,
        "badge": "Sit-Stand",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-012",
        "productCode": "CH-FUR012",
        "categoryCode": "FUR",
        "name": "Storage Cabinet",
        "subcategory": "Storage",
        "description": "Multipurpose 4-door modular storage credenza with adjustable shelves.",
        "price": 7499,
        "originalPrice": 11999,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 165,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-013",
        "productCode": "CH-FUR013",
        "categoryCode": "FUR",
        "name": "Side Table",
        "subcategory": "Living Room",
        "description": "Round marble-top gold accent side end table for drinks and decor lamps.",
        "price": 2999,
        "originalPrice": 4699,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 290,
        "badge": "Luxe",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-014",
        "productCode": "CH-FUR014",
        "categoryCode": "FUR",
        "name": "Wardrobe",
        "subcategory": "Bedroom",
        "description": "3-door spacious engineered wood closet with full-length mirrored door and hanging rail.",
        "price": 16999,
        "originalPrice": 26999,
        "discountPercent": 37,
        "rating": 4.8,
        "reviewsCount": 120,
        "badge": "Spacious",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fur-015",
        "productCode": "CH-FUR015",
        "categoryCode": "FUR",
        "name": "Console",
        "subcategory": "Living Room",
        "description": "Narrow industrial foyer entryway console table with bottom wire storage rack.",
        "price": 3499,
        "originalPrice": 5499,
        "discountPercent": 36,
        "rating": 4.6,
        "reviewsCount": 230,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Furniture', value: 'All' },
    { id: 'office', label: 'Office', value: 'Office' },
    { id: 'living', label: 'Living Room', value: 'Living Room' },
    { id: 'bedroom', label: 'Bedroom', value: 'Bedroom' },
    { id: 'dining', label: 'Dining', value: 'Dining' },
    { id: 'storage', label: 'Storage', value: 'Storage' }
];

export default class FurniturePage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_FURNITURE_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Furniture')
                .map((p, index) => {
                    const fallback =
                        DUMMY_FURNITURE_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_FURNITURE_PRODUCTS[index % DUMMY_FURNITURE_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-FUR${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_FURNITURE_PRODUCTS[index % DUMMY_FURNITURE_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'FUR',
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
            console.warn('[Furniture] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_FURNITURE_PRODUCTS;
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
        const urlSlug = `/furniture/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'furniture', url: urlSlug },
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
                console.warn('[FurniturePage] Product navigation error:', err);
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
                console.warn('[FurniturePage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Furniture item';

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
        event.target.src = 'https://images.unsplash.com/photo-1580481077195-c3f990558115?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
