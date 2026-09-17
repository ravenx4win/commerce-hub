import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { addToCart } from 'c/cartService';

const DUMMY_AUDIO_PRODUCTS = [
    {
        "id": "aud-001",
        "productCode": "CH-AUD001",
        "categoryCode": "AUD",
        "name": "SonicPro Noise Cancelling Headphones",
        "subcategory": "Over-Ear Headphones",
        "description": "Hybrid active noise cancellation with 40mm graphene drivers and 55h battery.",
        "price": 8999,
        "originalPrice": 14999,
        "discountPercent": 40,
        "rating": 4.8,
        "reviewsCount": 340,
        "badge": "Best Seller",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-002",
        "productCode": "CH-AUD002",
        "categoryCode": "AUD",
        "name": "Wireless Earbuds",
        "subcategory": "Wireless Earbuds",
        "description": "True wireless stereo earbuds with IPX7 waterproofing and wireless charging case.",
        "price": 3499,
        "originalPrice": 5999,
        "discountPercent": 42,
        "rating": 4.6,
        "reviewsCount": 512,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-003",
        "productCode": "CH-AUD003",
        "categoryCode": "AUD",
        "name": "Bluetooth Speaker",
        "subcategory": "Bluetooth Speakers",
        "description": "Portable waterproof 24W cylinder speaker with 360-degree room-filling surround sound.",
        "price": 2799,
        "originalPrice": 4499,
        "discountPercent": 38,
        "rating": 4.7,
        "reviewsCount": 189,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-004",
        "productCode": "CH-AUD004",
        "categoryCode": "AUD",
        "name": "Party Speaker",
        "subcategory": "Bluetooth Speakers",
        "description": "High-power 160W bass party speaker with multi-color dynamic rhythmic LED lights.",
        "price": 14999,
        "originalPrice": 21999,
        "discountPercent": 32,
        "rating": 4.9,
        "reviewsCount": 94,
        "badge": "Party King",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-005",
        "productCode": "CH-AUD005",
        "categoryCode": "AUD",
        "name": "Studio Headphones",
        "subcategory": "Over-Ear Headphones",
        "description": "Professional flat-response over-ear monitor headphones for studio recording and mixing.",
        "price": 6499,
        "originalPrice": 9999,
        "discountPercent": 35,
        "rating": 4.8,
        "reviewsCount": 95,
        "badge": "Studio Grade",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-006",
        "productCode": "CH-AUD006",
        "categoryCode": "AUD",
        "name": "Wired Earphones",
        "subcategory": "Wireless Earbuds",
        "description": "Tangle-free braided cable 3.5mm in-ear wired earphones with built-in HD microphone.",
        "price": 799,
        "originalPrice": 1299,
        "discountPercent": 38,
        "rating": 4.3,
        "reviewsCount": 620,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-007",
        "productCode": "CH-AUD007",
        "categoryCode": "AUD",
        "name": "Gaming Headset",
        "subcategory": "Gaming Headsets",
        "description": "7.1 surround sound gaming headset with flexible noise-filtering boom mic and RGB glow.",
        "price": 4299,
        "originalPrice": 6999,
        "discountPercent": 39,
        "rating": 4.5,
        "reviewsCount": 220,
        "badge": "RGB Glow",
        "badgeClass": "badge-new",
        "imageUrl": "https://images.unsplash.com/photo-1599669454699-248893623440?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-008",
        "productCode": "CH-AUD008",
        "categoryCode": "AUD",
        "name": "Neckband Earphones",
        "subcategory": "Wireless Earbuds",
        "description": "Flexible magnetic wireless sports neckband with 30-hour playback and dual pairing.",
        "price": 1499,
        "originalPrice": 2499,
        "discountPercent": 40,
        "rating": 4.4,
        "reviewsCount": 630,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-009",
        "productCode": "CH-AUD009",
        "categoryCode": "AUD",
        "name": "Soundbar",
        "subcategory": "Soundbars",
        "description": "380W 5.1 channel Dolby Atmos home theatre soundbar with wireless down-firing subwoofer.",
        "price": 18999,
        "originalPrice": 27999,
        "discountPercent": 32,
        "rating": 4.9,
        "reviewsCount": 88,
        "badge": "Dolby Atmos",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-010",
        "productCode": "CH-AUD010",
        "categoryCode": "AUD",
        "name": "Compact Soundbar",
        "subcategory": "Soundbars",
        "description": "120W slim 2.1 channel under-monitor soundbar with optical and Bluetooth inputs.",
        "price": 4999,
        "originalPrice": 7999,
        "discountPercent": 38,
        "rating": 4.3,
        "reviewsCount": 175,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-011",
        "productCode": "CH-AUD011",
        "categoryCode": "AUD",
        "name": "USB Microphone",
        "subcategory": "Gaming Headsets",
        "description": "Plug-and-play cardioid condenser USB microphone with heavy metal desktop stand.",
        "price": 3499,
        "originalPrice": 5499,
        "discountPercent": 36,
        "rating": 4.7,
        "reviewsCount": 142,
        "badge": "Top Rated",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-012",
        "productCode": "CH-AUD012",
        "categoryCode": "AUD",
        "name": "Podcast Mic",
        "subcategory": "Gaming Headsets",
        "description": "Broadcast-grade dynamic XLR/USB microphone with built-in headphone monitoring.",
        "price": 7999,
        "originalPrice": 11999,
        "discountPercent": 33,
        "rating": 4.9,
        "reviewsCount": 78,
        "badge": "Pro Audio",
        "badgeClass": "badge-bestseller",
        "imageUrl": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-013",
        "productCode": "CH-AUD013",
        "categoryCode": "AUD",
        "name": "Desktop Speakers",
        "subcategory": "Bluetooth Speakers",
        "description": "Active 2.0 nearfield stereo bookshelf speakers with wooden acoustic enclosures.",
        "price": 5999,
        "originalPrice": 8999,
        "discountPercent": 33,
        "rating": 4.6,
        "reviewsCount": 115,
        "badge": null,
        "badgeClass": "",
        "imageUrl": "https://images.unsplash.com/photo-1545127398-14699f92334b?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-014",
        "productCode": "CH-AUD014",
        "categoryCode": "AUD",
        "name": "Mini Speaker",
        "subcategory": "Bluetooth Speakers",
        "description": "Pocket-sized ultra-portable clip speaker with IP67 dustproof and waterproof seal.",
        "price": 1299,
        "originalPrice": 1999,
        "discountPercent": 35,
        "rating": 4.4,
        "reviewsCount": 310,
        "badge": "Deal",
        "badgeClass": "badge-deal",
        "imageUrl": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60"
    },
    {
        "id": "aud-015",
        "productCode": "CH-AUD015",
        "categoryCode": "AUD",
        "name": "Premium Earbuds",
        "subcategory": "Wireless Earbuds",
        "description": "Audiophile dual-driver true wireless earbuds with LDAC high-res audio codec.",
        "price": 11999,
        "originalPrice": 17999,
        "discountPercent": 33,
        "rating": 4.9,
        "reviewsCount": 82,
        "badge": "Hi-Res",
        "badgeClass": "badge-toprated",
        "imageUrl": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&auto=format&fit=crop&q=60"
    }
];



const SUBCATEGORIES = [
    { id: 'all', label: 'All Audio', value: 'All' },
    { id: 'earbuds', label: 'Wireless Earbuds', value: 'Wireless Earbuds' },
    { id: 'headphones', label: 'Over-Ear Headphones', value: 'Over-Ear Headphones' },
    { id: 'speakers', label: 'Bluetooth Speakers', value: 'Bluetooth Speakers' },
    { id: 'soundbars', label: 'Soundbars', value: 'Soundbars' },
    { id: 'gaming', label: 'Gaming Headsets', value: 'Gaming Headsets' }
];

export default class AudioPage extends NavigationMixin(LightningElement) {
    @track _allProducts = DUMMY_AUDIO_PRODUCTS;
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
                .filter((p) => p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === 'Audio')
                .map((p, index) => {
                    const fallback =
                        DUMMY_AUDIO_PRODUCTS.find(
                            (def) =>
                                (p.ProductCode && def.productCode && p.ProductCode.toUpperCase() === def.productCode.toUpperCase()) ||
                                (p.Name && def.name && p.Name.toLowerCase() === def.name.toLowerCase()) ||
                                (p.Name && def.name && (p.Name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(p.Name.toLowerCase())))
                        ) || DUMMY_AUDIO_PRODUCTS[index % DUMMY_AUDIO_PRODUCTS.length] || {};

                    const code = p.ProductCode || fallback.productCode || `CH-AUD${String(index + 1).padStart(3, '0')}`;
                    const img =
                        p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c && !p.Product_Images__r[0].Image_URL__c.includes('placehold.co')
                            ? p.Product_Images__r[0].Image_URL__c
                            : (fallback.imageUrl || DUMMY_AUDIO_PRODUCTS[index % DUMMY_AUDIO_PRODUCTS.length].imageUrl);

                    const priceVal = p.Price__c || fallback.price || 1999;
                    const origVal = fallback.originalPrice || Math.round(priceVal * 1.4);

                    return {
                        id: p.Id,
                        name: p.Name,
                        productCode: code,
                        categoryCode: 'AUD',
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
            console.warn('[Audio] Backend fetch error, using dummy dataset:', error);
            this._allProducts = DUMMY_AUDIO_PRODUCTS;
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
        const urlSlug = `/audio/products/${productId}`;

        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category: 'audio', url: urlSlug },
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
                console.warn('[AudioPage] Product navigation error:', err);
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
                console.warn('[AudioPage] Home navigation error:', err);
            }
        }
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.id;
        const prod = this._allProducts.find((p) => p.id === productId || p.Id === productId);
        const name = prod ? (prod.name || prod.Name) : 'Audio item';

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
        event.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60';
    }

    disconnectedCallback() {
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }
}
