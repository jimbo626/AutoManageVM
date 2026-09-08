class IAPBridge {
  constructor() {
    this.listeners = new Set();
    this.isNativeMode = this.detectNativeMode();
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
        this.notifyListeners(data);
      }
    });
  }

  isNative() {
    return this.isNativeMode;
  }

  async purchase(productId) {
    if (!this.isNative()) {
      throw new Error('Not in native mode');
    }

    const message = {
      action: 'purchase',
      productId,
    };

    window.webkit.messageHandlers.iap.postMessage(message);
  }

  async restore() {
    if (!this.isNative()) {
      throw new Error('Not in native mode');
    }

    const message = {
      action: 'restore',
    };

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
