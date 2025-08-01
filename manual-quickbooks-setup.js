// Manual QuickBooks Token Setup - Bypasses OAuth redirect issues
// This method allows you to get tokens without configuring redirect URIs

const fs = require('fs');
const path = require('path');

const manualSetupGuide = {
  title: "MANUAL QUICKBOOKS SETUP - No Redirect URI Required",
  
  problem: "Your QuickBooks app has no redirect URIs configured, causing all OAuth attempts to fail",
  
  solution: "Use QuickBooks' manual token generation in their developer portal",
  
  steps: [
    {
      step: 1,
      action: "Go to QuickBooks Developer Portal",
      url: "https://developer.intuit.com/",
      details: "Sign in with your QuickBooks developer account"
    },
    {
      step: 2,
      action: "Navigate to your app",
      details: "Find your app with Client ID: AB6HieH2iC..."
    },
    {
      step: 3,
      action: "Go to 'Test connect to app (OAuth)' link",
      details: "This opens the OAuth 2.0 Playground for your specific app"
    },
    {
      step: 4,
      action: "Generate tokens in playground",
      substeps: [
        "Select scope: com.intuit.quickbooks.accounting",
        "Click 'Get Authorization Code'", 
        "Click 'Get tokens'",
        "Copy both access_token and refresh_token"
      ]
    },
    {
      step: 5,
      action: "Provide tokens to developer",
      details: "Give both tokens and company ID to complete setup"
    }
  ],
  
  expectedResult: "Tokens will be stored in database, QuickBooks integration will work immediately",
  
  fallbackOption: {
    description: "If playground doesn't work, we can add redirect URI to your app",
    requiredUri: "https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback"
  }
};

console.log("=".repeat(80));
console.log("QUICKBOOKS MANUAL SETUP GUIDE");
console.log("=".repeat(80));
console.log(JSON.stringify(manualSetupGuide, null, 2));

// Create a simple endpoint for manual token insertion
const tokenInsertCode = `
// Add this to your backend for manual token insertion
app.post('/api/quickbooks/manual-setup', async (req, res) => {
  try {
    const { accessToken, refreshToken, companyId } = req.body;
    
    // Store tokens in database
    await storage.insertQuickBooksConnection({
      companyId: companyId || '9130351530529746',
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      sandbox: false
    });
    
    res.json({ 
      success: true, 
      message: 'QuickBooks connected successfully!',
      companyId: companyId || '9130351530529746'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
`;

console.log("\nMANUAL TOKEN INSERT CODE:");
console.log(tokenInsertCode);

// Save guide to file
fs.writeFileSync(path.join(__dirname, 'MANUAL_QUICKBOOKS_SETUP_GUIDE.md'), `
# Manual QuickBooks Setup Guide

${JSON.stringify(manualSetupGuide, null, 2)}

## Manual Token Insert Code
\`\`\`javascript
${tokenInsertCode}
\`\`\`
`);

console.log("\nGuide saved to: MANUAL_QUICKBOOKS_SETUP_GUIDE.md");