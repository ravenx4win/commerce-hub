const CART_STORAGE_KEY = 'commerceHubCart';
const PROMO_STORAGE_KEY = 'commerceHubAppliedPromo';

export function getCartItems() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.warn("[cartService] Error parsing cart from localStorage");
        return [];
    }
}

export function saveCartItems(items) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        notifyCartUpdate();
    } catch {
        console.warn("[cartService] Error saving cart to localStorage");
    }
}

export function addToCart(product, quantity = 1) {
    if (!product) return;
    const prodId = product.id || product.Id;
    if (!prodId) return;

    const items = getCartItems();
    const existingIndex = items.findIndex((item) => item.id === prodId);

    const name = product.name || product.Name || 'Product';
    const price = Number(product.price != null ? product.price : product.Price__c) || 0;
    const originalPrice = Number(
        product.originalPrice != null
            ? product.originalPrice
            : (product.Original_Price__c != null ? product.Original_Price__c : price)
    ) || price;
    const imageUrl = product.imageUrl || product.Image_URL__c || '';
    const subcategory = product.subcategory || product.subCategory || product.Subcategory__c || '';
    const category = product.category || (product.Commerce_Hub_Category__r ? product.Commerce_Hub_Category__r.Name : '');
    const badge = product.badge || product.Badge__c || null;
    const badgeClass = product.badgeClass || null;

    const variantId = product.variantId || product.variant_id || (typeof prodId === 'string' && prodId.startsWith('a05') ? prodId : null);
    const sku = product.sku || product.productCode || product.ProductCode || '';
    const productCode = product.productCode || product.ProductCode || '';

    if (existingIndex > -1) {
        items[existingIndex].quantity = (items[existingIndex].quantity || 1) + quantity;
        if (!items[existingIndex].imageUrl && imageUrl) {
            items[existingIndex].imageUrl = imageUrl;
        }
        if (!items[existingIndex].variantId && variantId) {
            items[existingIndex].variantId = variantId;
        }
    } else {
        // Push item into cart array
        items.push({
            id: prodId,
            variantId: variantId,
            sku: sku,
            productCode: productCode,
            name: name,
            price: price,
            originalPrice: originalPrice,
            imageUrl: imageUrl,
            subcategory: subcategory,
            category: category,
            quantity: quantity,
            badge: badge,
            badgeClass: badgeClass
        });
    }

    // Save cart array to localStorage so it is retained across page refreshes
    saveCartItems(items);
}

export function updateQuantity(productId, quantity) {
    let items = getCartItems();
    if (quantity <= 0) {
        items = items.filter((item) => item.id !== productId);
    } else {
        const target = items.find((item) => item.id === productId);
        if (target) {
            target.quantity = quantity;
        }
    }
    saveCartItems(items);
}

export function removeFromCart(productId) {
    const items = getCartItems().filter((item) => item.id !== productId);
    saveCartItems(items);
}

export function clearCart() {
    saveCartItems([]);
    try {
        localStorage.removeItem(PROMO_STORAGE_KEY);
    } catch {
        // ignore
    }
}

export function getAppliedPromo() {
    try {
        const raw = localStorage.getItem(PROMO_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function applyPromoCode(codeStr) {
    const code = (codeStr || '').trim().toUpperCase();
    if (!code) {
        return { success: false, message: 'Please enter a coupon code.' };
    }

    const VALID_PROMOS = {
        'FESTIVE20': { code: 'FESTIVE20', discountPercent: 20, description: 'Festive Offer: 20% OFF Total' },
        'WELCOME10': { code: 'WELCOME10', discountPercent: 10, description: 'Welcome Offer: 10% OFF Total' },
        'CHUB500': { code: 'CHUB500', flatDiscount: 500, description: 'CommerceHub Special: ₹500 OFF' }
    };

    if (VALID_PROMOS[code]) {
        const promo = VALID_PROMOS[code];
        try {
            localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promo));
            notifyCartUpdate();
        } catch {
            // ignore
        }
        return { success: true, promo, message: `Coupon "${code}" applied successfully!` };
    }

    return { success: false, message: 'Invalid or expired coupon code.' };
}

export function removePromoCode() {
    try {
        localStorage.removeItem(PROMO_STORAGE_KEY);
        notifyCartUpdate();
    } catch {
        // ignore
    }
}

export function calculateCartSummary() {
    const items = getCartItems();
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const originalTotal = items.reduce(
        (sum, item) => sum + ((item.originalPrice || item.price) * (item.quantity || 1)),
        0
    );
    const productDiscount = Math.max(0, originalTotal - subtotal);

    const appliedPromo = getAppliedPromo();
    let promoDiscount = 0;
    if (appliedPromo) {
        if (appliedPromo.discountPercent) {
            promoDiscount = Math.round((subtotal * appliedPromo.discountPercent) / 100);
        } else if (appliedPromo.flatDiscount) {
            promoDiscount = Math.min(subtotal, appliedPromo.flatDiscount);
        }
    }

    const shippingThreshold = 999;
    const shipping = (subtotal >= shippingThreshold || subtotal === 0) ? 0 : 99;
    const totalDiscount = productDiscount + promoDiscount;
    const grandTotal = Math.max(0, subtotal - promoDiscount + shipping);

    return {
        itemCount,
        subtotal,
        originalTotal,
        productDiscount,
        promoDiscount,
        totalDiscount,
        shipping,
        shippingThreshold,
        grandTotal,
        appliedPromo
    };
}

export function notifyCartUpdate() {
    const items = getCartItems();
    const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.dispatchEvent(
        new CustomEvent('commercehubcartupdate', {
            detail: { count, cartItems: items },
            bubbles: true,
            composed: true
        })
    );
}
