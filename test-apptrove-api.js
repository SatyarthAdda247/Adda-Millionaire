/**
 * Direct AppTrove API Test - Create Working Link
 * 
 * This script calls AppTrove API directly with credentials
 * to create a real working link.
 */

const fetch = globalThis.fetch;

// AppTrove API Configuration
const APPTROVE_API_URL = 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
const APPTROVE_SDK_KEY = process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
const APPTROVE_REPORTING_API_KEY = process.env.APPTROVE_REPORTING_API_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
const TEMPLATE_ID = 'wBehUW';
const APPTROVE_DOMAIN = 'applink.reevo.in';

// Generate test affiliate
function generateTestAffiliate() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  
  return {
    id: `test-${timestamp}-${randomId}`,
    name: 'Test Affiliate Example',
    email: `test-affiliate-${timestamp}@example.com`,
  };
}

// Test 1: Fetch templates to verify authentication
async function testFetchTemplates() {
  console.log('\n📋 Test 1: Fetching templates...\n');
  
  const authMethods = [
    {
      label: 'Basic Auth (Secret ID/Key)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    },
    {
      label: 'Reporting API Key',
      headers: {
        'api-key': APPTROVE_REPORTING_API_KEY,
        'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
        'Accept': 'application/json'
      }
    },
    {
      label: 'SDK Key',
      headers: {
        'api-key': APPTROVE_SDK_KEY,
        'X-SDK-Key': APPTROVE_SDK_KEY,
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
  ];
  
  const url = `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`;
  
  for (const method of authMethods) {
    try {
      console.log(`   Trying: ${method.label}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: method.headers,
      });
      
      const responseText = await response.text();
      let data = null;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS with ${method.label}!`);
        const templates = data?.data?.linkTemplateList || data?.linkTemplateList || [];
        console.log(`   Found ${templates.length} templates`);
        if (templates.length > 0) {
          console.log(`   Template IDs:`, templates.map((t) => t._id || t.id || t.oid).filter(Boolean).join(', '));
          return { success: true, templates, authMethod: method.label };
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} - ${data?.message || data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return { success: false, templates: [] };
}

// Test 2: Create link via AppTrove API
async function testCreateLink(affiliate) {
  console.log('\n🔗 Test 2: Creating link via AppTrove API...\n');
  
  const campaignName = `${affiliate.name}_Affiliate_Influencer`.replace(/\s+/g, '_');
  
  const payload = {
    name: `${affiliate.name} - Affiliate Link`,
    campaign: campaignName,
    deepLinking: campaignName,
    status: 'active',
  };
  
  console.log('   Payload:', JSON.stringify(payload, null, 2));
  console.log('   Template ID:', TEMPLATE_ID);
  
  // Try multiple endpoints and auth methods
  const endpoints = [
    {
      url: `${APPTROVE_API_URL}/internal/link-template/${TEMPLATE_ID}/link`,
      label: 'Internal Link Template Endpoint'
    },
    {
      url: `${APPTROVE_API_URL}/internal/unilink`,
      label: 'Internal UniLink Endpoint',
      payload: { ...payload, templateId: TEMPLATE_ID }
    },
    {
      url: `${APPTROVE_API_URL}/v2/link-template/${TEMPLATE_ID}/link`,
      label: 'V2 Link Template Endpoint'
    },
    {
      url: `${APPTROVE_API_URL}/api/internal/link-template/${TEMPLATE_ID}/link`,
      label: 'API Internal Link Template Endpoint'
    },
    {
      url: `${APPTROVE_API_URL}/api/unilink`,
      label: 'API UniLink Endpoint',
      payload: { ...payload, templateId: TEMPLATE_ID }
    },
    {
      url: `${APPTROVE_API_URL}/link-template/${TEMPLATE_ID}/link`,
      label: 'Link Template Endpoint (no internal)'
    },
    {
      url: `${APPTROVE_API_URL}/unilink`,
      label: 'UniLink Endpoint (no internal)',
      payload: { ...payload, templateId: TEMPLATE_ID }
    },
  ];
  
  const authMethods = [
    {
      label: 'Basic Auth (Secret ID/Key)',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
      }
    },
    {
      label: 'Secret Headers',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'secret-id': APPTROVE_SECRET_ID,
        'secret-key': APPTROVE_SECRET_KEY,
        'X-Secret-ID': APPTROVE_SECRET_ID,
        'X-Secret-Key': APPTROVE_SECRET_KEY,
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
  
  for (const endpoint of endpoints) {
    for (const auth of authMethods) {
      try {
        const finalPayload = endpoint.payload || payload;
        const url = endpoint.url;
        
        console.log(`\n   Trying: ${endpoint.label} with ${auth.label}...`);
        console.log(`   URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: auth.headers,
          body: JSON.stringify(finalPayload),
        });
        
        const responseText = await response.text();
        let data = null;
        
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { raw: responseText };
        }
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        
        if (response.ok) {
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
            null;

          if (unilinkUrl) {
            console.log(`\n   ✅ SUCCESS! Link created!`);
            console.log(`   URL: ${unilinkUrl}`);
            console.log(`   Link ID: ${linkId}`);
            return { success: true, unilink: unilinkUrl, linkId, linkData: data };
          } else if (linkId) {
            const constructedUrl = `https://${APPTROVE_DOMAIN}/d/${linkId}`;
            console.log(`\n   ✅ SUCCESS! Link created with ID!`);
            console.log(`   Constructed URL: ${constructedUrl}`);
            console.log(`   Link ID: ${linkId}`);
            return { success: true, unilink: constructedUrl, linkId, linkData: data };
          }
        } else {
          const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;
          console.log(`   ❌ Failed: ${errorMsg}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
  
  return { success: false, error: 'All endpoints failed' };
}

// Test 3: Verify link works
async function testLinkWorks(unilink) {
  console.log('\n🌐 Test 3: Testing link...\n');
  console.log(`   Link: ${unilink}`);
  
  try {
    const response = await fetch(unilink, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects automatically
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log(`   ✅ Redirect found: ${location}`);
      return { success: true, redirect: location };
    } else if (response.status === 200) {
      console.log(`   ✅ Link is accessible`);
      return { success: true };
    } else {
      console.log(`   ⚠️ Unexpected status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error testing link: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Starting AppTrove API Tests...\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Fetch templates
    const templatesResult = await testFetchTemplates();
    
    // Test 2: Create link
    const affiliate = generateTestAffiliate();
    console.log(`\n📝 Test Affiliate:`);
    console.log(`   Name: ${affiliate.name}`);
    console.log(`   Email: ${affiliate.email}`);
    console.log(`   ID: ${affiliate.id}`);
    
    const linkResult = await testCreateLink(affiliate);
    
    if (linkResult.success && linkResult.unilink) {
      // Test 3: Verify link works
      await testLinkWorks(linkResult.unilink);
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ SUCCESS! Working link created!\n');
      console.log('🔗 YOUR TEST LINK:');
      console.log(`   ${linkResult.unilink}`);
      console.log('\n📋 Details:');
      console.log(`   Link ID: ${linkResult.linkId || 'N/A'}`);
      console.log(`   Template ID: ${TEMPLATE_ID}`);
      console.log(`   Campaign: ${affiliate.name}_Affiliate_Influencer`);
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
