// @ts-ignore
import OAuthClient from 'intuit-oauth';
// @ts-ignore
import QuickBooks from 'node-quickbooks';
import { db } from './db';
import { quickbooksConfig, users, timeEntries } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export class QuickBooksService {
  private oauthClient: OAuthClient;
  private qbo: QuickBooks | null = null;
  private companyId: string | null = null;

  constructor() {
    // Clean and validate environment variables
    const clientId = (process.env.QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (process.env.QUICKBOOKS_CLIENT_SECRET || '').trim();
    const redirectUri = (process.env.QUICKBOOKS_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/quickbooks/callback`).trim();
    
    console.log('🔧 QuickBooks Init Debug:', {
      clientIdLength: clientId.length,
      clientIdStart: clientId.substring(0, 10),
      hasClientSecret: !!clientSecret,
      redirectUri,
      sandbox: process.env.QUICKBOOKS_SANDBOX
    });
    
    this.oauthClient = new OAuthClient({
      clientId,
      clientSecret,
      sandbox: process.env.QUICKBOOKS_SANDBOX === 'true',
      redirectUri,
    });
  }

  // Step 1: Get authorization URL for OAuth flow
  getAuthorizationUrl(state?: string) {
    console.log('QuickBooks OAuth Config:', {
      clientId: process.env.QUICKBOOKS_CLIENT_ID?.substring(0, 8) + '...',
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
      sandbox: process.env.QUICKBOOKS_SANDBOX
    });
    
    const authUrl = this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: state || 'state',
    });
    
    console.log('Generated auth URL:', authUrl.substring(0, 100) + '...');
    return authUrl;
  }

  // Step 2: Handle OAuth callback and store tokens
  async handleCallback(code: string, state: string, realmId: string) {
    try {
      console.log('🔍 QuickBooks Debug - Handling OAuth callback with manual token exchange');
      console.log('🔍 QuickBooks Debug - Code:', !!code, 'State:', state, 'RealmId:', realmId);
      
      // Manual token exchange as fallback to intuit-oauth createToken issues
      const tokens = await this.exchangeCodeForTokens(code, realmId);
      console.log('🔍 QuickBooks Debug - Manual token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        realmId: tokens.realmId
      });
      
      // Store tokens in database  
      await db.insert(quickbooksConfig).values({
        companyId: realmId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        sandbox: process.env.QUICKBOOKS_SANDBOX === 'true',
      }).onConflictDoUpdate({
        target: quickbooksConfig.companyId,
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        },
      });

      console.log('🔍 QuickBooks Debug - Tokens stored in database successfully');
      this.companyId = realmId;
      return { success: true, companyId: realmId };
    } catch (error) {
      console.error('🔍 QuickBooks Debug - OAuth callback error:', error);
      throw new Error('Failed to authenticate with QuickBooks');
    }
  }

  // Manual token exchange method
  private async exchangeCodeForTokens(authCode: string, realmId: string) {
    const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const clientId = (process.env.QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (process.env.QUICKBOOKS_CLIENT_SECRET || '').trim();
    const redirectUri = (process.env.QUICKBOOKS_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/quickbooks/callback`).trim();
    
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log('🔍 Manual Token Exchange Debug:', {
      tokenEndpoint,
      hasAuthCode: !!authCode,
      authCodeLength: authCode.length,
      realmId,
      redirectUri,
      credentialsLength: credentials.length
    });
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri
    });
    
    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });
      
      const responseText = await response.text();
      console.log('🔍 Token Exchange Response Status:', response.status);
      console.log('🔍 Token Exchange Response:', responseText);
      
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} - ${responseText}`);
      }
      
      const tokenData = JSON.parse(responseText);
      
      // Add realmId to the token data since it's not returned by the API
      return {
        ...tokenData,
        realmId: realmId
      };
    } catch (error) {
      console.error('🚨 Manual token exchange failed:', error);
      throw error;
    }
  }

  // Initialize QuickBooks client with stored tokens
  async initializeClient(companyId?: string): Promise<any> {
    try {
      console.log('🔍 QuickBooks Debug - Initializing client with companyId:', companyId);
      
      const config = await db.query.quickbooksConfig.findFirst({
        where: companyId ? eq(quickbooksConfig.companyId, companyId) : undefined,
      });

      console.log('🔍 QuickBooks Debug - Config found:', !!config);
      console.log('🔍 QuickBooks Debug - Config details:', config ? {
        companyId: config.companyId,
        hasAccessToken: !!config.accessToken,
        hasRefreshToken: !!config.refreshToken,
        tokenExpiry: config.tokenExpiry,
        isExpired: config.tokenExpiry ? new Date() >= config.tokenExpiry : 'unknown',
        sandbox: config.sandbox
      } : 'No config');

      if (!config) {
        throw new Error('QuickBooks not configured. Please complete OAuth setup first.');
      }

      // Check if token needs refresh
      if (new Date() >= config.tokenExpiry) {
        await this.refreshToken(config.companyId);
        return this.initializeClient(config.companyId);
      }

      // Initialize QuickBooks client for OAuth 2.0
      this.qbo = new QuickBooks(
        process.env.QUICKBOOKS_CLIENT_ID,   // consumerKey (Client ID)
        process.env.QUICKBOOKS_CLIENT_SECRET, // consumerSecret (Client Secret)
        config.accessToken,                 // accessToken
        false,                             // No token secret for OAuth 2.0
        config.companyId,                  // realmId
        config.sandbox,                    // use sandbox
        true,                             // enable debugging
        null,                             // minor version (latest)
        "2.0",                            // OAuth version 2.0
        config.refreshToken               // refresh token for auto-renewal
      );
      
      console.log('🔍 QuickBooks Debug - Client initialized successfully with OAuth 2.0');

      this.companyId = config.companyId;
      return this.qbo;
    } catch (error) {
      console.error('QuickBooks initialization error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(companyId: string) {
    try {
      const config = await db.query.quickbooksConfig.findFirst({
        where: eq(quickbooksConfig.companyId, companyId),
      });

      if (!config) {
        throw new Error('QuickBooks configuration not found');
      }

      const authResponse = await this.oauthClient.refreshUsingToken(config.refreshToken);
      
      await db.update(quickbooksConfig)
        .set({
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          tokenExpiry: new Date(Date.now() + authResponse.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(quickbooksConfig.companyId, companyId));

    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh QuickBooks token');
    }
  }



  // Create billable time entry in QuickBooks
  async createTimeActivity(timeEntry: any, user: any) {
    await this.initializeClient();
    
    return new Promise((resolve, reject) => {
      const timeActivity = {
        TxnDate: timeEntry.date,
        NameOf: 'Vendor',
        VendorRef: {
          value: user.quickbooksCustomerId,
        },
        ItemRef: {
          value: user.quickbooksItemId || '1', // Default service item
        },
        BillableStatus: timeEntry.isQuickbooksBillable ? 'Billable' : 'NotBillable',
        Hours: parseFloat(timeEntry.totalHours),
        HourlyRate: parseFloat(user.hourlyRate || '0'),
        Description: `${timeEntry.project} - ${timeEntry.notes || 'Time entry'}`,
        CustomerRef: timeEntry.clientName ? { name: timeEntry.clientName } : undefined,
      };

      this.qbo!.createTimeActivity(timeActivity, (err: any, timeActivity: any) => {
        if (err) {
          console.error('Error creating time activity:', err);
          reject(err);
        } else {
          resolve(timeActivity.QueryResponse?.TimeActivity?.[0] || timeActivity);
        }
      });
    });
  }

  // Convert time entries to invoice for a contractor
  async createInvoiceFromTimeEntries(contractorId: string, timeEntryIds: number[], invoiceData: any) {
    await this.initializeClient();
    
    const contractor = await db.query.users.findFirst({
      where: eq(users.id, contractorId),
    });

    if (!contractor?.quickbooksCustomerId) {
      throw new Error('Contractor not setup in QuickBooks');
    }

    const timeEntriesData = await db.query.timeEntries.findMany({
      where: and(
        eq(timeEntries.userId, contractorId),
        // Add condition for timeEntryIds
      ),
      with: {
        user: true,
      },
    });

    return new Promise((resolve, reject) => {
      const invoice = {
        CustomerRef: {
          value: contractor.quickbooksCustomerId,
        },
        Line: timeEntriesData.map((entry) => ({
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: contractor.quickbooksItemId || '1',
            },
            Qty: parseFloat(entry.totalHours),
            UnitPrice: parseFloat(contractor.hourlyRate || '0'),
            ServiceDate: entry.date,
          },
          Description: `${entry.project} - ${entry.notes || 'Time entry'}`,
        })),
        DueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        PrivateNote: invoiceData.notes || 'Invoice generated from time tracking system',
      };

      this.qbo!.createInvoice(invoice, (err: any, invoice: any) => {
        if (err) {
          console.error('Error creating invoice:', err);
          reject(err);
        } else {
          resolve(invoice.QueryResponse?.Invoice?.[0] || invoice);
        }
      });
    });
  }

  // Generate monthly contractor bills
  async generateMonthlyContractorBills(year: number, month: number) {
    await this.initializeClient();
    
    // Get all contractors with time entries for the month
    const contractors = await db.query.users.findMany({
      where: and(
        eq(users.role, 'employee'),
        // Add condition for having QuickBooks setup
      ),
      with: {
        timeEntries: {
          where: and(
            // Add date filtering for the specific month/year
          ),
        },
      },
    });

    const results = [];
    
    for (const contractor of contractors) {
      if (contractor.timeEntries.length > 0 && contractor.quickbooksCustomerId) {
        try {
          const invoice = await this.createInvoiceFromTimeEntries(
            contractor.id,
            contractor.timeEntries.map(entry => entry.id),
            {
              dueDate: new Date(year, month, 15).toISOString().split('T')[0], // 15th of next month
              notes: `Monthly time tracking invoice for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            }
          );
          
          results.push({
            contractor: contractor,
            invoice: invoice,
            totalHours: contractor.timeEntries.reduce((sum, entry) => sum + parseFloat(entry.totalHours), 0),
            totalAmount: contractor.timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.totalHours) * parseFloat(contractor.hourlyRate || '0')), 0),
          });
        } catch (error) {
          console.error(`Error creating invoice for contractor ${contractor.id}:`, error);
          results.push({
            contractor: contractor,
            error: (error as Error).message,
          });
        }
      }
    }

    return results;
  }

  // Get QuickBooks company information
  async getCompanyInfo() {
    await this.initializeClient();
    
    return new Promise((resolve, reject) => {
      this.qbo!.getCompanyInfo(this.companyId!, (err: any, companyInfo: any) => {
        if (err) {
          console.error('Error getting company info:', err);
          reject(err);
        } else {
          resolve(companyInfo.QueryResponse?.CompanyInfo?.[0] || companyInfo);
        }
      });
    });
  }

  // Test connection
  async testConnection() {
    try {
      console.log('🔍 QuickBooks Debug - Starting connection test');
      await this.initializeClient();
      console.log('🔍 QuickBooks Debug - Client initialized successfully');
      const companyInfo = await this.getCompanyInfo();
      console.log('🔍 QuickBooks Debug - Company info retrieved:', companyInfo);
      return { success: true, companyInfo };
    } catch (error) {
      console.log('🔍 QuickBooks Debug - Connection test failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Create contractor as vendor in QuickBooks
  async createContractor(employee: any) {
    try {
      const qbo = await this.initializeClient();
      
      const vendor = {
        Name: `${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName}`,
        CompanyName: employee.companyName || `${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName} Services`,
        PrintOnCheckName: `${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName}`,
        Active: employee.is_active || employee.isActive || employee.status === 'active',
        PrimaryEmailAddr: employee.email ? { Address: employee.email } : undefined,
        WebAddr: employee.website ? { URI: employee.website } : undefined,
        PrimaryPhone: employee.phone ? { FreeFormNumber: employee.phone } : undefined,
        Vendor1099: true, // Mark as 1099 contractor
        TaxIdentifier: employee.taxId || undefined,
        AcctNum: employee.id // Use our employee ID as account number for reference
      };

      return new Promise((resolve, reject) => {
        qbo.createVendor(vendor, (err: any, vendor: any) => {
          if (err) {
            console.error('Error creating contractor in QuickBooks:', err);
            reject(err);
          } else {
            console.log('✅ Contractor created in QuickBooks:', vendor.Id);
            resolve(vendor);
          }
        });
      });
    } catch (error) {
      console.error('Error creating contractor:', error);
      throw error;
    }
  }

  // Sync all active contractors to QuickBooks
  async syncAllContractors(employees: any[]) {
    try {
      console.log(`📤 Syncing ${employees.length} contractors to QuickBooks...`);
      console.log('👥 Employee data preview:', employees.slice(0, 2));
      const results = [];
      
      for (const employee of employees) {
        try {
          console.log(`🔍 Processing employee: ${JSON.stringify({
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            is_active: employee.is_active
          })}`);
          
          // Enhanced vendor search with multiple matching strategies
          const existingMatch = await this.findExistingVendor(employee);
          
          if (existingMatch) {
            const { vendor, matchType } = existingMatch as { vendor: any, matchType: string };
            console.log(`⏭️  Contractor ${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName} found as "${vendor.Name}" (${matchType} match)`);
            
            // Update our database with the QuickBooks vendor ID for future reference
            await db.update(users)
              .set({ 
                quickbooksCustomerId: vendor.Id,
                updatedAt: new Date()
              })
              .where(eq(users.id, employee.id));
            
            results.push({ 
              employee: employee.id, 
              status: 'linked', 
              vendor: vendor,
              matchType: matchType,
              message: `Linked existing QB vendor "${vendor.Name}" via ${matchType} match`
            });
          } else {
            console.log(`➕ Creating new vendor for ${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName}`);
            const vendor = await this.createContractor(employee) as any;
            
            // Update our database with the new QuickBooks vendor ID
            await db.update(users)
              .set({ 
                quickbooksCustomerId: vendor.Id,
                updatedAt: new Date()
              })
              .where(eq(users.id, employee.id));
            
            results.push({ 
              employee: employee.id, 
              status: 'created', 
              vendor: vendor,
              message: `Created new QB vendor "${vendor.Name}"`
            });
          }
        } catch (error) {
          console.error(`❌ Failed to sync contractor ${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName}:`, error);
          results.push({ 
            employee: employee.id, 
            status: 'failed', 
            error: (error as Error).message,
            message: `Failed to sync: ${(error as Error).message}`
          });
        }
      }
      
      console.log('📤 Contractor sync completed:', results);
      return {
        total: employees.length,
        created: results.filter(r => r.status === 'created').length,
        linked: results.filter(r => r.status === 'linked').length,
        failed: results.filter(r => r.status === 'failed').length,
        details: results
      };
    } catch (error) {
      console.error('Error syncing contractors:', error);
      throw error;
    }
  }

  // Find vendor by name
  private async findVendorByName(name: string) {
    try {
      const qbo = await this.initializeClient();
      
      return new Promise((resolve, reject) => {
        qbo.findVendors({ Name: name }, (err: any, vendors: any) => {
          if (err) {
            reject(err);
          } else {
            const vendor = vendors?.QueryResponse?.Vendor?.find((v: any) => v.Name === name);
            resolve(vendor || null);
          }
        });
      });
    } catch (error) {
      console.error('Error finding vendor:', error);
      return null;
    }
  }

  // Enhanced vendor search with multiple matching strategies
  private async findExistingVendor(employee: any) {
    try {
      const qbo = await this.initializeClient();
      const fullName = `${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName}`.trim();
      
      return new Promise((resolve, reject) => {
        // Search for all vendors to do comprehensive matching
        qbo.findVendors({}, (err: any, vendors: any) => {
          if (err) {
            reject(err);
            return;
          }

          const allVendors = vendors?.QueryResponse?.Vendor || [];
          
          // Strategy 1: Exact name match
          let match = allVendors.find((v: any) => v.Name === fullName);
          if (match) {
            console.log(`✅ Found exact name match: ${fullName}`);
            resolve({ vendor: match, matchType: 'exact_name' });
            return;
          }
          
          // Strategy 2: Case-insensitive name match
          match = allVendors.find((v: any) => 
            v.Name?.toLowerCase() === fullName.toLowerCase()
          );
          if (match) {
            console.log(`✅ Found case-insensitive name match: ${fullName}`);
            resolve({ vendor: match, matchType: 'name_case_insensitive' });
            return;
          }
          
          // Strategy 3: Email match (if employee has email)
          if (employee.email) {
            match = allVendors.find((v: any) => 
              v.PrimaryEmailAddr?.Address?.toLowerCase() === employee.email.toLowerCase()
            );
            if (match) {
              console.log(`✅ Found email match: ${employee.email} -> ${match.Name}`);
              resolve({ vendor: match, matchType: 'email' });
              return;
            }
          }
          
          // Strategy 4: Fuzzy name matching (handles "John Smith" vs "John A Smith")
          match = allVendors.find((v: any) => {
            const vendorName = v.Name?.toLowerCase() || '';
            const firstName = (employee.first_name || employee.firstName)?.toLowerCase() || '';
            const lastName = (employee.last_name || employee.lastName)?.toLowerCase() || '';
            
            return vendorName.includes(firstName) && vendorName.includes(lastName);
          });
          if (match) {
            console.log(`✅ Found fuzzy name match: ${fullName} -> ${match.Name}`);
            resolve({ vendor: match, matchType: 'fuzzy_name' });
            return;
          }
          
          // No match found
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error finding existing vendor:', error);
      return null;
    }
  }
}

export const quickbooksService = new QuickBooksService();