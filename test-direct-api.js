/**
 * Test direct AppTrove API calls - verify which endpoint/auth works
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';

const payload = {
  name: 'Test Direct API - Affiliate Link',
  campaign: 'Test_Direct_API_Affiliate_Influencer',
  deepLinking: 'Test_Direct_API_Affiliate_Influencer',
  status: 'active',
};

// Test the most likely working endpoints with X-Api-Key
const endpoints = [
  {
    url: `${APPTROVE_API_URL}/internal/template-link`,
    auth: 'X-Api-Key',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': APPTROVE_API_KEY,
    },
    payload: { ...payload, templateId: TEMPLATE_ID },
  },
  {
    url: `${APPTROVE_API_URL}/internal/link-template/${TEMPLATE_ID}/link`,
    auth: 'X-Api-Key',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': APPTROVE_API_KEY,
    },
    payload: payload,
  },
  {
    url: `${APPTROVE_API_URL}/internal/template-link`,
    auth: 'Basic Auth',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    },
    payload: { ...payload, templateId: TEMPLATE_ID },
  },
  {
    url: `${APPTROVE_API_URL}/internal/link-template/${TEMPLATE_ID}/link`,
    auth: 'Basic Auth',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    },
    payload: payload,
  },
];

console.log('🔍 Testing direct AppTrove API calls...\n');

for (const endpoint of endpoints) {
  try {
    console.log(`Testing: ${endpoint.url}`);
    console.log(`  Auth: ${endpoint.auth}`);
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: endpoint.headers,
      body: JSON.stringify(endpoint.payload),
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
      console.log(`Endpoint: ${endpoint.url}`);
      console.log(`Auth: ${endpoint.auth}`);
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
    } else {
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    }
    console.log('');
  } catch (error) {
    console.log(`  Error: ${error.message}\n`);
  }
}

console.log('Test complete');
