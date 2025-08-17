// supabase/functions/verification-redirect/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DjurDjura Verification</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body { 
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      color: #ffffff; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0; 
      padding: 20px; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      line-height: 1.6;
    }
    
    .container { 
      text-align: center; 
      max-width: 420px; 
      width: 100%;
      padding: 40px 30px; 
      border-radius: 16px; 
      border: 2px solid #FFC107; 
      background: rgba(255, 193, 7, 0.05);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .logo { 
      width: 80px; 
      height: 80px; 
      margin: 0 auto 24px auto; 
      background: linear-gradient(135deg, #FFC107 0%, #FF8F00 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 16px;
      opacity: 0.8;
      margin-bottom: 8px;
    }
    
    .status-message { 
      margin: 24px 0; 
    }
    
    .success { 
      color: #4CAF50; 
    }
    
    .success .logo {
      background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
    }
    
    .error { 
      color: #f44336; 
    }
    
    .error .logo {
      background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
    }
    
    .loading { 
      color: #FFC107; 
    }
    
    #countdown {
      font-weight: 600;
      font-size: 18px;
      color: #FFC107;
      margin-top: 16px;
    }
    
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #FFC107;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔗</div>
    <div id="status" class="status-message loading">
      <h2>Processing verification...</h2>
      <div class="loading-text">
        <span class="spinner"></span>
        <span>Please wait while we verify your email.</span>
      </div>
    </div>
  </div>

  <script>
    const APP_SCHEME = 'djurdjura';
    const DEBUG = true;

    function log(...args) {
      if (DEBUG) {
        console.log('[VERIFICATION]', ...args);
      }
    }

    log('🚀 Verification page loaded');
    log('📍 Current URL:', window.location.href);
    log('🔍 User Agent:', navigator.userAgent);

    const urlParams = new URLSearchParams(window.location.search);
    const statusDiv = document.getElementById('status');
    const logoDiv = document.querySelector('.logo');

    // Extract all possible auth parameters
    const authParams = {
      token: urlParams.get('token'),
      access_token: urlParams.get('access_token'),
      refresh_token: urlParams.get('refresh_token'),
      token_type: urlParams.get('token_type'),
      type: urlParams.get('type'),
      error: urlParams.get('error'),
      error_description: urlParams.get('error_description'),
      redirect_to: urlParams.get('redirect_to')
    };

    log('🔑 Auth parameters:', authParams);

    function updateStatus(message, className, emoji = '🔗') {
      logoDiv.textContent = emoji;
      statusDiv.innerHTML = \`
        <h2>\${message}</h2>
        <p id="countdown"></p>
      \`;
      statusDiv.className = \`status-message \${className}\`;
      document.querySelector('.container').className = \`container \${className}\`;
    }

    function startCountdown(seconds, callback = null) {
      const countdownElement = document.getElementById('countdown');
      let timeLeft = seconds;

      function updateCountdown() {
        if (countdownElement) {
          countdownElement.textContent = \`Redirecting in \${timeLeft} seconds...\`;
        }
        
        if (timeLeft <= 0) {
          if (callback) callback();
          return;
        }
        
        timeLeft--;
        setTimeout(updateCountdown, 1000);
      }
      
      updateCountdown();
    }

    function attemptDeepLink(deepLink, fallbackMessage = 'Please open your app manually') {
      log('🔄 Attempting deep link:', deepLink);
      
      let redirected = false;
      
      // Method 1: Direct assignment
      const attemptRedirect = () => {
        if (redirected) return;
        redirected = true;
        
        try {
          window.location.href = deepLink;
          
          // Fallback after 3 seconds
          setTimeout(() => {
            if (!document.hidden && document.visibilityState === 'visible') {
              log('⚠️ Deep link may have failed, showing fallback message');
              updateStatus(fallbackMessage, 'error', '📱');
            }
          }, 3000);
          
        } catch (error) {
          log('❌ Deep link failed:', error);
          updateStatus('Failed to open app. ' + fallbackMessage, 'error', '❌');
        }
      };

      // Try immediately
      setTimeout(attemptRedirect, 100);
    }

    function redirectToApp(status, params = {}) {
      const baseUrl = \`\${APP_SCHEME}://auth/callback\`;
      const allParams = { status, ...params };
      
      // Clean up undefined values
      Object.keys(allParams).forEach(key => {
        if (allParams[key] === null || allParams[key] === undefined) {
          delete allParams[key];
        }
      });
      
      const queryParams = new URLSearchParams(allParams);
      const deepLink = \`\${baseUrl}?\${queryParams.toString()}\`;
      
      log('📱 Redirecting to app with params:', allParams);
      attemptDeepLink(deepLink);
    }

    // Main logic
    function processVerification() {
      if (authParams.error) {
        log('❌ Verification error:', authParams.error, authParams.error_description);
        updateStatus(
          \`Verification failed: \${authParams.error_description || authParams.error}\`, 
          'error', 
          '❌'
        );
        
        startCountdown(5, () => {
          redirectToApp('error', {
            error: authParams.error,
            error_description: authParams.error_description
          });
        });
        
      } else if (authParams.token || authParams.access_token) {
        log('✉️ Processing email verification with tokens');
        updateStatus('Email verified successfully!', 'success', '✅');
        
        const tokenParams = {};
        if (authParams.token) tokenParams.token = authParams.token;
        if (authParams.access_token) tokenParams.access_token = authParams.access_token;
        if (authParams.refresh_token) tokenParams.refresh_token = authParams.refresh_token;
        if (authParams.token_type) tokenParams.token_type = authParams.token_type;
        if (authParams.type) tokenParams.type = authParams.type;
        
        startCountdown(3, () => {
          redirectToApp('verified', tokenParams);
        });
        
      } else {
        log('⚠️ Invalid or missing verification parameters');
        updateStatus('Invalid verification link', 'error', '⚠️');
        
        startCountdown(3, () => {
          redirectToApp('invalid');
        });
      }
    }

    // Start processing after a brief delay to ensure UI is ready
    setTimeout(processVerification, 500);

    // Emergency fallback
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        log('⏰ Emergency fallback redirect');
        updateStatus('Taking too long. Opening app...', 'loading', '⏰');
        redirectToApp('timeout');
      }
    }, 15000);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      log('👁️ Page visibility changed:', document.visibilityState);
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    },
  })
})