import { createElement } from 'lwc';
import NavigationBar from 'c/navigationBar';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';

// Register Apex Wire Adapter for Jest
const getProductsAdapter = registerApexTestWireAdapter(getProducts);

const mockGetProducts = require('./data/getProducts.json');

describe('c-navigation-bar', () => {
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
        expect(actionBtns.length).toBe(2);
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
});
