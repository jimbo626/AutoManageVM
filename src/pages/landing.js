export class LandingPage {
  constructor(router) {
    this.router = router;
  }

  render(container) {
    container.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        ">
          <h1 style="
            text-align: center;
            color: #333;
            margin: 0 0 10px 0;
            font-size: 28px;
          ">AutoManageVM</h1>
          
          <p style="
            text-align: center;
            color: #666;
            margin: 0 0 30px 0;
          ">Sales Management Platform</p>

          <form id="auth-form" style="display: flex; flex-direction: column; gap: 15px;">
            <div>
              <label style="
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
              ">Email</label>
              <input type="email" id="email" placeholder="your@email.com" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
              " />
            </div>

            <div>
              <label style="
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
              ">Password</label>
              <input type="password" id="password" placeholder="••••••••" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
              " />
            </div>

            <button type="submit" style="
              padding: 12px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: opacity 0.3s;
            ">Sign In</button>
          </form>

          <div style="
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
          ">
            Don't have an account? 
            <a href="#" onclick="alert('Sign up coming soon'); return false;" style="
              color: #667eea;
              text-decoration: none;
              font-weight: bold;
            ">Sign up</a>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#auth-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = container.querySelector('#email').value;
      console.log('Login attempt:', email);
      this.router.navigate('/subscribe');
    });
  }

  destroy() {
  }
}
