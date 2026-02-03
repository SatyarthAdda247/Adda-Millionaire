/**
 * Vercel Serverless Function: Test AppTrove Stats API
 * 
 * This endpoint tests all possible AppTrove stats endpoints
 * and authentication methods to find the working combination.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { linkId } = req.query;

  if (!linkId || typeof linkId !== 'string') {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  // Get all AppTrove credentials
  const credentials = {
    REPORTING_API_KEY: process.env.APPTROVE_REPORTING_API_KEY,
    API_KEY: process.env.APPTROVE_API_KEY,
    S2S_API: process.env.APPTROVE_S2S_API,
    SDK_KEY: process.env.APPTROVE_SDK_KEY,
    SECRET_ID: process.env.APPTROVE_SECRET_ID,
    SECRET_KEY: process.env.APPTROVE_SECRET_KEY,
    DOMAIN: process.env.APPTROVE_DOMAIN || 'https://api.apptrove.com',
    ANDROID_APP_ID: process.env.APPTROVE_ANDROID_APP_ID,
  };

  // Fix domain: ensure https:// protocol and use API domain, not link domain
  let baseUrl = credentials.DOMAIN;
  
  // If domain is a link domain (applink.*), use api.apptrove.com instead
  if (baseUrl.includes('applink.')) {
    console.warn(`[Test Stats] Domain is a link domain (${baseUrl}), using api.apptrove.com instead`);
    baseUrl = 'https://api.apptrove.com';
  }
  
  // Ensure https:// protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'https://' + baseUrl;
  }
  
  baseUrl = baseUrl.replace(/\/$/, '');

  // Test all possible endpoint patterns
  const endpoints = [
    // Stats endpoints
    `${baseUrl}/internal/unilink/${linkId}/stats`,
    `${baseUrl}/internal/link/${linkId}/stats`,
    `${baseUrl}/internal/unilink/${linkId}/analytics`,
    `${baseUrl}/internal/link/${linkId}/analytics`,
    
    // Reporting endpoints
    `${baseUrl}/reporting/unilink/${linkId}/stats`,
    `${baseUrl}/reporting/link/${linkId}/stats`,
    `${baseUrl}/reporting/unilink/${linkId}`,
    `${baseUrl}/reporting/link/${linkId}`,
    `${baseUrl}/api/reporting/link/${linkId}/stats`,
    
    // V1/V2 API endpoints
    `${baseUrl}/v1/links/${linkId}/stats`,
    `${baseUrl}/v2/links/${linkId}/stats`,
    `${baseUrl}/v1/unilinks/${linkId}/stats`,
    `${baseUrl}/v2/unilinks/${linkId}/stats`,
    
    // Analytics endpoints
    `${baseUrl}/analytics/link/${linkId}`,
    `${baseUrl}/analytics/unilink/${linkId}`,
    
    // Dashboard/Admin endpoints
    `${baseUrl}/dashboard/link/${linkId}/stats`,
    `${baseUrl}/admin/link/${linkId}/stats`,
  ];

  // Test all authentication methods
  const authMethods = [
    {
      name: 'Reporting API Key (api-key header)',
      headers: {
        'api-key': credentials.REPORTING_API_KEY,
        'Accept': 'application/json',
      },
    },
    {
      name: 'Reporting API Key (X-Api-Key header)',
      headers: {
        'X-Api-Key': credentials.REPORTING_API_KEY,
        'Accept': 'application/json',
      },
    },
    {
      name: 'S2S API Key (api-key header)',
      headers: {
        'api-key': credentials.S2S_API,
        'Accept': 'application/json',
      },
    },
    {
      name: 'S2S API Key (X-Api-Key header)',
      headers: {
        'X-Api-Key': credentials.S2S_API,
        'Accept': 'application/json',
      },
    },
    {
      name: 'SDK Key (api-key header)',
      headers: {
        'api-key': credentials.SDK_KEY,
        'Accept': 'application/json',
      },
    },
    {
      name: 'SDK Key (X-Api-Key header)',
      headers: {
        'X-Api-Key': credentials.SDK_KEY,
        'Accept': 'application/json',
      },
    },
    {
      name: 'Basic Auth (Secret ID/Key)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.SECRET_ID}:${credentials.SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    },
    {
      name: 'Bearer Token (Reporting API Key)',
      headers: {
        'Authorization': `Bearer ${credentials.REPORTING_API_KEY}`,
        'Accept': 'application/json',
      },
    },
    {
      name: 'Bearer Token (S2S API)',
      headers: {
        'Authorization': `Bearer ${credentials.S2S_API}`,
        'Accept': 'application/json',
      },
    },
  ];

  const results: any[] = [];
  let successfulAttempt: any = null;

  console.log(`[Test Stats] Testing ${endpoints.length} endpoints with ${authMethods.length} auth methods...`);

  for (const endpoint of endpoints) {
    for (const auth of authMethods) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: auth.headers,
        });

        const text = await response.text();
        let data = null;

        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        const result = {
          endpoint,
          authMethod: auth.name,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          response: response.ok ? data : (text.length > 200 ? text.substring(0, 200) + '...' : text),
        };

        results.push(result);

        if (response.ok && !successfulAttempt) {
          successfulAttempt = result;
          console.log(`[Test Stats] ✅ SUCCESS: ${endpoint} with ${auth.name}`);
          console.log(`[Test Stats] Response:`, data);
        }
      } catch (error: any) {
        results.push({
          endpoint,
          authMethod: auth.name,
          error: error.message,
          success: false,
        });
      }
    }
  }

  return res.status(successfulAttempt ? 200 : 500).json({
    success: !!successfulAttempt,
    linkId,
    successfulAttempt,
    totalAttempts: results.length,
    successfulAttempts: results.filter(r => r.success).length,
    failedAttempts: results.filter(r => !r.success).length,
    credentials: {
      hasReportingApiKey: !!credentials.REPORTING_API_KEY,
      hasApiKey: !!credentials.API_KEY,
      hasS2sApi: !!credentials.S2S_API,
      hasSdkKey: !!credentials.SDK_KEY,
      hasSecretId: !!credentials.SECRET_ID,
      hasSecretKey: !!credentials.SECRET_KEY,
      hasAndroidAppId: !!credentials.ANDROID_APP_ID,
      domain: credentials.DOMAIN,
    },
    allResults: results,
    note: successfulAttempt 
      ? 'Found working endpoint! Use this configuration in your production code.' 
      : 'No working endpoint found. AppTrove may not provide a stats API, or the link may need to be accessed differently.',
  });
}
