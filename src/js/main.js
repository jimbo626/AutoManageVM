import { SplashScreen } from '@capacitor/splash-screen';
import { Router } from './router.js';

async function initApp() {
  try {
    await SplashScreen.hide();
  } catch (error) {
    console.log('SplashScreen not available');
  }

  const router = new Router();
  router.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
