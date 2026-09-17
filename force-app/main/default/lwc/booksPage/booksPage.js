import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_BOOKS_PRODUCTS = [
    {
        "id": "bks-001",
        "productCode": "CH-BKS001",
        "categoryCode": "BKS",
        "name": "Clean Code",
        "subcategory": "Business & Finance",
        "description": "A handbook of agile software craftsmanship and foundational best practices.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.9,
        "reviewsCount": 840,
        "badge": "Classic",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-002",
        "productCode": "CH-BKS002",
        "categoryCode": "BKS",
        "name": "Python Guide",
        "subcategory": "Business & Finance",
        "description": "Comprehensive Python programming guide covering modern language features and frameworks.",
        "price": 699,
        "originalPrice": 1199,
        "discountPercent": 42,
        "rating": 4.8,
        "reviewsCount": 530,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-003",
        "productCode": "CH-BKS003",
        "categoryCode": "BKS",
        "name": "Atomic Habits & Psychology of Money",
        "subcategory": "Business & Finance",
        "description": "Timeless lessons on wealth, greed, and happiness by Morgan Housel.",
        "price": 499,
        "originalPrice": 799,
        "discountPercent": 38,
        "rating": 4.9,
        "reviewsCount": 1400,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-004",
        "productCode": "CH-BKS004",
        "categoryCode": "BKS",
        "name": "Algorithms Guide",
        "subcategory": "Business & Finance",
        "description": "Illustrated guide to data structures, graph search, and computational complexity.",
        "price": 999,
        "originalPrice": 1699,
        "discountPercent": 41,
        "rating": 4.8,
        "reviewsCount": 390,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-005",
        "productCode": "CH-BKS005",
        "categoryCode": "BKS",
        "name": "Java Fundamentals",
        "subcategory": "Business & Finance",
        "description": "Deep dive into modern Java, JVM memory tuning, concurrency, and enterprise design.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 310,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-006",
        "productCode": "CH-BKS006",
        "categoryCode": "BKS",
        "name": "Web Dev Handbook",
        "subcategory": "Business & Finance",
        "description": "Full-stack development guide covering modern JavaScript, React, Node, and web performance.",
        "price": 749,
        "originalPrice": 1199,
        "discountPercent": 38,
        "rating": 4.6,
        "reviewsCount": 260,
        "badge": "Popular",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-007",
        "productCode": "CH-BKS007",
        "categoryCode": "BKS",
        "name": "Database Essentials",
        "subcategory": "Business & Finance",
        "description": "Relational and NoSQL architecture, query optimization, indexing, and high availability.",
        "price": 849,
        "originalPrice": 1399,
        "discountPercent": 39,
        "rating": 4.7,
        "reviewsCount": 190,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-008",
        "productCode": "CH-BKS008",
        "categoryCode": "BKS",
        "name": "Software Principles",
        "subcategory": "Business & Finance",
        "description": "SOLID design principles, modularity, test-driven development, and architectural patterns.",
        "price": 899,
        "originalPrice": 1499,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 220,
        "badge": "Recommended",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-009",
        "productCode": "CH-BKS009",
        "categoryCode": "BKS",
        "name": "AI Fundamentals",
        "subcategory": "Business & Finance",
        "description": "Neural networks, transformer architectures, and applied large language models explained.",
        "price": 1199,
        "originalPrice": 1899,
        "discountPercent": 37,
        "rating": 4.9,
        "reviewsCount": 490,
        "badge": "Trending",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-010",
        "productCode": "CH-BKS010",
        "categoryCode": "BKS",
        "name": "ML Basics",
        "subcategory": "Business & Finance",
        "description": "Hands-on machine learning with Scikit-Learn, PyTorch, and real-world evaluation workflows.",
        "price": 999,
        "originalPrice": 1599,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 320,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-011",
        "productCode": "CH-BKS011",
        "categoryCode": "BKS",
        "name": "Cloud Computing",
        "subcategory": "Business & Finance",
        "description": "Architecting resilient multi-region cloud infrastructures, Kubernetes, and serverless backends.",
        "price": 1099,
        "originalPrice": 1799,
        "discountPercent": 39,
        "rating": 4.8,
        "reviewsCount": 280,
        "badge": "Enterprise",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-012",
        "productCode": "CH-BKS012",
        "categoryCode": "BKS",
        "name": "System Design",
        "subcategory": "Business & Finance",
        "description": "Scalable system design patterns, distributed caching, partitioning, and message streaming.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.9,
        "reviewsCount": 610,
        "badge": "Must Read",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-013",
        "productCode": "CH-BKS013",
        "categoryCode": "BKS",
        "name": "Cybersecurity",
        "subcategory": "Business & Finance",
        "description": "Defensive security, penetration testing, threat modeling, and identity management.",
        "price": 949,
        "originalPrice": 1499,
        "discountPercent": 37,
        "rating": 4.7,
        "reviewsCount": 190,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-014",
        "productCode": "CH-BKS014",
        "categoryCode": "BKS",
        "name": "Product Management",
        "subcategory": "Business & Finance",
        "description": "From discovery to delivery: user research, prioritization frameworks, and product metrics.",
        "price": 699,
        "originalPrice": 1099,
        "discountPercent": 36,
        "rating": 4.8,
        "reviewsCount": 340,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "bks-015",
        "productCode": "CH-BKS015",
        "categoryCode": "BKS",
        "name": "Entrepreneurship",
        "subcategory": "Business & Finance",
        "description": "The zero to one playbook for venture building, fundraising, and sustainable scaling.",
        "price": 599,
        "originalPrice": 999,
        "discountPercent": 40,
        "rating": 4.9,
        "reviewsCount": 450,
        "badge": "Inspiring",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Books', value: 'All' },
    { id: 'fiction', label: 'Fiction & Novels', value: 'Fiction & Novels' },
    { id: 'business', label: 'Business & Finance', value: 'Business & Finance' },
    { id: 'self-help', label: 'Self-Help', value: 'Self-Help' },
    { id: 'sci-fi', label: 'Sci-Fi & Fantasy', value: 'Sci-Fi & Fantasy' },
    { id: 'biographies', label: 'Biographies', value: 'Biographies' }
];

export default class BooksPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_BOOKS_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Books')
                .map((p, index) => {
                    const fallback =
                        DUMMY_BOOKS_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_BOOKS_PRODUCTS[index % DUMMY_BOOKS_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-BKS${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_BOOKS_PRODUCTS[index % DUMMY_BOOKS_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'BKS',
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
            console.warn('[Books] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_BOOKS_PRODUCTS;
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
        const urlSlug = `/books/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'books', url: urlSlug },
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
                console.warn('[BooksPage] Product navigation error:', err);
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
                console.warn('[BooksPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Book';

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
        event.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
