import { createElement } from 'lwc';
import AppliancesPage from 'c/appliancesPage';
import getProducts from '@salesforce/apex/CommerceProductController.getProducts';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';

const getProductsAdapter = registerApexTestWireAdapter(getProducts);

const MOCK_PRODUCTS = [
    {
        Id: 'app1',
        Name: 'Air Fryer',
        ProductCode: 'CH-APP001',
        Description: 'Touch control healthy air fryer',
        Commerce_Hub_Category__r: { Name: 'Appliances' }
    },
    {
        Id: 'app2',
        Name: 'Mixer Grinder',
        ProductCode: 'CH-APP002',
        Description: '750W copper motor grinder',
        Commerce_Hub_Category__r: { Name: 'Appliances' }
    }
];

describe('c-appliances-page', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders hero title, breadcrumbs, and default catalog items', () => {
        const element = createElement('c-appliances-page', {
            is: AppliancesPage
        });
        document.body.appendChild(element);

        const title = element.shadowRoot.querySelector('.hero-title');
        expect(title).not.toBeNull();
        expect(title.textContent).toBe('Home & Kitchen Appliances');

        const breadcrumbCurrent = element.shadowRoot.querySelector('.breadcrumb-current');
        expect(breadcrumbCurrent.textContent).toBe('Appliances');

        const productCards = element.shadowRoot.querySelectorAll('.product-card');
        expect(productCards.length).toBeGreaterThan(0);
    });

    it('updates catalog when live wire data is received', async () => {
        const element = createElement('c-appliances-page', {
            is: AppliancesPage
        });
        document.body.appendChild(element);

        getProductsAdapter.emit(MOCK_PRODUCTS);
        await Promise.resolve();

        const productCards = element.shadowRoot.querySelectorAll('.product-card');
        expect(productCards.length).toBe(2);

        const firstTitle = element.shadowRoot.querySelector('.card-title');
        expect(firstTitle.textContent).toBe('Air Fryer');
    });

    it('filters products when subcategory pill is clicked', async () => {
        const element = createElement('c-appliances-page', {
            is: AppliancesPage
        });
        document.body.appendChild(element);

        const climatePill = element.shadowRoot.querySelector('button[data-filter="Climate"]');
        expect(climatePill).not.toBeNull();

        climatePill.click();
        await Promise.resolve();

        const productCards = element.shadowRoot.querySelectorAll('.product-card');
        expect(productCards.length).toBe(3); // Room Heater, Air Purifier, Portable Fan
    });

    it('filters products when search term is entered', async () => {
        const element = createElement('c-appliances-page', {
            is: AppliancesPage
        });
        document.body.appendChild(element);

        const searchInput = element.shadowRoot.querySelector('.search-input');
        searchInput.value = 'kettle';
        searchInput.dispatchEvent(new CustomEvent('input', { target: { value: 'kettle' } }));
        await Promise.resolve();

        const productCards = element.shadowRoot.querySelectorAll('.product-card');
        expect(productCards.length).toBe(1);

        const cardTitle = element.shadowRoot.querySelector('.card-title');
        expect(cardTitle.textContent).toBe('Electric Kettle');
    });

    it('adds product to cart, shows feedback toast, and dispatches cart sync event', async () => {
        const element = createElement('c-appliances-page', {
            is: AppliancesPage
        });
        document.body.appendChild(element);

        const cartListener = jest.fn();
        document.addEventListener('commercehubcartupdate', cartListener);

        const addBtn = element.shadowRoot.querySelector('.btn-add-cart');
        expect(addBtn).not.toBeNull();

        addBtn.click();
        await Promise.resolve();

        expect(cartListener).toHaveBeenCalled();
        const toast = element.shadowRoot.querySelector('.toast-notice');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain('added to cart');
    });
});
