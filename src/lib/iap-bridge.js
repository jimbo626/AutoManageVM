class IAPBridge {
  constructor() {
    this.listeners = new Set();
    this.isNativeMode = this.detectNativeMode();
    this.pendingTimeout = null;
    this.actionTimeoutMs = 30000;
    this.setupMessageListener();
  }

  detectNativeMode() {
    const userAgent = navigator.userAgent;
    const hasWebkit = !!(window.webkit?.messageHandlers?.iap);
    return userAgent.includes('PWAShell') || hasWebkit;
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data?.type === 'iap_result') {
        this.clearPendingTimeout();
        this.notifyListeners(data);
      }
    });
  }

  clearPendingTimeout() {
    if (this.pendingTimeout !== null) {
      window.clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  startActionTimeout(action) {
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

  isNative() {
    return this.isNativeMode;
  }

  async purchase(productId) {
    if (!this.isNative()) {
      throw new Error('Not in native mode');
    }
    if (!window.webkit?.messageHandlers?.iap) {
      throw new Error('Native purchase handler unavailable');
    }

    const message = {
      action: 'purchase',
      productId,
    };

    this.startActionTimeout('purchase');
    window.webkit.messageHandlers.iap.postMessage(message);
  }

  async restore() {
    if (!this.isNative()) {
      throw new Error('Not in native mode');
    }
    if (!window.webkit?.messageHandlers?.iap) {
      throw new Error('Native purchase handler unavailable');
    }

    const message = {
      action: 'restore',
    };

    this.startActionTimeout('restore');
    window.webkit.messageHandlers.iap.postMessage(message);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(result) {
    this.listeners.forEach((listener) => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in IAP listener:', error);
      }
    });
  }
}

export const iapBridge = new IAPBridge();
