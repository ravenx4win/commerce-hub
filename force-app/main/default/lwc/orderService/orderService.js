/**
 * @description Persistent order management service for Commerce Hub.
 *              Stores all placed customer orders in an array retained across browser refreshes.
 */

const ORDERS_STORAGE_KEY = 'commerceHubOrders';

/**
 * Returns all saved orders from browser storage memory.
 */
export function getOrders() {
    try {
        const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.warn('[orderService] Error reading orders from localStorage');
        return [];
    }
}

/**
 * Appends a new order into the persistent orders array using .push().
 */
export function saveOrder(order) {
    if (!order) return null;

    const orders = getOrders();

    const orderId = order.orderId || `ORD-${Date.now()}`;
    const orderNumber = order.orderNumber || `CH-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const newOrder = {
        orderId: orderId,
        orderNumber: orderNumber,
        orderDate: order.orderDate || now.toISOString(),
        formattedDate: order.formattedDate || now.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        status: order.status || 'Confirmed',
        shippingStatus: order.shippingStatus || 'Preparing for Dispatch',
        paymentMethod: order.paymentMethod || 'Stripe',
        paymentStatus: order.paymentStatus || 'PAID',
        stripeTransactionId: order.stripeTransactionId || null,
        stripePaymentIntentId: order.stripePaymentIntentId || null,
        cardLast4: order.cardLast4 || null,
        cardBrand: order.cardBrand || null,
        items: Array.isArray(order.items) ? order.items : [],
        itemCount: Array.isArray(order.items)
            ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
            : 0,
        shippingAddress: order.shippingAddress || null,
        subtotal: Number(order.subtotal) || 0,
        tax: Number(order.tax) || 0,
        shippingCharge: Number(order.shippingCharge) || 0,
        discount: Number(order.discount) || 0,
        totalAmount: Number(order.totalAmount) || 0,
        trackingSteps: [
            { label: 'Order Placed', status: 'completed', time: 'Just now' },
            { label: 'Payment Confirmed (Stripe)', status: 'completed', time: 'Just now' },
            { label: 'Preparing Dispatch', status: 'active', time: 'Estimated tomorrow' },
            { label: 'Delivered', status: 'upcoming', time: 'Within 2-4 business days' }
        ]
    };

    // Use .push() to add order to the array
    orders.unshift(newOrder); // Newest orders first for UI, or push to store

    try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        notifyOrderUpdate(newOrder);
    } catch {
        console.warn('[orderService] Error persisting orders to localStorage');
    }

    return newOrder;
}

/**
 * Finds a specific order by orderId or orderNumber.
 */
export function getOrderById(targetId) {
    if (!targetId) return null;
    const orders = getOrders();
    return orders.find(
        (o) => o.orderId === targetId || o.orderNumber === targetId || o.stripeTransactionId === targetId
    ) || null;
}

/**
 * Clears all orders (useful for reset or testing).
 */
export function clearOrders() {
    try {
        localStorage.removeItem(ORDERS_STORAGE_KEY);
        notifyOrderUpdate(null);
    } catch {
        // ignore
    }
}

/**
 * Dispatches a cross-component custom event on document to synchronize order state.
 */
export function notifyOrderUpdate(latestOrder) {
    const orders = getOrders();
    document.dispatchEvent(
        new CustomEvent('commercehuborderupdate', {
            detail: {
                count: orders.length,
                orders: orders,
                latestOrder: latestOrder
            },
            bubbles: true,
            composed: true
        })
    );
}
