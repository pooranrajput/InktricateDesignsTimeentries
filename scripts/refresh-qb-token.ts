import { db } from "../server/db";
import { quickbooksConfig } from "../shared/schema";
import { eq } from "drizzle-orm";

async function refreshToken() {
  console.log('🔄 Refreshing QuickBooks access token...\n');
  
  const [config] = await db.select().from(quickbooksConfig).limit(1);
  if (!config) {
    console.log('❌ No QuickBooks config found');
    process.exit(1);
  }
  
  console.log('Current token expired:', config.tokenExpiry);
  
  const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
  
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(config.refreshToken)}`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token refresh failed:', response.status, errorText);
      process.exit(1);
    }
    
    const data = await response.json();
    
    const newExpiry = new Date(Date.now() + data.expires_in * 1000);
    
    await db.update(quickbooksConfig)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiry: newExpiry,
        updatedAt: new Date()
      })
      .where(eq(quickbooksConfig.id, config.id));
    
    console.log('✅ Token refreshed successfully!');
    console.log('   New expiry:', newExpiry.toISOString());
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

refreshToken();
