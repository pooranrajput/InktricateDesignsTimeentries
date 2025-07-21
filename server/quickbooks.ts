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

  // Find existing vendor by name in QuickBooks
  async findExistingVendor(qbo: any, vendorName: string) {
    return new Promise((resolve, reject) => {
      // Use SQL-like query which is more reliable for name searches
      const query = `SELECT * FROM Vendor WHERE Name = '${vendorName.replace(/'/g, "\\'")}'`;
      console.log(`🔍 Searching for vendor with query: ${query}`);
      
      qbo.findVendors(query, (err: any, vendors: any) => {
        if (err) {
          console.log(`⚠️ Error searching for vendor "${vendorName}":`, err);
          resolve(null); // Return null if search fails, don't reject
        } else {
          const foundVendors = vendors?.QueryResponse?.Vendor || [];
          console.log(`🔍 Search results for "${vendorName}":`, foundVendors.length, 'vendors found');
          if (foundVendors.length > 0) {
            console.log(`✅ Found existing vendor: ${foundVendors[0].Name} (ID: ${foundVendors[0].Id}, Track1099: ${foundVendors[0].Track1099})`);
            resolve(foundVendors[0]);
          } else {
            console.log(`ℹ️ No existing vendor found for "${vendorName}"`);
            resolve(null);
          }
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
      
      // Create vendor object with careful data validation - use correct field mapping
      const firstName = employee.first_name || employee.firstName || 'Unknown';
      const lastName = employee.last_name || employee.lastName || 'Unknown';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Basic validation to prevent API errors
      if (!fullName || fullName === 'Unknown Unknown') {
        throw new Error(`Invalid employee name data: firstName="${firstName}", lastName="${lastName}"`);
      }
      
      // Create vendor object with correct QuickBooks API structure
      const vendor: any = {
        DisplayName: fullName,  // QuickBooks requires DisplayName, not Name
        Track1099: true        // Make them appear as contractors by enabling 1099 tracking
      };
      
      // Add optional fields only if they exist and are valid
      if (employee.email && employee.email.trim()) {
        vendor.PrimaryEmailAddr = { Address: employee.email.trim() };
      }
      
      console.log('🔧 Creating contractor-vendor with structure:', vendor);

      console.log('📤 Creating QuickBooks vendor with data:', JSON.stringify(vendor, null, 2));
      
      return new Promise((resolve, reject) => {
        qbo.createVendor(vendor, (err: any, createdVendor: any) => {
          if (err) {
            console.error('❌ QuickBooks vendor creation failed for:', vendor.Name);
            console.error('❌ Vendor data sent:', JSON.stringify(vendor, null, 2));
            console.error('❌ Full error:', JSON.stringify(err, null, 2));
            console.error('❌ Error message:', err.message);
            console.error('❌ Error fault:', err.Fault);
            reject(err);
          } else {
            console.log('✅ Contractor created in QuickBooks successfully:', createdVendor.Id, 'Name:', createdVendor.Name);
            resolve(createdVendor);
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
    console.log(`🚀 Starting contractor sync for ${employees.length} employees`);
    
    if (!this.oauthClient || !this.companyId) {
      throw new Error('QuickBooks not properly initialized');
    }

    const results = [];
    
    for (const employee of employees) {
      console.log(`\n🔍 Processing employee:`, employee);
      
      try {
        // Map database fields correctly - database returns snake_case field names
        const firstName = employee.first_name || employee.firstName;
        const lastName = employee.last_name || employee.lastName;
        console.log('🔍 Employee field mapping:', { firstName, lastName, email: employee.email });
        
        if (!firstName || !lastName) {
          console.log(`⚠️  Employee has missing name data: firstName="${firstName}", lastName="${lastName}"`);
          console.log(`⚠️  Skipping employee with incomplete name data`);
          results.push({
            employee: employee.id,
            status: 'failed',
            error: 'Missing name data',
            message: 'Skipped due to missing first or last name'
          });
          continue;
        }
        
        // Check if vendor already exists in QuickBooks by searching for the name
        const fullName = `${firstName} ${lastName}`.trim();
        console.log(`🔍 Checking if vendor "${fullName}" already exists in QuickBooks...`);
        
        const existingVendor = await this.findExistingVendor(await this.initializeClient(), fullName);
        
        if (existingVendor) {
          console.log(`✅ Vendor "${fullName}" already exists (QB ID: ${existingVendor.Id})`);
          
          // Check if we need to enable 1099 tracking
          if (!existingVendor.Track1099) {
            console.log(`🔄 Updating vendor "${fullName}" to enable 1099 tracking...`);
            console.log(`🔧 Current vendor data before update:`, JSON.stringify({
              Id: existingVendor.Id,
              Name: existingVendor.Name,
              Track1099: existingVendor.Track1099,
              SyncToken: existingVendor.SyncToken
            }, null, 2));
            
            try {
              const qbo = await this.initializeClient();
              const updateData = {
                Id: existingVendor.Id,
                SyncToken: existingVendor.SyncToken,
                Name: existingVendor.Name,
                Track1099: true,
                sparse: true
              };
              
              console.log(`🔧 Update data being sent:`, JSON.stringify(updateData, null, 2));
              
              await new Promise((resolve, reject) => {
                qbo.updateVendor(updateData, (err: any, updatedVendor: any) => {
                  if (err) {
                    console.error(`❌ Failed to update 1099 tracking for ${fullName}:`, JSON.stringify(err, null, 2));
                    reject(err);
                  } else {
                    console.log(`✅ Successfully updated ${fullName} with 1099 tracking enabled`);
                    console.log(`✅ Updated vendor result:`, JSON.stringify(updatedVendor?.Name, null, 2));
                    resolve(updatedVendor);
                  }
                });
              });
            } catch (updateError) {
              console.error(`⚠️ Update failed for ${fullName}:`, updateError);
            }
          } else {
            console.log(`✅ Vendor "${fullName}" already has 1099 tracking enabled`);
          }
          
          // Update our database with QB vendor ID if not set
          if (!employee.quickbooksCustomerId && !employee.quickbooks_customer_id) {
            await db.update(users)
              .set({ 
                quickbooksCustomerId: existingVendor.Id,
                updatedAt: new Date()
              })
              .where(eq(users.id, employee.id));
          }
          
          results.push({
            employee: employee.id,
            employeeName: fullName,
            status: 'linked',
            message: `Successfully linked and configured as contractor`,
            quickbooksId: existingVendor.Id,
            actions: [
              'Found existing vendor in QuickBooks',
              existingVendor.Track1099 ? 'Already set up for 1099 tracking' : 'Enabled 1099 tracking - now appears in contractors section',
              'Linked to employee database record'
            ]
          });
          continue;
        }
        
        // Create new vendor if not found
        console.log(`➕ Creating new vendor for ${firstName} ${lastName}`);
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
          employeeName: fullName,
          status: 'created', 
          vendor: vendor,
          message: `Successfully created new contractor`,
          quickbooksId: vendor.Id,
          actions: [
            'Created new vendor in QuickBooks',
            'Enabled 1099 tracking - appears in contractors section',
            'Linked to employee database record'
          ]
        });
        
      } catch (error) {
        console.error(`❌ Failed to sync contractor ${employee.firstName || employee.first_name} ${employee.lastName || employee.last_name}:`, error);
        results.push({ 
          employee: employee.id, 
          status: 'failed', 
          error: (error as Error).message,
          message: `Failed to sync: ${(error as Error).message}`
        });
      }
    }
    
    console.log('📤 Contractor sync completed:', results);
    
    const created = results.filter(r => r.status === 'created');
    const linked = results.filter(r => r.status === 'linked');
    const failed = results.filter(r => r.status === 'failed');
    
    return {
      total: employees.length,
      created: created.length,
      linked: linked.length,
      failed: failed.length,
      summary: {
        successful: created.length + linked.length,
        createdContractors: created.map(r => r.employeeName).join(', '),
        linkedContractors: linked.map(r => r.employeeName).join(', '),
        failedContractors: failed.map(r => r.employeeName || r.employee).join(', ')
      },
      details: results
    };
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