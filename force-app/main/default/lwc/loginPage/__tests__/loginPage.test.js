import { createElement } from 'lwc';
import LoginPage from 'c/loginPage';

describe('c-login-page', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('renders the login page heading, inputs, and demo button', () => {
        const element = createElement('c-login-page', {
            is: LoginPage
        });
        document.body.appendChild(element);

        const heading = element.shadowRoot.querySelector('.login-heading');
        expect(heading).not.toBeNull();
        expect(heading.textContent).toBe('Welcome Back');

        const emailInput = element.shadowRoot.querySelector('[data-field="email"]');
        expect(emailInput).not.toBeNull();

        const passwordInput = element.shadowRoot.querySelector('[data-field="password"]');
        expect(passwordInput).not.toBeNull();
        expect(passwordInput.type).toBe('password');

        const demoBtn = element.shadowRoot.querySelector('.btn-demo-login');
        expect(demoBtn).not.toBeNull();
    });

    it('toggles password visibility when clicking eye button', async () => {
        const element = createElement('c-login-page', {
            is: LoginPage
        });
        document.body.appendChild(element);

        const toggleBtn = element.shadowRoot.querySelector('.password-toggle-btn');
        const passwordInput = element.shadowRoot.querySelector('[data-field="password"]');

        expect(passwordInput.type).toBe('password');

        toggleBtn.click();
        await Promise.resolve();

        expect(passwordInput.type).toBe('text');

        toggleBtn.click();
        await Promise.resolve();

        expect(passwordInput.type).toBe('password');
    });

    it('validates required fields on form submission', async () => {
        const element = createElement('c-login-page', {
            is: LoginPage
        });
        document.body.appendChild(element);

        const form = element.shadowRoot.querySelector('.login-form');
        form.dispatchEvent(new CustomEvent('submit'));
        await Promise.resolve();

        const alert = element.shadowRoot.querySelector('.alert-error');
        expect(alert).not.toBeNull();
        expect(alert.textContent).toContain('Please enter your email or username');
    });

    it('completes login via 1-click Demo Customer button and dispatches events', async () => {
        const element = createElement('c-login-page', {
            is: LoginPage
        });
        document.body.appendChild(element);

        const loginSuccessHandler = jest.fn();
        element.addEventListener('loginsuccess', loginSuccessHandler);

        const demoBtn = element.shadowRoot.querySelector('.btn-demo-login');
        demoBtn.click();
        await Promise.resolve();

        const alertSuccess = element.shadowRoot.querySelector('.alert-success');
        expect(alertSuccess).not.toBeNull();
        expect(alertSuccess.textContent).toContain('XYZ Kanwar');

        expect(loginSuccessHandler).toHaveBeenCalled();
        const stored = localStorage.getItem('commerceHubCustomer');
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored).name).toBe('XYZ Kanwar');
    });

    it('dispatches backtohome event when home link is clicked', async () => {
        const element = createElement('c-login-page', {
            is: LoginPage
        });
        document.body.appendChild(element);

        const backHandler = jest.fn();
        element.addEventListener('backtohome', backHandler);

        const breadcrumbLink = element.shadowRoot.querySelector('.breadcrumb-link');
        breadcrumbLink.click();
        await Promise.resolve();

        expect(backHandler).toHaveBeenCalled();
    });
});
