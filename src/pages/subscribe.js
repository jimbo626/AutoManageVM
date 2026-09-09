import { Capacitor } from '@capacitor/core';
import { NativePurchases } from '@capgo/native-purchases';

const PLANS = [
  {
    id: 'monthly',
    productIds: ['AMVsubscription', 'com.automanagevm.subscription'],
    name: 'Monthly',
    price: 'Loading...',
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
    productIds: ['AMV60day', 'com.automanagevm.60day'],
    name: '60-Day Access',
    price: 'Loading...',
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
const IAP_TIMEOUT_MS = 20000;

export class SubscribePage {
  constructor(router) {
    this.router = router;
    this.platform = Capacitor.getPlatform();
    this.isNative = Capacitor.isNativePlatform();
    this.isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent) || this.platform === 'ios';
    this.appleIAPOnly = this.isIOSDevice;
    this.canUseNativeIAP = this.appleIAPOnly && this.isNative;
    this.loading = false;
    this.selectedPlan = null;
    this.plans = PLANS.map(plan => ({ ...plan }));
    this.purchaseProductsByPlan = new Map();
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
            ${this.plans.map(plan => `
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
                  <span data-plan-price="${plan.id}" style="font-size: 36px; font-weight: bold; color: #333;">${plan.price}</span>
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

                <button class="plan-btn" data-plan-id="${plan.id}" style="
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
                  ${this.appleIAPOnly && !this.canUseNativeIAP ? 'opacity: 0.6; cursor: not-allowed;' : ''}
                ">
                  ${this.appleIAPOnly ? 'Subscribe Now' : 'Buy on Shopify'}
                </button>
              </div>
            `).join('')}
          </div>

          ${this.appleIAPOnly ? `
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
    this.initializeIAP(container);
  }

  setupEventListeners(container) {
    const planButtons = container.querySelectorAll('.plan-btn');
    planButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planId = e.target.dataset.planId;
        if (this.appleIAPOnly) {
          if (!this.canUseNativeIAP) {
            this.showAlert(container, {
              status: 'error',
              message: 'In-app purchase is only available in the iOS app.',
            });
            return;
          }
          this.handleNativePurchase(planId, container);
          return;
        }

        this.handleBrowserPurchase(planId);
      });
    });

    const restoreBtn = container.querySelector('#restore-btn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.handleRestore(container);
      });
    }

    if (this.appleIAPOnly && !this.canUseNativeIAP) {
      this.showAlert(container, {
        status: 'error',
        message: 'Open this page inside the iOS app to subscribe with Apple In-App Purchase.',
      });
    }
  }

  async initializeIAP(container) {
    if (!this.canUseNativeIAP) {
      this.updatePlanPrices(container);
      return;
    }

    try {
      await this.withTimeout(NativePurchases.initialize(), 'Unable to initialize Apple In-App Purchase.');
      const allProductIds = [...new Set(this.plans.flatMap((plan) => plan.productIds))];
      const result = await this.withTimeout(
        NativePurchases.getProducts({ products: allProductIds }),
        'Unable to load App Store pricing.'
      );

      for (const plan of this.plans) {
        const appStoreProduct = result.products.find((product) =>
          plan.productIds.includes(product.productId)
        );

        if (appStoreProduct) {
          this.purchaseProductsByPlan.set(plan.id, appStoreProduct.productId);
          plan.price = appStoreProduct.price || plan.price;
        } else {
          plan.price = 'Unavailable';
        }
      }
    } catch (error) {
      this.showAlert(container, {
        status: 'error',
        message: error.message || 'Unable to load App Store products.',
      });
      this.plans.forEach((plan) => {
        plan.price = 'Unavailable';
      });
    }

    this.updatePlanPrices(container);
  }

  updatePlanPrices(container) {
    this.plans.forEach((plan) => {
      const priceElement = container.querySelector(`[data-plan-price="${plan.id}"]`);
      if (priceElement) {
        priceElement.textContent = plan.price;
      }
    });
  }

  async handleNativePurchase(planId, container) {
    try {
      this.loading = true;
      this.selectedPlan = planId;

      const productId = this.purchaseProductsByPlan.get(planId);
      if (!productId) {
        throw new Error('This product is not available in App Store Connect.');
      }

      await this.withTimeout(
        NativePurchases.purchase({ product: productId }),
        'Purchase timed out. Please try again.'
      );

      this.showAlert(container, {
        status: 'success',
      });
    } catch (error) {
      this.showAlert(container, {
        status: 'error',
        message: error.message || 'Purchase failed',
      });
    } finally {
      this.loading = false;
      this.selectedPlan = null;
    }
  }

  handleBrowserPurchase(planId) {
    const shopifyUrl = `${SHOPIFY_STORE}/products/${planId}`;
    window.open(shopifyUrl, '_blank');
  }

  async handleRestore(container) {
    try {
      this.loading = true;
      if (!this.canUseNativeIAP) {
        throw new Error('Restore is only available in the iOS app.');
      }

      const restored = await this.withTimeout(
        NativePurchases.restorePurchases(),
        'Restore timed out. Please try again.'
      );

      if (restored && restored.length > 0) {
        this.showAlert(container, {
          status: 'success',
          message: 'Previous purchases restored.',
          noRedirect: true,
        });
      } else {
        this.showAlert(container, {
          status: 'cancelled',
          message: 'No previous purchases were found for this Apple ID.',
          noRedirect: true,
        });
      }
    } catch (error) {
      this.showAlert(container, {
        status: 'error',
        message: error.message || 'Restore failed',
      });
    } finally {
      this.loading = false;
    }
  }

  withTimeout(promise, timeoutMessage) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), IAP_TIMEOUT_MS);
    });
    return Promise.race([promise, timeoutPromise]);
  }

  showAlert(container, result) {
    const alertDiv = container.querySelector('#alert');
    let message = '';
    let bgColor = '';

    if (result.status === 'success') {
      message = result.message || 'Purchase successful! Redirecting to dashboard...';
      bgColor = '#d4edda';
      alertDiv.style.color = '#155724';
      alertDiv.style.borderLeft = '4px solid #28a745';
      if (!result.noRedirect) {
        setTimeout(() => {
          this.router.navigate('/dashboard');
        }, 2000);
      }
    } else if (result.status === 'error') {
      message = result.message || 'Purchase failed. Please try again.';
      bgColor = '#f8d7da';
      alertDiv.style.color = '#721c24';
      alertDiv.style.borderLeft = '4px solid #f5c6cb';
    } else if (result.status === 'cancelled') {
      message = result.message || 'Purchase cancelled.';
      bgColor = '#fff3cd';
      alertDiv.style.color = '#856404';
      alertDiv.style.borderLeft = '4px solid #ffc107';
    }

    alertDiv.textContent = message;
    alertDiv.style.backgroundColor = bgColor;
    alertDiv.style.display = 'block';
  }

  destroy() {}
}
