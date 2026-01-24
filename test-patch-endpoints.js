/**
 * Final Test: Template-specific endpoints with PATCH and session-style auth
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9';

// Try template-specific endpoints with PATCH (since /internal/link-template/link accepts PATCH)
const endpoints = [
  `/internal/link-template/${TEMPLATE_ID}/link`,
  `/internal/link-template/${TEMPLATE_OID}/link`,
  `/internal/link-template/${TEMPLATE_ID}/links`,
  `/internal/link-template/${TEMPLATE_OID}/links`,
];

const payloads = [
  { name: 'Test Link', status: 'active' },
  { 
    name: 'Test Affiliate Example - Affiliate Link',
    campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
    deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
    status: 'active'
  },
];

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
    label: 'Basic Auth + Dashboard Headers',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://dashboard.apptrove.com',
      'Referer': 'https://dashboard.apptrove.com/',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    }
  },
];

console.log('🔍 Testing template-specific endpoints with PATCH...\n');

for (const endpoint of endpoints) {
  for (const auth of authConfigs) {
    for (const payload of payloads) {
      // Try both POST and PATCH
      for (const method of ['POST', 'PATCH']) {
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
          } else if (response.status === 400 && data?.message?.includes('login')) {
            console.log(`  ⚠️  Requires dashboard login`);
          } else if (response.status !== 404 && response.status !== 405) {
            console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
          }
          console.log('');
        } catch (error) {
          // Skip
        }
      }
    }
  }
}

// Also try the working template endpoint structure but with POST
console.log('\n🔍 Trying GET on template links to see structure...\n');

try {
  const url = `${APPTROVE_API_URL}/internal/link-template/${TEMPLATE_ID}/links`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Template links structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
    console.log('\nThis might show us the correct endpoint structure!');
  } else {
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text.substring(0, 200)}`);
  }
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log('\nTest complete');
