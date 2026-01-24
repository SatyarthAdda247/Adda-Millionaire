/**
 * Vercel Serverless Function: Get AppTrove Template Links
 * 
 * This proxies AppTrove API calls to bypass CORS restrictions.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sdk-key, api-key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
      });
    }

    const { templateId } = req.query;

    if (!templateId || typeof templateId !== 'string') {
      return res.status(200).json({ 
        success: false,
        error: 'Template ID is required',
        links: []
      });
    }

    // Get AppTrove credentials - Match old backend pattern
    // NOTE: Vercel serverless functions CANNOT access VITE_ prefixed variables
    // Priority: Non-VITE env vars > VITE_ vars (for local dev) > Hardcoded fallbacks
    const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || process.env.VITE_APPTROVE_API_KEY || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
    const APPTROVE_SDK_KEY = process.env.APPTROVE_SDK_KEY || process.env.VITE_APPTROVE_SDK_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
    const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || process.env.VITE_APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || process.env.VITE_APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_API_URL = (process.env.APPTROVE_API_URL || process.env.VITE_APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');
    
    // Log which variables are being used (for debugging)
    console.log(`[AppTrove Template Links] Environment check:`);
    console.log(`  - APPTROVE_API_KEY: ${APPTROVE_API_KEY ? `SET (${APPTROVE_API_KEY.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - APPTROVE_SECRET_ID: ${APPTROVE_SECRET_ID ? `SET (${APPTROVE_SECRET_ID.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - APPTROVE_SECRET_KEY: ${APPTROVE_SECRET_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`  - API URL: ${APPTROVE_API_URL}`);

    // Try multiple endpoints - MATCH OLD BACKEND EXACTLY
    // Old backend tries: /internal/link-template/${templateId}/links first
    const endpoints = [
      `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/links`,
      `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`,
      `${APPTROVE_API_URL}/internal/link/${encodeURIComponent(templateId)}`,
    ];

    // Try authentication methods in order - MATCH OLD BACKEND EXACTLY
    // Old backend uses: Basic Auth (Secret ID/Key) FIRST for create-link, S2S API Key for templates
    // For template-links, try Basic Auth first (matches create-link pattern)
    const tryHeaders = [
      // Method 1: Basic Auth with Secret ID/Key (PRIMARY - matches create-link)
      { label: 'basic-auth', headers: {
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json'
      } },
      // Method 2: S2S API Key with api-key header (matches templates.ts)
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
      // Method 4: Secret ID/Key as headers
      { label: 'secret-headers', headers: {
        'secret-id': APPTROVE_SECRET_ID,
        'secret-key': APPTROVE_SECRET_KEY,
        'X-Secret-ID': APPTROVE_SECRET_ID,
        'X-Secret-Key': APPTROVE_SECRET_KEY,
        'Accept': 'application/json'
      } },
    ];

    let lastError: any = null;

    // Try each endpoint with each auth method (matching old backend pattern)
    for (const url of endpoints) {
      for (const attempt of tryHeaders) {
        try {
          console.log(`[AppTrove Template Links] Trying ${url} with ${attempt.label} auth`);
          
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
            console.log(`[AppTrove Template Links] ✅ Success with ${url} using ${attempt.label} auth!`);
            
            // Handle different response structures (matching old backend)
            const links =
              data?.data?.linkList ??
              data?.linkList ??
              data?.data?.links ??
              data?.links ??
              (Array.isArray(data) ? data : []) ??
              [];

            console.log(`[AppTrove Template Links] Found ${links.length} links`);
            return res.status(200).json({ success: true, links });
          }

          const errorMsg = data?.message || data?.error || data?.raw || `HTTP ${response.status}: ${response.statusText}`;
          lastError = errorMsg;
          console.log(`[AppTrove Template Links] ❌ ${response.status} - ${url} (${attempt.label}): ${errorMsg}`);
        } catch (error: any) {
          lastError = error.message || 'Network error';
          console.error(`[AppTrove Template Links] Error: ${url} (${attempt.label})`, error);
        }
      }
    }

    // Return empty links instead of error
    return res.status(200).json({
      success: false,
      error: `Failed to fetch template links: ${typeof lastError === 'string' ? lastError : JSON.stringify(lastError)}`,
      links: []
    });
  } catch (error: any) {
    console.error('[AppTrove] Template links error:', error);
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      links: [],
      details: error.message || 'Unknown error occurred',
    });
  }
}
