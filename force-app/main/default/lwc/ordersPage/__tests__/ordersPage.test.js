import { createElement } from 'lwc';
import OrdersPage from 'c/ordersPage';

describe('c-orders-page', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders empty orders state when no orders exist in memory', () => {
        const element = createElement('c-orders-page', {
            is: OrdersPage
        });
        document.body.appendChild(element);

        const emptyTitle = element.shadowRoot.querySelector('.empty-title');
        expect(emptyTitle).not.toBeNull();
        expect(emptyTitle.textContent).toBe('No orders placed yet');
    });

    it('renders orders, Stripe payment badge, and item images from persistent storage', async () => {
        const mockOrders = [
            {
                orderId: 'ord-101',
                orderNumber: 'CH-STRIPE-893201',
                formattedDate: '17 Sep 2026, 05:30 PM',
                status: 'Confirmed',
                shippingStatus: 'Preparing for Dispatch',
                paymentMethod: 'Stripe',
                paymentStatus: 'PAID',
                stripeTransactionId: 'ch_test_9928172648',
                itemCount: 2,
                totalAmount: 9998,
                shippingCharge: 0,
                shippingAddress: { City__c: 'Mumbai', State__c: 'Maharashtra' },
                items: [
                    {
                        id: 'APP001',
                        name: 'Digital Air Fryer 4.5L',
                        category: 'appliances',
                        subcategory: 'Kitchen',
                        price: 4999,
                        quantity: 2,
                        itemTotal: 9998,
                        imageUrl: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500'
                    }
                ]
            }
        ];
        localStorage.setItem('commerceHubOrders', JSON.stringify(mockOrders));

        const element = createElement('c-orders-page', {
            is: OrdersPage
        });
        document.body.appendChild(element);

        await Promise.resolve();

        const orderCards = element.shadowRoot.querySelectorAll('.order-card');
        expect(orderCards.length).toBe(1);

        const orderNum = element.shadowRoot.querySelector('.order-num');
        expect(orderNum.textContent).toBe('CH-STRIPE-893201');

        const stripeBadge = element.shadowRoot.querySelector('.stripe-paid-badge');
        expect(stripeBadge).not.toBeNull();
        expect(stripeBadge.textContent).toContain('Paid with Stripe');

        const txCode = element.shadowRoot.querySelector('.tx-code');
        expect(txCode.textContent).toBe('ch_test_9928172648');

        const itemImg = element.shadowRoot.querySelector('.item-thumb-img');
        expect(itemImg).not.toBeNull();
        expect(itemImg.src).toContain('images.unsplash.com');

        const itemName = element.shadowRoot.querySelector('.item-name');
        expect(itemName.textContent).toBe('Digital Air Fryer 4.5L');
    });

    it('filters orders by search query', async () => {
        const mockOrders = [
            {
                orderId: 'ord-101',
                orderNumber: 'CH-STRIPE-111111',
                totalAmount: 1200,
                items: [{ id: 'p1', name: 'Smart TV', quantity: 1, price: 1200 }]
            },
            {
                orderId: 'ord-102',
                orderNumber: 'CH-STRIPE-222222',
                totalAmount: 500,
                items: [{ id: 'p2', name: 'Cotton T-Shirt', quantity: 1, price: 500 }]
            }
        ];
        localStorage.setItem('commerceHubOrders', JSON.stringify(mockOrders));

        const element = createElement('c-orders-page', {
            is: OrdersPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const searchInput = element.shadowRoot.querySelector('.search-input');
        expect(searchInput).not.toBeNull();

        searchInput.value = 'Smart TV';
        searchInput.dispatchEvent(new CustomEvent('input'));

        await Promise.resolve();

        const cards = element.shadowRoot.querySelectorAll('.order-card');
        expect(cards.length).toBe(1);
        expect(element.shadowRoot.querySelector('.order-num').textContent).toBe('CH-STRIPE-111111');
    });

    it('dispatches backtohome event when home link or Start Shopping is clicked', () => {
        const element = createElement('c-orders-page', {
            is: OrdersPage
        });
        document.body.appendChild(element);

        const handler = jest.fn();
        element.addEventListener('backtohome', handler);

        const shopBtn = element.shadowRoot.querySelector('.btn-shop-now');
        expect(shopBtn).not.toBeNull();
        shopBtn.click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('dispatches productselect event when product in order is clicked', async () => {
        const mockOrders = [
            {
                orderId: 'ord-101',
                orderNumber: 'CH-STRIPE-111111',
                items: [{ id: 'APP001', name: 'Air Fryer', category: 'appliances', quantity: 1, price: 4499 }]
            }
        ];
        localStorage.setItem('commerceHubOrders', JSON.stringify(mockOrders));

        const element = createElement('c-orders-page', {
            is: OrdersPage
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const handler = jest.fn();
        element.addEventListener('productselect', handler);

        const itemName = element.shadowRoot.querySelector('.item-name');
        expect(itemName).not.toBeNull();
        itemName.click();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail.productId).toBe('APP001');
    });
});
