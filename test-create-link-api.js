/**
 * Test the actual create-link API endpoint
 */

const fetch = globalThis.fetch;

const TEMPLATE_ID = 'wBehUW';
const AFFILIATE_DATA = {
  id: 'test-affiliate-123',
  name: 'Test Affiliate',
  email: 'test@example.com',
};

const LINK_DATA = {
  name: 'Test Affiliate - Affiliate Link',
  campaign: 'Test_Affiliate_Influencer',
  status: 'active',
};

// Test localhost first
const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

async function testCreateLink() {
  console.log('🧪 Testing create-link API endpoint...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Template ID: ${TEMPLATE_ID}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/apptrove/create-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        linkData: LINK_DATA,
        affiliateData: AFFILIATE_DATA,
      }),
    });

    const responseText = await response.text();
    let data = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅✅✅ SUCCESS! ✅✅✅\n');
      console.log(`Link created: ${data.unilink || data.link}`);
      console.log(`Link ID: ${data.linkId}`);
    } else {
      console.log('\n❌ Failed:', data.error || data.details);
      if (data.endpointsTried) {
        console.log(`\nEndpoints tried: ${data.endpointsTried.length}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateLink();
