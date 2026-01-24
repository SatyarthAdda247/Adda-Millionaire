/**
 * Test: POST Add template link - Exact API Documentation Pattern
 * Based on: "POST Add template link" from API docs
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9';

// Try different payload structures
const payloadVariations = [
  // Variation 1: Basic structure
  {
    name: 'Test Affiliate Example - Affiliate Link',
    campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
    deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
    status: 'active',
  },
  // Variation 2: With templateId
  {
    templateId: TEMPLATE_ID,
    name: 'Test Affiliate Example - Affiliate Link',
    campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
    deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
    status: 'active',
  },
  // Variation 3: With templateOid
  {
    templateOid: TEMPLATE_OID,
    name: 'Test Affiliate Example - Affiliate Link',
    campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
    deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
    status: 'active',
  },
  // Variation 4: Minimal
  {
    name: 'Test Link',
    status: 'active',
  },
];

// Most likely endpoint based on API docs pattern
const endpoints = [
  `/internal/link-template/${TEMPLATE_ID}/link`,
  `/internal/link-template/${TEMPLATE_OID}/link`,
  `/internal/template-link`,
];

const authMethods = [
  {
    label: 'Basic Auth (Secret ID/Key)',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    }
  },
  {
    label: 'Reporting API Key',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': APPTROVE_REPORTING_API_KEY,
      'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
    }
  },
];

console.log('🔍 Testing "POST Add template link" with different payloads...\n');

for (const endpoint of endpoints) {
  for (const auth of authMethods) {
    for (let i = 0; i < payloadVariations.length; i++) {
      const payload = payloadVariations[i];
      try {
        const url = `${APPTROVE_API_URL}${endpoint}`;
        
        console.log(`Trying: ${endpoint}`);
        console.log(`  Auth: ${auth.label}`);
        console.log(`  Payload: ${JSON.stringify(payload)}`);
        
        const response = await fetch(url, {
          method: 'POST',
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
          console.log(`\n✅ SUCCESS!`);
          console.log(`Endpoint: ${endpoint}`);
          console.log(`Auth: ${auth.label}`);
          console.log(`Payload: Variation ${i + 1}`);
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
            null;

          if (unilinkUrl || linkId) {
            console.log(`\n🎉 LINK CREATED!`);
            console.log(`URL: ${unilinkUrl || `https://applink.reevo.in/d/${linkId}`}`);
            console.log(`Link ID: ${linkId}`);
            process.exit(0);
          }
        } else if (response.status !== 404) {
          console.log(`  Error: ${data?.message || data?.error || 'Unknown'}`);
          if (response.status === 400) {
            console.log(`  Details:`, JSON.stringify(data, null, 2).substring(0, 200));
          }
        }
        console.log('');
      } catch (error) {
        // Skip
      }
    }
  }
}

console.log('❌ No working endpoint/payload combination found');
