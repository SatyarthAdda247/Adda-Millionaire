/**
 * Final Strategy: Query parameters and alternative structures
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const TEMPLATE_ID = 'wBehUW';

const payload = {
  name: 'Test Affiliate Example - Affiliate Link',
  campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
  deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
  status: 'active',
};

// Try endpoints with query parameters
const endpoints = [
  {
    url: `/internal/template-link?templateId=${TEMPLATE_ID}`,
    payload: payload,
  },
  {
    url: `/internal/template-link?linkTemplateId=${TEMPLATE_ID}`,
    payload: payload,
  },
  {
    url: `/internal/link-template/link?templateId=${TEMPLATE_ID}`,
    payload: payload,
  },
  {
    url: `/internal/unilink?templateId=${TEMPLATE_ID}`,
    payload: payload,
  },
];

const authHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
};

console.log('🔍 Testing endpoints with query parameters...\n');

for (const endpointConfig of endpoints) {
  try {
    const url = `${APPTROVE_API_URL}${endpointConfig.url}`;
    
    console.log(`Testing: ${endpointConfig.url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
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
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    }
    console.log('');
  } catch (error) {
    console.log(`  Error: ${error.message}\n`);
  }
}

// Summary of findings
console.log('\n📊 Summary of Findings:\n');
console.log('✅ Templates API works: /internal/link-template (GET)');
console.log('✅ Endpoint exists: /internal/link-template/link (accepts PATCH, requires dashboard login)');
console.log('❌ Link creation endpoints all return 404');
console.log('\n💡 Conclusion:');
console.log('   Link creation via API appears to require dashboard session authentication.');
console.log('   The "POST Add template link" endpoint may be:');
console.log('   1. Behind dashboard authentication (session cookies)');
console.log('   2. Requires a different API plan/permissions');
console.log('   3. Uses a different endpoint structure not found in testing');
console.log('   4. May need to use browser automation (Puppeteer) like old backend');
