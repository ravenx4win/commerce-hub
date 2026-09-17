import { createElement } from 'lwc';
import SportsFitnessPage from 'c/sportsFitnessPage';

describe('c-sports-fitness-page', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders hero header and breadcrumb without errors', () => {
        const element = createElement('c-sports-fitness-page', {
            is: SportsFitnessPage
        });
        document.body.appendChild(element);

        const title = element.shadowRoot.querySelector('.hero-title');
        expect(title).not.toBeNull();
        expect(title.textContent).toContain('Sports & Fitness');

        const breadcrumb = element.shadowRoot.querySelector('.breadcrumb-current');
        expect(breadcrumb).not.toBeNull();
        expect(breadcrumb.textContent).toBe('Sports & Fitness');
    });

    it('renders default dummy products and filter pills', () => {
        const element = createElement('c-sports-fitness-page', {
            is: SportsFitnessPage
        });
        document.body.appendChild(element);

        const cards = element.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).toBeGreaterThan(0);

        const pills = element.shadowRoot.querySelectorAll('.pill-btn');
        expect(pills.length).toBeGreaterThan(0);
    });

    it('filters products by search input', async () => {
        const element = createElement('c-sports-fitness-page', {
            is: SportsFitnessPage
        });
        document.body.appendChild(element);

        const input = element.shadowRoot.querySelector('.search-input');
        input.value = 'Yoga';
        input.dispatchEvent(new CustomEvent('input'));

        await Promise.resolve();

        const cards = element.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).toBe(1);
        const title = element.shadowRoot.querySelector('.product-title');
        expect(title.textContent).toContain('Yoga');
    });

    it('dispatches backtohome CustomEvent when clicking home breadcrumb', () => {
        const element = createElement('c-sports-fitness-page', {
            is: SportsFitnessPage
        });
        document.body.appendChild(element);

        const homeHandler = jest.fn();
        element.addEventListener('backtohome', homeHandler);

        const homeBtn = element.shadowRoot.querySelector('.breadcrumb-link');
        homeBtn.click();

        expect(homeHandler).toHaveBeenCalled();
    });
});
