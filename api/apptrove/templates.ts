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
    // Match old backend pattern: Secret ID/Key with Basic Auth as PRIMARY method
    // Priority: Environment variables > Hardcoded fallbacks
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    // Build URL with query params (matching old backend format)
    const url = `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`;

    // Try authentication methods in order (matching old backend - uses api-key header)
    // Old backend used: 'api-key': APPTROVE_API_KEY header
    const tryHeaders = [
      // Method 1: S2S API Key (Server-to-Server) - PRIMARY (this is the API key user provided)
      { label: 's2s-api-key', headers: {
        'api-key': APPTROVE_API_KEY, // This is the S2S API key (82aa3b94-bb98-449d-a372-4a8a98e319f0)
        'Accept': 'application/json'
      } },
      // Method 2: Basic Auth with Secret ID/Key
      { label: 'basic-auth', headers: (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) ? {
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json'
      } : null },
      // Method 3: Secret ID/Key as headers
      { label: 'secret-headers', headers: (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) ? {
        'secret-id': APPTROVE_SECRET_ID,
        'secret-key': APPTROVE_SECRET_KEY,
        'X-Secret-ID': APPTROVE_SECRET_ID,
        'X-Secret-Key': APPTROVE_SECRET_KEY,
        'Accept': 'application/json'
      } : null },
      // Method 4: SDK Key
      { label: 'sdk-key', headers: APPTROVE_SDK_KEY ? { 
        'api-key': APPTROVE_SDK_KEY, 
        'X-SDK-Key': APPTROVE_SDK_KEY,
        'Accept': 'application/json' 
      } : null },
    ].filter((x): x is { label: string; headers: Record<string, string> } => !!x.headers);

    let lastError: any = null;

    for (const attempt of tryHeaders) {
      try {
        const response = await fetch(url, { method: 'GET', headers: attempt.headers });
        const data = await response.json().catch(() => null);

        if (response.ok) {
          // Handle different response structures
          const linkTemplateList =
            data?.data?.linkTemplateList ??
            data?.linkTemplateList ??
            (Array.isArray(data) ? data : []) ??
            [];

          return res.status(200).json({ success: true, templates: linkTemplateList });
        }

        const errorMsg = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        lastError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
      } catch (error: any) {
        lastError = error.message || 'Network error';
      }
    }

    // Return empty templates instead of error - don't crash
    const errorMsg = typeof lastError === 'string' ? lastError : JSON.stringify(lastError || 'Unknown error');
    return res.status(200).json({
      success: false,
      error: `Failed to fetch templates: ${errorMsg}`,
      templates: []
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
