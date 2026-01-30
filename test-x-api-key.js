/**
 * Test with X-Api-Key header (from API docs)
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9';

const payload = {
  name: 'Test Affiliate Example - Affiliate Link',
  campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
  deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
  status: 'active',
};

// Most likely endpoints
const endpoints = [
  {
    url: `/internal/template-link`,
    payload: { ...payload, templateId: TEMPLATE_ID },
  },
  {
    url: `/internal/link-template/${TEMPLATE_ID}/link`,
    payload: payload,
  },
  {
    url: `/internal/link-template/${TEMPLATE_OID}/link`,
    payload: payload,
  },
  {
    url: `/internal/unilink`,
    payload: { ...payload, templateId: TEMPLATE_ID },
  },
];

// Test with X-Api-Key header (from API docs)
const authMethods = [
  {
    label: 'X-Api-Key (S2S API Key)',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': APPTROVE_API_KEY,
    }
  },
  {
    label: 'X-Api-Key (Reporting API Key)',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': APPTROVE_REPORTING_API_KEY,
    }
  },
  {
    label: 'X-Api-Key + api-key (both)',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': APPTROVE_API_KEY,
      'api-key': APPTROVE_API_KEY,
    }
  },
  {
    label: 'Basic Auth (fallback)',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    }
  },
];

console.log('🔍 Testing with X-Api-Key header (from API docs)...\n');

for (const endpointConfig of endpoints) {
  for (const auth of authMethods) {
    try {
      const url = `${APPTROVE_API_URL}${endpointConfig.url}`;
      
      console.log(`Testing: ${endpointConfig.url}`);
      console.log(`  Auth: ${auth.label}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: auth.headers,
        body: JSON.stringify(endpointConfig.payload),
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
      } else if (response.status !== 404) {
        console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 300));
        if (response.status === 400) {
          console.log(`  ⚠️  400 - might be wrong payload`);
        } else if (response.status === 401) {
          console.log(`  ⚠️  401 - might be wrong API key`);
        }
      }
      console.log('');
    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }
  }
}

console.log('Test complete');
