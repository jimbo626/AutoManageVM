import { LandingPage } from '../pages/landing.js';
import { SubscribePage } from '../pages/subscribe.js';

export class Router {
  constructor() {
    this.currentPage = null;
    this.appContainer = document.getElementById('app');
  }

  init() {
    this.route(window.location.pathname);

    window.addEventListener('popstate', () => {
      this.route(window.location.pathname);
    });
  }

  route(path) {
    const route = path.replace(/^\//, '') || 'landing';

    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    this.appContainer.innerHTML = '';

    switch (route) {
      case 'subscribe':
        this.currentPage = new SubscribePage(this);
        break;
      case 'landing':
      default:
        this.currentPage = new LandingPage(this);
        break;
    }

    this.currentPage.render(this.appContainer);
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.route(path);
  }
}
