/**
 * Test script to verify AppTrove link creation via serverless function
 * 
 * Run this after deploying to Vercel:
 * node test-link-creation-api.js
 * 
 * Or test locally with: vercel dev
 * Then run: node test-link-creation-api.js
 */

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.TEST_URL || 'http://localhost:3000';

const TEMPLATE_ID = 'wBehUW'; // Millionaires Adda template

async function testLinkCreation() {
  console.log('🧪 Testing AppTrove Link Creation via Serverless Function');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📋 Template ID: ${TEMPLATE_ID}\n`);

  try {
    // Test 1: Fetch templates first
    console.log('1️⃣ Testing templates endpoint...');
    const templatesResponse = await fetch(`${BASE_URL}/api/apptrove/templates`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const templatesData = await templatesResponse.json();
    console.log('   Status:', templatesResponse.status);
    console.log('   Success:', templatesData.success);
    console.log('   Templates found:', templatesData.templates?.length || 0);
    
    if (templatesData.templates?.length > 0) {
      console.log('   ✅ Templates endpoint working!');
      console.log('   First template:', templatesData.templates[0]?.name || templatesData.templates[0]?._id);
    } else {
      console.log('   ⚠️  No templates found or error:', templatesData.error);
    }
    console.log('');

    // Test 2: Create a test link
    console.log('2️⃣ Testing link creation...');
    const testLinkName = `Test Link - ${new Date().toISOString()}`;
    
    const createResponse = await fetch(`${BASE_URL}/api/apptrove/create-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        affiliateData: {
          id: 'test-user-123',
          name: 'Test Affiliate',
          email: 'test@example.com',
        },
        linkData: {
          name: testLinkName,
          campaign: 'test-campaign',
          status: 'active',
        },
      }),
    });

    const createData = await createResponse.json();
    console.log('   Status:', createResponse.status);
    console.log('   Success:', createData.success);
    
    if (createData.success && createData.unilink) {
      console.log('   ✅ Link created successfully!');
      console.log('   UniLink:', createData.unilink);
      console.log('   Link ID:', createData.linkId);
      console.log('   Full response:', JSON.stringify(createData, null, 2));
    } else {
      console.log('   ❌ Link creation failed');
      console.log('   Error:', createData.error);
      console.log('   Details:', createData.details);
      console.log('   Last response:', JSON.stringify(createData.lastResponse, null, 2));
      console.log('   Attempted endpoints:', createData.attemptedEndpoints);
      console.log('   Template ID variants:', createData.templateIdVariants);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testLinkCreation();
