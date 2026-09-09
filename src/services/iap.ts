import { NativePurchases } from '@capgo/native-purchases';

const PRODUCT_IDS = {
  subscription: 'AMVsubscription',
  access60Day: 'AMV60day',
};

const RECEIPT_VERIFICATION_URL =
  'https://rugged-lyrebird-259.convex.site/apple-iap-verify';

export class IAPService {
  private products = [];

  async fetchProducts() {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: Object.values(PRODUCT_IDS),
    });
    this.products = products;
    return products;
  }

  getAvailableProducts() {
    return this.products;
  }

  async purchaseSubscription(productId: string) {
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: productId === PRODUCT_IDS.access60Day ? 'INAPP' : 'SUBS',
    });
    return this.verifyPurchase(transaction, productId);
  }

  async verifyPurchase(transaction: Record<string, string>, productId: string) {
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
    if (!response.ok) throw new Error('Receipt verification failed.');
    return response.json();
  }

  async restorePurchases() {
    await NativePurchases.restorePurchases();
    return NativePurchases.getPurchases();
  }
}

export const iapService = new IAPService();
