/**
 * Vercel Serverless Function: Create AppTrove UniLink
 * 
 * This proxies AppTrove API calls to bypass CORS restrictions.
 * Deployed as part of the frontend on Vercel (no separate backend needed).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { templateId, linkData } = req.body || {};

    if (!templateId) {
      return res.status(400).json({ 
        success: false,
        error: 'Template ID is required' 
      });
    }

    // Get AppTrove credentials from environment variables
    // Vercel serverless functions can access env vars with or without VITE_ prefix
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY;
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID;
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY;
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    // Build payload
    const campaign = linkData?.campaign || (linkData?.name || 'Affiliate Link').replace(/\s+/g, '-').toLowerCase().substring(0, 50);
    const payload = {
      name: linkData?.name || 'Affiliate Link',
      campaign: campaign,
      deepLinking: linkData?.deepLink || '',
      status: linkData?.status || 'active',
      ...linkData,
      templateId: templateId,
    };

    // Try multiple endpoints and auth methods
    const endpoints: Array<{ url: string; auth: 'api-key' | 'secret' | 'basic' }> = [
      { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: 'api-key' },
      { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: 'secret' },
      { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: 'basic' },
      { url: `${APPTROVE_API_URL}/internal/link-template/link`, auth: 'api-key' },
      { url: `${APPTROVE_API_URL}/internal/link-template/link`, auth: 'secret' },
      { url: `${APPTROVE_API_URL}/internal/unilink`, auth: 'api-key' },
      { url: `${APPTROVE_API_URL}/internal/unilink`, auth: 'secret' },
      { url: `${APPTROVE_API_URL}/v2/link-template/${encodeURIComponent(templateId)}/link`, auth: 'api-key' },
      { url: `${APPTROVE_API_URL}/v2/link-template/${encodeURIComponent(templateId)}/link`, auth: 'secret' },
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        // Add authentication - try multiple methods
        if (endpoint.auth === 'api-key') {
          // Try API Key first, then SDK Key
          if (APPTROVE_API_KEY) {
            headers['api-key'] = APPTROVE_API_KEY;
          } else if (APPTROVE_SDK_KEY) {
            headers['api-key'] = APPTROVE_SDK_KEY;
            headers['X-SDK-Key'] = APPTROVE_SDK_KEY;
          } else {
            continue; // Skip if no API key available
          }
        } else if (endpoint.auth === 'secret' && APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
          headers['secret-id'] = APPTROVE_SECRET_ID;
          headers['secret-key'] = APPTROVE_SECRET_KEY;
          headers['X-Secret-ID'] = APPTROVE_SECRET_ID;
          headers['X-Secret-Key'] = APPTROVE_SECRET_KEY;
        } else if (endpoint.auth === 'basic' && APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
          const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
          headers['Authorization'] = `Basic ${authString}`;
        } else {
          continue; // Skip if auth method not available
        }

        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);

        // Check for success
        if (response.ok || response.status === 200 || response.status === 201) {
          // Extract unilink from various response formats
          const unilink =
            data?.data?.unilink ??
            data?.unilink ??
            data?.data?.link?.link ??
            data?.data?.link?.unilink ??
            data?.link?.link ??
            data?.link?.unilink ??
            data?.url ??
            null;

          // If we got a successful response but no unilink, try to construct it
          if (!unilink && data?.data?.link) {
            const linkId = data?.data?.link?.id || data?.data?.link?._id;
            if (linkId) {
              const domain = data?.data?.link?.domain || 'applink.reevo.in';
              return res.status(200).json({
                success: true,
                link: data?.data?.link || data?.link || data,
                unilink: `https://${domain}/d/${linkId}`,
              });
            }
          }

          return res.status(200).json({
            success: true,
            link: data?.data?.link || data?.link || data,
            unilink: unilink,
          });
        }

        // If not successful, try next endpoint
        lastError = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch (error: any) {
        lastError = error.message || 'Network error';
        continue; // Try next endpoint
      }
    }

    // All endpoints failed - return error but don't crash
    return res.status(200).json({
      success: false,
      error: `Failed to create link in template ${templateId}`,
      details: lastError || 'All AppTrove API endpoints failed',
    });
  } catch (error: any) {
    console.error('Serverless function error:', error);
    // Return error response instead of crashing
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred',
    });
  }
}
