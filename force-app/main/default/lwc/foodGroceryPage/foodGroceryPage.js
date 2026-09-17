import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_GROCERY_PRODUCTS = [
    {
        "id": "fod-001",
        "productCode": "CH-FOD001",
        "categoryCode": "FOD",
        "name": "Basmati Rice",
        "subcategory": "Staples & Grains",
        "description": "Aged long-grain royal aromatic basmati rice for fragrant culinary perfection (5kg).",
        "price": 649,
        "originalPrice": 899,
        "discountPercent": 28,
        "rating": 4.9,
        "reviewsCount": 1120,
        "badge": "Aged Rice",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-002",
        "productCode": "CH-FOD002",
        "categoryCode": "FOD",
        "name": "Green Tea",
        "subcategory": "Beverages & Coffee",
        "description": "Pure organic whole-leaf Himalayan green tea rich in natural antioxidants (100 bags).",
        "price": 499,
        "originalPrice": 749,
        "discountPercent": 33,
        "rating": 4.8,
        "reviewsCount": 650,
        "badge": "Organic",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-003",
        "productCode": "CH-FOD003",
        "categoryCode": "FOD",
        "name": "Coffee Beans",
        "subcategory": "Beverages & Coffee",
        "description": "100% Arabica artisanal medium-dark roasted whole coffee beans from Chikmagalur (500g).",
        "price": 599,
        "originalPrice": 899,
        "discountPercent": 33,
        "rating": 4.9,
        "reviewsCount": 480,
        "badge": "Artisanal",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-004",
        "productCode": "CH-FOD004",
        "categoryCode": "FOD",
        "name": "Organic Honey",
        "subcategory": "Organic & Health",
        "description": "Raw unpasteurized wild forest organic honey collected straight from bee hives (500g).",
        "price": 399,
        "originalPrice": 599,
        "discountPercent": 33,
        "rating": 4.8,
        "reviewsCount": 710,
        "badge": "Pure",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-005",
        "productCode": "CH-FOD005",
        "categoryCode": "FOD",
        "name": "Dry Fruits",
        "subcategory": "Snacks & Dry Fruits",
        "description": "Premium mix of California almonds, cashews, raisins, and walnut kernels (500g).",
        "price": 799,
        "originalPrice": 1199,
        "discountPercent": 33,
        "rating": 4.8,
        "reviewsCount": 560,
        "badge": "Nutritious",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-006",
        "productCode": "CH-FOD006",
        "categoryCode": "FOD",
        "name": "Wheat Flour",
        "subcategory": "Staples & Grains",
        "description": "100% stone-ground whole wheat chakki atta with natural dietary fiber (5kg).",
        "price": 299,
        "originalPrice": 399,
        "discountPercent": 25,
        "rating": 4.7,
        "reviewsCount": 890,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-007",
        "productCode": "CH-FOD007",
        "categoryCode": "FOD",
        "name": "Brown Rice",
        "subcategory": "Staples & Grains",
        "description": "Unpolished whole grain brown basmati rice for healthy low-glycemic diets (1kg).",
        "price": 199,
        "originalPrice": 280,
        "discountPercent": 29,
        "rating": 4.6,
        "reviewsCount": 320,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-008",
        "productCode": "CH-FOD008",
        "categoryCode": "FOD",
        "name": "Rolled Oats",
        "subcategory": "Breakfast",
        "description": "100% whole grain gluten-free jumbo rolled oats for heart-healthy breakfast bowls (1kg).",
        "price": 279,
        "originalPrice": 399,
        "discountPercent": 30,
        "rating": 4.8,
        "reviewsCount": 640,
        "badge": "Healthy",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-009",
        "productCode": "CH-FOD009",
        "categoryCode": "FOD",
        "name": "Peanut Butter",
        "subcategory": "Breakfast",
        "description": "All-natural crunchy high-protein roasted peanut butter with zero added sugar (1kg).",
        "price": 349,
        "originalPrice": 499,
        "discountPercent": 30,
        "rating": 4.9,
        "reviewsCount": 780,
        "badge": "High Protein",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-010",
        "productCode": "CH-FOD010",
        "categoryCode": "FOD",
        "name": "Fruit Jam",
        "subcategory": "Breakfast",
        "description": "Real strawberry and mixed fruit chunky preserve with 70% real fruit content (500g).",
        "price": 199,
        "originalPrice": 299,
        "discountPercent": 33,
        "rating": 4.6,
        "reviewsCount": 350,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-011",
        "productCode": "CH-FOD011",
        "categoryCode": "FOD",
        "name": "Pasta",
        "subcategory": "Staples & Grains",
        "description": "Traditional bronze-cut Italian durum wheat semolina penne rigate pasta (500g).",
        "price": 179,
        "originalPrice": 250,
        "discountPercent": 28,
        "rating": 4.7,
        "reviewsCount": 420,
        "badge": "Authentic",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-012",
        "productCode": "CH-FOD012",
        "categoryCode": "FOD",
        "name": "Pasta Sauce",
        "subcategory": "Staples & Grains",
        "description": "Slow-simmered San Marzano tomato & fragrant basil artisanal pasta sauce (350g).",
        "price": 249,
        "originalPrice": 350,
        "discountPercent": 29,
        "rating": 4.8,
        "reviewsCount": 310,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1572441713132-c542fc4fe282?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-013",
        "productCode": "CH-FOD013",
        "categoryCode": "FOD",
        "name": "Herbal Tea",
        "subcategory": "Beverages & Coffee",
        "description": "Caffeine-free soothing chamomile, peppermint, and lavender bedtime herbal infusion.",
        "price": 399,
        "originalPrice": 599,
        "discountPercent": 33,
        "rating": 4.7,
        "reviewsCount": 290,
        "badge": "Calm",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-014",
        "productCode": "CH-FOD014",
        "categoryCode": "FOD",
        "name": "Olive Oil & Cooking Oil",
        "subcategory": "Staples & Grains",
        "description": "Cold-pressed extra virgin olive oil for dressings, pasta, and healthy sautéing (1L).",
        "price": 899,
        "originalPrice": 1399,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 520,
        "badge": "Cold Pressed",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "fod-015",
        "productCode": "CH-FOD015",
        "categoryCode": "FOD",
        "name": "Breakfast Cereal",
        "subcategory": "Breakfast",
        "description": "Multi-grain crunchy almond and honey clusters with pumpkin and chia seeds (750g).",
        "price": 399,
        "originalPrice": 599,
        "discountPercent": 33,
        "rating": 4.7,
        "reviewsCount": 440,
        "badge": "Crunchy",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Grocery', value: 'All' },
    { id: 'staples', label: 'Staples & Grains', value: 'Staples & Grains' },
    { id: 'beverages', label: 'Beverages & Coffee', value: 'Beverages & Coffee' },
    { id: 'snacks', label: 'Snacks & Dry Fruits', value: 'Snacks & Dry Fruits' },
    { id: 'organic', label: 'Organic & Health', value: 'Organic & Health' },
    { id: 'breakfast', label: 'Breakfast', value: 'Breakfast' }
];

export default class FoodGroceryPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_GROCERY_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Food & Grocery')
                .map((p, index) => {
                    const fallback =
                        DUMMY_GROCERY_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_GROCERY_PRODUCTS[index % DUMMY_GROCERY_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-FOD${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_GROCERY_PRODUCTS[index % DUMMY_GROCERY_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'FOD',
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
            console.warn('[Food & Grocery] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_GROCERY_PRODUCTS;
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
        const urlSlug = `/food-grocery/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'food-grocery', url: urlSlug },
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
                console.warn('[FoodGroceryPage] Product navigation error:', err);
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
                console.warn('[FoodGroceryPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Grocery item';

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
        event.target.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
