/**
 * Final Test: Try All Possible Endpoint Patterns
 * 
 * Testing every possible endpoint pattern for link creation
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9'; // Found from template fetch

const payload = {
  name: 'Test Link',
  campaign: 'test_campaign',
  deepLinking: 'test_campaign',
  status: 'active',
};

// Try ALL possible endpoint patterns
const endpoints = [
  // Standard patterns
  `/internal/link-template/${TEMPLATE_ID}/link`,
  `/internal/link-template/${TEMPLATE_OID}/link`,
  `/internal/link-template/${TEMPLATE_ID}/links`,
  `/internal/link-template/${TEMPLATE_OID}/links`,
  `/internal/link/${TEMPLATE_ID}`,
  `/internal/link/${TEMPLATE_OID}`,
  `/internal/unilink`,
  `/internal/unilinks`,
  `/internal/links`,
  `/internal/link-template/link`,
  `/internal/link-template/links`,
  
  // API prefix patterns
  `/api/internal/link-template/${TEMPLATE_ID}/link`,
  `/api/internal/link-template/${TEMPLATE_OID}/link`,
  `/api/internal/unilink`,
  `/api/internal/links`,
  
  // V2 patterns
  `/v2/link-template/${TEMPLATE_ID}/link`,
  `/v2/link-template/${TEMPLATE_OID}/link`,
  `/v2/unilink`,
  `/v2/links`,
  
  // V1 patterns
  `/v1/link-template/${TEMPLATE_ID}/link`,
  `/v1/link-template/${TEMPLATE_OID}/link`,
  `/v1/unilink`,
  `/v1/links`,
  
  // Direct patterns
  `/link-template/${TEMPLATE_ID}/link`,
  `/link-template/${TEMPLATE_OID}/link`,
  `/unilink`,
  `/links`,
  
  // Template patterns
  `/template/${TEMPLATE_ID}/link`,
  `/template/${TEMPLATE_OID}/link`,
  `/templates/${TEMPLATE_ID}/link`,
  `/templates/${TEMPLATE_OID}/link`,
];

const authHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
};

console.log('🔍 Testing ALL possible endpoint patterns...\n');
console.log(`Template ID: ${TEMPLATE_ID}`);
console.log(`Template OID: ${TEMPLATE_OID}\n`);

let successCount = 0;
let notFoundCount = 0;
let otherErrors = [];

for (const endpoint of endpoints) {
  const url = `${APPTROVE_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(endpoint.includes('/unilink') && !endpoint.includes('/link-template') 
        ? { ...payload, templateId: TEMPLATE_ID }
        : payload),
    });
    
    const responseText = await response.text();
    let data = null;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }
    
    if (response.ok) {
      console.log(`✅ SUCCESS: ${endpoint}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 300));
      successCount++;
    } else if (response.status === 404) {
      notFoundCount++;
      // Don't log 404s to reduce noise
    } else {
      otherErrors.push({ endpoint, status: response.status, data });
      console.log(`⚠️  ${endpoint}: ${response.status} - ${data?.message || data?.error || 'Unknown'}`);
    }
  } catch (error) {
    // Skip network errors
  }
}

console.log(`\n📊 Results:`);
console.log(`   ✅ Success: ${successCount}`);
console.log(`   ❌ 404 Not Found: ${notFoundCount}`);
console.log(`   ⚠️  Other Errors: ${otherErrors.length}`);

if (successCount === 0) {
  console.log(`\n❌ No working endpoints found. Link creation may not be available via API.`);
} else {
  console.log(`\n✅ Found ${successCount} working endpoint(s)!`);
}

if (otherErrors.length > 0) {
  console.log(`\n⚠️  Other errors (non-404):`);
  otherErrors.forEach(e => {
    console.log(`   ${e.endpoint}: ${e.status}`);
  });
}
