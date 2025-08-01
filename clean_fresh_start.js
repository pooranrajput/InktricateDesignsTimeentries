// Create a completely clean QuickBooks callback handler

const cleanCallbackHandler = `
  // QuickBooks callback handler - COMPLETELY CLEAN FRESH START
  app.get('/api/quickbooks/callback', async (req, res) => {
    console.log('🆕 COMPLETELY CLEAN FRESH QuickBooks Callback...');
    console.log('🔍 Raw Query:', req.query);
    
    try {
      const { code, state, realmId, error, error_description } = req.query;
      
      // Check for OAuth errors first
      if (error) {
        console.error('❌ QuickBooks OAuth Error:', { error, error_description });
        return res.redirect(\`/?quickbooks=error&reason=\${error}\`);
      }
      
      // Validate required parameters
      if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect('/?quickbooks=error&reason=no_code');
      }

      if (!realmId) {
        console.error('❌ No company ID received');
        return res.redirect('/?quickbooks=error&reason=no_company_id');
      }

      console.log('✅ Valid callback parameters received:', {
        code: code.substring(0, 20) + '...',
        state,
        realmId,
        codeLength: code.length
      });

      // Clear any existing QuickBooks data for fresh start
      await storage.clearQuickBooksConfig();
      console.log('🧹 Cleared existing QuickBooks configuration');

      // Exchange authorization code for tokens
      const clientId = process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID;
      const clientSecret = process.env.QUICKBOOKS_PRODUCTION_CLIENT_SECRET;
      const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
      
      console.log('🔄 Exchanging code for tokens with production credentials');
      
      const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': \`Basic \${Buffer.from(\`\${clientId}:\${clientSecret}\`).toString('base64')}\`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', {
          status: tokenResponse.status,
          error: errorText
        });
        return res.redirect(\`/?quickbooks=error&reason=token_exchange&status=\${tokenResponse.status}\`);
      }

      const tokens = await tokenResponse.json();
      console.log('✅ Token exchange successful');

      // Store the tokens and configuration
      await storage.storeQuickBooksTokens({
        companyId: realmId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        sandbox: false
      });

      console.log('💾 QuickBooks configuration saved successfully');
      console.log('🎉 CLEAN FRESH QuickBooks connection established!');
      
      res.redirect('/?quickbooks=success&fresh=true');

    } catch (error) {
      console.error('❌ Callback processing error:', error);
      res.redirect('/?quickbooks=error&reason=server_error');
    }
  });
`;

console.log('Clean callback handler created');
console.log('This replaces the complex existing callback with a simple, robust version');
console.log('Key improvements:');
console.log('- Clean error handling');
console.log('- Proper parameter validation');
console.log('- Fresh database clearing');
console.log('- Simple token exchange');
console.log('- Clear success/error reporting');