/**
 * Vercel Serverless Function: Create AppTrove UniLink
 * 
 * This proxies AppTrove API calls to bypass CORS restrictions.
 * Includes comprehensive tracking parameters for accurate analytics.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sdk-key, api-key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
      });
    }

    const { templateId, linkData, affiliateData } = req.body || {};

    if (!templateId) {
      return res.status(200).json({ 
        success: false,
        error: 'Template ID is required' 
      });
    }

    // Get AppTrove credentials - SDK Key is hardcoded as fallback
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY;
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID;
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY;
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    // Build comprehensive payload with all tracking parameters
    const campaign = linkData?.campaign || (linkData?.name || 'Affiliate Link').replace(/\s+/g, '-').toLowerCase().substring(0, 50);
    
    // Extract affiliate tracking data
    const affiliateId = affiliateData?.id || linkData?.userId || linkData?.affiliateId || '';
    const affiliateName = affiliateData?.name || linkData?.name || '';
    const affiliateEmail = affiliateData?.email || linkData?.email || '';
    
    // Build comprehensive payload with tracking metadata
    const payload: any = {
      name: linkData?.name || `${affiliateName} - Affiliate Link` || 'Affiliate Link',
      campaign: campaign,
      deepLinking: linkData?.deepLink || '',
      status: linkData?.status || 'active',
      templateId: templateId,
      // Include all tracking parameters
      metadata: {
        affiliateId: affiliateId,
        affiliateName: affiliateName,
        affiliateEmail: affiliateEmail,
        userId: linkData?.userId || affiliateId,
        createdAt: new Date().toISOString(),
        source: 'admin_dashboard',
        ...linkData?.metadata,
      },
      // Additional tracking fields that AppTrove might expect
      ...(linkData?.utm_source && { utm_source: linkData.utm_source }),
      ...(linkData?.utm_medium && { utm_medium: linkData.utm_medium }),
      ...(linkData?.utm_campaign && { utm_campaign: linkData.utm_campaign }),
      ...(linkData?.utm_term && { utm_term: linkData.utm_term }),
      ...(linkData?.utm_content && { utm_content: linkData.utm_content }),
      // Include any other linkData fields
      ...linkData,
    };

    // Remove duplicate templateId if it was in linkData
    if (payload.templateId !== templateId) {
      payload.templateId = templateId;
    }

    // Try multiple endpoints and auth methods (comprehensive fallback)
    const endpoints: Array<{ url: string; auth: 'api-key' | 'sdk-key' | 'secret' | 'basic'; headers: Record<string, string> }> = [];

    // Build endpoint configurations with proper auth headers
    const endpointConfigs = [
      { path: `/internal/link-template/${encodeURIComponent(templateId)}/link`, authMethods: ['api-key', 'sdk-key', 'secret', 'basic'] },
      { path: `/internal/link-template/link`, authMethods: ['api-key', 'sdk-key', 'secret'] },
      { path: `/internal/unilink`, authMethods: ['api-key', 'sdk-key', 'secret'] },
      { path: `/v2/link-template/${encodeURIComponent(templateId)}/link`, authMethods: ['api-key', 'sdk-key', 'secret'] },
      { path: `/api/v1/unilinks`, authMethods: ['api-key', 'sdk-key'] },
      { path: `/api/v1/links`, authMethods: ['api-key', 'sdk-key'] },
    ];

    for (const config of endpointConfigs) {
      for (const authMethod of config.authMethods) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        // Set authentication headers based on method
        if (authMethod === 'api-key' && APPTROVE_API_KEY) {
          headers['api-key'] = APPTROVE_API_KEY;
          headers['X-API-Key'] = APPTROVE_API_KEY;
        } else if (authMethod === 'sdk-key' && APPTROVE_SDK_KEY) {
          headers['api-key'] = APPTROVE_SDK_KEY;
          headers['X-SDK-Key'] = APPTROVE_SDK_KEY;
          headers['x-sdk-key'] = APPTROVE_SDK_KEY; // lowercase variant
        } else if (authMethod === 'secret' && APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
          headers['secret-id'] = APPTROVE_SECRET_ID;
          headers['secret-key'] = APPTROVE_SECRET_KEY;
          headers['X-Secret-ID'] = APPTROVE_SECRET_ID;
          headers['X-Secret-Key'] = APPTROVE_SECRET_KEY;
        } else if (authMethod === 'basic' && APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
          const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
          headers['Authorization'] = `Basic ${authString}`;
        } else {
          continue; // Skip if auth method not available
        }

        endpoints.push({
          url: `${APPTROVE_API_URL}${config.path}`,
          auth: authMethod as any,
          headers,
        });
      }
    }

    let lastError: any = null;
    let lastResponse: any = null;

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`[AppTrove] Trying endpoint: ${endpoint.url} with auth: ${endpoint.auth}`);
        
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: endpoint.headers,
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let data: any = null;
        
        try {
          data = JSON.parse(responseText);
        } catch {
          // If not JSON, try to extract useful info
          data = { raw: responseText };
        }

        lastResponse = { status: response.status, data };

        // Check for success (200-299)
        if (response.ok || response.status === 200 || response.status === 201) {
          // Extract unilink from various response formats
          const unilink =
            data?.data?.unilink ??
            data?.unilink ??
            data?.data?.link?.link ??
            data?.data?.link?.unilink ??
            data?.data?.link?.url ??
            data?.link?.link ??
            data?.link?.unilink ??
            data?.link?.url ??
            data?.url ??
            null;

          // If we got a successful response but no unilink, try to construct it
          if (!unilink && data?.data?.link) {
            const linkId = data?.data?.link?.id || data?.data?.link?._id || data?.data?.linkId;
            if (linkId) {
              const domain = data?.data?.link?.domain || data?.data?.domain || 'applink.reevo.in';
              return res.status(200).json({
                success: true,
                link: data?.data?.link || data?.link || data,
                unilink: `https://${domain}/d/${linkId}`,
                linkId: linkId,
                tracking: {
                  affiliateId,
                  campaign,
                  templateId,
                },
              });
            }
          }

          // Success with unilink
          if (unilink) {
            return res.status(200).json({
              success: true,
              link: data?.data?.link || data?.link || data,
              unilink: unilink,
              linkId: data?.data?.link?.id || data?.data?.linkId || data?.link?.id,
              tracking: {
                affiliateId,
                campaign,
                templateId,
              },
            });
          }
        }

        // If not successful, log and try next endpoint
        lastError = data?.message || data?.error || data?.raw || `HTTP ${response.status}: ${response.statusText}`;
        console.log(`[AppTrove] Endpoint failed: ${endpoint.url} - ${lastError}`);
      } catch (error: any) {
        lastError = error.message || 'Network error';
        console.error(`[AppTrove] Endpoint error: ${endpoint.url}`, error);
        continue; // Try next endpoint
      }
    }

    // All endpoints failed - return error but don't crash
    const errorMsg = typeof lastError === 'string' ? lastError : JSON.stringify(lastError || 'All AppTrove API endpoints failed');
    console.error('[AppTrove] All endpoints failed:', errorMsg);
    console.error('[AppTrove] Last response:', JSON.stringify(lastResponse, null, 2));
    console.error('[AppTrove] Attempted endpoints:', endpoints.length);
    
    return res.status(200).json({
      success: false,
      error: `Failed to create link in template ${templateId}`,
      details: errorMsg,
      lastResponse: lastResponse,
      attemptedEndpoints: endpoints.length,
      debug: process.env.NODE_ENV === 'development' ? {
        payload,
        endpoints: endpoints.map(e => ({ url: e.url, auth: e.auth })),
      } : undefined,
    });
  } catch (error: any) {
    console.error('[AppTrove] Serverless function error:', error);
    // Return error response instead of crashing
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
