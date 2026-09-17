import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_TOYS_PRODUCTS = [
    {
        "id": "toy-001",
        "productCode": "CH-TOY001",
        "categoryCode": "TOY",
        "name": "RC Racing Car",
        "subcategory": "RC & Electronics",
        "description": "1:16 scale 4WD high-speed 40km/h off-road remote control buggy with dual rechargeable batteries.",
        "price": 2499,
        "originalPrice": 3999,
        "discountPercent": 38,
        "rating": 4.8,
        "reviewsCount": 470,
        "badge": "40 km/h",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-002",
        "productCode": "CH-TOY002",
        "categoryCode": "TOY",
        "name": "Strategy Game",
        "subcategory": "Board Games",
        "description": "Classic civilization settlement and trade tabletop board game for family game nights.",
        "price": 1799,
        "originalPrice": 2799,
        "discountPercent": 36,
        "rating": 4.9,
        "reviewsCount": 620,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-003",
        "productCode": "CH-TOY003",
        "categoryCode": "TOY",
        "name": "Building Blocks",
        "subcategory": "Building Sets",
        "description": "800-piece creative architectural brick building blocks kit compatible with major brands.",
        "price": 1999,
        "originalPrice": 3299,
        "discountPercent": 39,
        "rating": 4.8,
        "reviewsCount": 810,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-004",
        "productCode": "CH-TOY004",
        "categoryCode": "TOY",
        "name": "Science Kit",
        "subcategory": "STEM & Learning",
        "description": "60+ exciting chemistry and physics experiments lab kit for curious young scientists.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 390,
        "badge": "STEM Approved",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-005",
        "productCode": "CH-TOY005",
        "categoryCode": "TOY",
        "name": "Magnetic Tiles",
        "subcategory": "Building Sets",
        "description": "100-piece 3D magnetic geometric building tiles set with vibrant translucent rainbow colors.",
        "price": 2199,
        "originalPrice": 3499,
        "discountPercent": 37,
        "rating": 4.9,
        "reviewsCount": 540,
        "badge": "Creative 3D",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-006",
        "productCode": "CH-TOY006",
        "categoryCode": "TOY",
        "name": "Puzzle Game",
        "subcategory": "Board Games",
        "description": "1000-piece precision-cut landscape jigsaw puzzle made of recycled premium cardstock.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.6,
        "reviewsCount": 310,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-007",
        "productCode": "CH-TOY007",
        "categoryCode": "TOY",
        "name": "Toy Kitchen Set",
        "subcategory": "Pretend Play",
        "description": "Wooden interactive play kitchen with stove sound effects, utensils, and sink.",
        "price": 3499,
        "originalPrice": 5499,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 270,
        "badge": "Pretend Play",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-008",
        "productCode": "CH-TOY008",
        "categoryCode": "TOY",
        "name": "Toy Train Set",
        "subcategory": "Pretend Play",
        "description": "Electric classic steam locomotive train set with smoke effects, lights, and circular track.",
        "price": 1899,
        "originalPrice": 2899,
        "discountPercent": 34,
        "rating": 4.7,
        "reviewsCount": 330,
        "badge": "Lights & Sound",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1530325553241-4f6e7690cf36?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-009",
        "productCode": "CH-TOY009",
        "categoryCode": "TOY",
        "name": "Doll House",
        "subcategory": "Pretend Play",
        "description": "3-story fully furnished wooden dollhouse with 15 miniature furniture pieces and balcony.",
        "price": 4299,
        "originalPrice": 6599,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 190,
        "badge": "3-Story",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-010",
        "productCode": "CH-TOY010",
        "categoryCode": "TOY",
        "name": "STEM Kit",
        "subcategory": "STEM & Learning",
        "description": "12-in-1 solar hydraulic robot building kit teaching engineering and clean energy concepts.",
        "price": 1699,
        "originalPrice": 2599,
        "discountPercent": 35,
        "rating": 4.7,
        "reviewsCount": 410,
        "badge": "Solar Powered",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-011",
        "productCode": "CH-TOY011",
        "categoryCode": "TOY",
        "name": "Action Figure",
        "subcategory": "Pretend Play",
        "description": "12-inch collectible articulated superhero action figure with detachable power accessories.",
        "price": 1199,
        "originalPrice": 1799,
        "discountPercent": 33,
        "rating": 4.8,
        "reviewsCount": 520,
        "badge": "Collectible",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-012",
        "productCode": "CH-TOY012",
        "categoryCode": "TOY",
        "name": "Playing Cards",
        "subcategory": "Board Games",
        "description": "Casino-grade 100% waterproof plastic luxury gold foil embossed playing cards with gift box.",
        "price": 499,
        "originalPrice": 799,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 680,
        "badge": "Gold Foil",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-013",
        "productCode": "CH-TOY013",
        "categoryCode": "TOY",
        "name": "Chess Board",
        "subcategory": "Board Games",
        "description": "Handcrafted magnetic wooden folding chess set with felted carved pieces and storage slots.",
        "price": 1499,
        "originalPrice": 2299,
        "discountPercent": 35,
        "rating": 4.9,
        "reviewsCount": 460,
        "badge": "Handcrafted",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-014",
        "productCode": "CH-TOY014",
        "categoryCode": "TOY",
        "name": "Art & Craft Kit",
        "subcategory": "STEM & Learning",
        "description": "150-piece mega art studio kit with watercolor cakes, pastels, sketch pencils, and wooden easel box.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 380,
        "badge": "Mega Studio",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "toy-015",
        "productCode": "CH-TOY015",
        "categoryCode": "TOY",
        "name": "Outdoor Ball Set",
        "subcategory": "Pretend Play",
        "description": "Pack of 3 multi-sports balls including volleyball, soccer, and pump with needle.",
        "price": 899,
        "originalPrice": 1399,
        "discountPercent": 36,
        "rating": 4.6,
        "reviewsCount": 290,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Toys', value: 'All' },
    { id: 'building', label: 'Building Sets', value: 'Building Sets' },
    { id: 'board', label: 'Board Games', value: 'Board Games' },
    { id: 'stem', label: 'STEM & Learning', value: 'STEM & Learning' },
    { id: 'rc', label: 'RC & Electronics', value: 'RC & Electronics' },
    { id: 'pretend', label: 'Pretend Play', value: 'Pretend Play' }
];

export default class ToysGamesPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_TOYS_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Toys & Games')
                .map((p, index) => {
                    const fallback =
                        DUMMY_TOYS_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_TOYS_PRODUCTS[index % DUMMY_TOYS_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-TOY${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_TOYS_PRODUCTS[index % DUMMY_TOYS_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'TOY',
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
            console.warn('[Toys & Games] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_TOYS_PRODUCTS;
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
        const urlSlug = `/toys-games/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'toys-games', url: urlSlug },
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
                console.warn('[ToysGamesPage] Product navigation error:', err);
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
                console.warn('[ToysGamesPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Toy item';

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
        event.target.src = 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
