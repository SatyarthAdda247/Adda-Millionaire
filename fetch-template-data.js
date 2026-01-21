/**
 * Script to fetch and display full AppTrove template data
 * Run: node fetch-template-data.js
 */

const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_SDK_KEY = process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
const APPTROVE_API_URL = process.env.APPTROVE_API_URL || 'https://api.apptrove.com';
const TEMPLATE_ID = 'wBehUW'; // Millionaires Adda template

async function fetchTemplateData() {
  console.log('🔍 Fetching template data for:', TEMPLATE_ID);
  console.log('📡 API URL:', APPTROVE_API_URL);
  console.log('');

  const url = `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`;

  // Try Basic Auth first (matches old backend)
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
    'Accept': 'application/json'
  };

  try {
    console.log('📤 Sending request...');
    const response = await fetch(url, { method: 'GET', headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Response received');
    console.log('');

    // Extract templates
    const templates = data?.data?.linkTemplateList || data?.linkTemplateList || (Array.isArray(data) ? data : []);
    console.log(`📋 Found ${templates.length} templates`);
    console.log('');

    // Find our template
    const template = templates.find((t) => 
      t._id === TEMPLATE_ID || 
      t.id === TEMPLATE_ID || 
      t.oid === TEMPLATE_ID ||
      t.name?.toLowerCase().includes('millionaire')
    );

    if (!template) {
      console.log('❌ Template not found! Available templates:');
      templates.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.name || t._id || t.id} (ID: ${t._id || t.id || t.oid})`);
      });
      return;
    }

    console.log('🎯 Found template:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(template, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Extract key fields
    console.log('📊 Key Fields:');
    console.log('  Template Name:', template.name);
    console.log('  Template ID:', template._id || template.id || template.oid);
    console.log('  Domain:', template.domain);
    console.log('  Status:', template.status);
    console.log('');
    console.log('🤖 Android App Info:');
    console.log('  androidAppID:', template.androidAppID);
    console.log('  androidAppId:', template.androidAppId);
    console.log('  packageName:', template.packageName);
    console.log('  androidPackage:', template.androidPackage);
    console.log('  android:', template.android ? JSON.stringify(template.android, null, 2) : 'N/A');
    console.log('');
    console.log('🍎 iOS App Info:');
    console.log('  iosAppID:', template.iosAppID);
    console.log('  iosAppId:', template.iosAppId);
    console.log('  bundleId:', template.bundleId);
    console.log('  iosBundle:', template.iosBundle);
    console.log('  ios:', template.ios ? JSON.stringify(template.ios, null, 2) : 'N/A');
    console.log('');

    // Check for nested structures
    if (template.androidApplication) {
      console.log('📱 androidApplication object:');
      console.log(JSON.stringify(template.androidApplication, null, 2));
      console.log('');
    }

    if (template.iosApplication) {
      console.log('📱 iosApplication object:');
      console.log(JSON.stringify(template.iosApplication, null, 2));
      console.log('');
    }

    // Summary
    const androidAppID = 
      template.androidAppID || 
      template.androidAppId || 
      template.packageName || 
      template.androidPackage ||
      template.android?.packageName ||
      template.android?.appId ||
      template.androidApplication?.packageName ||
      template.androidApplication?.appId;

    console.log('✅ Summary:');
    console.log('  Domain:', template.domain || 'applink.reevo.in');
    console.log('  Android App ID:', androidAppID || '❌ NOT FOUND - Need to set APPTROVE_ANDROID_APP_ID');
    console.log('');

    if (!androidAppID) {
      console.log('⚠️  Android App ID not found in template data!');
      console.log('   Please find it manually and set APPTROVE_ANDROID_APP_ID environment variable.');
      console.log('   See FIND_ANDROID_APP_ID.md for instructions.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

fetchTemplateData();
