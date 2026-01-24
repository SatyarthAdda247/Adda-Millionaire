/**
 * Test: Try PATCH/PUT and dashboard-style authentication
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const TEMPLATE_ID = 'wBehUW';

const payload = {
  templateId: TEMPLATE_ID,
  name: 'Test Affiliate Example - Affiliate Link',
  campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
  deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
  status: 'active',
};

// Endpoints that exist (from OPTIONS test)
const endpoints = [
  '/internal/link-template/link',
  '/internal/link-template/links',
];

// Try different methods
const methods = ['POST', 'PUT', 'PATCH'];

// Try different auth combinations
const authConfigs = [
  {
    label: 'Basic Auth',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    }
  },
  {
    label: 'Basic Auth + Origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://dashboard.apptrove.com',
      'Referer': 'https://dashboard.apptrove.com/',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    }
  },
  {
    label: 'Secret Headers',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'secret-id': APPTROVE_SECRET_ID,
      'secret-key': APPTROVE_SECRET_KEY,
      'X-Secret-ID': APPTROVE_SECRET_ID,
      'X-Secret-Key': APPTROVE_SECRET_KEY,
    }
  },
];

console.log('🔍 Testing endpoints that exist (from OPTIONS)...\n');

for (const endpoint of endpoints) {
  for (const method of methods) {
    for (const auth of authConfigs) {
      try {
        const url = `${APPTROVE_API_URL}${endpoint}`;
        
        console.log(`Testing: ${endpoint} (${method}, ${auth.label})`);
        
        const response = await fetch(url, {
          method: method,
          headers: auth.headers,
          body: JSON.stringify(payload),
        });
        
        const responseText = await response.text();
        let data = null;
        
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { raw: responseText };
        }
        
        console.log(`  Status: ${response.status}`);
        
        if (response.ok) {
          console.log(`\n✅✅✅ SUCCESS! ✅✅✅\n`);
          console.log(`Endpoint: ${endpoint}`);
          console.log(`Method: ${method}`);
          console.log(`Auth: ${auth.label}`);
          console.log(`Response:`, JSON.stringify(data, null, 2));
          
          const unilinkUrl = 
            data?.shortUrl || 
            data?.longUrl || 
            data?.link || 
            data?.url ||
            data?.data?.shortUrl || 
            data?.data?.longUrl || 
            data?.data?.link ||
            data?.data?.url || 
            null;

          const linkId = 
            data?._id || 
            data?.id || 
            data?.linkId ||
            data?.data?._id || 
            data?.data?.id || 
            data?.data?.linkId ||
            null;

          if (unilinkUrl || linkId) {
            console.log(`\n🎉 LINK CREATED!`);
            console.log(`URL: ${unilinkUrl || `https://applink.reevo.in/d/${linkId}`}`);
            console.log(`Link ID: ${linkId}`);
            process.exit(0);
          }
        } else if (response.status !== 404 && response.status !== 405) {
          console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 300));
          if (response.status === 400 && data?.message?.includes('login')) {
            console.log(`  ⚠️  Requires dashboard login - might need session cookie`);
          }
        }
        console.log('');
      } catch (error) {
        console.log(`  Error: ${error.message}\n`);
      }
    }
  }
}

console.log('Test complete');
