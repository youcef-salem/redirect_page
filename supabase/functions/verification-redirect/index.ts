// supabase/functions/verification-redirect/index.ts
import { serve } from "https://deno.land/std/http/server.ts"

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DjurDjura Verification</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #000; color: #fff; font-family: Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { text-align: center; max-width: 400px; padding: 20px; border-radius: 12px; border: 2px solid #FFC107; }
    .status-message { margin: 20px 0; }
    .success { color: #4CAF50; }
    .error { color: #f44336; }
    .loading { color: #FFC107; }
    .logo { width: 100px; height: 100px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="logo.png" alt="DjurDjura Logo" class="logo">
    <div id="status" class="loading">
      <h2>Processing verification...</h2>
      <p>Please wait while we verify your email.</p>
    </div>
  </div>

  <script>
    const APP_SCHEME = 'djurdjura';
    const DEBUG = true;

    function log(...args) {
      if (DEBUG) console.log(...args);
    }

    log('🚀 Verification page loaded');
    log('📍 Current URL:', window.location.href);

    const urlParams = new URLSearchParams(window.location.search);
    const statusDiv = document.getElementById('status');

    const token = urlParams.get('token');
    const type = urlParams.get('type');
    const refreshToken = urlParams.get('refresh_token');
    const tokenType = urlParams.get('token_type');

    log('🔑 Auth parameters:', {
      token: token ? '✓' : '✗',
      type,
      refreshToken: refreshToken ? '✓' : '✗',
      tokenType
    });

    function updateStatus(message, className) {
      statusDiv.innerHTML = \`
        <h2>\${message}</h2>
        <p id="countdown"></p>
      \`;
      statusDiv.className = className;
    }

    function startCountdown(seconds) {
      const countdownElement = document.getElementById('countdown');
      let timeLeft = seconds;

      const timer = setInterval(() => {
        countdownElement.textContent = \`Redirecting in \${timeLeft} seconds...\`;
        timeLeft--;
        if (timeLeft < 0) clearInterval(timer);
      }, 1000);
    }

    function redirectToApp(status, params = {}) {
      const baseUrl = \`\${APP_SCHEME}://auth/callback\`;
      const queryParams = new URLSearchParams({ status, ...params });
      const deepLink = \`\${baseUrl}?\${queryParams.toString()}\`;

      log('🔄 Redirecting to:', deepLink);

      setTimeout(() => {
        try {
          window.location.replace(deepLink);
        } catch (error) {
          log('⚠️ Primary redirect failed:', error);
          try {
            window.location.href = deepLink;
          } catch (error2) {
            log('❌ All redirect methods failed:', error2);
            updateStatus('Failed to open app. Please open it manually.', 'error');
          }
        }
      }, 500);
    }

    if (token && type === 'signup') {
      log('✉️ Processing email verification');
      updateStatus('Verifying your email...', 'loading');

      const verificationParams = { token, type: 'signup' };
      if (refreshToken) verificationParams.refresh_token = refreshToken;
      if (tokenType) verificationParams.token_type = tokenType;

      startCountdown(3);

      setTimeout(() => {
        updateStatus('Email verified! Opening app...', 'success');
        redirectToApp('verified', verificationParams);
      }, 3000);

    } else if (urlParams.get('error')) {
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      log('❌ Verification error:', error, errorDescription);
      updateStatus(\`Verification failed: \${errorDescription || error}\`, 'error');

      startCountdown(5);
      setTimeout(() => {
        redirectToApp('error', { error });
      }, 5000);

    } else {
      log('⚠️ Invalid verification parameters');
      updateStatus('Invalid verification link', 'error');

      startCountdown(3);
      setTimeout(() => {
        redirectToApp('invalid');
      }, 3000);
    }

    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        log('⏰ Fallback redirect triggered');
        updateStatus('Taking too long. Redirecting...', 'loading');
        redirectToApp('timeout');
      }
    }, 10000);
  </script>
</body>
</html>
`;

serve((_req) => {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
