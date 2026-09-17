import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getOrders } from 'c/orderService';

const DEFAULT_IMAGE_FALLBACK =
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60';

export default class OrdersPage extends NavigationMixin(LightningElement) {
    @track rawOrders = [];
    @track searchQuery = '';
    _orderListener = null;

    connectedCallback() {
        this.refreshOrders();
        this._orderListener = () => {
            this.refreshOrders();
        };
        document.addEventListener('commercehuborderupdate', this._orderListener);
    }

    disconnectedCallback() {
        if (this._orderListener) {
            document.removeEventListener('commercehuborderupdate', this._orderListener);
            this._orderListener = null;
        }
    }

    refreshOrders() {
        this.rawOrders = getOrders();
    }

    get hasOrders() {
        return this.filteredOrders && this.filteredOrders.length > 0;
    }

    get orderCount() {
        return this.rawOrders ? this.rawOrders.length : 0;
    }

    get orderCountLabel() {
        return this.orderCount === 1 ? 'order' : 'orders';
    }

    get filteredOrders() {
        const query = (this.searchQuery || '').trim().toLowerCase();
        const list = (this.rawOrders || []).map((ord) => {
            const shippingCharge = Number(ord.shippingCharge) || 0;
            const shippingChargeLabel = shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`;

            const items = (ord.items || []).map((item) => ({
                ...item,
                itemTotal: (Number(item.price) || 0) * (Number(item.quantity) || 1),
                imageUrl: item.imageUrl || DEFAULT_IMAGE_FALLBACK
            }));

            return {
                ...ord,
                shippingChargeLabel,
                items
            };
        });

        if (!query) return list;

        return list.filter((ord) => {
            const numMatch = (ord.orderNumber || '').toLowerCase().includes(query);
            const idMatch = (ord.orderId || '').toLowerCase().includes(query);
            const txMatch = (ord.stripeTransactionId || '').toLowerCase().includes(query);
            const itemMatch = (ord.items || []).some((i) =>
                (i.name || '').toLowerCase().includes(query)
            );
            return numMatch || idMatch || txMatch || itemMatch;
        });
    }

    // ── Handlers ───────────────────────────────────────────────────────

    handleSearchInput(event) {
        this.searchQuery = event.target.value;
    }

    handleClearSearch() {
        this.searchQuery = '';
    }

    handleProductSelect(event) {
        const productId = event.currentTarget.dataset.id;
        const category = event.currentTarget.dataset.category || 'appliances';
        this.dispatchEvent(
            new CustomEvent('productselect', {
                detail: { productId, category },
                bubbles: true,
                composed: true
            })
        );
    }

    handleBackToHome(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('backtohome', {
                bubbles: true,
                composed: true
            })
        );

        const isLocalDev =
            typeof window !== 'undefined' &&
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
                console.warn('[OrdersPage] Home navigation error:', err);
            }
        }
    }

    handleImageFallback(event) {
        event.target.onerror = null;
        event.target.src = DEFAULT_IMAGE_FALLBACK;
    }
}
