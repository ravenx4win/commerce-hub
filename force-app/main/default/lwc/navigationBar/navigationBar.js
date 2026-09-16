import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { navigate, NavigationContext } from 'lwr/navigation';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import getMyAddresses from '@salesforce/apex/CommerceOrderController.getMyAddresses';
import getDefaultShippingAddress from '@salesforce/apex/CommerceOrderController.getDefaultShippingAddress';
import saveNewAddress from '@salesforce/apex/CommerceOrderController.saveNewAddress';
import { refreshApex } from '@salesforce/apex';
import isGuest from '@salesforce/user/isGuest';
/**
 * Ganesh Chaturthi Banner Image Attribution:
 * Source: Wikimedia Commons
 * File: Ganesh chaturdhi.jpg
 * Author: Bharath chandra badavath
 * License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
 * Commons URL: https://commons.wikimedia.org/wiki/File:Ganesh_chaturdhi.jpg
 * License URL: https://creativecommons.org/licenses/by-sa/4.0/
 */
import commerceHubGaneshBanner from '@salesforce/resourceUrl/commerceHubGaneshBanner';
const CART_KEY = 'commerceHubCart';
const MAX_RESULTS = 8;

export default class NavigationBar extends NavigationMixin(LightningElement) {
    @track _searchResults = [];
    @track _categories = [];
    @track _dropdownActive = false;

    // Pagination state
    @track _currentPage = 1;
    @track _pageSize = 7;
    @track _paginatedCategories = [];
    _resizeObserver = null;

    _searchTerm = '';
    _cartCount = 0;
    _allProducts = [];
    _cartUpdateHandler = null;
    
    @track _categoryDropdownActive = false;
    @track _hoveredCategory = '';
    @track _dropdownProducts = [];
    @track _hoveredCategoryCount = 0;
    @track _showAllProducts = false;
    _dropdownTimeout = null;

    // Location State
    @track _isLocationDrawerOpen = false;
    @track _isAddingNewAddress = false;
    @track _locationSearchTerm = '';
    @track _savedAddresses = [];
    @track _filteredAddresses = [];
    @track _selectedAddress = null;
    @track _defaultAddress = null;
    _addressesWireResult = null;
    _defaultAddressWireResult = null;

    get isGuestUser() {
        return isGuest;
    }

    // ── Wire: resolve current page for future active-state use ───────

    @wire(CurrentPageReference)
    handlePageRef() {}

    // ── Wire: Navigation Context for LWR ─────────────────────────────

    @wire(NavigationContext)
    navContext;

    // ── Wire: Addresses ──────────────────────────────────────────────

    @wire(getMyAddresses)
    wiredAddresses(result) {
        this._addressesWireResult = result;
        if (result.data) {
            this._savedAddresses = result.data;
            this._filterSavedAddresses();
        } else if (result.error) {
            this._savedAddresses = [];
            this._filteredAddresses = [];
        }
    }

    @wire(getDefaultShippingAddress)
    wiredDefaultAddress(result) {
        this._defaultAddressWireResult = result;
        if (result.data) {
            this._defaultAddress = result.data;
        } else if (result.error) {
            this._defaultAddress = null;
        }
    }

    // ── Wire: product catalog — drives both search and categories ────

    @wire(getProducts)
    handleProducts({ data }) {
        if (data) {
            this._allProducts = data;
            this._buildCategories(data);
        }
        // On error the header stays functional; search finds nothing.
    }

    // ── Lifecycle ────────────────────────────────────────────────────

    connectedCallback() {
        this._refreshCartCount();
        // LWS-compatible cart sync: listen for a custom event dispatched by the
        // cart component on the same page. 'window.storage' is blocked by LWS;
        // document.addEventListener for custom events is permitted.
        this._cartUpdateHandler = (event) => {
            const count =
                event && event.detail && Number.isFinite(event.detail.count)
                    ? Math.max(0, Math.floor(event.detail.count))
                    : 0;
            this._cartCount = count;
        };
        document.addEventListener('commercehubcartupdate', this._cartUpdateHandler);
    }

    renderedCallback() {
        if (!this._resizeObserver && typeof ResizeObserver !== 'undefined') {
            const container = this.template.querySelector('.category-nav-wrapper');
            if (container) {
                this._resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        if (entry && entry.contentRect) {
                            this._updatePageSize(entry.contentRect.width);
                        }
                    }
                });
                this._resizeObserver.observe(container);
            }
        }
    }

    disconnectedCallback() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._cartUpdateHandler) {
            document.removeEventListener(
                'commercehubcartupdate',
                this._cartUpdateHandler
            );
            this._cartUpdateHandler = null;
        }
    }

    // ── Getters ──────────────────────────────────────────────────────

    // ── Storefront Homepage Extensions ────────────────────────────────

    get storefrontCategories() {
        return this._categories || [];
    }

    get trendingProducts() {
        if (!this._allProducts) return [];
        return this._allProducts.slice(0, 5).map(p => this._formatProductForDisplay(p));
    }

    get festiveDeals() {
        if (!this._allProducts) return [];
        return this._allProducts.slice(5, 10).map(p => this._formatProductForDisplay(p));
    }

    _formatProductForDisplay(p) {
        if (!p) return null;
        let img = null;
        if (p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c) {
            const rawUrl = p.Product_Images__r[0].Image_URL__c;
            if (rawUrl && !rawUrl.includes('placehold.co')) {
                img = rawUrl;
            }
        }
        const categoryName = (p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name) || '';
        if (!img) {
            img = this._getProductImage(p.Name, categoryName);
        }
        return {
            ...p,
            imageUrl: img,
            category: categoryName,
            displayPrice: p.Price__c ? `₹${p.Price__c}` : null,
            variantSummary: 'Multiple variants'
        };
    }

    handleCategoryCardClick(event) {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        this.handleCategoryClick(event);
    }

    get dropdownExpanded() {
        return this._dropdownActive ? 'true' : 'false';
    }

    // ARIA state for the currently hovered category button
    get isCategoryExpanded() {
        return this._categoryDropdownActive ? 'true' : 'false';
    }

    get hasSearchResults() {
        return this._searchResults.length > 0;
    }

    get showNoResults() {
        return this._dropdownActive && !this.hasSearchResults;
    }

    get hasCartItems() {
        return this._cartCount > 0;
    }

    get cartAriaLabel() {
        const n = this._cartCount;
        return n > 0 ? `Cart, ${n} item${n === 1 ? '' : 's'}` : 'Cart, empty';
    }

    get viewAllButtonText() {
        if (this._showAllProducts) {
            return 'Show fewer products ↑';
        }
        return `View all ${this._hoveredCategoryCount} ${this._hoveredCategory || ''} products →`;
    }

    get viewAllAriaLabel() {
        if (this._showAllProducts) {
            return 'Show fewer products';
        }
        return `View all ${this._hoveredCategoryCount} ${this._hoveredCategory || ''} products`;
    }

    get ganeshBannerUrl() {
        return commerceHubGaneshBanner || this._getGaneshSvgDataUrl();
    }

    handleBannerImageError(event) {
        if (event && event.target && event.target.src !== this._getGaneshSvgDataUrl()) {
            event.target.src = this._getGaneshSvgDataUrl();
        }
    }

    _getGaneshSvgDataUrl() {
        return this._createSvgDataUrl(
            '<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="auraGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff7ed" stop-opacity="0.95"/><stop offset="60%" stop-color="#ffedd5" stop-opacity="0.8"/><stop offset="100%" stop-color="#fed7aa" stop-opacity="0"/></radialGradient><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient><linearGradient id="saffronGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ea580c"/><stop offset="100%" stop-color="#c2410c"/></linearGradient><linearGradient id="diyaFlame" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#fef08a"/></linearGradient></defs><circle cx="160" cy="120" r="110" fill="url(#auraGlow)"/><circle cx="160" cy="120" r="90" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="6 4"/><path d="M20 20 Q 90 45, 160 30 Q 230 45, 300 20" fill="none" stroke="#f97316" stroke-width="4" stroke-dasharray="8 6"/><circle cx="50" cy="30" r="6" fill="#eab308"/><circle cx="90" cy="36" r="6" fill="#f97316"/><circle cx="130" cy="32" r="6" fill="#eab308"/><circle cx="190" cy="32" r="6" fill="#eab308"/><circle cx="230" cy="36" r="6" fill="#f97316"/><circle cx="270" cy="30" r="6" fill="#eab308"/><path d="M25 180 Q35 195 45 180 Z" fill="url(#goldGrad)"/><ellipse cx="35" cy="180" rx="10" ry="3" fill="#b45309"/><path d="M35 177 Q31 168 35 160 Q39 168 35 177 Z" fill="url(#diyaFlame)"/><path d="M275 180 Q285 195 295 180 Z" fill="url(#goldGrad)"/><ellipse cx="285" cy="180" rx="10" ry="3" fill="#b45309"/><path d="M285 177 Q281 168 285 160 Q289 168 285 177 Z" fill="url(#diyaFlame)"/><path d="M125 68 L160 18 L195 68 L178 68 L160 38 L142 68 Z" fill="url(#goldGrad)"/><circle cx="160" cy="22" r="5" fill="#ef4444"/><rect x="128" y="65" width="64" height="9" rx="3" fill="url(#saffronGrad)"/><path d="M115 90 C80 72, 70 115, 118 132" fill="url(#goldGrad)" opacity="0.9"/><path d="M205 90 C240 72, 250 115, 202 132" fill="url(#goldGrad)" opacity="0.9"/><path d="M128 74 C128 118, 138 135, 155 140 C168 144, 184 145, 188 158 C192 172, 178 182, 166 182 C156 182, 152 173, 154 167" fill="none" stroke="url(#saffronGrad)" stroke-width="10" stroke-linecap="round"/><circle cx="154" cy="167" r="4" fill="#fde047"/><path d="M138 122 L127 128" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/><path d="M182 122 L188 125" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/><path d="M135 102 Q144 97 150 102" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><path d="M170 102 Q176 97 185 102" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><path d="M152 80 L168 80 M154 84 L166 84 M156 88 L164 88" stroke="#ea580c" stroke-width="2.5"/><line x1="160" y1="75" x2="160" y2="93" stroke="#dc2626" stroke-width="3"/><circle cx="160" cy="95" r="3" fill="#dc2626"/><path d="M146 205 Q160 188 174 205 Q160 213 146 205 Z" fill="url(#goldGrad)"/></svg>'
        );
    }

    // ── Cart ─────────────────────────────────────────────────────────

    _refreshCartCount() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            if (!raw) { this._cartCount = 0; return; }
            const cart = JSON.parse(raw);
            if (!Array.isArray(cart)) { this._cartCount = 0; return; }
            this._cartCount = cart.reduce((sum, item) => {
                const qty = item && Number.isFinite(item.quantity) && item.quantity > 0
                    ? item.quantity : 0;
                return sum + qty;
            }, 0);
        } catch {

            this._cartCount = 0;
        }
    }

    // ── Categories ───────────────────────────────────────────────────

    _buildCategories(products) {
        const seen = new Set();
        const cats = [];
        for (const p of products) {
            const name = p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name;
            // Exclude Automotive
            if (name && name !== 'Automotive' && !seen.has(name)) {
                seen.add(name);
                cats.push({
                    name,
                    key: name,
                    isElectronics: name === 'Electronics',
                    isClothing: name === 'Clothing',
                    isBooks: name === 'Books',
                    isMobiles: name === 'Mobiles',
                    isBeauty: name === 'Beauty',
                    isHome: name === 'Home',
                    isAppliances: name === 'Appliances',
                    isToys: name === 'Toys & Games',
                    isFood: name === 'Food & Grocery',
                    isSports: name === 'Sports & Fitness',
                    isFurniture: name === 'Furniture',
                    isLaptops: name === 'Laptops & Computers',
                    isAudio: name === 'Audio',
                    isTravel: name === 'Travel & Luggage',
                    isWatches: name === 'Watches & Accessories',
                    isPersonalCare: name === 'Personal Care',
                    isKitchen: name === 'Kitchen & Dining'
                });
            }
        }
        cats.sort((a, b) => a.name.localeCompare(b.name));
        this._categories = cats;
        
        // Initial pagination
        this._currentPage = 1;
        this._updatePaginatedCategories();
    }

    _updatePageSize(width) {
        let newSize = 7;
        if (width < 600) {
            newSize = 3;
        } else if (width < 900) {
            newSize = 5;
        }
        if (this._pageSize !== newSize) {
            this._pageSize = newSize;
            this._currentPage = 1;
            this._updatePaginatedCategories();
        }
    }

    _updatePaginatedCategories() {
        if (!this._categories || this._categories.length === 0) {
            this._paginatedCategories = [];
            return;
        }
        const totalPages = Math.ceil(this._categories.length / this._pageSize) || 1;
        if (this._currentPage > totalPages) {
            this._currentPage = totalPages;
        }
        if (this._currentPage < 1) {
            this._currentPage = 1;
        }
        const start = (this._currentPage - 1) * this._pageSize;
        const end = start + this._pageSize;
        this._paginatedCategories = this._categories.slice(start, end);
    }

    get isPrevDisabled() {
        return this._currentPage <= 1;
    }

    get isNextDisabled() {
        if (!this._categories || this._categories.length === 0) return true;
        return (this._currentPage * this._pageSize) >= this._categories.length;
    }

    get hasPreviousPage() {
        return !this.isPrevDisabled;
    }

    get hasNextPage() {
        return !this.isNextDisabled;
    }

    handlePrevPage() {
        if (!this.isPrevDisabled) {
            this._currentPage--;
            this.closeCategoryDropdown();
            this._updatePaginatedCategories();
        }
    }

    handleNextPage() {
        if (!this.isNextDisabled) {
            this._currentPage++;
            this.closeCategoryDropdown();
            this._updatePaginatedCategories();
        }
    }

    // ── Category Dropdown Interaction ─────────────────────────────────

    _updateDropdownProductsForCategory(category) {
        const filtered = (this._allProducts || []).filter(p => 
            p && p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name === category
        );
        this._hoveredCategoryCount = filtered.length;
        const listToDisplay = this._showAllProducts
            ? filtered
            : filtered.slice(0, 8);

        this._dropdownProducts = listToDisplay.map(p => {
            let img = null;
            if (p.Product_Images__r && p.Product_Images__r.length > 0 && p.Product_Images__r[0].Image_URL__c) {
                const rawUrl = p.Product_Images__r[0].Image_URL__c;
                if (rawUrl && !rawUrl.includes('placehold.co')) {
                    img = rawUrl;
                }
            }
            if (!img) {
                img = this._getProductImage(p.Name, category);
            }
            return {
                ...p,
                imageUrl: img,
                displayPrice: p.Price__c ? `₹${p.Price__c}` : null,
                variantSummary: 'Multiple variants'
            };
        });
    }

    handleProductImageError(event) {
        const target = event.currentTarget || event.target;
        const productId = target && target.dataset ? target.dataset.id : null;
        if (productId) {
            const prod = (this._dropdownProducts || []).find(item => item.Id === productId);
            if (prod) {
                prod.imageUrl = this._getProductImage(prod.Name, this._hoveredCategory);
            }
        }
    }

    _getProductImage(name, category) {
        const lowerName = (name || '').toLowerCase();
        const lowerCat = (category || '').toLowerCase();

        // 1. Appliances
        if (lowerName.includes('air fryer') || lowerName.includes('fryer')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="25" y="15" width="50" height="70" rx="12" fill="#1e293b"/><rect x="32" y="22" width="36" height="14" rx="4" fill="#3b82f6"/><circle cx="50" cy="29" r="3" fill="#60a5fa"/><rect x="30" y="42" width="40" height="36" rx="8" fill="#334155"/><rect x="42" y="48" width="16" height="6" rx="3" fill="#64748b"/></svg>'
            );
        }
        if (lowerName.includes('purifier') || lowerName.includes('air purifier')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="32" y="12" width="36" height="76" rx="10" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/><rect x="38" y="20" width="24" height="6" rx="3" fill="#2563eb"/><path d="M38 34h24M38 42h24M38 50h24M38 58h24M38 66h24" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="78" r="3" fill="#10b981"/></svg>'
            );
        }
        if (lowerName.includes('coffee') || lowerName.includes('espresso')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#fff7ed"/><rect x="25" y="15" width="50" height="70" rx="8" fill="#78350f"/><rect x="32" y="22" width="36" height="18" rx="4" fill="#451a03"/><circle cx="50" cy="31" r="3" fill="#f97316"/><rect x="35" y="58" width="30" height="20" rx="4" fill="#fed7aa"/><path d="M35 50h30v4H35z" fill="#9a3412"/></svg>'
            );
        }
        if (lowerName.includes('kettle') || lowerName.includes('iron') || lowerName.includes('blender') || lowerName.includes('cooktop') || lowerName.includes('microwave') || lowerName.includes('mixer') || lowerName.includes('fan') || lowerName.includes('cooker') || lowerName.includes('vacuum') || lowerName.includes('heater') || lowerName.includes('sandwich') || lowerName.includes('toaster') || lowerCat === 'appliances') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="20" y="25" width="60" height="50" rx="10" fill="#334155"/><rect x="28" y="33" width="44" height="26" rx="4" fill="#0284c7"/><circle cx="50" cy="46" r="8" fill="#e0f2fe"/><path d="M30 68h40v3H30z" fill="#94a3b8"/></svg>'
            );
        }

        // 2. Audio
        if (lowerName.includes('speaker') || lowerName.includes('soundbar') || lowerName.includes('headset') || lowerName.includes('earphone') || lowerName.includes('headphones') || lowerName.includes('mic') || lowerName.includes('earbuds') || lowerCat === 'audio') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f1f5f9"/><rect x="20" y="30" width="60" height="40" rx="20" fill="#2563eb"/><circle cx="38" cy="50" r="12" fill="#1e40af"/><circle cx="38" cy="50" r="6" fill="#60a5fa"/><circle cx="62" cy="50" r="12" fill="#1e40af"/><circle cx="62" cy="50" r="6" fill="#60a5fa"/><rect x="45" y="24" width="10" height="6" rx="2" fill="#93c5fd"/></svg>'
            );
        }

        // 3. Beauty
        if (lowerName.includes('aloe') || lowerName.includes('compact') || lowerName.includes('cleanser') || lowerName.includes('mask') || lowerName.includes('serum') || lowerName.includes('foundation') || lowerName.includes('kajal') || lowerName.includes('balm') || lowerName.includes('brush') || lowerName.includes('lip') || lowerName.includes('cream') || lowerName.includes('sunscreen') || lowerCat === 'beauty') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#fff1f2"/><rect x="35" y="35" width="30" height="48" rx="6" fill="#f43f5e"/><rect x="42" y="18" width="16" height="17" rx="3" fill="#fda4af"/><rect x="38" y="14" width="24" height="6" rx="2" fill="#e11d48"/></svg>'
            );
        }

        // 4. Books
        if (lowerCat === 'books' || lowerName.includes('code') || lowerName.includes('guide') || lowerName.includes('book') || lowerName.includes('python') || lowerName.includes('java') || lowerName.includes('ai') || lowerName.includes('ml') || lowerName.includes('system')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f0fdf4"/><path d="M25 20h42a6 6 0 0 1 6 6v54a6 6 0 0 1-6 6H25a3 3 0 0 1-3-3V23a3 3 0 0 1 3-3z" fill="#16a34a"/><rect x="22" y="20" width="8" height="62" fill="#15803d"/><line x1="36" y1="36" x2="62" y2="36" stroke="#bbf7d0" stroke-width="4" stroke-linecap="round"/><line x1="36" y1="48" x2="58" y2="48" stroke="#bbf7d0" stroke-width="4" stroke-linecap="round"/><line x1="36" y1="60" x2="52" y2="60" stroke="#bbf7d0" stroke-width="4" stroke-linecap="round"/></svg>'
            );
        }

        // 5. Clothing
        if (lowerCat === 'clothing' || lowerName.includes('shirt') || lowerName.includes('t-shirt') || lowerName.includes('jacket') || lowerName.includes('jeans') || lowerName.includes('hoodie') || lowerName.includes('pants') || lowerName.includes('shorts')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#fdf2f8"/><path d="M30 18l-15 20 12 8v38h46V46l12-8-15-20-15 8-15-8z" fill="#ec4899"/><path d="M40 18a10 10 0 0 0 20 0" fill="none" stroke="#be185d" stroke-width="3"/></svg>'
            );
        }

        // 6. Electronics
        if (lowerName.includes('tv') || lowerName.includes('television')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="15" y="20" width="70" height="48" rx="4" fill="#1e293b"/><rect x="18" y="23" width="64" height="42" fill="#2563eb"/><path d="M35 78l15-10 15 10" fill="none" stroke="#475569" stroke-width="4" stroke-linecap="round"/></svg>'
            );
        }
        if (lowerName.includes('camera') || lowerName.includes('dslr') || lowerName.includes('projector') || lowerName.includes('console') || lowerCat === 'electronics') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="20" y="30" width="60" height="45" rx="8" fill="#1e293b"/><circle cx="50" cy="52" r="16" fill="#475569" stroke="#94a3b8" stroke-width="3"/><circle cx="50" cy="52" r="8" fill="#3b82f6"/><rect x="32" y="22" width="16" height="8" rx="2" fill="#64748b"/></svg>'
            );
        }

        // 7. Food & Grocery
        if (lowerCat === 'food & grocery' || lowerName.includes('rice') || lowerName.includes('tea') || lowerName.includes('honey') || lowerName.includes('oil') || lowerName.includes('butter') || lowerName.includes('pasta') || lowerName.includes('oats') || lowerName.includes('flour')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#fefce8"/><rect x="30" y="25" width="40" height="55" rx="8" fill="#eab308"/><path d="M40 25V16a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v9" fill="none" stroke="#ca8a04" stroke-width="3"/><circle cx="50" cy="52" r="12" fill="#fef08a"/><path d="M46 52l3 3 5-6" stroke="#854d0e" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
            );
        }

        // 8. Furniture
        if (lowerCat === 'furniture' || lowerName.includes('chair') || lowerName.includes('table') || lowerName.includes('desk') || lowerName.includes('shelf') || lowerName.includes('cabinet') || lowerName.includes('wardrobe')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#fffbe7"/><path d="M25 35h50v20H25z" fill="#b45309"/><rect x="30" y="55" width="8" height="30" fill="#78350f"/><rect x="62" y="55" width="8" height="30" fill="#78350f"/><rect x="20" y="30" width="60" height="8" rx="2" fill="#d97706"/></svg>'
            );
        }

        // 9. Home
        if (lowerCat === 'home' || lowerName.includes('lamp') || lowerName.includes('clock') || lowerName.includes('curtain') || lowerName.includes('cushion') || lowerName.includes('mirror') || lowerName.includes('diffuser') || lowerName.includes('bedsheet')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#faf5ff"/><path d="M30 45l20-25 20 25H30z" fill="#a855f7"/><rect x="46" y="45" width="8" height="32" fill="#7e22ce"/><rect x="38" y="77" width="24" height="6" rx="3" fill="#6b21a8"/><circle cx="50" cy="38" r="6" fill="#fef08a"/></svg>'
            );
        }

        // 10. Kitchen & Dining
        if (lowerCat === 'kitchen & dining' || lowerName.includes('cookware') || lowerName.includes('pan') || lowerName.includes('bottle') || lowerName.includes('knife') || lowerName.includes('cooker') || lowerName.includes('bowl') || lowerName.includes('mug')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f0fdfa"/><ellipse cx="50" cy="55" rx="30" ry="18" fill="#0d9488"/><path d="M20 55v10c0 10 13 18 30 18s30-8 30-18V55" fill="#0f766e"/><path d="M75 50l15-5" stroke="#115e59" stroke-width="5" stroke-linecap="round"/></svg>'
            );
        }

        // 11. Laptops & Computers
        if (lowerName.includes('laptop') || lowerName.includes('macbook') || lowerName.includes('monitor') || lowerName.includes('keyboard') || lowerName.includes('mouse') || lowerCat === 'laptops & computers') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="22" y="20" width="56" height="40" rx="4" fill="#334155"/><rect x="26" y="24" width="48" height="32" fill="#3b82f6"/><path d="M12 64h76v6a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2v-6z" fill="#94a3b8"/><rect x="44" y="66" width="12" height="2" rx="1" fill="#64748b"/></svg>'
            );
        }

        // 12. Mobiles
        if (lowerName.includes('phone') || lowerName.includes('s25') || lowerName.includes('pixel') || lowerName.includes('oneplus') || lowerName.includes('galaxy') || lowerCat === 'mobiles') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="28" y="12" width="44" height="76" rx="8" fill="#0f172a"/><rect x="32" y="16" width="36" height="68" rx="4" fill="#3b82f6"/><circle cx="50" cy="20" r="2" fill="#ffffff"/></svg>'
            );
        }

        // 13. Personal Care
        if (lowerCat === 'personal care' || lowerName.includes('trimmer') || lowerName.includes('dryer') || lowerName.includes('shaver') || lowerName.includes('toothbrush') || lowerName.includes('groomer')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#ecfeff"/><rect x="40" y="15" width="20" height="70" rx="6" fill="#0891b2"/><rect x="44" y="22" width="12" height="12" rx="2" fill="#06b6d4"/><circle cx="50" cy="48" r="4" fill="#cffaff"/></svg>'
            );
        }

        // 14. Sports & Fitness
        if (lowerName.includes('cricket') || lowerName.includes('bat') || lowerName.includes('ball') || lowerName.includes('dumbbell') || lowerName.includes('football') || lowerName.includes('yoga') || lowerCat === 'sports & fitness') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#fef3c7"/><path d="M68 16l-10 10m0 0L32 52a6 6 0 0 0-1.5 4.5l1.5 14a6 6 0 0 0 6 6l14-1.5a6 6 0 0 0 4.5-1.5L84 48z" fill="#d97706" stroke="#b45309" stroke-width="3"/><line x1="62" y1="22" x2="72" y2="32" stroke="#ea580c" stroke-width="4"/><circle cx="24" cy="24" r="8" fill="#dc2626"/></svg>'
            );
        }

        // 15. Toys & Games
        if (lowerCat === 'toys & games' || lowerName.includes('toy') || lowerName.includes('game') || lowerName.includes('car') || lowerName.includes('chess') || lowerName.includes('puzzle') || lowerName.includes('blocks')) {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#eff6ff"/><rect x="20" y="35" width="60" height="30" rx="6" fill="#3b82f6"/><circle cx="35" cy="65" r="10" fill="#1e293b"/><circle cx="65" cy="65" r="10" fill="#1e293b"/><rect x="30" y="25" width="25" height="12" fill="#93c5fd"/></svg>'
            );
        }

        // 16. Travel & Luggage
        if (lowerName.includes('luggage') || lowerName.includes('suitcase') || lowerName.includes('bag') || lowerName.includes('backpack') || lowerCat === 'travel & luggage') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f0f9ff"/><rect x="25" y="30" width="50" height="55" rx="8" fill="#0284c7"/><path d="M40 30V18a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12" fill="none" stroke="#0369a1" stroke-width="4"/><line x1="40" y1="45" x2="40" y2="70" stroke="#38bdf8" stroke-width="3"/><line x1="60" y1="45" x2="60" y2="70" stroke="#38bdf8" stroke-width="3"/><circle cx="35" cy="88" r="4" fill="#1e293b"/><circle cx="65" cy="88" r="4" fill="#1e293b"/></svg>'
            );
        }

        // 17. Watches & Accessories
        if (lowerName.includes('watch') || lowerName.includes('strap') || lowerCat === 'watches & accessories') {
            return this._createSvgDataUrl(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f8fafc"/><rect x="42" y="10" width="16" height="80" rx="4" fill="#334155"/><circle cx="50" cy="50" r="24" fill="#ffffff" stroke="#2563eb" stroke-width="4"/><circle cx="50" cy="50" r="20" fill="#f1f5f9"/><polyline points="50 36 50 50 60 56" fill="none" stroke="#1e3a8a" stroke-width="3" stroke-linecap="round"/></svg>'
            );
        }

        // Default Commerce Hub product fallback
        return this._createSvgDataUrl(
            '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="16" fill="#f1f5f9"/><rect x="25" y="25" width="50" height="50" rx="8" fill="#2563eb" opacity="0.85"/><circle cx="40" cy="40" r="6" fill="#ffffff"/><path d="M30 65l12-15 10 10 15-18 8 23H30z" fill="#93c5fd"/></svg>'
        );
    }

    _createSvgDataUrl(svgString) {
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
    }

    handleCategoryHover(event) {
        if (this._dropdownTimeout) {
            clearTimeout(this._dropdownTimeout);
        }
        const targetEl = event.currentTarget || event.target;
        const category = targetEl && targetEl.dataset ? targetEl.dataset.category : null;
        if (category && this._hoveredCategory !== category) {
            this._hoveredCategory = category;
            this._showAllProducts = false;
            this._updateDropdownProductsForCategory(category);
        }
        if (category) {
            this._categoryDropdownActive = true;
        }
    }

    closeCategoryDropdownDelay() {
        if (this._dropdownTimeout) {
            clearTimeout(this._dropdownTimeout);
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._dropdownTimeout = setTimeout(() => {
            this._categoryDropdownActive = false;
        }, 150); // slight delay for natural pointer movement
    }

    keepCategoryDropdownOpen() {
        if (this._dropdownTimeout) {
            clearTimeout(this._dropdownTimeout);
        }
    }
    
    closeCategoryDropdown() {
        if (this._dropdownTimeout) {
            clearTimeout(this._dropdownTimeout);
        }
        this._categoryDropdownActive = false;
        this._showAllProducts = false;
    }

    handleDropdownProductClick(event) {
        const targetEl = (event && event.currentTarget) || (event && event.target);
        const productId = targetEl && targetEl.dataset ? targetEl.dataset.id : null;
        this.closeCategoryDropdown();
        if (productId) {
            this.dispatchEvent(
                new CustomEvent('productselect', {
                    detail: { productId },
                    bubbles: true,
                    composed: true
                })
            );
            try {
                const navPromise = this[NavigationMixin.Navigate]({
                    type: 'comm__namedPage',
                    attributes: { name: 'Product_Detail' },
                    state: { productId }
                });
                if (navPromise && typeof navPromise.catch === 'function') {
                    navPromise.catch((err) => {
                        console.warn(
                            `[Commerce Hub navigationBar] Product Detail navigation for product "${productId}" ` +
                            `could not complete: Target page 'Product_Detail' is not yet registered.`,
                            err
                        );
                    });
                }
            } catch (err) {
                console.warn(
                    `[Commerce Hub navigationBar] Product Detail navigation error for product "${productId}":`,
                    err
                );
            }
        }
    }

    handleViewAllCategory() {
        if (!this._hoveredCategory) {
            return;
        }

        // Toggle between compact preview and full category product expansion
        this._showAllProducts = !this._showAllProducts;
        this._updateDropdownProductsForCategory(this._hoveredCategory);

        if (this._dropdownTimeout) {
            clearTimeout(this._dropdownTimeout);
        }
        this._categoryDropdownActive = true;

        this.dispatchEvent(
            new CustomEvent('categoryexpand', {
                detail: {
                    category: this._hoveredCategory,
                    expanded: this._showAllProducts,
                    count: this._hoveredCategoryCount
                },
                bubbles: true,
                composed: true
            })
        );
    }

    // ── Search ───────────────────────────────────────────────────────

    handleSearchFocus() {
        if (this._searchTerm.trim()) {
            this._dropdownActive = true;
        }
    }

    handleSearchBlur() {
        this._dropdownActive = false;
    }

    handleSearchInput(event) {
        const term = event.target.value;
        this._searchTerm = term;
        const trimmed = term.trim();
        if (!trimmed) {
            this._searchResults = [];
            this._dropdownActive = false;
            return;
        }
        this._filterProducts(trimmed);
        this._dropdownActive = true;
    }

    _filterProducts(term) {
        const lower = term.toLowerCase();
        const results = [];
        for (const p of this._allProducts) {
            if (results.length >= MAX_RESULTS) break;
            const name = (p.Name || '').toLowerCase();
            const code = (p.ProductCode || '').toLowerCase();
            const desc = (p.Description || '').toLowerCase();
            const cat = (p.Commerce_Hub_Category__r && p.Commerce_Hub_Category__r.Name) || '';
            if (
                name.includes(lower) ||
                code.includes(lower) ||
                desc.includes(lower) ||
                cat.toLowerCase().includes(lower)
            ) {
                results.push({ id: p.Id, name: p.Name, category: cat || null });
            }
        }
        this._searchResults = results;
    }

    // Prevents input blur firing before the result click registers.
    preventBlur(event) {
        event.preventDefault();
    }

    handleResultClick(event) {
        const productId = event.currentTarget.dataset.id;
        this._clearSearch();
        // Page name 'Product_Detail' must exist in Experience Builder. See Phase report.
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'Product_Detail' },
            state: { productId },
        });
    }

    _clearSearch() {
        const input = this.template.querySelector('.search-input');
        if (input) input.value = '';
        this._searchTerm = '';
        this._searchResults = [];
        this._dropdownActive = false;
    }

    // ── Navigation ───────────────────────────────────────────────────

    handleBrandClick() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'Home' },
        });
    }

    handleLoginClick() {
        // Use LWR-native navigation to resolve LWR4002 context error
        if (this.navContext) {
            navigate(this.navContext, {
                type: 'comm__loginPage',
                attributes: { actionName: 'login' }
            });
        }
    }

    handleCartClick() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'Cart' },
        });
    }

    handleCategoryClick(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        const targetEl = (event && event.currentTarget) || (event && event.target);
        const category = targetEl && targetEl.dataset ? targetEl.dataset.category : null;
        
        // Touch toggle support: if tapping already open dropdown, close it.
        // Otherwise, open it (and view all link can be used to navigate).
        if (category && this._hoveredCategory === category && this._categoryDropdownActive) {
            this.closeCategoryDropdown();
        } else if (category) {
            this.handleCategoryHover(event);
        }
    }

    // ── Delivery Location Extensions ─────────────────────────────────

    get displayedDeliveryLocation() {
        if (this._selectedAddress) {
            return this._formatAddressCompact(this._selectedAddress);
        }
        if (this._defaultAddress) {
            return this._formatAddressCompact(this._defaultAddress);
        }
        return 'Location not set';
    }

    _formatAddressCompact(addr) {
        if (!addr) return 'Location not set';
        const parts = [];
        if (addr.City__c) parts.push(addr.City__c);
        if (addr.Postal_Code__c) parts.push(addr.Postal_Code__c);
        if (parts.length > 0) return parts.join(' · ');
        return addr.Street__c || 'Deliver here';
    }

    openLocationDrawer() {
        this._isLocationDrawerOpen = true;
        this._isAddingNewAddress = false;
        this._locationSearchTerm = '';
        this._filterSavedAddresses();
    }

    closeLocationDrawer() {
        this._isLocationDrawerOpen = false;
    }

    handleLocationSearchInput(event) {
        this._locationSearchTerm = (event.target.value || '').toLowerCase().trim();
        this._filterSavedAddresses();
    }

    _filterSavedAddresses() {
        if (!this._locationSearchTerm) {
            this._filteredAddresses = [...this._savedAddresses];
            return;
        }
        const term = this._locationSearchTerm;
        this._filteredAddresses = this._savedAddresses.filter(addr => {
            const street = (addr.Street__c || '').toLowerCase();
            const city = (addr.City__c || '').toLowerCase();
            const pin = (addr.Postal_Code__c || '').toLowerCase();
            return street.includes(term) || city.includes(term) || pin.includes(term);
        });
    }

    handleCurrentLocationClick() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    alert('Location feature accessed successfully. Existing saved addresses remain the delivery source of truth.');
                },
                () => {
                    alert('Location access denied or unavailable.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    handleAddressSelect(event) {
        const addrId = event.currentTarget.dataset.id;
        const selected = this._savedAddresses.find(a => a.Id === addrId);
        if (selected) {
            this._selectedAddress = selected;
            this.closeLocationDrawer();
        }
    }

    get hasSavedAddresses() {
        return this._filteredAddresses.length > 0;
    }

    get formattedFilteredAddresses() {
        const defaultId = this._defaultAddress ? this._defaultAddress.Id : null;
        const selectedId = this._selectedAddress ? this._selectedAddress.Id : defaultId;
        
        return this._filteredAddresses.map(addr => ({
            ...addr,
            isSelected: addr.Id === selectedId,
            isDefault: addr.Is_Default__c,
            cssClass: addr.Id === selectedId ? 'address-card selected' : 'address-card'
        }));
    }

    handleAddAddressClick() {
        this._isAddingNewAddress = true;
    }

    handleCancelAddAddress() {
        this._isAddingNewAddress = false;
    }

    handleSaveNewAddress(event) {
        event.preventDefault();
        const inputs = this.template.querySelectorAll('.address-form-input');
        let allValid = true;
        const fields = {};
        
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                allValid = false;
            } else {
                if (input.type === 'checkbox') {
                    fields[input.dataset.field] = input.checked;
                } else {
                    fields[input.dataset.field] = input.value;
                }
            }
        });

        if (!allValid) return;

        saveNewAddress({ addressFields: fields })
            .then(newAddr => {
                this._selectedAddress = newAddr;
                this._isAddingNewAddress = false;
                this.closeLocationDrawer();
                if (this._addressesWireResult) refreshApex(this._addressesWireResult);
                if (this._defaultAddressWireResult) refreshApex(this._defaultAddressWireResult);
            })
            .catch(error => {
                console.error('Error saving address:', error);
                alert('Error saving address. Please try again.');
            });
    }
}
