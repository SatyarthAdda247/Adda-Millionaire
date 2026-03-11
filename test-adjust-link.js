/**
 * Test script to verify Adjust Campaign API Link Creation
 */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Get credentials from environment or use test ones
const ADJUST_API_TOKEN = process.env.ADJUST_API_TOKEN || '8zTxM99vLdeeZ_kPAc3b-ykVL1QMPJvhfYSyC79cMq7evzxyeA';
const ADJUST_APP_TOKEN = process.env.ADJUST_APP_TOKEN || 'YOUR_ADJUST_APP_TOKEN';

async function testAdjustLinkCreation() {
    const linkName = `Test Affiliate ${Math.floor(Math.random() * 1000)}`;
    const campaign = linkName.replace(/\s+/g, '-').toLowerCase();

    console.log('Testing Adjust Link Creation...');
    console.log(`API Token: ${ADJUST_API_TOKEN.substring(0, 5)}...`);
    console.log(`App Token: ${ADJUST_APP_TOKEN}`);
    console.log(`Campaign: ${campaign}`);

    try {
        const adjustRes = await axios.post(
            `https://api.adjust.com/public/v2/apps/${ADJUST_APP_TOKEN}/trackers`,
            {
                name: linkName,
                label: campaign
            },
            {
                headers: {
                    'Authorization': `Bearer ${ADJUST_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ SUCCESS!');
        console.log('Response:', JSON.stringify(adjustRes.data, null, 2));

    } catch (error) {
        console.log('\n❌ FAILED');
        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

testAdjustLinkCreation();
