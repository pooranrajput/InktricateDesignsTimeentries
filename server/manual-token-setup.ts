// Manual QuickBooks token setup endpoint
import { Request, Response } from 'express';
import { storage } from './storage';

export async function setupManualQuickBooksTokens(req: Request, res: Response) {
  try {
    const { accessToken, refreshToken, companyId } = req.body;
    
    if (!accessToken || !refreshToken) {
      return res.status(400).json({ 
        error: 'Missing required tokens',
        required: ['accessToken', 'refreshToken']
      });
    }

    const finalCompanyId = companyId || '9130351530529746';
    
    // Store tokens in database
    const connection = await storage.insertQuickBooksConnection({
      companyId: finalCompanyId,
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      sandbox: false
    });
    
    console.log('✅ MANUAL QUICKBOOKS SETUP SUCCESS:', {
      companyId: finalCompanyId,
      connectionId: connection.id,
      tokenExpiryIn: '1 hour',
      setupMethod: 'manual-playground-tokens'
    });
    
    res.json({ 
      success: true, 
      message: 'QuickBooks connected successfully via manual setup!',
      companyId: finalCompanyId,
      connectionId: connection.id,
      tokenExpiry: connection.tokenExpiry,
      nextSteps: [
        'Test connection with /api/quickbooks/test',
        'Create payroll bills with /api/quickbooks/create-bill',
        'Tokens will auto-refresh when needed'
      ]
    });
    
  } catch (error) {
    console.error('❌ MANUAL QUICKBOOKS SETUP ERROR:', error);
    res.status(500).json({ 
      error: 'Failed to setup QuickBooks connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}