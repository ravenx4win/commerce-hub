import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_CLOTHING_PRODUCTS = [
    {
        "id": "clt-001",
        "productCode": "CH-CLT001",
        "categoryCode": "CLT",
        "name": "Cotton T-Shirt",
        "subcategory": "Men's Fashion",
        "description": "Premium 100% combed ring-spun breathable cotton crewneck t-shirt.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 920,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-002",
        "productCode": "CH-CLT002",
        "categoryCode": "CLT",
        "name": "Oversized T-Shirt",
        "subcategory": "Men's Fashion",
        "description": "Streetwear heavyweight 240 GSM drop-shoulder boxy oversized cotton tee.",
        "price": 999,
        "originalPrice": 1599,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 640,
        "badge": "Trending",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-003",
        "productCode": "CH-CLT003",
        "categoryCode": "CLT",
        "name": "Polo Shirt",
        "subcategory": "Men's Fashion",
        "description": "Classic pique textured knit polo shirt with ribbed collar and double-button placket.",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 480,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-004",
        "productCode": "CH-CLT004",
        "categoryCode": "CLT",
        "name": "Oxford Casual Shirt",
        "subcategory": "Men's Fashion",
        "description": "Pure linen-cotton blend relaxed fit button-down casual spread collar shirt.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.6,
        "reviewsCount": 390,
        "badge": "Comfort",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-005",
        "productCode": "CH-CLT005",
        "categoryCode": "CLT",
        "name": "Formal Shirt",
        "subcategory": "Men's Fashion",
        "description": "Wrinkle-resistant luxury Egyptian cotton executive spread collar formal shirt.",
        "price": 1799,
        "originalPrice": 2799,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 310,
        "badge": "Executive",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-006",
        "productCode": "CH-CLT006",
        "categoryCode": "CLT",
        "name": "Denim Jacket",
        "subcategory": "Women's Fashion",
        "description": "Vintage-wash rugged denim trucker jacket with brass hardware and dual chest pockets.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 420,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-007",
        "productCode": "CH-CLT007",
        "categoryCode": "CLT",
        "name": "Bomber Jacket",
        "subcategory": "Winter Wear",
        "description": "Weather-resistant flight bomber jacket with ribbed cuffs, zip arm utility pocket, and warm lining.",
        "price": 2999,
        "originalPrice": 4699,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 280,
        "badge": "Warm",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-008",
        "productCode": "CH-CLT008",
        "categoryCode": "CLT",
        "name": "Casual Hoodie",
        "subcategory": "Winter Wear",
        "description": "Fleece-lined heavyweight pull-over hoodie with kangaroo pocket and drawstring hood.",
        "price": 1699,
        "originalPrice": 2599,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 560,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-009",
        "productCode": "CH-CLT009",
        "categoryCode": "CLT",
        "name": "Zip Hoodie",
        "subcategory": "Winter Wear",
        "description": "Full-zip warm french terry athletic hoodie with dual slip pockets and athletic stretch.",
        "price": 1899,
        "originalPrice": 2899,
        "discountPercent": 34,
        "rating": 4.7,
        "reviewsCount": 310,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-010",
        "productCode": "CH-CLT010",
        "categoryCode": "CLT",
        "name": "Chino Trousers",
        "subcategory": "Men's Fashion",
        "description": "Tailored slim-fit stretch twill chino pants for work and casual weekends.",
        "price": 1699,
        "originalPrice": 2499,
        "discountPercent": 32,
        "rating": 4.6,
        "reviewsCount": 370,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-011",
        "productCode": "CH-CLT011",
        "categoryCode": "CLT",
        "name": "Slim Fit Jeans",
        "subcategory": "Men's Fashion",
        "description": "Authentic 5-pocket indigo stretch denim jeans with comfortable movement flexibility.",
        "price": 1999,
        "originalPrice": 3299,
        "discountPercent": 39,
        "rating": 4.7,
        "reviewsCount": 680,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-012",
        "productCode": "CH-CLT012",
        "categoryCode": "CLT",
        "name": "Relaxed Fit Jeans",
        "subcategory": "Women's Fashion",
        "description": "90s straight leg relaxed-fit vintage washed denim with high-rise waistline.",
        "price": 2199,
        "originalPrice": 3499,
        "discountPercent": 37,
        "rating": 4.8,
        "reviewsCount": 290,
        "badge": "Retro",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-013",
        "productCode": "CH-CLT013",
        "categoryCode": "CLT",
        "name": "Track Pants",
        "subcategory": "Activewear",
        "description": "Moisture-wicking dry-fit performance workout joggers with zippered ankle cuffs.",
        "price": 1199,
        "originalPrice": 1799,
        "discountPercent": 33,
        "rating": 4.6,
        "reviewsCount": 440,
        "badge": "Dry-Fit",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-014",
        "productCode": "CH-CLT014",
        "categoryCode": "CLT",
        "name": "Cotton Shorts",
        "subcategory": "Activewear",
        "description": "Breathable lightweight french terry lounge & running shorts with elastic waist drawstring.",
        "price": 899,
        "originalPrice": 1399,
        "discountPercent": 36,
        "rating": 4.5,
        "reviewsCount": 350,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "clt-015",
        "productCode": "CH-CLT015",
        "categoryCode": "CLT",
        "name": "Winter Sweatshirt",
        "subcategory": "Winter Wear",
        "description": "Cozy thermal crewneck pullover sweatshirt made with brushed cotton inside.",
        "price": 1399,
        "originalPrice": 2199,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 410,
        "badge": "Cozy",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Clothing', value: 'All' },
    { id: 'men', label: "Men's Fashion", value: "Men's Fashion" },
    { id: 'women', label: "Women's Fashion", value: "Women's Fashion" },
    { id: 'ethnic', label: 'Ethnic Wear', value: 'Ethnic Wear' },
    { id: 'active', label: 'Activewear', value: 'Activewear' },
    { id: 'winter', label: 'Winter Wear', value: 'Winter Wear' }
];

export default class ClothingPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_CLOTHING_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Clothing')
                .map((p, index) => {
                    const fallback =
                        DUMMY_CLOTHING_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_CLOTHING_PRODUCTS[index % DUMMY_CLOTHING_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-CLT${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_CLOTHING_PRODUCTS[index % DUMMY_CLOTHING_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'CLT',
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
            console.warn('[Clothing] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_CLOTHING_PRODUCTS;
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
        const urlSlug = `/clothing/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'clothing', url: urlSlug },
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
                console.warn('[ClothingPage] Product navigation error:', err);
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
                console.warn('[ClothingPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Clothing item';

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
        event.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
