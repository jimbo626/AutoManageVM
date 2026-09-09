import { getAuthUrl } from '../config.js';

export class LandingPage {
  constructor(router) {
    this.router = router;
  }

  render(container) {
    container.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        ">
          <h1 style="
            text-align: center;
            color: #1e3a8a;
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
          ">AutoManageVM</h1>
          
          <p style="
            text-align: center;
            color: #64748b;
            margin: 0 0 30px 0;
            font-size: 14px;
          ">Sales Management Platform</p>

          <div style="display: flex; flex-direction: column; gap: 15px;">
            <a href="${getAuthUrl('login')}" style="
              display: block;
              text-align: center;
              padding: 12px;
              background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
              color: white;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
            ">Sign In</a>
            <a href="${getAuthUrl('signup')}" style="
              display: block;
              text-align: center;
              padding: 12px;
              border: 1px solid #1e3a8a;
              color: #1e3a8a;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
            ">Create account</a>
          </div>

          <div style="
            text-align: center;
            margin-top: 20px;
            color: #64748b;
            font-size: 14px;
          ">
            Sign in or create an account through Hercules Auth.
          </div>
        </div>
      </div>
    `;

  }

  destroy() {
  }
}
