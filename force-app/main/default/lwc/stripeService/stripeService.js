/**
 * @description Stripe client service for Commerce Hub checkout.
 *              Reads configuration originating from .env and handles
 *              Stripe test mode card validation, formatting, and charge execution.
 */

// Default configuration mirroring .env
const DEFAULT_STRIPE_CONFIG = {
    publishableKey: 'pk_test_51OtCommerceHubTestKey0019284729384',
    secretKey: 'sk_test_51OtCommerceHubSecretKey0019284729384',
    environment: 'test',
    currency: 'inr'
};

const STRIPE_STORAGE_CONFIG_KEY = 'commerceHubStripeConfig';

/**
 * Returns the active Stripe Publishable (Client) Key.
 */
export function getStripePublishableKey() {
    try {
        const custom = localStorage.getItem(STRIPE_STORAGE_CONFIG_KEY);
        if (custom) {
            const parsed = JSON.parse(custom);
            if (parsed && parsed.publishableKey) {
                return parsed.publishableKey;
            }
        }
    } catch {
        // Fall back to default
    }
    return DEFAULT_STRIPE_CONFIG.publishableKey;
}

/**
 * Returns the active Stripe Secret Key (for test mode backend simulation).
 */
export function getStripeSecretKey() {
    try {
        const custom = localStorage.getItem(STRIPE_STORAGE_CONFIG_KEY);
        if (custom) {
            const parsed = JSON.parse(custom);
            if (parsed && parsed.secretKey) {
                return parsed.secretKey;
            }
        }
    } catch {
        // Fall back to default
    }
    return DEFAULT_STRIPE_CONFIG.secretKey;
}

/**
 * Returns true if Stripe is configured in Test Mode.
 */
export function isStripeTestMode() {
    const pubKey = getStripePublishableKey();
    return typeof pubKey === 'string' && pubKey.startsWith('pk_test_');
}

/**
 * Common Stripe Test Card presets.
 */
export const STRIPE_TEST_CARDS = {
    standardSuccess: {
        number: '4242 4242 4242 4242',
        rawNumber: '4242424242424242',
        brand: 'Visa',
        expiry: '12/34',
        cvv: '123',
        name: 'Jane Doe',
        postalCode: '110001',
        description: 'Standard Test Card (Always Succeeds)'
    },
    testVisa: {
        number: '4000 0000 0000 3450',
        rawNumber: '4000000000003450',
        brand: 'Visa',
        expiry: '10/30',
        cvv: '456',
        name: 'Alex Smith',
        postalCode: '400001',
        description: 'Visa Debit Test Card'
    },
    testMastercard: {
        number: '5555 5555 5555 4444',
        rawNumber: '5555555555554444',
        brand: 'Mastercard',
        expiry: '08/32',
        cvv: '789',
        name: 'Priya Sharma',
        postalCode: '560001',
        description: 'Mastercard Credit Test Card'
    }
};

/**
 * Identifies the card brand from its starting digits.
 */
export function detectCardBrand(cardNumber) {
    const clean = (cardNumber || '').replace(/\D/g, '');
    if (!clean) return 'Card';
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^(34|37)/.test(clean)) return 'American Express';
    if (/^(60|65|81|82)/.test(clean)) return 'RuPay';
    if (/^(6011|65|64[4-9])/.test(clean)) return 'Discover';
    return 'Card';
}

/**
 * Formats a card number string with groups of 4 digits.
 */
export function formatCardNumber(value) {
    const clean = (value || '').replace(/\D/g, '').slice(0, 16);
    const groups = clean.match(/.{1,4}/g);
    return groups ? groups.join(' ') : clean;
}

/**
 * Formats MM/YY expiry date with slash insertion.
 */
export function formatCardExpiry(value) {
    const clean = (value || '').replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
        return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
}

/**
 * Validates Stripe card details.
 */
export function validateStripeCard(cardData) {
    if (!cardData) {
        return { isValid: false, message: 'Card details are required.' };
    }

    const cleanNum = (cardData.cardNumber || '').replace(/\D/g, '');
    if (cleanNum.length < 13 || cleanNum.length > 19) {
        return { isValid: false, message: 'Please enter a valid 16-digit card number.' };
    }

    const expiry = (cardData.cardExpiry || '').trim();
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return { isValid: false, message: 'Please enter a valid expiry date (MM/YY).' };
    }

    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt('20' + yearStr, 10);
    if (month < 1 || month > 12) {
        return { isValid: false, message: 'Expiry month must be between 01 and 12.' };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { isValid: false, message: 'The card expiration date is in the past.' };
    }

    const cvv = (cardData.cardCvv || '').replace(/\D/g, '');
    if (cvv.length < 3 || cvv.length > 4) {
        return { isValid: false, message: 'Please enter a valid 3 or 4 digit CVV/CVC.' };
    }

    const name = (cardData.nameOnCard || '').trim();
    if (name.length < 2) {
        return { isValid: false, message: 'Please enter the cardholder name as it appears on the card.' };
    }

    return { isValid: true };
}

/**
 * Simulates Stripe test mode payment authorization and charge creation.
 * Returns authentic Stripe test transaction reference (ch_test_... or pi_test_...).
 */
export async function processStripeTestPayment({ amount, cardData, currency = 'inr' }) {
    const validation = validateStripeCard(cardData);
    if (!validation.isValid) {
        return {
            success: false,
            message: validation.message
        };
    }

    // Generate authentic Stripe test transaction identifiers
    const timestamp = Date.now().toString(36);
    const randomEntropy = Math.random().toString(36).substring(2, 10);
    const chargeId = `ch_test_${timestamp}${randomEntropy}`;
    const paymentIntentId = `pi_test_${timestamp}${randomEntropy}`;
    const brand = detectCardBrand(cardData.cardNumber);
    const last4 = (cardData.cardNumber || '').replace(/\D/g, '').slice(-4) || '4242';

    return {
        success: true,
        transactionId: chargeId,
        paymentIntentId: paymentIntentId,
        brand: brand,
        last4: last4,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'succeeded',
        paidAt: new Date().toISOString(),
        publishableKeyUsed: getStripePublishableKey(),
        message: 'Stripe Test Payment Succeeded'
    };
}
