<script>
        const APP_SCHEME = 'djurdjura';
        const DEBUG = true;

        function log(...args) {
            if (DEBUG) {
                console.log(...args);
            }
        }

        log('🚀 Verification page loaded');
        log('📍 Current URL:', window.location.href);

        const urlParams = new URLSearchParams(window.location.search);
        const statusDiv = document.getElementById('status');

        // Extract Supabase tokens and parameters
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
            statusDiv.innerHTML = `
                <h2>${message}</h2>
                <p id="countdown"></p>
            `;
            statusDiv.className = className;
        }

        function startCountdown(seconds) {
            const countdownElement = document.getElementById('countdown');
            let timeLeft = seconds;

            const timer = setInterval(() => {
                countdownElement.textContent = `Redirecting in ${timeLeft} seconds...`;
                timeLeft--;

                if (timeLeft < 0) {
                    clearInterval(timer);
                }
            }, 1000);
        }

        function redirectToApp(status, params = {}) {
            const baseUrl = `${APP_SCHEME}://auth/callback`;
            const queryParams = new URLSearchParams({
                status,
                ...params
            });
            const deepLink = `${baseUrl}?${queryParams.toString()}`;
            
            log('🔄 Redirecting to:', deepLink);

            // Try multiple redirect methods
            setTimeout(() => {
                try {
                    // Primary method
                    window.location.replace(deepLink);
                } catch (error) {
                    log('⚠️ Primary redirect failed:', error);
                    try {
                        // Fallback method
                        window.location.href = deepLink;
                    } catch (error2) {
                        log('❌ All redirect methods failed:', error2);
                        updateStatus('Failed to open app. Please open it manually.', 'error');
                    }
                }
            }, 500);
        }

        // Handle Supabase verification flow
        if (token && type === 'signup') {
            log('✉️ Processing email verification');
            updateStatus('Verifying your email...', 'loading');

            // Prepare verification parameters
            const verificationParams = {
                token,
                type: 'signup'
            };

            // Add optional tokens if present
            if (refreshToken) {
                verificationParams.refresh_token = refreshToken;
            }
            if (tokenType) {
                verificationParams.token_type = tokenType;
            }

            // Start redirect countdown
            startCountdown(3);

            // Redirect with verification data
            setTimeout(() => {
                updateStatus('Email verified! Opening app...', 'success');
                redirectToApp('verified', verificationParams);
            }, 3000);

        } else if (urlParams.get('error')) {
            // Handle verification errors
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');
            
            log('❌ Verification error:', error, errorDescription);
            updateStatus(
                `Verification failed: ${errorDescription || error}`, 
                'error'
            );

            startCountdown(5);
            setTimeout(() => {
                redirectToApp('error', { error });
            }, 5000);

        } else {
            // Handle unknown or invalid links
            log('⚠️ Invalid verification parameters');
            updateStatus('Invalid verification link', 'error');

            startCountdown(3);
            setTimeout(() => {
                redirectToApp('invalid');
            }, 3000);
        }

        // Fallback redirect
        setTimeout(() => {
            if (document.visibilityState === 'visible') {
                log('⏰ Fallback redirect triggered');
                updateStatus('Taking too long. Redirecting...', 'loading');
                redirectToApp('timeout');
            }
        }, 10000);
    </script>