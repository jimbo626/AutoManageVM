/**
 * Subscribe Page - Paywall showing subscription plans
 * Displays two subscription tiers with native purchase buttons
 * Auto-redirects if user already has active subscription
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativePurchases } from '@capgo/native-purchases';
import type { IAPStatus } from '@/lib/iap-bridge';

interface Plan {
  id: string;
  productIds: string[];
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  featured?: boolean;
}

const PLANS: Plan[] = [
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

const SHOPIFY_STORE = process.env.NEXT_PUBLIC_SHOPIFY_STORE || 'https://automanagevm.myshopify.com';
const IAP_TIMEOUT_MS = 20000;

export default function SubscribePage() {
  const router = useRouter();
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform());
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>(PLANS.map((plan) => ({ ...plan })));
  const productMapRef = useRef<Map<string, string>>(new Map());
  const [status, setStatus] = useState<{
    type: IAPStatus;
    message: string;
  } | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const platform = Capacitor.getPlatform();
    setIsNative(Capacitor.isNativePlatform());
    setIsIOSDevice(/iPhone|iPad|iPod/i.test(userAgent) || platform === 'ios');
  }, [router]);

  const appleIAPOnly = isIOSDevice;
  const canUseNativeIAP = appleIAPOnly && isNative;

  useEffect(() => {
    let cancelled = false;
    const initializeIAP = async () => {
      if (!canUseNativeIAP) {
        return;
      }

      try {
        await withTimeout(
          NativePurchases.initialize(),
          'Unable to initialize Apple In-App Purchase.'
        );
        const allProductIds = [...new Set(PLANS.flatMap((plan) => plan.productIds))];
        const result = await withTimeout(
          NativePurchases.getProducts({ products: allProductIds }),
          'Unable to load App Store pricing.'
        );

        if (cancelled) {
          return;
        }

        const updatedPlans = PLANS.map((plan) => {
          const appStoreProduct = result.products.find((product) =>
            plan.productIds.includes(product.productId)
          );
          if (appStoreProduct) {
            productMapRef.current.set(plan.id, appStoreProduct.productId);
            return {
              ...plan,
              price: appStoreProduct.price || plan.price,
            };
          }
          return {
            ...plan,
            price: 'Unavailable',
          };
        });
        setPlans(updatedPlans);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unable to load App Store products.',
        });
        setPlans(PLANS.map((plan) => ({ ...plan, price: 'Unavailable' })));
      }
    };

    initializeIAP();

    return () => {
      cancelled = true;
    };
  }, [canUseNativeIAP]);

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMessage: string
  ): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), IAP_TIMEOUT_MS);
    });
    try {
      return (await Promise.race([promise, timeoutPromise])) as T;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const handleNativePurchase = async (planId: string) => {
    try {
      setLoading(true);
      setSelectedPlan(planId);
      setStatus(null);

      if (!canUseNativeIAP) {
        throw new Error('In-app purchase is only available in the iOS app.');
      }

      const productId = productMapRef.current.get(planId);
      if (!productId) {
        throw new Error('This product is not available in App Store Connect.');
      }

      await withTimeout(
        NativePurchases.purchase({ product: productId }),
        'Purchase timed out. Please try again.'
      );
      setStatus({
        type: 'success',
        message: 'Purchase successful! Redirecting to dashboard...',
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Purchase failed',
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleBrowserPurchase = (planId: string) => {
    if (appleIAPOnly) {
      setStatus({
        type: 'error',
        message: 'In-app purchase is only available in the iOS app.',
      });
      return;
    }
    const shopifyUrl = `${SHOPIFY_STORE}/products/${planId}`;
    window.open(shopifyUrl, '_blank');
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      setStatus(null);

      if (!canUseNativeIAP) {
        throw new Error('Restore is only available in the iOS app.');
      }

      const restored = await withTimeout(
        NativePurchases.restorePurchases(),
        'Restore timed out. Please try again.'
      );
      if (restored && restored.length > 0) {
        setStatus({
          type: 'success',
          message: 'Previous purchases restored.',
        });
      } else {
        setStatus({
          type: 'cancelled',
          message: 'No previous purchases were found for this Apple ID.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Restore failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Choose Your Plan</h1>
        <p>Start managing your sales performance today</p>
      </div>

      {status && (
        <div style={{ ...styles.alert, ...styles[status.type] }}>
          {status.message}
        </div>
      )}

      <div style={styles.plansGrid}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              ...styles.planCard,
              ...(plan.featured ? styles.featured : {}),
            }}
          >
            {plan.featured && (
              <div style={styles.badge}>Most Popular</div>
            )}

            <h2>{plan.name}</h2>
            <div style={styles.pricing}>
              <span style={styles.price}>{plan.price}</span>
              <span style={styles.period}>{plan.period}</span>
            </div>
            <p style={styles.description}>{plan.description}</p>

            <ul style={styles.features}>
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <span style={styles.checkmark}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {appleIAPOnly ? (
              <button
                style={{
                  ...styles.button,
                  ...(loading && selectedPlan === plan.id
                    ? styles.loading
                    : {}),
                }}
                onClick={() => handleNativePurchase(plan.id)}
                disabled={loading || !canUseNativeIAP}
              >
                {loading && selectedPlan === plan.id
                  ? 'Processing...'
                  : 'Subscribe Now'}
              </button>
            ) : (
              <button
                style={styles.button}
                onClick={() => handleBrowserPurchase(plan.id)}
              >
                Buy on Shopify
              </button>
            )}
          </div>
        ))}
      </div>

      {appleIAPOnly && (
        <div style={styles.restoreSection}>
          <button
            style={styles.restoreButton}
            onClick={handleRestore}
            disabled={loading}
          >
            Restore Purchases
          </button>
          <p style={styles.restoreText}>
            Already purchased? Restore your subscription.
          </p>
        </div>
      )}

      <div style={styles.footer}>
        <p>Questions? Contact our support team</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '60px',
  },
  alert: {
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '30px',
    textAlign: 'center',
    fontWeight: 500,
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    borderLeft: '4px solid #28a745',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderLeft: '4px solid #f5c6cb',
  },
  cancelled: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderLeft: '4px solid #ffc107',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px',
    maxWidth: '1000px',
    margin: '0 auto',
    marginBottom: '60px',
  },
  planCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  },
  featured: {
    transform: 'scale(1.05)',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
    borderTop: '4px solid #667eea',
  },
  badge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#667eea',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  pricing: {
    margin: '20px 0',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  price: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
  },
  period: {
    fontSize: '16px',
    color: '#666',
  },
  description: {
    color: '#666',
    marginBottom: '20px',
  },
  features: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '30px',
  },
  checkmark: {
    color: '#28a745',
    marginRight: '8px',
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  loading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  restoreSection: {
    textAlign: 'center',
    marginTop: '40px',
  },
  restoreButton: {
    background: 'transparent',
    color: 'white',
    border: '2px solid white',
    padding: '10px 30px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  restoreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    marginTop: '10px',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
  },
};
