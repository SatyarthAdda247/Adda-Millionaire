/**
 * Test: POST Add template link endpoint
 * Based on API documentation showing "POST Add template link"
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9';

const payload = {
  name: 'Test Affiliate Example - Affiliate Link',
  campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
  deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
  status: 'active',
};

// Based on API docs: "POST Add template link"
// Try different endpoint patterns
const endpoints = [
  // Pattern 1: Direct template-link endpoint
  `/internal/template-link`,
  `/internal/template-link/${TEMPLATE_ID}`,
  `/internal/template-link/${TEMPLATE_OID}`,
  
  // Pattern 2: With template ID in body
  `/internal/template-link`,
  
  // Pattern 3: Link-template structure
  `/internal/link-template/${TEMPLATE_ID}/template-link`,
  `/internal/link-template/${TEMPLATE_OID}/template-link`,
  
  // Pattern 4: Template structure
  `/internal/template/${TEMPLATE_ID}/link`,
  `/internal/template/${TEMPLATE_OID}/link`,
  
  // Pattern 5: Unilink structure
  `/internal/unilink/template-link`,
  `/internal/unilink/template/${TEMPLATE_ID}/link`,
];

const authMethods = [
  {
    label: 'Basic Auth',
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

console.log('🔍 Testing "POST Add template link" endpoint patterns...\n');

for (const endpoint of endpoints) {
  for (const auth of authMethods) {
    try {
      const url = `${APPTROVE_API_URL}${endpoint}`;
      const body = endpoint.includes('/template-link') && !endpoint.includes(TEMPLATE_ID) && !endpoint.includes(TEMPLATE_OID)
        ? { ...payload, templateId: TEMPLATE_ID }
        : payload;
      
      console.log(`Trying: ${endpoint} (${auth.label})`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: auth.headers,
        body: JSON.stringify(body),
      });
      
      const responseText = await response.text();
      let data = null;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }
      
      if (response.ok) {
        console.log(`\n✅ SUCCESS: ${endpoint} (${auth.label})`);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        
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
        console.log(`   Status: ${response.status} - ${data?.message || data?.error || 'Unknown'}`);
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 300));
        }
      }
    } catch (error) {
      // Skip errors
    }
  }
}

console.log('\n❌ No working endpoint found');
