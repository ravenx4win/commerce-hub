import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

const CUSTOMER_STORAGE_KEY = 'commerceHubCustomer';

export default class LoginPage extends NavigationMixin(LightningElement) {
    @track email = '';
    @track password = '';
    @track rememberMe = true;
    @track showPassword = false;
    @track isLoading = false;
    @track errorMessage = '';
    @track successMessage = '';

    get passwordInputType() {
        return this.showPassword ? 'text' : 'password';
    }

    get passwordToggleLabel() {
        return this.showPassword ? 'Hide password' : 'Show password';
    }

    handleEmailChange(event) {
        this.email = event.target.value;
        this.errorMessage = '';
    }

    handlePasswordChange(event) {
        this.password = event.target.value;
        this.errorMessage = '';
    }

    handleRememberMeChange(event) {
        this.rememberMe = event.target.checked;
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    handleHomeClick(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('backtohome', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleForgotPassword(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.errorMessage = '';
        this.successMessage =
            'Password reset link will be sent to your registered email address.';
    }

    // ── Demo Customer Login (1-Click) ────────────────────────────────
    handleDemoLogin(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.isLoading = true;
        this.errorMessage = '';

        const demoCustomer = {
            name: 'XYZ Kanwar',
            email: 'dhruvkkanwar2@gmail.com',
            contactId: '003dL00002DQwXkQAL',
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };

        this._completeLogin(demoCustomer);
    }

    // ── Form Submit ──────────────────────────────────────────────────
    handleSubmit(event) {
        if (event && event.preventDefault) event.preventDefault();
        this.errorMessage = '';
        this.successMessage = '';

        const trimmedEmail = (this.email || '').trim();
        const trimmedPassword = (this.password || '').trim();

        if (!trimmedEmail) {
            this.errorMessage = 'Please enter your email or username.';
            return;
        }

        if (!trimmedPassword) {
            this.errorMessage = 'Please enter your password.';
            return;
        }

        if (trimmedPassword.length < 4) {
            this.errorMessage = 'Password must be at least 4 characters long.';
            return;
        }

        this.isLoading = true;

        // Derive friendly display name from email / username
        let derivedName = trimmedEmail.split('@')[0];
        derivedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

        const customerSession = {
            name: derivedName,
            email: trimmedEmail,
            contactId: '003dL00002DQwXkQAL',
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };

        this._completeLogin(customerSession);
    }

    _completeLogin(customerData) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(
                    CUSTOMER_STORAGE_KEY,
                    JSON.stringify(customerData)
                );
            }
        } catch (e) {
            console.warn('[LoginPage] localStorage write warning:', e);
        }

        // Global event dispatch so navigationBar & checkoutPage update immediately
        if (typeof document !== 'undefined') {
            document.dispatchEvent(
                new CustomEvent('commercehubauthupdate', {
                    detail: {
                        isLoggedIn: true,
                        customer: customerData
                    }
                })
            );
        }

        this.successMessage = `Signed in successfully as ${customerData.name}! Redirecting...`;
        this.isLoading = false;

        // Dispatch local event for parent router
        this.dispatchEvent(
            new CustomEvent('loginsuccess', {
                detail: customerData,
                bubbles: true,
                composed: true
            })
        );

        // Check if there is a pending redirect route in hash or history
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (hash.includes('checkout') || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('commerceHubPostLogin') === 'checkout')) {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('commerceHubPostLogin');
            }
            this.dispatchEvent(
                new CustomEvent('navigatetocheckout', {
                    bubbles: true,
                    composed: true
                })
            );
            if (typeof window !== 'undefined' && window.location) {
                window.location.hash = '/checkout';
            }
        } else {
            this.handleHomeClick();
        }
    }
}
