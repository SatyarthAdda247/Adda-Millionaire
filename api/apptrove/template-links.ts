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
    // Secret ID/Key with Basic Auth as PRIMARY method
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY;
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    // Try multiple endpoints
    const endpoints = [
      `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`,
      `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/links`,
      `${APPTROVE_API_URL}/api/v1/templates/${encodeURIComponent(templateId)}/links`,
    ];

    // Try authentication methods in order: Basic Auth (Secret ID/Key) FIRST, then others
    const tryHeaders = [
      // Method 1: Basic Auth with Secret ID/Key (PRIMARY - matches old backend)
      { label: 'basic-auth', headers: (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) ? {
        'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
        'Accept': 'application/json'
      } : null },
      // Method 2: Secret ID/Key as headers
      { label: 'secret-headers', headers: (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) ? {
        'secret-id': APPTROVE_SECRET_ID,
        'secret-key': APPTROVE_SECRET_KEY,
        'X-Secret-ID': APPTROVE_SECRET_ID,
        'X-Secret-Key': APPTROVE_SECRET_KEY,
        'Accept': 'application/json'
      } : null },
      // Method 3: API Key
      { label: 'api-key', headers: APPTROVE_API_KEY ? { 'api-key': APPTROVE_API_KEY, 'Accept': 'application/json' } : null },
      // Method 4: SDK Key
      { label: 'sdk-key', headers: APPTROVE_SDK_KEY ? { 
        'api-key': APPTROVE_SDK_KEY, 
        'X-SDK-Key': APPTROVE_SDK_KEY,
        'x-sdk-key': APPTROVE_SDK_KEY,
        'Accept': 'application/json' 
      } : null },
    ].filter((x): x is { label: string; headers: Record<string, string> } => !!x.headers);

    let lastError: any = null;

    for (const url of endpoints) {
      for (const attempt of tryHeaders) {
        try {
          const response = await fetch(url, { method: 'GET', headers: attempt.headers });
          const responseText = await response.text();
          let data: any = null;
          
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { raw: responseText };
          }

          if (response.ok) {
            // Handle different response structures
            const links =
              data?.data?.linkList ??
              data?.linkList ??
              data?.data?.links ??
              data?.links ??
              (Array.isArray(data) ? data : []) ??
              [];

            return res.status(200).json({ success: true, links });
          }

          lastError = data?.message || data?.error || data?.raw || `HTTP ${response.status}: ${response.statusText}`;
        } catch (error: any) {
          lastError = error.message || 'Network error';
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
