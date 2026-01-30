/**
 * Test alternative endpoint paths and base URLs
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const TEMPLATE_ID = 'wBehUW';

const payload = {
  name: 'Test Affiliate Example - Affiliate Link',
  campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
  deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
  status: 'active',
  templateId: TEMPLATE_ID,
};

// Alternative base URLs
const baseUrls = [
  'https://api.apptrove.com',
  'https://apptrove.com/api',
  'https://api.apptrove.com/api',
  'https://apptrove.com',
];

// Alternative endpoint paths
const endpointPaths = [
  '/internal/template-link',
  '/api/internal/template-link',
  '/v1/internal/template-link',
  '/v2/internal/template-link',
  '/template-link',
  '/api/template-link',
  '/v1/template-link',
  '/v2/template-link',
  '/internal/link-template/link',
  '/api/internal/link-template/link',
  '/internal/unilink',
  '/api/internal/unilink',
  `/internal/link-template/${TEMPLATE_ID}/link`,
  `/api/internal/link-template/${TEMPLATE_ID}/link`,
];

// Auth methods
const authMethods = [
  {
    label: 'X-Api-Key',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': APPTROVE_API_KEY,
    }
  },
  {
    label: 'Basic Auth',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    }
  },
];

console.log('🔍 Testing alternative base URLs and endpoint paths...\n');

let successCount = 0;

for (const baseUrl of baseUrls) {
  for (const endpointPath of endpointPaths) {
    for (const auth of authMethods) {
      try {
        const url = `${baseUrl}${endpointPath}`;
        
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
        
        if (response.ok) {
          console.log(`\n✅✅✅ SUCCESS! ✅✅✅\n`);
          console.log(`URL: ${url}`);
          console.log(`Auth: ${auth.label}`);
          console.log(`Response:`, JSON.stringify(data, null, 2));
          successCount++;
        } else if (response.status !== 404 && response.status !== 401) {
          console.log(`\n⚠️  ${response.status} - ${url} (${auth.label})`);
          console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 300));
        }
      } catch (error) {
        // Skip connection errors
      }
    }
  }
}

if (successCount === 0) {
  console.log('\n❌ No successful endpoints found. All tested combinations returned 404 or connection errors.');
}

console.log('\nTest complete');
