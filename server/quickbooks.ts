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
      console.log('🔍 QuickBooks Debug - Handling OAuth callback');
      console.log('🔍 QuickBooks Debug - Code:', !!code, 'State:', state, 'RealmId:', realmId);
      
      const authResponse = await this.oauthClient.createToken(code);
      console.log('🔍 QuickBooks Debug - Auth response received:', {
        hasAccessToken: !!authResponse.access_token,
        hasRefreshToken: !!authResponse.refresh_token,
        expiresIn: authResponse.expires_in
      });
      
      // Store tokens in database
      await db.insert(quickbooksConfig).values({
        companyId: realmId,
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        tokenExpiry: new Date(Date.now() + authResponse.expires_in * 1000),
        sandbox: process.env.QUICKBOOKS_SANDBOX === 'true',
      }).onConflictDoUpdate({
        target: quickbooksConfig.companyId,
        set: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          tokenExpiry: new Date(Date.now() + authResponse.expires_in * 1000),
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

      this.qbo = new QuickBooks(
        process.env.QUICKBOOKS_CLIENT_ID,
        process.env.QUICKBOOKS_CLIENT_SECRET,
        config.accessToken,
        false, // Use token (not consumer key/secret)
        config.companyId,
        config.sandbox
      );

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

  // Create a contractor (vendor) in QuickBooks
  async createContractor(userData: any) {
    await this.initializeClient();
    
    return new Promise((resolve, reject) => {
      const vendor = {
        Name: `${userData.firstName} ${userData.lastName}`,
        CompanyName: userData.companyName || `${userData.firstName} ${userData.lastName}`,
        VendorPaymentBankAccount: {
          BankName: userData.bankName,
          AccountNumber: userData.accountNumber,
          RoutingNumber: userData.routingNumber,
        },
        BillAddr: {
          Line1: userData.homeAddress,
        },
        PrimaryEmailAddr: {
          Address: userData.email,
        },
        PrimaryPhone: {
          FreeFormNumber: userData.phone,
        },
        Vendor1099: true, // Mark as 1099 contractor
      };

      this.qbo!.createVendor(vendor, (err: any, vendor: any) => {
        if (err) {
          console.error('Error creating vendor:', err);
          reject(err);
        } else {
          resolve(vendor.QueryResponse?.Vendor?.[0] || vendor);
        }
      });
    });
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
}

export const quickbooksService = new QuickBooksService();