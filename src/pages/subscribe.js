import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { RECEIPT_VERIFICATION_URL } from '../config.js';

const PLANS = [
  {
    id: 'monthly',
    productId: 'AMVsubscription',
    name: 'Monthly',
    price: 'Loading price…',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Unlimited leads',
      'Sales automation',
      'Performance tracking',
      'Email support',
    ],
  },
  {
    id: '60day',
    productId: 'AMV60day',
    name: '60-Day Access',
    price: 'Loading price…',
    period: 'one time',
    description: 'Full access for 60 days',
    features: [
      'Unlimited leads',
      'Sales automation',
      'Performance tracking',
      'Email support',
      '60 days of access',
    ],
    featured: true,
  },
];

const SHOPIFY_STORE = 'https://automanagevm.myshopify.com';

export class SubscribePage {
  constructor(router) {
    this.router = router;
    this.isNative = window.Capacitor?.isNativePlatform?.() ?? false;
    this.loading = false;
    this.selectedPlan = null;
    this.products = new Map();
  }

  render(container) {
    container.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          max-width: 1000px;
          margin: 0 auto;
        ">
          <div style="
            text-align: center;
            color: white;
            margin-bottom: 60px;
          ">
            <h1 style="margin: 0 0 10px 0; font-size: 32px;">Choose Your Plan</h1>
            <p style="margin: 0; opacity: 0.9;">Start managing your sales performance today</p>
          </div>

          <div id="alert" style="display: none; padding: 16px; border-radius: 8px; margin-bottom: 30px; text-align: center; font-weight: 500;"></div>

          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
          ">
            ${PLANS.map(plan => `
              <div style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                position: relative;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                ${plan.featured ? 'transform: scale(1.05); box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3); border-top: 4px solid #667eea;' : ''}
              ">
                ${plan.featured ? '<div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">Most Popular</div>' : ''}

                <h2 style="margin: 0 0 20px 0; color: #333;">${plan.name}</h2>

                <div style="margin: 20px 0; display: flex; align-items: baseline; gap: 4px;">
                  <span data-price-id="${plan.productId}" style="font-size: 36px; font-weight: bold; color: #333;">${plan.price}</span>
                  <span style="font-size: 16px; color: #666;">${plan.period}</span>
                </div>

                <p style="color: #666; margin: 0 0 20px 0;">${plan.description}</p>

                <ul style="list-style: none; padding: 0; margin: 0 0 30px 0;">
                  ${plan.features.map(feature => `
                    <li style="color: #333; margin-bottom: 10px;">
                      <span style="color: #28a745; margin-right: 8px;">✓</span>${feature}
                    </li>
                  `).join('')}
                </ul>

                <button class="plan-btn" data-product-id="${plan.productId}" style="
                  width: 100%;
                  padding: 12px 24px;
                  background: #667eea;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: bold;
                  cursor: pointer;
                  transition: background 0.3s ease;
                ">
                  ${this.isNative ? 'Subscribe Now' : 'Buy on Shopify'}
                </button>
              </div>
            `).join('')}
          </div>

          ${this.isNative ? `
            <div style="text-align: center; margin-top: 40px;">
              <button id="restore-btn" style="
                background: transparent;
                color: white;
                border: 2px solid white;
                padding: 10px 30px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.3s ease;
              ">Restore Purchases</button>
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-top: 10px;">
                Already purchased? Restore your subscription.
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-top: 40px;">
            <p>Questions? Contact our support team</p>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
    if (this.isNative) {
      this.loadProducts(container);
    }
  }

  async loadProducts(container) {
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: PLANS.map(plan => plan.productId),
      });
      products.forEach(product => this.products.set(product.identifier, product));
      products.forEach(product => {
        const price = container.querySelector(`[data-price-id="${product.identifier}"]`);
        if (price) price.textContent = product.priceString || product.price || '';
      });
    } catch (error) {
      this.showAlert(container, { status: 'error', message: 'Unable to load Apple purchase options.' });
    }
  }

  setupEventListeners(container) {
    const planButtons = container.querySelectorAll('.plan-btn');
    planButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        if (this.isNative) {
          this.handleNativePurchase(productId, container);
        } else {
          this.handleBrowserPurchase(productId);
        }
      });
    });

    const restoreBtn = container.querySelector('#restore-btn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.handleRestore(container);
      });
    }

  }

  async handleNativePurchase(productId, container) {
    try {
      this.loading = true;
      this.selectedPlan = productId;
      const plan = PLANS.find(item => item.productId === productId);
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType: plan?.id === '60day' ? PURCHASE_TYPE.INAPP : PURCHASE_TYPE.SUBS,
      });
      await this.verifyPurchase(transaction, productId);
      this.showAlert(container, { status: 'success' });
    } catch (error) {
      this.loading = false;
      this.showAlert(container, {
        status: 'error',
        message: error.message || 'Purchase failed',
      });
    }
  }

  handleBrowserPurchase(planId) {
    const shopifyUrl = `${SHOPIFY_STORE}/products/${planId}`;
    window.open(shopifyUrl, '_blank');
  }

  async handleRestore(container) {
    try {
      this.loading = true;
      await NativePurchases.restorePurchases();
      this.showAlert(container, {
        status: 'restored',
        message: 'Purchases restored. Your access will refresh shortly.',
      });
    } catch (error) {
      this.loading = false;
      this.showAlert(container, {
        status: 'error',
        message: error.message || 'Restore failed',
      });
    }
  }

  showAlert(container, result) {
    const alertDiv = container.querySelector('#alert');
    let message = '';
    let bgColor = '';

    if (result.status === 'success') {
      this.loading = false;
      message = 'Purchase successful! Redirecting to dashboard...';
      bgColor = '#d4edda';
      alertDiv.style.color = '#155724';
      alertDiv.style.borderLeft = '4px solid #28a745';
      setTimeout(() => {
        this.router.navigate('/dashboard');
      }, 2000);
    } else if (result.status === 'restored') {
      this.loading = false;
      message = result.message;
      bgColor = '#d4edda';
      alertDiv.style.color = '#155724';
      alertDiv.style.borderLeft = '4px solid #28a745';
    } else if (result.status === 'error') {
      message = result.message || 'Purchase failed. Please try again.';
      bgColor = '#f8d7da';
      alertDiv.style.color = '#721c24';
      alertDiv.style.borderLeft = '4px solid #f5c6cb';
    } else if (result.status === 'cancelled') {
      message = 'Purchase cancelled.';
      bgColor = '#fff3cd';
      alertDiv.style.color = '#856404';
      alertDiv.style.borderLeft = '4px solid #ffc107';
    }

    alertDiv.textContent = message;
    alertDiv.style.backgroundColor = bgColor;
    alertDiv.style.display = 'block';
  }

  destroy() {
  }

  async verifyPurchase(transaction, productId) {
    const response = await fetch(RECEIPT_VERIFICATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        transactionId: transaction.transactionId,
        receipt: transaction.receipt,
        jwsRepresentation: transaction.jwsRepresentation,
      }),
    });
    if (!response.ok) throw new Error('Hercules could not verify this purchase.');
    return response.json();
  }
}
