import { NativePurchases } from '@capgo/native-purchases';

export interface SubscriptionProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export class IAPService {
  // Your App Store subscription product IDs
  private readonly productIds = {
    access60: 'AMVsubscription',      // ID: 22368638
    subscription60day: 'AMV60day'      // ID: 6809809506
  };

  private products: SubscriptionProduct[] = [];

  /**
   * Initialize IAP and fetch available products
   */
  async initialize() {
    try {
      await NativePurchases.initialize();
      console.log('IAP initialized');
      
      // Fetch products from App Store
      await this.fetchProducts();
      
      // Restore any previous purchases
      await this.restorePurchases();
    } catch (error) {
      console.error('IAP initialization failed:', error);
      throw error;
    }
  }

  /**
   * Fetch available subscription products from App Store
   */
  async fetchProducts() {
    try {
      const productIds = Object.values(this.productIds);
      const result = await NativePurchases.getProducts({ products: productIds });
      
      this.products = result.products.map(p => ({
        id: p.productId,
        title: p.title || '',
        description: p.description || '',
        price: p.price || '',
        currency: p.currency || 'USD'
      }));
      
      console.log('Available products:', this.products);
      return this.products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  /**
   * Get all available subscription products
   */
  getAvailableProducts(): SubscriptionProduct[] {
    return this.products;
  }

  /**
   * Purchase a subscription
   * @param productId - Product ID (AMVsubscription or AMV60day)
   * @param userEmail - User's email for backend validation
   */
  async purchaseSubscription(productId: string, userEmail: string): Promise<boolean> {
    try {
      console.log(`Starting purchase for product: ${productId}`);
      
      const result = await NativePurchases.purchase({ product: productId });
      
      if (result.transactionId) {
        // Send receipt to your backend for validation
        const success = await this.sendReceiptToBackend(
          result.transactionId,
          result.receipt || '',
          userEmail,
          productId
        );
        return success;
      }
      
      return false;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Send receipt to backend for validation with Apple
   */
  private async sendReceiptToBackend(
    transactionId: string,
    receipt: string,
    email: string,
    productId: string
  ): Promise<boolean> {
    try {
      const response = await fetch('https://automanagevm.com/api/validate-receipt', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Add if you have auth tokens
        },
        body: JSON.stringify({ 
          transactionId,
          receipt,
          email,
          productId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Subscription activated!', data);
        // Update local state
        localStorage.setItem('subscriptionStatus', 'active');
        localStorage.setItem('subscriptionExpires', data.expiresDate || '');
        return true;
      } else {
        console.error('Backend validation failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to send receipt to backend:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases (user switching devices, etc)
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const result = await NativePurchases.restorePurchases();
      console.log('Restore purchases result:', result);
      
      if (result && result.length > 0) {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          // Validate the restored purchase
          const purchase = result[0];
          await this.sendReceiptToBackend(
            purchase.transactionId,
            purchase.receipt || '',
            userEmail,
            purchase.productId || 'unknown'
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return false;
    }
  }

  /**
   * Check current subscription status
   */
  getSubscriptionStatus() {
    return {
      isActive: localStorage.getItem('subscriptionStatus') === 'active',
      expiresDate: localStorage.getItem('subscriptionExpires') || null
    };
  }
}

// Export singleton instance
export const iapService = new IAPService();
