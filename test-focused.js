/**
 * Focused Test: Most Likely Endpoints with Detailed Logging
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9';

// Most likely endpoints based on API docs
const endpoints = [
  {
    url: `/internal/template-link`,
    payloads: [
      { templateId: TEMPLATE_ID, name: 'Test Link', status: 'active' },
      { templateOid: TEMPLATE_OID, name: 'Test Link', status: 'active' },
      { linkTemplateId: TEMPLATE_ID, name: 'Test Link', status: 'active' },
      { template_id: TEMPLATE_ID, name: 'Test Link', status: 'active' },
      { 
        templateId: TEMPLATE_ID,
        name: 'Test Affiliate Example - Affiliate Link',
        campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
        deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
        status: 'active'
      },
    ]
  },
  {
    url: `/internal/link-template/${TEMPLATE_ID}/link`,
    payloads: [
      { name: 'Test Link', status: 'active' },
      { name: 'Test Link', campaign: 'test', status: 'active' },
      { 
        name: 'Test Affiliate Example - Affiliate Link',
        campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
        deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
        status: 'active'
      },
    ]
  },
  {
    url: `/internal/link-template/${TEMPLATE_OID}/link`,
    payloads: [
      { name: 'Test Link', status: 'active' },
      { 
        name: 'Test Affiliate Example - Affiliate Link',
        campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
        deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
        status: 'active'
      },
    ]
  },
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
    label: 'S2S API Key',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': APPTROVE_API_KEY,
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

console.log('🎯 Focused Test: Most Likely Endpoints\n');

for (const endpointConfig of endpoints) {
  for (const auth of authMethods) {
    for (const payload of endpointConfig.payloads) {
      try {
        const url = `${APPTROVE_API_URL}${endpointConfig.url}`;
        
        console.log(`\nTesting: ${endpointConfig.url}`);
        console.log(`  Auth: ${auth.label}`);
        console.log(`  Payload:`, JSON.stringify(payload));
        
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
          console.log(`\n✅✅✅ SUCCESS! ✅✅✅\n`);
          console.log(`Endpoint: ${endpointConfig.url}`);
          console.log(`Auth: ${auth.label}`);
          console.log(`Full Response:`, JSON.stringify(data, null, 2));
          
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
        } else {
          // Show ALL responses (not just 404)
          console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 300));
          if (response.status === 400) {
            console.log(`  ⚠️  400 Bad Request - might be wrong payload structure`);
          } else if (response.status === 401) {
            console.log(`  ⚠️  401 Unauthorized - might be wrong auth method`);
          } else if (response.status === 403) {
            console.log(`  ⚠️  403 Forbidden - might need permissions/IP whitelist`);
          } else if (response.status === 405) {
            console.log(`  ⚠️  405 Method Not Allowed - endpoint exists but POST not allowed`);
          }
        }
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }
}

console.log(`\n❌ No success found`);
