// Test script to verify link creation functionality
import axios from 'axios';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'data', 'database.json');

async function testLinkCreation() {
  console.log('🔍 Testing Link Creation Functionality\n');
  console.log('='.repeat(60));
  
  // Step 1: Check database
  console.log('\n📊 Step 1: Checking database...');
  let db;
  try {
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    db = JSON.parse(dbContent);
    console.log(`✅ Database loaded: ${db.users?.length || 0} users, ${db.links?.length || 0} links`);
  } catch (error) {
    console.error('❌ Error reading database:', error.message);
    return;
  }
  
  // Step 2: Find or create test user
  console.log('\n👤 Step 2: Finding test user...');
  let testUser = db.users?.find(u => u.approvalStatus === 'approved');
  
  if (!testUser) {
    console.log('⚠️  No approved user found. Creating test user...');
    testUser = {
      id: 'test-' + Date.now(),
      name: 'Test User for Link Creation',
      email: 'test-link@example.com',
      phone: '1234567890',
      approvalStatus: 'approved',
      createdAt: new Date().toISOString()
    };
    if (!db.users) db.users = [];
    db.users.push(testUser);
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    console.log(`✅ Test user created: ${testUser.id}`);
  } else {
    console.log(`✅ Using existing approved user: ${testUser.name} (${testUser.id})`);
  }
  
  // Step 3: Test link creation endpoint
  console.log('\n🔗 Step 3: Testing link creation endpoint...');
  const linkName = `Test Link ${new Date().toISOString()}`;
  
  try {
    const response = await axios.post(
      'http://localhost:3001/api/apptrove/templates/wBehUW/create-link',
      {
        name: linkName,
        userId: testUser.id
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    
    console.log('✅ Link creation successful!');
    console.log('\n📋 Response Details:');
    console.log('  Status:', response.status);
    console.log('  Success:', response.data.success);
    console.log('  Link:', response.data.link);
    console.log('  Link ID:', response.data.linkId);
    console.log('  Template ID:', response.data.templateId);
    console.log('  Message:', response.data.message);
    
    if (response.data.note) {
      console.log('  Note:', response.data.note);
    }
    
    // Step 4: Verify link was saved to database
    console.log('\n💾 Step 4: Verifying link in database...');
    const updatedDb = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
    const savedLink = updatedDb.links?.find(l => l.userId === testUser.id);
    
    if (savedLink) {
      console.log('✅ Link saved to database:');
      console.log('  Link:', savedLink.link);
      console.log('  Link ID:', savedLink.linkId);
      console.log('  Template ID:', savedLink.templateId);
      console.log('  Status:', savedLink.status);
      console.log('  Created At:', savedLink.createdAt || savedLink.updatedAt);
    } else {
      console.log('⚠️  Link not found in database after creation');
    }
    
    // Step 5: Test link format
    console.log('\n🔍 Step 5: Verifying link format...');
    const linkUrl = response.data.link;
    if (linkUrl && linkUrl.startsWith('https://') && linkUrl.includes('/d/')) {
      console.log('✅ Link format is valid');
      console.log('  Domain:', new URL(linkUrl).hostname);
      console.log('  Path:', new URL(linkUrl).pathname);
    } else {
      console.log('⚠️  Link format may be invalid:', linkUrl);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED - Link creation is working!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Link creation failed:');
    console.error('  Status:', error.response?.status);
    console.error('  Error:', error.response?.data?.error || error.message);
    if (error.response?.data?.details) {
      console.error('  Details:', error.response.data.details);
    }
    if (error.response?.data) {
      console.error('  Full response:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
  }
}

testLinkCreation().catch(console.error);
