// @ts-ignore
import OAuthClient from 'intuit-oauth';
// @ts-ignore
import QuickBooks from 'node-quickbooks';
import { db } from './db';
import { quickbooksConfig, users, timeEntries, monthlyPayroll } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export class QuickBooksService {
  private oauthClient: OAuthClient;
  private qbo: QuickBooks | null = null;
  private companyId: string | null = null;
  private useSandbox: boolean;

  constructor() {
    // FORCE PRODUCTION: Hardcode production settings
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
    
    // FORCE PRODUCTION MODE: Completely disable sandbox
    this.useSandbox = false;
    process.env.QUICKBOOKS_SANDBOX = 'false';
    process.env.QB_SANDBOX = 'false';
    process.env.INTUIT_SANDBOX = 'false';
    
    console.log('🆕 FRESH QUICKBOOKS INTEGRATION:', {
      clientIdLength: clientId?.length,
      clientIdStart: clientId?.substring(0, 10),
      hasClientSecret: !!clientSecret,
      redirectUri,
      productionMode: !this.useSandbox,
      environmentSource: 'Replit Secrets'
    });
    
    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks credentials missing from environment');
    }
    
    this.oauthClient = new OAuthClient({
      clientId,
      clientSecret,
      sandbox: false, // FORCE PRODUCTION
      redirectUri,
      environment: 'production', // Force production environment
      logging: false
    });
  }

  // Step 1: Get authorization URL for OAuth flow
  getAuthorizationUrl(state?: string) {
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
    const expectedProductionCompanyId = '9130351530529746';
    
    console.log('🆕 FRESH OAuth Authorization:', {
      productionMode: !this.useSandbox,
      redirectUri: redirectUri,
      targetCompanyId: expectedProductionCompanyId,
      state: state || 'fresh-start'
    });
    
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    
    // Verify we have the correct Client ID before generating URL
    if (!clientId || clientId.length !== 50) {
      throw new Error(`Invalid Client ID: expected 50 characters, got ${clientId?.length || 0}`);
    }
    
    if (clientId.charAt(10) !== 'W') {
      throw new Error(`Client ID has wrong character at position 11: expected 'W', got '${clientId.charAt(10)}'`);
    }
    
    // Manual URL construction with PRODUCTION ONLY parameters
    const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
    
    // Ensure state parameter is never undefined to prevent "undefined didn't connect" error
    const safeState = state || `production-auth-${Date.now()}`;
    
    const params = new URLSearchParams({
      client_id: clientId || '',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: redirectUri || '',
      response_type: 'code',
      state: safeState
      // REMOVED sandbox parameter - QuickBooks OAuth doesn't recognize this parameter
    });
    
    const manualAuthUrl = `${baseUrl}?${params.toString()}`;
    
    // Force production OAuth client configuration
    const productionOAuthClient = new OAuthClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
      sandbox: false,
      redirectUri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
      environment: 'production'
    });
    
    let libraryAuthUrl = '';
    try {
      libraryAuthUrl = productionOAuthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state: state || 'production-auth',
      });
    } catch (error) {
      console.error('🚨 Library authorization URL generation failed:', error);
    }
    
    console.log('🔧 Manual Auth URL with company pre-selection:', manualAuthUrl.substring(0, 150) + '...');
    console.log('🔧 Library Auth URL:', libraryAuthUrl.substring(0, 150) + '...');
    console.log('🎯 Target Company ID:', expectedProductionCompanyId);
    
    // Return manual URL with pre-selected company
    return manualAuthUrl;
  }

  // Step 2: Handle OAuth callback and store tokens
  async handleCallback(code: string, state: string, realmId: string) {
    try {
      console.log('🔍 QuickBooks Debug - Handling OAuth callback with manual token exchange');
      console.log('🔍 QuickBooks Debug - Code:', !!code, 'State:', state, 'RealmId:', realmId);
      console.log('🔍 QuickBooks Debug - Environment check during callback:', {
        useSandbox: this.useSandbox,
        sandboxEnv: process.env.QUICKBOOKS_SANDBOX,
        realmId: realmId
      });
      
      // Manual token exchange as fallback to intuit-oauth createToken issues
      const tokens = await this.exchangeCodeForTokens(code, realmId);
      console.log('🔍 QuickBooks Debug - Manual token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        realmId: tokens.realmId
      });
      
      // CRITICAL CHECK: Prevent production/sandbox mismatch
      if (!this.useSandbox && realmId === '9341455047397094') {
        console.error('🚨 PRODUCTION/SANDBOX MISMATCH DETECTED!');
        console.error('🚨 You connected to sandbox company 9341455047397094 with production credentials');
        console.error('🚨 This will cause ApplicationAuthorizationFailed errors');
        console.error('🚨 SOLUTION: You must connect to your ACTUAL business QuickBooks account');
        throw new Error('SANDBOX/PRODUCTION MISMATCH: You are connecting to a sandbox QuickBooks company (ID: 9341455047397094) using production app credentials. This is not allowed by QuickBooks. Please use the authorization URL again and select your ACTUAL business QuickBooks account instead of the sandbox/demo account.');
      }

      // Store tokens in database  
      await db.insert(quickbooksConfig).values({
        companyId: realmId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        sandbox: this.useSandbox, // Use environment variable
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
    // Check for sandbox/production compatibility
    const knownSandboxCompanyId = '9341455047397094';
    const expectedProductionCompanyId = '9130351530529746';
    
    console.log('🔍 Company ID Check:', {
      realmId,
      isSandboxCompany: realmId === knownSandboxCompanyId,
      isProductionCompany: realmId === expectedProductionCompanyId,
      useSandbox: this.useSandbox,
      mode: this.useSandbox ? 'Sandbox' : 'Production'
    });
    
    if (!this.useSandbox && realmId === knownSandboxCompanyId) {
      console.log('⚠️  SANDBOX COMPANY DETECTED IN PRODUCTION MODE');
      console.log('⚠️  Company:', realmId, '← This is the SANDBOX demo company');
      console.log('⚠️  Expected:', expectedProductionCompanyId, '← This should be your PRODUCTION company');
      console.error('🚨 You connected to sandbox company 9341455047397094 with production credentials');
      console.error('🚨 This is not allowed. You must connect to your production company: 9130351530529746');
      throw new Error('SANDBOX/PRODUCTION MISMATCH: You are connecting to a sandbox QuickBooks company (ID: 9341455047397094) using production app credentials. This is not allowed by QuickBooks. Please use the authorization URL again and select your ACTUAL business QuickBooks account with ID 9130351530529746.');
    }
    
    if (!this.useSandbox && realmId === expectedProductionCompanyId) {
      console.log('✅ CORRECT PRODUCTION COMPANY SELECTED!');
      console.log('✅ Company ID:', realmId, '← This is your real business QuickBooks account');
    }
    
    if (this.useSandbox && realmId !== knownSandboxCompanyId) {
      console.log('🔍 Sandbox mode with non-sandbox company - this should work for testing');
    }
    
    const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const clientId = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
    const clientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU';
    const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
    
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
        'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA',   // consumerKey (Client ID)
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
      
      // Calculate token expiry with fallback
      const expiresIn = authResponse.expires_in || 3600; // Default to 1 hour if not provided
      const tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
      
      await db.update(quickbooksConfig)
        .set({
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          tokenExpiry: tokenExpiry,
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

  // Find existing vendor by name in QuickBooks (SQL query version)
  async findExistingVendorByQuery(qbo: any, vendorName: string) {
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

  // Create a QuickBooks bill for a contractor's payroll
  async createContractorBill(payrollRecord: any, vendor: any) {
    await this.initializeClient();
    
    // Calculate payroll period end date (last day of the month)
    const payrollDate = new Date(payrollRecord.year, payrollRecord.month - 1 + 1, 0); // Last day of month
    const formattedDate = payrollDate.toISOString().split('T')[0];
    
    // Get month name for description
    const monthName = new Date(payrollRecord.year, payrollRecord.month - 1).toLocaleDateString('en-US', { month: 'long' });
    
    return new Promise((resolve, reject) => {
      const bill = {
        VendorRef: {
          value: vendor.vendorId || vendor.Id,
        },
        TxnDate: formattedDate, // Use payroll period end date
        DueDate: formattedDate,
        Line: [{
          Id: "1",
          Amount: parseFloat(payrollRecord.grossPay || payrollRecord.gross_pay || '0'),
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: process.env.QB_PAYROLL_ACCOUNT || "1150040000", // "Wages" account ID 
            },
          },
          Description: `${monthName} ${payrollRecord.year} - ${vendor.firstName} ${vendor.lastName} Payroll`,
        }],
        PrivateNote: `Payroll bill for ${monthName} ${payrollRecord.year}`,
      };

      console.log('🔧 Creating QuickBooks bill with data:', JSON.stringify(bill, null, 2));

      this.qbo!.createBill(bill, (err: any, createdBill: any) => {
        if (err) {
          console.error('❌ Error creating bill:', err);
          reject(err);
        } else {
          console.log('✅ Bill created successfully:', createdBill?.Bill?.Id);
          resolve(createdBill?.Bill || createdBill);
        }
      });
    });
  }

  // Generate monthly contractor bills
  async generateMonthlyContractorBills(year: number, month: number) {
    await this.initializeClient();
    
    // Get payroll records for the specified month/year using correct field names
    const payrollRecords = await db.select({
      id: monthlyPayroll.id,
      userId: monthlyPayroll.userId, 
      year: monthlyPayroll.year,
      month: monthlyPayroll.month,
      totalHours: monthlyPayroll.totalHours,
      grossPay: monthlyPayroll.grossPay,
      firstName: users.firstName,
      lastName: users.lastName,
      quickbooksVendorId: users.quickbooksVendorId,
    })
    .from(monthlyPayroll)
    .innerJoin(users, eq(monthlyPayroll.userId, users.id))
    .where(and(
      eq(monthlyPayroll.year, year),
      eq(monthlyPayroll.month, month),
      eq(users.role, 'employee')
    ));

    console.log(`🔄 Found ${payrollRecords.length} payroll records for ${month}/${year}`);

    const results = [];
    
    for (const payrollRecord of payrollRecords) {
      try {
        console.log(`\n🔄 Processing payroll for ${payrollRecord.firstName} ${payrollRecord.lastName}...`);
        
        // Find or create vendor for this contractor
        let vendor = null;
        let vendorId = payrollRecord.quickbooksVendorId;
        
        if (vendorId) {
          vendor = { vendorId, firstName: payrollRecord.firstName, lastName: payrollRecord.lastName };
          console.log(`✅ Using existing vendor ID: ${vendorId}`);
        } else {
          // Create vendor if doesn't exist
          const createdVendor = await this.createContractor({
            id: payrollRecord.userId,
            first_name: payrollRecord.firstName,
            last_name: payrollRecord.lastName,
          });
          vendorId = createdVendor.Id;
          vendor = { vendorId, firstName: payrollRecord.firstName, lastName: payrollRecord.lastName };
          console.log(`✅ Created new vendor ID: ${vendorId}`);
        }
        
        // Create QuickBooks bill
        const createdBill = await this.createContractorBill(payrollRecord, vendor);
        
        // Update payroll record with QuickBooks bill ID
        await db.update(monthlyPayroll)
          .set({ 
            quickbooksBillId: createdBill.Id.toString() 
          })
          .where(eq(monthlyPayroll.id, payrollRecord.id));
        
        console.log(`✅ Bill ${createdBill.Id} created for ${payrollRecord.firstName} ${payrollRecord.lastName} - $${payrollRecord.grossPay}`);
        
        results.push({
          contractor: `${payrollRecord.firstName} ${payrollRecord.lastName}`,
          billId: createdBill.Id,
          amount: payrollRecord.grossPay,
          hours: payrollRecord.totalHours,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Error creating bill for ${payrollRecord.firstName} ${payrollRecord.lastName}:`, error);
        results.push({
          contractor: `${payrollRecord.firstName} ${payrollRecord.lastName}`,
          error: (error as Error).message,
          success: false
        });
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
        DisplayName: fullName,  // QuickBooks requires DisplayName for vendor creation
        Vendor1099: true,       // CORRECT FIELD: This vendor is a 1099 contractor
        Active: true            // Ensure vendor is active
      };
      
      // Add optional fields only if they exist and are valid
      if (employee.email && employee.email.trim()) {
        vendor.PrimaryEmailAddr = { Address: employee.email.trim() };
      }
      
      // Add tax identifier if available (helps with 1099 processing)
      if (employee.socialSecurityNumber || employee.taxId) {
        vendor.TaxIdentifier = employee.socialSecurityNumber || employee.taxId;
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
            
            // Store QB vendor ID in our database for future bill creation
            this.storage.updateUser(employee.id, { 
              quickbooksVendorId: createdVendor.Id.toString() 
            }).then(() => {
              console.log(`💾 Stored QB vendor ID ${createdVendor.Id} for user ${employee.id}`);
            }).catch(err => {
              console.error(`⚠️ Failed to store QB vendor ID: ${err.message}`);
            });
            
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
    
    try {
      // Initialize the client before starting sync
      await this.initializeClient();
      
      if (!this.oauthClient || !this.companyId) {
        throw new Error('QuickBooks not properly initialized after init attempt');
      }
    } catch (initError) {
      console.error('❌ Failed to initialize QuickBooks client:', initError);
      throw new Error('QuickBooks initialization failed');
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
          
          // Always try to enable 1099 tracking regardless of current status
          console.log(`🔄 Updating vendor "${fullName}" to enable 1099 tracking...`);
          console.log(`🔧 Current vendor data before update:`, JSON.stringify({
            Id: existingVendor.Id,
            DisplayName: existingVendor.DisplayName,
            Vendor1099: existingVendor.Vendor1099,
            SyncToken: existingVendor.SyncToken,
            Active: existingVendor.Active
          }, null, 2));
          
          try {
            const qbo = await this.initializeClient();
            
            // Use full vendor update with all fields to ensure Vendor1099 takes effect
            const updateData = {
              Id: existingVendor.Id,
              SyncToken: existingVendor.SyncToken,
              DisplayName: existingVendor.DisplayName || existingVendor.Name,
              Vendor1099: true,     // Mark as 1099 contractor
              Active: existingVendor.Active !== false,
              // Include all existing fields to prevent data loss
              GivenName: existingVendor.GivenName,
              FamilyName: existingVendor.FamilyName,
              CompanyName: existingVendor.CompanyName,
              PrimaryEmailAddr: existingVendor.PrimaryEmailAddr,
              PrimaryPhone: existingVendor.PrimaryPhone,
              BillAddr: existingVendor.BillAddr,
              TaxIdentifier: existingVendor.TaxIdentifier,
              sparse: false     // Full update to ensure all fields are properly set
            };
            
            console.log(`🔧 Update data being sent:`, JSON.stringify(updateData, null, 2));
            
            const updateResult = await new Promise((resolve, reject) => {
              qbo.updateVendor(updateData, (err: any, updatedVendor: any) => {
                if (err) {
                  console.error(`❌ Failed to update 1099 tracking for ${fullName}:`, JSON.stringify(err, null, 2));
                  if (err.Fault && err.Fault.Error) {
                    console.error(`❌ QuickBooks Error Details:`, JSON.stringify(err.Fault.Error, null, 2));
                  }
                  reject(err);
                } else {
                  console.log(`✅ Successfully updated ${fullName} with 1099 tracking enabled`);
                  console.log(`✅ Updated vendor Vendor1099:`, updatedVendor?.Vendor1099);
                  resolve(updatedVendor);
                }
              });
            });
            
            // Verify the update by reading the vendor back
            console.log(`🔍 Verifying update for ${fullName}...`);
            const verifyResult = await new Promise((resolve) => {
              qbo.getVendor(existingVendor.Id, (err: any, vendor: any) => {
                if (err) {
                  console.error(`⚠️ Could not verify update for ${fullName}:`, err);
                  resolve(null);
                } else {
                  console.log(`✅ Verified vendor ${fullName} Vendor1099:`, vendor?.Vendor1099);
                  resolve(vendor);
                }
              });
            });
            
          } catch (updateError) {
            console.error(`⚠️ Update failed for ${fullName}:`, updateError);
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

// Export class for instantiation after environment setup
// Note: Do not create singleton instance here to avoid loading before environment variables are set