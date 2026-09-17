import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import {
    getCartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    removePromoCode,
    calculateCartSummary,
    getAppliedPromo
} from 'c/cartService';

export default class CartPage extends NavigationMixin(LightningElement) {
    @track cartRawItems = [];
    @track couponInput = '';
    @track showToast = false;
    @track toastMessage = '';
    _toastTimeout = null;
    _cartListener = null;

    connectedCallback() {
        this.refreshCartState();
        this._cartListener = () => {
            this.refreshCartState();
        };
        document.addEventListener('commercehubcartupdate', this._cartListener);
    }

    disconnectedCallback() {
        if (this._cartListener) {
            document.removeEventListener('commercehubcartupdate', this._cartListener);
        }
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
    }

    refreshCartState() {
        this.cartRawItems = getCartItems();
    }

    get cartItems() {
        return (this.cartRawItems || []).map((item) => {
            const qty = item.quantity || 1;
            const price = Number(item.price) || 0;
            const origPrice = Number(item.originalPrice || price) || price;
            const img = item.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60';

            return {
                ...item,
                price,
                originalPrice: origPrice > price ? origPrice : null,
                imageUrl: img,
                quantity: qty,
                itemTotal: price * qty
            };
        });
    }

    get hasItems() {
        return this.cartItems && this.cartItems.length > 0;
    }

    get itemCount() {
        return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    get itemLabel() {
        return this.itemCount === 1 ? 'item' : 'items';
    }

    get summary() {
        return calculateCartSummary();
    }

    get appliedPromo() {
        return getAppliedPromo();
    }

    get hasAppliedPromo() {
        return !!this.appliedPromo;
    }

    get isFreeShipping() {
        return this.summary.shipping === 0;
    }

    get isFreeShippingUnlocked() {
        return this.summary.subtotal >= this.summary.shippingThreshold;
    }

    get amountNeededForFreeShipping() {
        return Math.max(0, this.summary.shippingThreshold - this.summary.subtotal);
    }

    get shippingProgressPercent() {
        if (this.isFreeShippingUnlocked) return 100;
        return Math.min(100, Math.round((this.summary.subtotal / this.summary.shippingThreshold) * 100));
    }

    get shippingProgressStyle() {
        return `width: ${this.shippingProgressPercent}%;`;
    }

    get hasTotalSavings() {
        return this.summary.totalDiscount > 0;
    }

    // ── Handlers ───────────────────────────────────────────────────────

    handleBackToHome(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('backtohome', {
                bubbles: true,
                composed: true
            })
        );
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

    handleIncrementQty(event) {
        const productId = event.currentTarget.dataset.id;
        const target = this.cartItems.find((i) => i.id === productId);
        if (target) {
            updateQuantity(productId, target.quantity + 1);
        }
    }

    handleDecrementQty(event) {
        const productId = event.currentTarget.dataset.id;
        const target = this.cartItems.find((i) => i.id === productId);
        if (target) {
            updateQuantity(productId, target.quantity - 1);
        }
    }

    handleRemoveItem(event) {
        const productId = event.currentTarget.dataset.id;
        const target = this.cartItems.find((i) => i.id === productId);
        removeFromCart(productId);
        if (target) {
            this.triggerToast(`Removed "${target.name}" from your cart.`);
        }
    }

    handleClearCart() {
        clearCart();
        this.triggerToast('Cart cleared.');
    }

    handleCouponInput(event) {
        this.couponInput = event.target.value;
    }

    handleCouponKeyUp(event) {
        if (event.key === 'Enter') {
            this.handleApplyCoupon();
        }
    }

    handleApplyCoupon() {
        if (!this.couponInput || !this.couponInput.trim()) {
            this.triggerToast('Please enter a coupon code.');
            return;
        }
        const res = applyPromoCode(this.couponInput);
        this.triggerToast(res.message);
        if (res.success) {
            this.couponInput = '';
        }
    }

    handleQuickApplyPromo(event) {
        const code = event.currentTarget.dataset.code;
        const res = applyPromoCode(code);
        this.triggerToast(res.message);
    }

    handleRemoveCoupon() {
        removePromoCode();
        this.triggerToast('Coupon removed.');
    }

    handleProceedToCheckout() {
        this.dispatchEvent(
            new CustomEvent('checkout', {
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
                    attributes: { url: '/checkout' }
                });
            } catch (err) {
                console.warn('[CartPage] Checkout navigation error:', err);
            }
        }
    }

    handleImageError(event) {
        event.target.onerror = null;
        event.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60';
    }

    triggerToast(msg) {
        this.toastMessage = msg;
        this.showToast = true;
        if (this._toastTimeout) clearTimeout(this._toastTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._toastTimeout = setTimeout(() => {
            this.showToast = false;
        }, 2600);
    }
}