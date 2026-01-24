/**
 * Vercel Serverless Function: Get AppTrove Templates
 * 
 * This proxies AppTrove API calls to bypass CORS restrictions.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get AppTrove credentials from environment variables
    // NOTE: Vercel serverless functions CANNOT access VITE_ prefixed variables
    // Match old backend: uses process.env.APPTROVE_API_KEY directly
    // Priority: APPTROVE_API_KEY > APPTROVE_S2S_API > VITE_ vars (for local dev) > Hardcoded fallbacks
    const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || process.env.VITE_APPTROVE_API_KEY || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
    const APPTROVE_SDK_KEY = process.env.APPTROVE_SDK_KEY || process.env.VITE_APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || process.env.VITE_APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || process.env.VITE_APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_API_URL = (process.env.APPTROVE_API_URL || process.env.VITE_APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');
    
    // Log which variables are being used (for debugging)
    console.log(`[AppTrove Templates] Environment check:`);
    console.log(`  - process.env.APPTROVE_API_KEY: ${process.env.APPTROVE_API_KEY ? `SET (${process.env.APPTROVE_API_KEY.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - process.env.APPTROVE_S2S_API: ${process.env.APPTROVE_S2S_API ? `SET (${process.env.APPTROVE_S2S_API.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - process.env.APPTROVE_SECRET_ID: ${process.env.APPTROVE_SECRET_ID ? `SET (${process.env.APPTROVE_SECRET_ID.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - process.env.APPTROVE_SECRET_KEY: ${process.env.APPTROVE_SECRET_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`  - Using API Key: ${APPTROVE_API_KEY.substring(0, 8)}...`);
    console.log(`  - Using Secret ID: ${APPTROVE_SECRET_ID.substring(0, 8)}...`);
    console.log(`  - API URL: ${APPTROVE_API_URL}`);

    // Build URL with query params (matching old backend format EXACTLY)
    // Old backend uses: /internal/link-template with params: status=active&limit=100
    const url = `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`;
    
    console.log(`[AppTrove Templates] Fetching from: ${url}`);
    console.log(`[AppTrove Templates] Using S2S API Key: ${APPTROVE_API_KEY ? 'Set' : 'Not set'}`);

    // Try authentication methods in order
    // OLD BACKEND USES: 'api-key' header with APPTROVE_API_KEY (S2S API key)
    // But Basic Auth works better for other endpoints, so try it first
    const tryHeaders = [
      // Method 1: Basic Auth with Secret ID/Key (PRIMARY - matches create-link and template-links)
      { label: 'basic-auth-secret', headers: {
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json'
      } },
      // Method 2: S2S API Key with api-key header (MATCHES OLD BACKEND - SECONDARY)
      { label: 's2s-api-key', headers: {
        'api-key': APPTROVE_API_KEY, // S2S API key (82aa3b94-bb98-449d-a372-4a8a98e319f0)
        'Accept': 'application/json'
      } },
      // Method 3: SDK Key
      { label: 'sdk-key', headers: {
        'api-key': APPTROVE_SDK_KEY,
        'X-SDK-Key': APPTROVE_SDK_KEY,
        'Accept': 'application/json'
      } },
      // Method 4: Secret ID/Key as custom headers
      { label: 'secret-headers', headers: {
        'secret-id': APPTROVE_SECRET_ID,
        'secret-key': APPTROVE_SECRET_KEY,
        'X-Secret-ID': APPTROVE_SECRET_ID,
        'X-Secret-Key': APPTROVE_SECRET_KEY,
        'Accept': 'application/json'
      } },
      // Method 5: Try S2S API key with X-S2S-API-Key header
      { label: 's2s-api-key-alt', headers: {
        'api-key': APPTROVE_API_KEY,
        'X-S2S-API-Key': APPTROVE_API_KEY,
        'Accept': 'application/json'
      } },
    ];

    let lastError: any = null;

    for (const attempt of tryHeaders) {
      try {
        console.log(`[AppTrove Templates] Trying ${attempt.label} authentication...`);
        
        // Add timeout (10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        let response: Response;
        try {
          response = await fetch(url, { 
            method: 'GET', 
            headers: attempt.headers,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(`Request timeout after 10 seconds`);
          } else if (fetchError.code === 'ECONNREFUSED') {
            throw new Error(`Connection refused - AppTrove API unreachable`);
          } else if (fetchError.code === 'ETIMEDOUT') {
            throw new Error(`Connection timeout`);
          }
          throw fetchError;
        }
        const responseText = await response.text();
        let data: any = null;
        
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { raw: responseText };
        }

        if (response.ok) {
          console.log(`[AppTrove Templates] ✅ Success with ${attempt.label} authentication!`);
          console.log(`[AppTrove Templates] Response data structure:`, Object.keys(data || {}));
          
          // Handle different response structures (matching old backend EXACTLY)
          // Old backend checks: response.data.data.linkTemplateList, then response.data.linkTemplateList, then Array.isArray(response.data)
          let linkTemplateList: any[] = [];
          
          if (data?.data?.linkTemplateList) {
            linkTemplateList = Array.isArray(data.data.linkTemplateList) ? data.data.linkTemplateList : [];
          } else if (data?.linkTemplateList) {
            linkTemplateList = Array.isArray(data.linkTemplateList) ? data.linkTemplateList : [];
          } else if (Array.isArray(data)) {
            linkTemplateList = data;
          } else if (Array.isArray(data?.data)) {
            linkTemplateList = data.data;
          }

          console.log(`[AppTrove Templates] Found ${linkTemplateList.length} templates`);
          if (linkTemplateList.length > 0) {
            console.log(`[AppTrove Templates] Template IDs:`, linkTemplateList.map((t: any) => t._id || t.id || t.oid).filter(Boolean).join(', '));
            console.log(`[AppTrove Templates] Template names:`, linkTemplateList.map((t: any) => t.name).filter(Boolean).join(', '));
          }

          return res.status(200).json({ success: true, templates: linkTemplateList });
        }

        // Log detailed error information
        const errorMsg = data?.message || data?.error || data?.codeMsg || data?.raw || `HTTP ${response.status}: ${response.statusText}`;
        lastError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
        
        console.log(`[AppTrove Templates] ❌ ${attempt.label} failed: ${errorMsg}`);
        console.log(`[AppTrove Templates] Status: ${response.status}`);
        console.log(`[AppTrove Templates] Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        
        // If 401/403, authentication is wrong - try next method
        // If 404, endpoint might be wrong
        // If 400, might be validation error
        if (response.status === 401) {
          console.log(`[AppTrove Templates] 401 Unauthorized - ${attempt.label} auth failed, trying next method...`);
        } else if (response.status === 403) {
          console.log(`[AppTrove Templates] 403 Forbidden - ${attempt.label} auth failed, trying next method...`);
        } else if (response.status === 404) {
          console.log(`[AppTrove Templates] 404 Not Found - endpoint may be wrong or API structure changed`);
        }
      } catch (error: any) {
        lastError = error.message || 'Network error';
        console.error(`[AppTrove Templates] Error with ${attempt.label}:`, error);
      }
    }

    // Return empty templates instead of error - don't crash
    const errorMsg = typeof lastError === 'string' ? lastError : JSON.stringify(lastError || 'Unknown error');
    console.error(`[AppTrove Templates] ❌ All authentication methods failed!`);
    console.error(`[AppTrove Templates] Last error: ${errorMsg}`);
    console.error(`[AppTrove Templates] URL tried: ${url}`);
    console.error(`[AppTrove Templates] Check: APPTROVE_API_KEY (S2S API key) is set in Vercel environment variables`);
    
    return res.status(200).json({
      success: false,
      error: `Failed to fetch templates: ${errorMsg}`,
      templates: [],
      debug: {
        url,
        attemptedMethods: tryHeaders.map(h => h.label),
        apiKeySet: !!APPTROVE_API_KEY,
        note: 'Check Vercel environment variables: APPTROVE_API_KEY or APPTROVE_S2S_API should be set'
      }
    });
  } catch (error: any) {
    console.error('[AppTrove] Templates error:', error);
    // Return empty templates instead of crashing
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      templates: [],
      details: error.message || 'Unknown error occurred',
    });
  }
}
