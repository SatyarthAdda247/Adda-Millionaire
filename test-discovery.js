/**
 * Discovery Test: Find what endpoints actually exist
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';

const endpoints = [
  '/internal/template-link',
  '/internal/link-template/wBehUW/link',
  '/internal/link-template/wBehUW/links',
  '/internal/unilink',
  '/internal/unilinks',
  '/internal/link-template/link',
  '/internal/link-template/links',
  '/v2/link-template/wBehUW/link',
  '/api/internal/template-link',
];

const authHeaders = {
  'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
  'Accept': 'application/json',
};

console.log('🔍 Testing OPTIONS to discover allowed methods...\n');

for (const endpoint of endpoints) {
  try {
    const url = `${APPTROVE_API_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: authHeaders,
    });
    
    console.log(`${endpoint}:`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Allow: ${response.headers.get('Allow') || 'Not specified'}`);
    console.log(`  Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods') || 'Not specified'}`);
    if (response.status !== 404) {
      console.log(`  ⚠️  Endpoint exists! Status: ${response.status}`);
    }
    console.log('');
  } catch (error) {
    // Skip
  }
}

// Also try GET to see if endpoint exists but doesn't allow POST
console.log('\n🔍 Testing GET to see if endpoints exist...\n');

for (const endpoint of endpoints) {
  try {
    const url = `${APPTROVE_API_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders,
    });
    
    if (response.status !== 404) {
      console.log(`${endpoint} (GET):`);
      console.log(`  Status: ${response.status}`);
      const text = await response.text().catch(() => '');
      console.log(`  Response preview: ${text.substring(0, 200)}`);
      console.log('');
    }
  } catch (error) {
    // Skip
  }
}

// Try to find API base path variations
console.log('\n🔍 Testing different API base paths...\n');

const baseUrls = [
  'https://api.apptrove.com',
  'https://api.apptrove.com/api',
  'https://apptrove.com/api',
  'https://dashboard.apptrove.com/api',
];

for (const baseUrl of baseUrls) {
  try {
    const url = `${baseUrl}/internal/template-link`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateId: TEMPLATE_ID, name: 'Test', status: 'active' }),
    });
    
    if (response.status !== 404) {
      console.log(`${baseUrl}/internal/template-link:`);
      console.log(`  Status: ${response.status}`);
      const text = await response.text().catch(() => '');
      console.log(`  Response: ${text.substring(0, 200)}`);
      console.log('');
    }
  } catch (error) {
    // Skip
  }
}

console.log('Discovery complete');
