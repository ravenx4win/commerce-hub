import { createElement } from 'lwc';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';

const mockNavigate = jest.fn();
jest.mock(
    'lightning/navigation',
    () => {
        const Navigate = Symbol('Navigate');
        const GenerateUrl = Symbol('GenerateUrl');
        const NavigationMixin = (Base) => {
            return class extends Base {
                [Navigate](...args) {
                    return mockNavigate(...args);
                }
                [GenerateUrl]() {
                    return Promise.resolve('https://www.example.com');
                }
            };
        };
        NavigationMixin.Navigate = Navigate;
        NavigationMixin.GenerateUrl = GenerateUrl;
        return {
            NavigationMixin,
            CurrentPageReference: require('@salesforce/wire-service-jest-util').createTestWireAdapter(jest.fn())
        };
    },
    { virtual: true }
);

import NavigationBar from 'c/navigationBar';

// Register Apex Wire Adapter for Jest
const getProductsAdapter = registerApexTestWireAdapter(getProducts);

const mockGetProducts = require('./data/getProducts.json');

describe('c-navigation-bar', () => {
    beforeEach(() => {
        window.scrollTo = jest.fn();
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders header elements properly without crashing', () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const brandName = element.shadowRoot.querySelector('.brand-name');
        expect(brandName).not.toBeNull();
        expect(brandName.textContent).toBe('Commerce Hub');

        const searchInput = element.shadowRoot.querySelector('.search-input');
        expect(searchInput).not.toBeNull();

        const actionBtns = element.shadowRoot.querySelectorAll('.action-btn');
        expect(actionBtns.length).toBe(3);
    });

    it('populates and paginates 17 categories excluding Automotive', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        // Emit wire data
        getProductsAdapter.emit(mockGetProducts);

        await Promise.resolve();

        const categoryBtns = element.shadowRoot.querySelectorAll('.category-btn');
        // Desktop default page size 7
        expect(categoryBtns.length).toBe(7);

        // Automotive should not exist in the categories
        const catNames = Array.from(categoryBtns).map(btn => btn.textContent.trim());
        expect(catNames).not.toContain('Automotive');
    });

    it('handles pagination next and previous buttons', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        getProductsAdapter.emit(mockGetProducts);
        await Promise.resolve();

        const prevBtn = element.shadowRoot.querySelector('.pagination-btn[aria-label="Previous categories"]');
        const nextBtn = element.shadowRoot.querySelector('.pagination-btn[aria-label="Next categories"]');

        expect(prevBtn.disabled).toBe(true);
        expect(nextBtn.disabled).toBe(false);

        // Click next
        nextBtn.click();
        await Promise.resolve();

        expect(prevBtn.disabled).toBe(false);
        expect(nextBtn.disabled).toBe(false);
    });

    it('opens dropdown on category hover and expands all products in-place on View All click', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        getProductsAdapter.emit(mockGetProducts);
        await Promise.resolve();

        const firstCatBtn = element.shadowRoot.querySelector('.category-btn');
        expect(firstCatBtn).not.toBeNull();

        firstCatBtn.dispatchEvent(new CustomEvent('mouseenter', { bubbles: true }));
        await Promise.resolve();

        const dropdown = element.shadowRoot.querySelector('.category-dropdown-panel');
        expect(dropdown).not.toBeNull();

        const viewAllBtn = element.shadowRoot.querySelector('.view-all-btn');
        expect(viewAllBtn).not.toBeNull();
        expect(viewAllBtn.textContent).toContain('View all');

        // Click View All -> Expands products in-place without page navigation
        viewAllBtn.click();
        await Promise.resolve();

        expect(viewAllBtn.textContent).toContain('Show fewer products');

        // Click Show Fewer -> Returns to compact preview
        viewAllBtn.click();
        await Promise.resolve();

        expect(viewAllBtn.textContent).toContain('View all');
    });

    it('navigates to /appliances page when Appliances category is clicked and switches back on home click', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        getProductsAdapter.emit(mockGetProducts);
        await Promise.resolve();

        const appliancesBtn = element.shadowRoot.querySelector('.category-btn[data-category="Appliances"]');
        expect(appliancesBtn).not.toBeNull();

        appliancesBtn.click();
        await Promise.resolve();

        // c-appliances-page component should now be rendered
        const appliancesPage = element.shadowRoot.querySelector('c-appliances-page');
        expect(appliancesPage).not.toBeNull();

        // Clicking brand button switches back to home view
        const brandBtn = element.shadowRoot.querySelector('.brand-btn');
        brandBtn.click();
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-appliances-page')).toBeNull();
    });

    it('handles browser back and forward button navigation via popstate', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        getProductsAdapter.emit(mockGetProducts);
        await Promise.resolve();

        // 1. Click Appliances -> navigates to appliances
        const appliancesBtn = element.shadowRoot.querySelector('.category-btn[data-category="Appliances"]');
        appliancesBtn.click();
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-appliances-page')).not.toBeNull();

        // 2. Simulate browser Back button: URL hash changes to /home and popstate fires
        window.location.hash = '/home';
        window.dispatchEvent(new CustomEvent('popstate'));
        await Promise.resolve();

        // Should return to homepage view
        expect(element.shadowRoot.querySelector('c-appliances-page')).toBeNull();

        // 3. Simulate browser Forward button: URL hash changes to /appliances and popstate fires
        window.location.hash = '/appliances';
        window.dispatchEvent(new CustomEvent('popstate'));
        await Promise.resolve();

        // Should display appliances page again
        expect(element.shadowRoot.querySelector('c-appliances-page')).not.toBeNull();
    });

    it('navigates to each category page when category buttons are clicked', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        getProductsAdapter.emit(mockGetProducts);
        await Promise.resolve();

        // 1. Audio
        element.navigateToAudio();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-audio-page')).not.toBeNull();

        // 2. Beauty
        element.navigateToBeauty();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-beauty-page')).not.toBeNull();

        // 3. Books
        element.navigateToBooks();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-books-page')).not.toBeNull();

        // 4. Clothing
        element.navigateToClothing();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-clothing-page')).not.toBeNull();

        // 5. Electronics
        element.navigateToElectronics();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-electronics-page')).not.toBeNull();

        // 6. Food & Grocery
        element.navigateToFoodGrocery();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-food-grocery-page')).not.toBeNull();

        // 7. Toys & Games
        element.navigateToToysGames();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-toys-games-page')).not.toBeNull();

        // 8. Travel & Luggage
        element.navigateToTravelLuggage();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-travel-luggage-page')).not.toBeNull();

        // 9. Watches & Accessories
        element.navigateToWatchesAccessories();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-watches-accessories-page')).not.toBeNull();

        // 10. Return to Home
        element.handleBrandClick();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-watches-accessories-page')).toBeNull();
    });

    it('renders c-product-detail on product selection and returns on category back', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        // Navigate to product detail
        element.navigateToProductDetail('appliances', '01tdL00000gwfnCQAQ');
        await Promise.resolve();

        const pdp = element.shadowRoot.querySelector('c-product-detail');
        expect(pdp).not.toBeNull();
        expect(element.shadowRoot.querySelector('c-appliances-page')).toBeNull();

        // Simulate back to category event
        pdp.dispatchEvent(new CustomEvent('backtocategory', {
            detail: { category: 'appliances' }
        }));
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-product-detail')).toBeNull();
        expect(element.shadowRoot.querySelector('c-appliances-page')).not.toBeNull();
    });

    it('supports product detail routing for all Batch 1 categories', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const batch1Samples = [
            { category: 'appliances', productId: '01tdL00000gwfnCQAQ', expectedPageTag: 'c-appliances-page', nav: () => element.navigateToAppliances() },
            { category: 'audio', productId: '01tdL00000gwfotQAA', expectedPageTag: 'c-audio-page', nav: () => element.navigateToAudio() },
            { category: 'beauty', productId: '01tdL00000gwfmiQAA', expectedPageTag: 'c-beauty-page', nav: () => element.navigateToBeauty() },
            { category: 'books', productId: '01tdL00000gwfmTQAQ', expectedPageTag: 'c-books-page', nav: () => element.navigateToBooks() },
            { category: 'clothing', productId: '01tdL00000gwfmEQAQ', expectedPageTag: 'c-clothing-page', nav: () => element.navigateToClothing() },
            { category: 'electronics', productId: '01tdL00000gwfllQAA', expectedPageTag: 'c-electronics-page', nav: () => element.navigateToElectronics() },
            { category: 'food-grocery', productId: '01tdL00000gwfngQAA', expectedPageTag: 'c-food-grocery-page', nav: () => element.navigateToFoodGrocery() }
        ];

        for (const item of batch1Samples) {
            // Navigate to category
            item.nav();
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
            expect(element.shadowRoot.querySelector(item.expectedPageTag)).not.toBeNull();

            // Select product within category
            element.navigateToProductDetail(item.category, item.productId);
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();

            const pdp = element.shadowRoot.querySelector('c-product-detail');
            expect(pdp).not.toBeNull();
            expect(pdp.productId).toBe(item.productId);
            expect(pdp.categorySlug).toBe(item.category);

            // Back to category
            pdp.dispatchEvent(new CustomEvent('backtocategory', {
                detail: { category: item.category }
            }));
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
            expect(element.shadowRoot.querySelector('c-product-detail')).toBeNull();
            expect(element.shadowRoot.querySelector(item.expectedPageTag)).not.toBeNull();
        }
    });

    it('supports product detail routing for all Batch 2 categories', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const batch2Samples = [
            { category: 'furniture', productId: '01tdL00000gwfoAQAQ', expectedPageTag: 'c-furniture-page', nav: () => element.navigateToFurniture() },
            { category: 'home', productId: '01tdL00000gwfmxQAA', expectedPageTag: 'c-home-living-page', nav: () => element.navigateToHomeLiving() },
            { category: 'kitchen-dining', productId: '01tdL00000gwfprQAA', expectedPageTag: 'c-kitchen-dining-page', nav: () => element.navigateToKitchenDining() },
            { category: 'laptops-computers', productId: '01tdL00000gwfoeQAA', expectedPageTag: 'c-laptops-computers-page', nav: () => element.navigateToLaptopsComputers() },
            { category: 'mobiles', productId: '01tdL00000gwflzQAA', expectedPageTag: 'c-mobiles-page', nav: () => element.navigateToMobiles() },
            { category: 'personal-care', productId: '01tdL00000gwfpcQAA', expectedPageTag: 'c-personal-care-page', nav: () => element.navigateToPersonalCare() },
            { category: 'sports-fitness', productId: '01tdL00000gwfnvQAA', expectedPageTag: 'c-sports-fitness-page', nav: () => element.navigateToSportsFitness() }
        ];

        for (const item of batch2Samples) {
            // Navigate to category
            item.nav();
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
            expect(element.shadowRoot.querySelector(item.expectedPageTag)).not.toBeNull();

            // Select product within category
            element.navigateToProductDetail(item.category, item.productId);
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();

            const pdp = element.shadowRoot.querySelector('c-product-detail');
            expect(pdp).not.toBeNull();
            expect(pdp.productId).toBe(item.productId);
            expect(pdp.categorySlug).toBe(item.category);

            // Back to category
            pdp.dispatchEvent(new CustomEvent('backtocategory', {
                detail: { category: item.category }
            }));
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
            expect(element.shadowRoot.querySelector('c-product-detail')).toBeNull();
            expect(element.shadowRoot.querySelector(item.expectedPageTag)).not.toBeNull();
        }
    });

    it('supports product detail routing for all Batch 3 categories', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const batch3Samples = [
            { category: 'toys-games', productId: '01tdL00000gwfnRQAQ', expectedPageTag: 'c-toys-games-page', nav: () => element.navigateToToysGames() },
            { category: 'travel-luggage', productId: '01tdL00000gwfp8QAA', expectedPageTag: 'c-travel-luggage-page', nav: () => element.navigateToTravelLuggage() },
            { category: 'watches-accessories', productId: '01tdL00000gwfpNQAQ', expectedPageTag: 'c-watches-accessories-page', nav: () => element.navigateToWatchesAccessories() }
        ];

        for (const item of batch3Samples) {
            // Navigate to category
            item.nav();
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
            expect(element.shadowRoot.querySelector(item.expectedPageTag)).not.toBeNull();

            // Select product within category
            element.navigateToProductDetail(item.category, item.productId);
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();

            const pdp = element.shadowRoot.querySelector('c-product-detail');
            expect(pdp).not.toBeNull();
            expect(pdp.productId).toBe(item.productId);
            expect(pdp.categorySlug).toBe(item.category);

            // Back to category
            pdp.dispatchEvent(new CustomEvent('backtocategory', {
                detail: { category: item.category }
            }));
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
            expect(element.shadowRoot.querySelector('c-product-detail')).toBeNull();
            expect(element.shadowRoot.querySelector(item.expectedPageTag)).not.toBeNull();
        }
    });

    it('normalizes category aliases on backtocategory in Batch 3', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        // Test 'toys' alias
        element.navigateToProductDetail('toys-games', '01tdL00000gwfnRQAQ');
        await Promise.resolve();
        let pdp = element.shadowRoot.querySelector('c-product-detail');
        expect(pdp).not.toBeNull();
        pdp.dispatchEvent(new CustomEvent('backtocategory', { detail: { category: 'toys' } }));
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-toys-games-page')).not.toBeNull();

        // Test 'luggage' alias
        element.navigateToProductDetail('travel-luggage', '01tdL00000gwfp8QAA');
        await Promise.resolve();
        pdp = element.shadowRoot.querySelector('c-product-detail');
        pdp.dispatchEvent(new CustomEvent('backtocategory', { detail: { category: 'luggage' } }));
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-travel-luggage-page')).not.toBeNull();

        // Test 'watches' alias
        element.navigateToProductDetail('watches-accessories', '01tdL00000gwfpNQAQ');
        await Promise.resolve();
        pdp = element.shadowRoot.querySelector('c-product-detail');
        pdp.dispatchEvent(new CustomEvent('backtocategory', { detail: { category: 'watches' } }));
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-watches-accessories-page')).not.toBeNull();
    });

    it('supports navigation to checkout view and back to cart or home', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        // 1. Navigate to Cart
        element.navigateToCart();
        await Promise.resolve();
        const cartPage = element.shadowRoot.querySelector('c-cart-page');
        expect(cartPage).not.toBeNull();
        expect(element.shadowRoot.querySelector('c-checkout-page')).toBeNull();

        // 2. Dispatch checkout event from cart
        cartPage.dispatchEvent(new CustomEvent('checkout'));
        await Promise.resolve();

        const checkoutPage = element.shadowRoot.querySelector('c-checkout-page');
        expect(checkoutPage).not.toBeNull();
        expect(element.shadowRoot.querySelector('c-cart-page')).toBeNull();

        // 3. Dispatch backtocart event from checkout
        checkoutPage.dispatchEvent(new CustomEvent('backtocart'));
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-cart-page')).not.toBeNull();
        expect(element.shadowRoot.querySelector('c-checkout-page')).toBeNull();

        // 4. Test direct navigateToCheckout method
        element.navigateToCheckout();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-checkout-page')).not.toBeNull();

        // 5. Back to Home
        element.handleBrandClick();
        await Promise.resolve();
        expect(element.shadowRoot.querySelector('c-checkout-page')).toBeNull();
    });

    it('navigates to Login page and mounts c-login-page when header Login button is clicked', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const loginBtn = element.shadowRoot.querySelector('.action-btn[aria-label="Login to your account"]');
        expect(loginBtn).not.toBeNull();
        loginBtn.click();
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-login-page')).not.toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith({
            type: 'standard__webPage',
            attributes: {
                url: '/login'
            }
        });
    });

    it('navigates to Login page when footer My Account is clicked', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const footerLinks = element.shadowRoot.querySelectorAll('.clickable-span');
        const myAccountLink = Array.from(footerLinks).find((el) => el.textContent.trim() === 'My Account');
        expect(myAccountLink).not.toBeNull();
        myAccountLink.click();
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-login-page')).not.toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith({
            type: 'standard__webPage',
            attributes: {
                url: '/login'
            }
        });
    });

    it('displays customer greeting and handles logout when customer session is active', async () => {
        localStorage.setItem(
            'commerceHubCustomer',
            JSON.stringify({
                name: 'XYZ Kanwar',
                email: 'dhruvkkanwar2@gmail.com',
                isLoggedIn: true
            })
        );

        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);
        await Promise.resolve();

        // Customer greeting should appear instead of Login button
        const customerGreeting = element.shadowRoot.querySelector('.customer-greeting-text');
        expect(customerGreeting).not.toBeNull();
        expect(customerGreeting.textContent).toBe('Hi, XYZ Kanwar');

        // Logout button should be visible
        const logoutBtn = element.shadowRoot.querySelector('.btn-logout-header');
        expect(logoutBtn).not.toBeNull();

        logoutBtn.click();
        await Promise.resolve();

        // After logout, localStorage is cleared and login button reappears
        expect(localStorage.getItem('commerceHubCustomer')).toBeNull();
        const loginBtn = element.shadowRoot.querySelector('.action-btn[aria-label="Login to your account"]');
        expect(loginBtn).not.toBeNull();
    });

    it('navigates to Orders page and mounts c-orders-page when header Orders button is clicked', async () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);
        await Promise.resolve();

        const ordersBtn = element.shadowRoot.querySelector('.orders-btn');
        expect(ordersBtn).not.toBeNull();
        ordersBtn.click();
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-orders-page')).not.toBeNull();
    });
});


