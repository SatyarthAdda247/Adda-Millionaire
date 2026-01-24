/**
 * Test Script: Create Complete Link with Example Affiliate
 * 
 * This script creates a complete working example:
 * 1. Creates an example affiliate in DynamoDB
 * 2. Creates a link via AppTrove API
 * 3. Saves the link to DynamoDB
 * 4. Displays the complete working link
 * 
 * Usage:
 *   cd server && node ../test-complete-link.js
 * 
 * Or with environment variables:
 *   VITE_AWS_ACCESS_KEY_ID=xxx VITE_AWS_SECRET_ACCESS_KEY=yyy node test-complete-link.js
 */

// Use dynamic import for fetch (Node 18+)
const fetch = globalThis.fetch || require('node-fetch');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration
const AWS_REGION = process.env.VITE_AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_SECRET_ACCESS_KEY;

const USERS_TABLE = process.env.VITE_DYNAMODB_USERS_TABLE || 'edurise-users';
const LINKS_TABLE = process.env.VITE_DYNAMODB_LINKS_TABLE || 'edurise-links';

const APPTROVE_API_URL = process.env.APPTROVE_API_URL || process.env.VITE_APPTROVE_API_URL || 'https://api.apptrove.com';
const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || process.env.VITE_APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || process.env.VITE_APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_DOMAIN = process.env.APPTROVE_DOMAIN || process.env.VITE_APPTROVE_DOMAIN || 'applink.reevo.in';
const TEMPLATE_ID = 'wBehUW'; // Hardcoded template ID

// Initialize DynamoDB Client
let client = null;
let docClient = null;

function getClient() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Set VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY');
  }

  if (!client) {
    client = new DynamoDBClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    docClient = DynamoDBDocumentClient.from(client);
  }

  return docClient;
}

// Generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create example affiliate
async function createExampleAffiliate() {
  const client = getClient();
  
  const affiliateId = generateId();
  const affiliate = {
    id: affiliateId,
    name: 'Test Affiliate Example',
    email: `test-affiliate-${Date.now()}@example.com`,
    phone: '+919876543210',
    socialHandle: '@testaffiliate',
    platform: 'Instagram',
    approvalStatus: 'approved',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('\n📝 Creating example affiliate...');
  console.log('   Name:', affiliate.name);
  console.log('   Email:', affiliate.email);
  console.log('   ID:', affiliateId);

  await client.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: affiliate,
  }));

  console.log('✅ Affiliate created successfully!');
  return affiliate;
}

// Create link via AppTrove API
async function createAppTroveLink(affiliate) {
  console.log('\n🔗 Creating link via AppTrove API...');
  console.log('   Template ID:', TEMPLATE_ID);
  console.log('   Affiliate:', affiliate.name);

  const campaignName = `${affiliate.name}_Affiliate_Influencer`.replace(/\s+/g, '_');
  
  const payload = {
    name: `${affiliate.name} - Affiliate Link`,
    campaign: campaignName,
    deepLinking: campaignName,
    status: 'active',
  };

  console.log('   Payload:', JSON.stringify(payload, null, 2));

  // Try Basic Auth (Secret ID/Key) - PRIMARY method
  const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
  
  const endpoints = [
    `${APPTROVE_API_URL}/internal/link-template/${TEMPLATE_ID}/link`,
    `${APPTROVE_API_URL}/internal/unilink`,
    `${APPTROVE_API_URL}/v2/link-template/${TEMPLATE_ID}/link`,
  ];

  let lastError = null;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n   Trying endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
        body: JSON.stringify(payload),
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
          console.log('✅ Link created successfully!');
          console.log('   URL:', unilinkUrl);
          console.log('   Link ID:', linkId);
          return { success: true, unilink: unilinkUrl, linkId, linkData: data };
        } else if (linkId) {
          const constructedUrl = `https://${APPTROVE_DOMAIN}/d/${linkId}`;
          console.log('✅ Link created with ID, constructed URL:');
          console.log('   URL:', constructedUrl);
          console.log('   Link ID:', linkId);
          return { success: true, unilink: constructedUrl, linkId, linkData: data };
        }
      }

      lastError = data?.message || data?.error || `HTTP ${response.status}`;
      console.log(`   ❌ Failed: ${lastError}`);
    } catch (error) {
      lastError = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  throw new Error(`All endpoints failed. Last error: ${lastError}`);
}

// Save link to DynamoDB
async function saveLinkToDynamoDB(affiliate, linkResult) {
  const client = getClient();
  
  const linkId = linkResult.linkId || generateId();
  const link = {
    id: linkId,
    userId: affiliate.id,
    unilink: linkResult.unilink,
    templateId: TEMPLATE_ID,
    campaign: `${affiliate.name}_Affiliate_Influencer`.replace(/\s+/g, '_'),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    affiliateId: affiliate.id,
    affiliateName: affiliate.name,
    affiliateEmail: affiliate.email,
    createdVia: 'api-registered',
    linkData: linkResult.linkData,
  };

  console.log('\n💾 Saving link to DynamoDB...');
  console.log('   Link ID:', linkId);
  console.log('   URL:', linkResult.unilink);

  await client.send(new PutCommand({
    TableName: LINKS_TABLE,
    Item: link,
  }));

  console.log('✅ Link saved to DynamoDB!');
  return link;
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting complete link creation test...\n');
    console.log('='.repeat(60));

    // Step 1: Create affiliate
    const affiliate = await createExampleAffiliate();

    // Step 2: Create link via AppTrove API
    const linkResult = await createAppTroveLink(affiliate);

    // Step 3: Save link to DynamoDB
    const link = await saveLinkToDynamoDB(affiliate, linkResult);

    // Step 4: Display results
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETE LINK CREATION SUCCESSFUL!\n');
    console.log('📋 Summary:');
    console.log('   Affiliate ID:', affiliate.id);
    console.log('   Affiliate Name:', affiliate.name);
    console.log('   Affiliate Email:', affiliate.email);
    console.log('   Link ID:', link.id);
    console.log('   Link URL:', link.unilink);
    console.log('   Template ID:', TEMPLATE_ID);
    console.log('   Campaign:', link.campaign);
    console.log('\n🔗 Working Link:');
    console.log('   ' + link.unilink);
    console.log('\n📊 Test the link:');
    console.log('   1. Open the link in a browser');
    console.log('   2. It should redirect to Play Store');
    console.log('   3. Check AppTrove dashboard to verify tracking');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createExampleAffiliate, createAppTroveLink, saveLinkToDynamoDB };
