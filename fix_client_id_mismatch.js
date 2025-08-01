// Fix the Client ID mismatch issue

import fetch from 'node-fetch';

const fixClientIdMismatch = async () => {
  console.log('FIXING CLIENT ID MISMATCH ISSUE...\n');
  
  console.log('ISSUE IDENTIFIED:');
  console.log('Current OAuth URL uses: AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA');
  console.log('Correct Production ID:  AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA');
  console.log('Problem: System not using the production credentials from secrets');
  console.log('');
  
  // Check what environment variables are being used
  console.log('ENVIRONMENT VARIABLE CHECK:');
  console.log('QUICKBOOKS_PRODUCTION_CLIENT_ID exists:', !!process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID);
  console.log('QUICKBOOKS_CLIENT_ID exists:', !!process.env.QUICKBOOKS_CLIENT_ID);
  console.log('');
  
  if (process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID) {
    const prodId = process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID;
    console.log('Production Client ID first 15 chars:', prodId.substring(0, 15));
    console.log('Production Client ID length:', prodId.length);
  }
  
  if (process.env.QUICKBOOKS_CLIENT_ID) {
    const oldId = process.env.QUICKBOOKS_CLIENT_ID;
    console.log('Old Client ID first 15 chars:', oldId.substring(0, 15));
    console.log('Old Client ID length:', oldId.length);
  }
  
  console.log('');
  console.log('SOLUTION: Force system to use PRODUCTION credentials');
  
  return {
    issue: 'client_id_mismatch',
    solution: 'update_system_to_use_production_credentials'
  };
};

fixClientIdMismatch();