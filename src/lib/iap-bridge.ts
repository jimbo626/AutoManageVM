/**
 * IAP Bridge - Communication layer between web app and native iOS StoreKit
 * Handles purchase flow, restore purchases, and result callbacks
 */

export type IAPAction = 'purchase' | 'restore';
export type IAPStatus = 'success' | 'error' | 'cancelled';

export interface IAPMessage {
  action: IAPAction;
  productId?: string;
}

export interface IAPResult {
  type: 'iap_result';
  status: IAPStatus;
  productId?: string;
  transactionId?: string;
  receiptData?: string;
  message?: string;
}

export interface IAPListener {
  (result: IAPResult): void;
}

class IAPBridge {
  private listeners: Set<IAPListener> = new Set();
  private isNativeMode = false;
  private pendingTimeout: number | null = null;
  private readonly actionTimeoutMs = 30000;

  constructor() {
    this.detectNativeMode();
    this.setupMessageListener();
  }

  /**
   * Detect if running in native iOS wrapper
   * Requires the native iAP message handler to be present
   */
  private detectNativeMode(): void {
    const hasWebkit = !!(window as any).webkit?.messageHandlers?.iap;
    this.isNativeMode = hasWebkit;
  }

  /**
   * Listen for messages from native layer
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as IAPResult;
      if (data?.type === 'iap_result') {
        this.clearPendingTimeout();
        this.notifyListeners(data);
      }
    });
  }

  private clearPendingTimeout(): void {
    if (this.pendingTimeout !== null) {
      window.clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  private startActionTimeout(action: IAPAction): void {
    this.clearPendingTimeout();
    this.pendingTimeout = window.setTimeout(() => {
      this.pendingTimeout = null;
      this.notifyListeners({
        type: 'iap_result',
        status: 'error',
        message: `Purchase ${action} timed out. Please try again.`,
      });
    }, this.actionTimeoutMs);
  }

  /**
   * Check if running in native mode
   */
  public isNative(): boolean {
    return this.isNativeMode;
  }

  /**
   * Send purchase request to native layer
   * @param productId - The product ID to purchase (e.g., "com.automanagevm.subscription")
   */
  public async purchase(productId: string): Promise<void> {
    if (!this.isNative()) {
      throw new Error('Not in native mode');
    }
    if (!(window as any).webkit?.messageHandlers?.iap) {
      throw new Error('Native purchase handler unavailable');
    }

    const message: IAPMessage = {
      action: 'purchase',
      productId,
    };

    this.startActionTimeout('purchase');
    (window as any).webkit.messageHandlers.iap.postMessage(message);
  }

  /**
   * Send restore purchases request to native layer
   */
  public async restore(): Promise<void> {
    if (!this.isNative()) {
      throw new Error('Not in native mode');
    }
    if (!(window as any).webkit?.messageHandlers?.iap) {
      throw new Error('Native purchase handler unavailable');
    }

    const message: IAPMessage = {
      action: 'restore',
    };

    this.startActionTimeout('restore');
    (window as any).webkit.messageHandlers.iap.postMessage(message);
  }

  /**
   * Subscribe to IAP results
   * @param listener - Callback function that receives IAP results
   * @returns Unsubscribe function
   */
  public subscribe(listener: IAPListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of IAP result
   */
  private notifyListeners(result: IAPResult): void {
    this.listeners.forEach((listener) => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in IAP listener:', error);
      }
    });
  }
}

// Export singleton instance
export const iapBridge = new IAPBridge();
