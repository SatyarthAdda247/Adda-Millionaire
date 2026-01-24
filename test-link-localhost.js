/**
 * Localhost Test: Fix Link Creation
 * 
 * Tests link creation using the exact same approach as old backend
 */

const fetch = globalThis.fetch;

// AppTrove Configuration (matching old backend)
const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const APPTROVE_REPORTING_API_KEY = process.env.APPTROVE_REPORTING_API_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';

// Step 1: Fetch template to get actual ID variants
async function fetchTemplate(templateId) {
  console.log('\n📋 Step 1: Fetching template details...\n');
  
  const authMethods = [
    {
      label: 'Reporting API Key',
      headers: {
        'api-key': APPTROVE_REPORTING_API_KEY,
        'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
        'Accept': 'application/json'
      }
    },
    {
      label: 'S2S API Key',
      headers: {
        'api-key': APPTROVE_API_KEY,
        'Accept': 'application/json'
      }
    },
    {
      label: 'Basic Auth',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    },
  ];
  
  // Try list endpoint first
  const listUrl = `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`;
  
  for (const method of authMethods) {
    try {
      console.log(`   Trying list endpoint with ${method.label}...`);
      const response = await fetch(listUrl, {
        method: 'GET',
        headers: method.headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        const templates = data?.data?.linkTemplateList || data?.linkTemplateList || [];
        const template = templates.find(t => 
          t._id === templateId || t.id === templateId || t.oid === templateId
        );
        
        if (template) {
          console.log(`   ✅ Found template!`);
          console.log(`   Name: ${template.name}`);
          console.log(`   _id: ${template._id}`);
          console.log(`   id: ${template.id}`);
          console.log(`   oid: ${template.oid}`);
          return { success: true, template, authMethod: method.label };
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Try direct fetch endpoint
  const directUrl = `${APPTROVE_API_URL}/internal/link/${templateId}`;
  
  for (const method of authMethods) {
    try {
      console.log(`   Trying direct endpoint with ${method.label}...`);
      const response = await fetch(directUrl, {
        method: 'GET',
        headers: method.headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        const template = data?.data?.linkTemplate || data?.linkTemplate || data?.data || data;
        if (template && (template._id || template.id || template.oid)) {
          console.log(`   ✅ Found template via direct fetch!`);
          return { success: true, template, authMethod: method.label };
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return { success: false, template: null };
}

// Step 2: Create link using template ID variants
async function createLink(templateId, template, linkName, customParams = {}) {
  console.log('\n🔗 Step 2: Creating link...\n');
  
  // Build template ID variants (matching old backend)
  const templateIdVariants = [templateId];
  if (template?.oid && template.oid !== templateId) {
    templateIdVariants.push(template.oid);
  }
  if (template?._id && template._id !== templateId) {
    templateIdVariants.push(template._id);
  }
  if (template?.id && template.id !== templateId) {
    templateIdVariants.push(template.id);
  }
  
  console.log(`   Template ID variants to try: ${templateIdVariants.join(', ')}`);
  
  // Build payload (matching old backend exactly)
  const campaign = customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50);
  const basePayload = {
    name: linkName,
    campaign: campaign,
    deepLinking: customParams.deepLink || '',
    status: 'active',
    ...customParams
  };
  
  console.log(`   Payload:`, JSON.stringify(basePayload, null, 2));
  
  // Build endpoints (matching old backend exactly)
  const endpoints = [];
  
  // Method 1: Basic Auth with template ID variants
  for (const id of templateIdVariants) {
    endpoints.push({
      url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
      payload: basePayload,
      auth: 'basic',
      label: `Basic Auth - Template ID: ${id}`
    });
  }
  
  // Method 2: Secret Headers with template ID variants
  for (const id of templateIdVariants) {
    endpoints.push({
      url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
      payload: basePayload,
      auth: 'secret-headers',
      label: `Secret Headers - Template ID: ${id}`
    });
  }
  
  // Method 3: API Key with template ID variants
  for (const id of templateIdVariants) {
    endpoints.push({
      url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
      payload: basePayload,
      auth: 'api-key',
      label: `API Key - Template ID: ${id}`
    });
  }
  
  // Method 4: Reporting API Key with template ID variants (since it works for templates)
  for (const id of templateIdVariants) {
    endpoints.push({
      url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
      payload: basePayload,
      auth: 'reporting-api-key',
      label: `Reporting API Key - Template ID: ${id}`
    });
  }
  
  // Alternative endpoints
  endpoints.push({
    url: `${APPTROVE_API_URL}/internal/unilink`,
    payload: { ...basePayload, templateId: templateId },
    auth: 'basic',
    label: 'Basic Auth - UniLink Endpoint'
  });
  
  endpoints.push({
    url: `${APPTROVE_API_URL}/internal/link-template/link`,
    payload: { ...basePayload, templateId: templateId },
    auth: 'basic',
    label: 'Basic Auth - Link Template Link Endpoint'
  });
  
  // V2 endpoints
  for (const id of templateIdVariants) {
    endpoints.push({
      url: `${APPTROVE_API_URL}/v2/link-template/${id}/link`,
      payload: basePayload,
      auth: 'basic',
      label: `Basic Auth - V2 API - Template ID: ${id}`
    });
  }
  
  // Try each endpoint
  for (const endpoint of endpoints) {
    try {
      console.log(`\n   Trying: ${endpoint.label}`);
      console.log(`   URL: ${endpoint.url}`);
      
      // Build headers
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (endpoint.auth === 'basic') {
        const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
        headers['Authorization'] = `Basic ${authString}`;
      } else if (endpoint.auth === 'secret-headers') {
        headers['secret-id'] = APPTROVE_SECRET_ID;
        headers['secret-key'] = APPTROVE_SECRET_KEY;
        headers['X-Secret-ID'] = APPTROVE_SECRET_ID;
        headers['X-Secret-Key'] = APPTROVE_SECRET_KEY;
      } else if (endpoint.auth === 'api-key') {
        headers['api-key'] = APPTROVE_API_KEY;
      } else if (endpoint.auth === 'reporting-api-key') {
        headers['api-key'] = APPTROVE_REPORTING_API_KEY;
        headers['X-Reporting-API-Key'] = APPTROVE_REPORTING_API_KEY;
      }
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(endpoint.payload),
      });
      
      const responseText = await response.text();
      let data = null;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 1000));
        
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

        if (unilinkUrl) {
          console.log(`\n   🎉 Link created successfully!`);
          console.log(`   URL: ${unilinkUrl}`);
          console.log(`   Link ID: ${linkId}`);
          return { success: true, unilink: unilinkUrl, linkId, linkData: data };
        } else if (linkId) {
          const domain = data?.domain || data?.data?.domain || template?.domain || 'applink.reevo.in';
          const constructedUrl = `https://${domain}/d/${linkId}`;
          console.log(`\n   🎉 Link created with ID!`);
          console.log(`   Constructed URL: ${constructedUrl}`);
          console.log(`   Link ID: ${linkId}`);
          return { success: true, unilink: constructedUrl, linkId, linkData: data };
        }
      } else {
        const errorMsg = data?.message || data?.error || data?.codeMsg || `HTTP ${response.status}`;
        console.log(`   ❌ Failed: ${errorMsg}`);
        if (response.status !== 404) {
          console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return { success: false, error: 'All endpoints failed' };
}

// Main test
async function main() {
  console.log('🚀 Localhost Test: Fix Link Creation\n');
  console.log('='.repeat(60));
  
  const linkName = 'Test Affiliate Example - Affiliate Link';
  const customParams = {
    campaign: 'Test_Affiliate_Example_Affiliate_Influencer',
    deepLink: 'Test_Affiliate_Example_Affiliate_Influencer',
  };
  
  try {
    // Step 1: Fetch template
    const templateResult = await fetchTemplate(TEMPLATE_ID);
    
    if (!templateResult.success) {
      console.log('\n❌ Could not fetch template. Proceeding with provided templateId only.');
    }
    
    // Step 2: Create link
    const linkResult = await createLink(
      TEMPLATE_ID,
      templateResult.template,
      linkName,
      customParams
    );
    
    if (linkResult.success) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ SUCCESS! Working link created!\n');
      console.log('🔗 YOUR TEST LINK:');
      console.log(`   ${linkResult.unilink}`);
      console.log('\n📋 Details:');
      console.log(`   Link ID: ${linkResult.linkId || 'N/A'}`);
      console.log(`   Template ID: ${TEMPLATE_ID}`);
      console.log(`   Campaign: ${customParams.campaign}`);
      console.log('\n📊 Open this link in your browser to test!');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ Failed to create link');
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
