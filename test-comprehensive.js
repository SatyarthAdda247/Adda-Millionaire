/**
 * Comprehensive Test: Try EVERYTHING until we find working endpoint
 */

const fetch = globalThis.fetch;

const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const APPTROVE_REPORTING_API_KEY = '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const TEMPLATE_OID = 'shNYmkCqk9';

// Test different payload structures
const payloads = [
  // Payload 1: Basic
  { name: 'Test Link', status: 'active' },
  // Payload 2: With campaign
  { name: 'Test Link', campaign: 'test_campaign', status: 'active' },
  // Payload 3: Full structure
  { 
    name: 'Test Affiliate Example - Affiliate Link',
    campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
    deepLinking: 'Test_Affiliate_Example_Affiliate_Influencer',
    status: 'active'
  },
  // Payload 4: With templateId
  { 
    templateId: TEMPLATE_ID,
    name: 'Test Link',
    status: 'active'
  },
  // Payload 5: With templateOid
  { 
    templateOid: TEMPLATE_OID,
    name: 'Test Link',
    status: 'active'
  },
  // Payload 6: With linkTemplateId
  { 
    linkTemplateId: TEMPLATE_ID,
    name: 'Test Link',
    status: 'active'
  },
  // Payload 7: With template_id
  { 
    template_id: TEMPLATE_ID,
    name: 'Test Link',
    status: 'active'
  },
];

// Test different endpoint patterns
const endpointPatterns = [
  // Pattern 1: Standard
  `/internal/link-template/${TEMPLATE_ID}/link`,
  `/internal/link-template/${TEMPLATE_OID}/link`,
  
  // Pattern 2: Template-link
  `/internal/template-link`,
  
  // Pattern 3: Links plural
  `/internal/link-template/${TEMPLATE_ID}/links`,
  `/internal/link-template/${TEMPLATE_OID}/links`,
  
  // Pattern 4: Unilink
  `/internal/unilink`,
  
  // Pattern 5: Unilinks plural
  `/internal/unilinks`,
  
  // Pattern 6: Link-template/link
  `/internal/link-template/link`,
  
  // Pattern 7: Template/link
  `/internal/template/${TEMPLATE_ID}/link`,
  `/internal/template/${TEMPLATE_OID}/link`,
  
  // Pattern 8: V2 API
  `/v2/link-template/${TEMPLATE_ID}/link`,
  `/v2/link-template/${TEMPLATE_OID}/link`,
  
  // Pattern 9: V1 API
  `/v1/link-template/${TEMPLATE_ID}/link`,
  `/v1/link-template/${TEMPLATE_OID}/link`,
  
  // Pattern 10: API prefix
  `/api/internal/link-template/${TEMPLATE_ID}/link`,
  `/api/internal/template-link`,
  
  // Pattern 11: Direct link
  `/internal/link`,
  
  // Pattern 12: With create
  `/internal/link-template/${TEMPLATE_ID}/create-link`,
  `/internal/template-link/create`,
];

// Test different HTTP methods
const methods = ['POST', 'PUT', 'PATCH'];

// Test different auth methods
const authConfigs = [
  {
    label: 'Basic Auth',
    headers: (baseHeaders) => ({
      ...baseHeaders,
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    })
  },
  {
    label: 'Secret Headers',
    headers: (baseHeaders) => ({
      ...baseHeaders,
      'secret-id': APPTROVE_SECRET_ID,
      'secret-key': APPTROVE_SECRET_KEY,
      'X-Secret-ID': APPTROVE_SECRET_ID,
      'X-Secret-Key': APPTROVE_SECRET_KEY,
    })
  },
  {
    label: 'S2S API Key',
    headers: (baseHeaders) => ({
      ...baseHeaders,
      'api-key': APPTROVE_API_KEY,
      'X-S2S-API-Key': APPTROVE_API_KEY,
    })
  },
  {
    label: 'Reporting API Key',
    headers: (baseHeaders) => ({
      ...baseHeaders,
      'api-key': APPTROVE_REPORTING_API_KEY,
      'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
    })
  },
];

let successFound = false;
let attempts = 0;
const maxAttempts = endpointPatterns.length * methods.length * authConfigs.length * payloads.length;

console.log(`🚀 Comprehensive Test: Trying ${maxAttempts} combinations...\n`);
console.log(`Template ID: ${TEMPLATE_ID}, OID: ${TEMPLATE_OID}\n`);

for (const endpoint of endpointPatterns) {
  if (successFound) break;
  
  for (const method of methods) {
    if (successFound) break;
    
    for (const auth of authConfigs) {
      if (successFound) break;
      
      for (let pIdx = 0; pIdx < payloads.length; pIdx++) {
        if (successFound) break;
        
        const payload = payloads[pIdx];
        attempts++;
        
        // Skip payloads with templateId if endpoint already has it in URL
        if (endpoint.includes(TEMPLATE_ID) || endpoint.includes(TEMPLATE_OID)) {
          if (payload.templateId || payload.templateOid || payload.linkTemplateId || payload.template_id) {
            continue;
          }
        }
        
        // Add templateId to payload if endpoint doesn't have it
        let finalPayload = { ...payload };
        if (!endpoint.includes(TEMPLATE_ID) && !endpoint.includes(TEMPLATE_OID) && !endpoint.includes('/link-template/')) {
          if (!finalPayload.templateId && !finalPayload.templateOid) {
            finalPayload.templateId = TEMPLATE_ID;
          }
        }
        
        try {
          const url = `${APPTROVE_API_URL}${endpoint}`;
          const baseHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };
          const headers = auth.headers(baseHeaders);
          
          // Show progress every 50 attempts
          if (attempts % 50 === 0) {
            console.log(`Progress: ${attempts}/${maxAttempts} attempts...`);
          }
          
          const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(finalPayload),
          });
          
          const responseText = await response.text();
          let data = null;
          
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { raw: responseText };
          }
          
          // Check for success (200-299)
          if (response.ok) {
            console.log(`\n✅✅✅ SUCCESS FOUND! ✅✅✅\n`);
            console.log(`Endpoint: ${endpoint}`);
            console.log(`Method: ${method}`);
            console.log(`Auth: ${auth.label}`);
            console.log(`Payload: Variation ${pIdx + 1}`);
            console.log(`Status: ${response.status}`);
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
              console.log(`\n🎉🎉🎉 LINK CREATED! 🎉🎉🎉`);
              console.log(`URL: ${unilinkUrl || `https://applink.reevo.in/d/${linkId}`}`);
              console.log(`Link ID: ${linkId}`);
              successFound = true;
              process.exit(0);
            }
          } else if (response.status !== 404 && response.status !== 405) {
            // Log ALL non-404/405 responses - they might give clues
            console.log(`\n🔍 ${endpoint}`);
            console.log(`   Method: ${method}, Auth: ${auth.label}, Payload: ${pIdx + 1}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 400));
            if (response.status === 400 || response.status === 401 || response.status === 403) {
              console.log(`   ⚠️  This might be the right endpoint but wrong auth/payload!`);
            }
          }
        } catch (error) {
          // Skip network errors
        }
      }
    }
  }
}

if (!successFound) {
  console.log(`\n❌ Tested ${attempts} combinations - no working endpoint found`);
  console.log(`\nPossible reasons:`);
  console.log(`1. Endpoint requires different API plan/permissions`);
  console.log(`2. Endpoint path is different from documentation`);
  console.log(`3. Authentication requires IP whitelisting (S2S API Key)`);
  console.log(`4. Link creation only available via dashboard UI`);
}
