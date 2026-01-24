/**
 * Simple Test Script: Create Complete Test Link
 * 
 * This script creates a test link using the Vercel API endpoint
 * which already has all credentials configured.
 * 
 * Usage:
 *   node create-test-link.js
 */

const fetch = globalThis.fetch;

// Configuration
// Set your production URL here or via API_BASE_URL environment variable
const API_BASE_URL = process.env.API_BASE_URL 
  || process.env.VERCEL_URL 
  || 'http://localhost:5173'; // Default to local dev server

const TEMPLATE_ID = 'wBehUW';

// Generate test affiliate data
function generateTestAffiliate() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  
  return {
    id: `test-${timestamp}-${randomId}`,
    name: 'Test Affiliate Example',
    email: `test-affiliate-${timestamp}@example.com`,
    phone: '+919876543210',
    socialHandle: '@testaffiliate',
    platform: 'Instagram',
  };
}

// Create link via Vercel API endpoint
async function createTestLink() {
  console.log('🚀 Creating test link...\n');
  
  const affiliate = generateTestAffiliate();
  
  console.log('📝 Test Affiliate:');
  console.log('   Name:', affiliate.name);
  console.log('   Email:', affiliate.email);
  console.log('   ID:', affiliate.id);
  
  console.log('\n🔗 Creating link via AppTrove API...');
  console.log('   Template ID:', TEMPLATE_ID);
  
  const campaignName = `${affiliate.name}_Affiliate_Influencer`.replace(/\s+/g, '_');
  
  const payload = {
    templateId: TEMPLATE_ID,
    linkData: {
      name: `${affiliate.name} - Affiliate Link`,
      userId: affiliate.id,
      affiliateId: affiliate.id,
      affiliateName: affiliate.name,
      affiliateEmail: affiliate.email,
      campaign: campaignName,
      deepLinking: campaignName,
      status: 'active',
    },
    affiliateData: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
    },
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/apptrove/create-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (data.success && data.unilink) {
      console.log('\n✅ Link created successfully!\n');
      console.log('='.repeat(60));
      console.log('🔗 YOUR TEST LINK:');
      console.log('   ' + data.unilink);
      console.log('='.repeat(60));
      console.log('\n📋 Details:');
      console.log('   Link ID:', data.linkId || 'N/A');
      console.log('   Template ID:', TEMPLATE_ID);
      console.log('   Campaign:', campaignName);
      console.log('   Created Via:', data.createdVia || 'api');
      console.log('\n📊 Next Steps:');
      console.log('   1. Open the link above in your browser');
      console.log('   2. It should redirect to Play Store');
      console.log('   3. Check AppTrove dashboard to verify tracking');
      console.log('\n');
      
      return data.unilink;
    } else {
      console.error('\n❌ Failed to create link:');
      console.error('   Error:', data.error || 'Unknown error');
      if (data.details) {
        console.error('   Details:', data.details);
      }
      if (data.templateVerification) {
        console.error('   Template Verification:', JSON.stringify(data.templateVerification, null, 2));
      }
      throw new Error(data.error || 'Failed to create link');
    }
  } catch (error) {
    console.error('\n❌ Error creating link:');
    console.error('   Message:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    throw error;
  }
}

// Main
createTestLink().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
