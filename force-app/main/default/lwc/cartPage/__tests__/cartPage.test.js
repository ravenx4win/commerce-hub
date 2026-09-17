import { createElement } from 'lwc';
import CartPage from 'c/cartPage';

describe('c-cart-page', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders empty cart state by default', () => {
        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);

        const emptyTitle = element.shadowRoot.querySelector('.empty-cart-title');
        expect(emptyTitle).not.toBeNull();
        expect(emptyTitle.textContent).toBe('Your shopping cart is empty');
    });

    it('renders items and images when items exist in localStorage array', async () => {
        const mockItems = [
            {
                id: 'prod-1',
                name: 'Test Air Fryer',
                price: 4999,
                originalPrice: 8999,
                quantity: 2,
                category: 'Appliances',
                subcategory: 'Kitchen',
                imageUrl: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500&auto=format&fit=crop&q=60'
            }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);

        await Promise.resolve();

        const itemCards = element.shadowRoot.querySelectorAll('.cart-item-card');
        expect(itemCards.length).toBe(1);

        const title = element.shadowRoot.querySelector('.item-title');
        expect(title.textContent).toBe('Test Air Fryer');

        const image = element.shadowRoot.querySelector('.item-img');
        expect(image).not.toBeNull();
        expect(image.src).toBe('https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500&auto=format&fit=crop&q=60');

        const subtotal = element.shadowRoot.querySelector('.item-subtotal');
        expect(subtotal.textContent).toBe('₹9998');

        const badge = element.shadowRoot.querySelector('.item-count-badge');
        expect(badge.textContent).toBe('2 items');
    });

    it('increments item quantity when plus button is clicked', async () => {
        const mockItems = [
            {
                id: 'prod-1',
                name: 'Test Item',
                price: 1000,
                originalPrice: 1500,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1'
            }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const plusBtn = element.shadowRoot.querySelector('.btn-plus');
        expect(plusBtn).not.toBeNull();
        plusBtn.click();

        await Promise.resolve();

        const qtyVal = element.shadowRoot.querySelector('.qty-val');
        expect(qtyVal.textContent).toBe('2');

        const saved = JSON.parse(localStorage.getItem('commerceHubCart'));
        expect(saved[0].quantity).toBe(2);
    });

    it('decrements item quantity when minus button is clicked', async () => {
        const mockItems = [
            {
                id: 'prod-1',
                name: 'Test Item',
                price: 1000,
                originalPrice: 1500,
                quantity: 3,
                imageUrl: 'https://images.unsplash.com/photo-1'
            }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const minusBtn = element.shadowRoot.querySelector('.btn-minus');
        expect(minusBtn).not.toBeNull();
        minusBtn.click();

        await Promise.resolve();

        const qtyVal = element.shadowRoot.querySelector('.qty-val');
        expect(qtyVal.textContent).toBe('2');

        const saved = JSON.parse(localStorage.getItem('commerceHubCart'));
        expect(saved[0].quantity).toBe(2);
    });

    it('removes item when remove button is clicked', async () => {
        const mockItems = [
            {
                id: 'prod-1',
                name: 'Item to Remove',
                price: 500,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1'
            }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const removeBtn = element.shadowRoot.querySelector('.btn-remove-item');
        expect(removeBtn).not.toBeNull();
        removeBtn.click();

        await Promise.resolve();

        const saved = JSON.parse(localStorage.getItem('commerceHubCart'));
        expect(saved.length).toBe(0);

        const emptyTitle = element.shadowRoot.querySelector('.empty-cart-title');
        expect(emptyTitle).not.toBeNull();
    });

    it('clears entire cart when clear cart button is clicked', async () => {
        const mockItems = [
            { id: 'prod-1', name: 'Item 1', price: 500, quantity: 1 },
            { id: 'prod-2', name: 'Item 2', price: 700, quantity: 2 }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const clearBtn = element.shadowRoot.querySelector('.btn-clear-cart');
        expect(clearBtn).not.toBeNull();
        clearBtn.click();

        await Promise.resolve();

        const saved = JSON.parse(localStorage.getItem('commerceHubCart'));
        expect(saved.length).toBe(0);

        const emptyTitle = element.shadowRoot.querySelector('.empty-cart-title');
        expect(emptyTitle).not.toBeNull();
    });

    it('applies coupon code correctly and recalculates summary', async () => {
        const mockItems = [
            { id: 'prod-1', name: 'High Value Item', price: 2000, quantity: 1 }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const festivePill = element.shadowRoot.querySelector('button[data-code="FESTIVE20"]');
        expect(festivePill).not.toBeNull();
        festivePill.click();

        await Promise.resolve();

        const promoBadge = element.shadowRoot.querySelector('.promo-code-tag');
        expect(promoBadge).not.toBeNull();
        expect(promoBadge.textContent).toContain('FESTIVE20');

        const grandTotal = element.shadowRoot.querySelector('.grand-total');
        expect(grandTotal).not.toBeNull();
        // 2000 - 20% (400) = 1600 (shipping free since subtotal >= 999)
        expect(grandTotal.textContent).toBe('₹1600');
    });

    it('dispatches backtohome event when home link or continue shopping button is clicked', () => {
        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);

        const handler = jest.fn();
        element.addEventListener('backtohome', handler);

        const shopNowBtn = element.shadowRoot.querySelector('.btn-shop-now');
        expect(shopNowBtn).not.toBeNull();
        shopNowBtn.click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('dispatches checkout event when proceed to checkout button is clicked', async () => {
        const mockItems = [
            { id: 'prod-1', name: 'Item 1', price: 1500, quantity: 1 }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const handler = jest.fn();
        element.addEventListener('checkout', handler);

        const checkoutBtn = element.shadowRoot.querySelector('.btn-checkout');
        expect(checkoutBtn).not.toBeNull();
        checkoutBtn.click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('dispatches productselect event when product title or image is clicked', async () => {
        const mockItems = [
            {
                id: 'APP001',
                name: 'Air Fryer',
                category: 'Appliances',
                price: 4499,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1'
            }
        ];
        localStorage.setItem('commerceHubCart', JSON.stringify(mockItems));

        const element = createElement('c-cart-page', {
            is: CartPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const handler = jest.fn();
        element.addEventListener('productselect', handler);

        const title = element.shadowRoot.querySelector('.item-title');
        expect(title).not.toBeNull();
        title.click();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail.productId).toBe('APP001');
    });
});
