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

          <form id="auth-form" style="display: flex; flex-direction: column; gap: 15px;">
            <div>
              <label style="
                display: block;
                margin-bottom: 8px;
                color: #1e3a8a;
                font-weight: 600;
                font-size: 14px;
              ">Username</label>
              <input type="text" id="username" placeholder="Enter username" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
              " />
            </div>

            <div>
              <label style="
                display: block;
                margin-bottom: 8px;
                color: #1e3a8a;
                font-weight: 600;
                font-size: 14px;
              ">Email</label>
              <input type="email" id="email" placeholder="your@email.com" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
              " />
            </div>

            <div>
              <label style="
                display: block;
                margin-bottom: 8px;
                color: #1e3a8a;
                font-weight: 600;
                font-size: 14px;
              ">Password</label>
              <input type="password" id="password" placeholder="••••••••" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
              " />
            </div>

            <button type="submit" style="
              padding: 12px;
              background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: opacity 0.3s;
            ">Sign In</button>
          </form>

          <div style="
            text-align: center;
            margin-top: 20px;
            color: #64748b;
            font-size: 14px;
          ">
            Don't have an account? 
            <a href="#" onclick="window.location.hash = '/subscribe'; return false;" style="
              color: #1e3a8a;
              text-decoration: none;
              font-weight: 600;
            ">Sign up</a>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#auth-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = container.querySelector('#username').value;
      const email = container.querySelector('#email').value;
      console.log('Login attempt:', { username, email });
      this.router.navigate('/subscribe');
    });
  }

  destroy() {
  }
}
