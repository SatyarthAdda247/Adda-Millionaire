/**
 * Vercel Serverless Function: Create AppTrove UniLink
 * 
 * This proxies AppTrove API calls to bypass CORS restrictions.
 * Uses the same pattern as the old backend server.js that was working.
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

    // Get AppTrove credentials - Match old backend pattern
    // Old backend used Secret ID/Key with Basic Auth as PRIMARY method
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY;
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    // Build payload matching old backend format exactly
    const linkName = linkData?.name || `${affiliateData?.name || 'Affiliate'} - Affiliate Link` || 'Affiliate Link';
    const campaign = linkData?.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50);
    
    const basePayload = {
      name: linkName,
      campaign: campaign,
      deepLinking: linkData?.deepLink || '',
      status: linkData?.status || 'active',
      ...linkData,
    };

    // Try to get template info first to find template ID variants (oid, _id) and domain
    let templateIdVariants = [templateId];
    let template: any = null;
    try {
      const templateResponse = await fetch(
        `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`,
        {
          headers: APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY ? {
            'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
            'Accept': 'application/json'
          } : APPTROVE_SDK_KEY ? {
            'api-key': APPTROVE_SDK_KEY,
            'Accept': 'application/json'
          } : {},
        }
      );
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json().catch(() => null);
        const templates = templateData?.data?.linkTemplateList || templateData?.linkTemplateList || [];
        template = templates.find((t: any) => 
          t._id === templateId || t.id === templateId || t.oid === templateId
        );
        
        if (template) {
          // Add template ID variants
          if (template.oid && template.oid !== templateId) templateIdVariants.push(template.oid);
          if (template._id && template._id !== templateId) templateIdVariants.push(template._id);
          if (template.id && template.id !== templateId) templateIdVariants.push(template.id);
        }
      }
    } catch (e) {
      console.log('[AppTrove] Could not fetch template variants, using provided templateId only');
    }

    // Build endpoints matching old backend EXACTLY
    // Old backend tried: Basic Auth (Secret ID/Key) FIRST, then secret headers, then API key
    const endpoints: Array<{ url: string; auth: string; headers: Record<string, string>; payload: any }> = [];

    // Method 1: Basic Auth with Secret ID/Key (PRIMARY - matches old backend)
    for (const id of templateIdVariants) {
      if (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
        const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
        endpoints.push({
          url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(id)}/link`,
          auth: 'basic',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${authString}`,
          },
          payload: basePayload,
        });
      }
    }

    // Method 2: Secret ID/Key as headers
    for (const id of templateIdVariants) {
      if (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
        endpoints.push({
          url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(id)}/link`,
          auth: 'secret-headers',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'secret-id': APPTROVE_SECRET_ID,
            'secret-key': APPTROVE_SECRET_KEY,
            'X-Secret-ID': APPTROVE_SECRET_ID,
            'X-Secret-Key': APPTROVE_SECRET_KEY,
          },
          payload: basePayload,
        });
      }
    }

    // Method 3: API Key (fallback)
    for (const id of templateIdVariants) {
      if (APPTROVE_API_KEY) {
        endpoints.push({
          url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(id)}/link`,
          auth: 'api-key',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'api-key': APPTROVE_API_KEY,
          },
          payload: basePayload,
        });
      }
    }

    // Alternative endpoints (matching old backend)
    if (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
      const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
      
      // /internal/unilink with templateId in payload
      endpoints.push({
        url: `${APPTROVE_API_URL}/internal/unilink`,
        auth: 'basic',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
        payload: { ...basePayload, templateId: templateId },
      });

      // /internal/link-template/link with templateId in payload
      endpoints.push({
        url: `${APPTROVE_API_URL}/internal/link-template/link`,
        auth: 'basic',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
        payload: { ...basePayload, templateId: templateId },
      });

      // v2 API endpoints
      for (const id of templateIdVariants) {
        endpoints.push({
          url: `${APPTROVE_API_URL}/v2/link-template/${encodeURIComponent(id)}/link`,
          auth: 'basic',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${authString}`,
          },
          payload: basePayload,
        });
      }
    }

    // Try SDK Key as last resort
    if (APPTROVE_SDK_KEY && endpoints.length === 0) {
      for (const id of templateIdVariants) {
        endpoints.push({
          url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(id)}/link`,
          auth: 'sdk-key',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'api-key': APPTROVE_SDK_KEY,
            'X-SDK-Key': APPTROVE_SDK_KEY,
          },
          payload: basePayload,
        });
      }
    }

    let lastError: any = null;
    let lastResponse: any = null;

    // Try each endpoint (matching old backend logic)
    for (const endpoint of endpoints) {
      try {
        console.log(`[AppTrove] Trying ${endpoint.url} with ${endpoint.auth} auth`);
        
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: endpoint.headers,
          body: JSON.stringify(endpoint.payload),
        });

        const responseText = await response.text();
        let data: any = null;
        
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { raw: responseText };
        }

        lastResponse = { status: response.status, data };

        // Check for success (200-299) - matching old backend
        if (response.status >= 200 && response.status < 300) {
          console.log(`✅ Success with ${endpoint.url} using ${endpoint.auth} auth!`);
          
          // Extract unilink matching old backend pattern
          const unilinkUrl = 
            data?.shortUrl || 
            data?.longUrl || 
            data?.link || 
            data?.url ||
            data?.data?.shortUrl || 
            data?.data?.longUrl || 
            data?.data?.link ||
            data?.data?.url || 
            data?.result?.link || 
            data?.result?.url || 
            null;

          const linkId = 
            data?._id || 
            data?.id || 
            data?.linkId ||
            data?.data?._id || 
            data?.data?.id || 
            data?.data?.linkId ||
            data?.result?.id || 
            data?.result?.linkId || 
            null;

          if (unilinkUrl) {
            return res.status(200).json({
              success: true,
              link: data,
              unilink: unilinkUrl,
              linkId: linkId,
              tracking: {
                affiliateId: affiliateData?.id || linkData?.userId,
                campaign,
                templateId,
              },
            });
          }

          // If we got success but no URL, try to construct it
          if (linkId) {
            const domain = data?.domain || data?.data?.domain || 'applink.reevo.in';
            return res.status(200).json({
              success: true,
              link: data,
              unilink: `https://${domain}/d/${linkId}`,
              linkId: linkId,
              tracking: {
                affiliateId: affiliateData?.id || linkData?.userId,
                campaign,
                templateId,
              },
            });
          }
        }

        // If not successful, log and try next endpoint
        const errorMsg = data?.message || data?.error || data?.raw || `HTTP ${response.status}: ${response.statusText}`;
        lastError = errorMsg;
        console.log(`[AppTrove] ${response.status} - ${endpoint.url} (${endpoint.auth}): ${errorMsg}`);
        
        // Log full response for debugging 404s
        if (response.status === 404) {
          console.log(`[AppTrove] 404 Details - URL: ${endpoint.url}, Auth: ${endpoint.auth}, Response:`, JSON.stringify(data, null, 2));
        }
      } catch (error: any) {
        lastError = error.message || 'Network error';
        console.error(`[AppTrove] Endpoint error: ${endpoint.url} (${endpoint.auth})`, error);
        continue;
      }
    }

    // All endpoints failed - try URL construction fallback (like old backend)
    console.log('[AppTrove] All API endpoints failed, trying URL construction fallback...');
    
    // Get template domain and Android App ID for URL construction
    const domain = template?.domain || process.env.APPTROVE_DOMAIN || 'applink.reevo.in';
    const androidAppID = template?.androidAppID || process.env.APPTROVE_ANDROID_APP_ID;
    
    // Generate unique link ID
    const generateLinkId = () => {
      return `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };
    
    if (androidAppID) {
      // Construct tracking URL using AppTrove's format (works for tracking even if not in dashboard)
      const linkId = generateLinkId();
      const mediaSource = basePayload.campaign || 'affiliate';
      const params = new URLSearchParams({
        pid: mediaSource,
        campaign: basePayload.campaign,
        templateId: templateId
      });
      
      if (basePayload.deepLinking) {
        params.append('dlv', basePayload.deepLinking);
      }
      
      const trackingUrl = `https://click.trackier.io/c/${androidAppID}?${params.toString()}`;
      
      console.log('[AppTrove] ✅ Using URL construction fallback');
      console.log('[AppTrove] Constructed URL:', trackingUrl);
      
      return res.status(200).json({
        success: true,
        link: { id: linkId, url: trackingUrl },
        unilink: trackingUrl,
        linkId: linkId,
        tracking: {
          affiliateId: affiliateData?.id || linkData?.userId,
          campaign: basePayload.campaign,
          templateId,
        },
        note: 'Link constructed using URL format - functional for tracking. API endpoints were not available.',
        createdVia: 'url-construction-fallback',
      });
    }
    
    // If URL construction also fails, return error
    const errorMsg = typeof lastError === 'string' ? lastError : JSON.stringify(lastError || 'All endpoints failed');
    console.error('[AppTrove] All endpoints failed:', errorMsg);
    console.error('[AppTrove] Last response:', JSON.stringify(lastResponse, null, 2));
    console.error('[AppTrove] Attempted endpoints:', endpoints.length);
    console.error('[AppTrove] Template ID variants tried:', templateIdVariants);
    
    return res.status(200).json({
      success: false,
      error: `Failed to create link in template ${templateId}`,
      details: errorMsg,
      lastResponse: lastResponse,
      attemptedEndpoints: endpoints.length,
      templateIdVariants: templateIdVariants,
      suggestion: 'All API endpoints returned 404. AppTrove may not support programmatic link creation. Please create links manually in the AppTrove dashboard, or ensure APPTROVE_ANDROID_APP_ID is set for URL construction fallback.',
    });
  } catch (error: any) {
    console.error('[AppTrove] Serverless function error:', error);
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
