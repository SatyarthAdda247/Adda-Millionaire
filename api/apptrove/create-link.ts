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
    // Priority: Environment variables > Hardcoded fallbacks
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_REPORTING_API_KEY = process.env.VITE_APPTROVE_REPORTING_API_KEY || process.env.APPTROVE_REPORTING_API_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    // Build payload matching old backend format exactly
    // Match working link format: pid=Affiliate (simple string, not UUID)
    const linkName = linkData?.name || `${affiliateData?.name || 'Affiliate'} - Affiliate Link` || 'Affiliate Link';
    
    // Campaign format: Use affiliate name with underscores (matching working link: "Shobhit_Affiliate_Influencer")
    const affiliateName = affiliateData?.name || 'Affiliate';
    const campaignName = linkData?.campaign || `${affiliateName}_Affiliate_Influencer`.replace(/\s+/g, '_');
    
    // Build payload matching working link format exactly
    const basePayload = {
      name: linkName,
      campaign: campaignName,
      deepLinking: linkData?.deepLink || campaignName || '',
      status: linkData?.status || 'active',
      // pid should be "Affiliate" (simple string) - AppTrove will handle this automatically
      // Don't pass pid in payload - let AppTrove set it based on template configuration
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
          
          // Log template data for debugging - including Play Store configuration
          console.log('[AppTrove] Template found:', {
            name: template.name,
            domain: template.domain,
            androidAppID: template.androidAppID || template.androidAppId || template.packageName || template.androidPackage,
            iosAppID: template.iosAppID || template.iosAppId || template.bundleId || template.iosBundle,
            hasPlayStoreConfig: !!(template.notInstalled?.androidRdtCUrl || template.androidRdtCUrl),
            playStoreUrl: template.notInstalled?.androidRdtCUrl || template.androidRdtCUrl || 'Not configured',
            deepLinkingEnabled: !!(template.installed?.androidRdt || template.androidRdt),
          });
          
          // Warn if Play Store configuration is missing
          if (!template.notInstalled?.androidRdtCUrl && !template.androidRdtCUrl) {
            console.warn('⚠️ WARNING: Template does not have Play Store URL configured!');
            console.warn('⚠️ Links created from this template may not redirect to Play Store.');
            console.warn('⚠️ Please configure Play Store URL in AppTrove dashboard for template:', templateId);
          }
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
    // CRITICAL: We MUST succeed with API call to register link in AppTrove dashboard
    // URL construction fallback creates links that aren't visible in dashboard
    for (const endpoint of endpoints) {
      try {
        console.log(`[AppTrove] Trying ${endpoint.url} with ${endpoint.auth} auth`);
        console.log(`[AppTrove] Payload:`, JSON.stringify(endpoint.payload, null, 2));
        
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

        console.log(`[AppTrove] Response status: ${response.status}`);
        console.log(`[AppTrove] Response data:`, JSON.stringify(data, null, 2).substring(0, 500));

        // Check for success (200-299) - matching old backend
        if (response.status >= 200 && response.status < 300) {
          console.log(`✅ Success with ${endpoint.url} using ${endpoint.auth} auth!`);
          
          // Extract unilink matching old backend pattern - try all possible fields
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
            data?.linkData?.shortUrl ||
            data?.linkData?.longUrl ||
            data?.linkData?.link ||
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
            data?.linkData?._id ||
            data?.linkData?.id ||
            data?.linkData?.linkId ||
            null;

          // If we have a URL, return success (link is registered in AppTrove)
          if (unilinkUrl) {
            console.log(`✅ Link created and registered in AppTrove! URL: ${unilinkUrl}, ID: ${linkId}`);
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
              createdVia: 'api-registered',
            });
          }

          // If we got success but no URL, try to construct it from linkId
          if (linkId) {
            const domain = data?.domain || data?.data?.domain || template?.domain || process.env.APPTROVE_DOMAIN || 'applink.reevo.in';
            const constructedUrl = `https://${domain}/d/${linkId}`;
            console.log(`✅ Link created with ID ${linkId}, constructed URL: ${constructedUrl}`);
            return res.status(200).json({
              success: true,
              link: data,
              unilink: constructedUrl,
              linkId: linkId,
              tracking: {
                affiliateId: affiliateData?.id || linkData?.userId,
                campaign,
                templateId,
              },
              createdVia: 'api-registered',
            });
          }

          // Success response but no URL or ID - log full response for debugging
          console.warn(`⚠️ Success response but no URL/ID found. Full response:`, JSON.stringify(data, null, 2));
        }

        // If not successful, log and try next endpoint
        const errorMsg = data?.message || data?.error || data?.codeMsg || data?.raw || `HTTP ${response.status}: ${response.statusText}`;
        lastError = errorMsg;
        console.log(`[AppTrove] ❌ ${response.status} - ${endpoint.url} (${endpoint.auth}): ${errorMsg}`);
        
        // Log full response for debugging
        if (response.status >= 400) {
          console.log(`[AppTrove] Error Details - Status: ${response.status}, URL: ${endpoint.url}, Auth: ${endpoint.auth}`);
          console.log(`[AppTrove] Response:`, JSON.stringify(data, null, 2).substring(0, 1000));
        }
      } catch (error: any) {
        lastError = error.message || 'Network error';
        console.error(`[AppTrove] Endpoint error: ${endpoint.url} (${endpoint.auth})`, error);
        continue;
      }
    }

    // All endpoints failed - this is CRITICAL
    // URL construction fallback creates links that aren't registered in AppTrove dashboard
    // We MUST return an error so admin knows to create link manually
    console.error('[AppTrove] ❌ CRITICAL: All API endpoints failed!');
    console.error('[AppTrove] Attempted endpoints:', endpoints.length);
    console.error('[AppTrove] Last error:', lastError);
    console.error('[AppTrove] Last response:', JSON.stringify(lastResponse, null, 2));
    
    return res.status(200).json({
      success: false,
      error: 'Failed to create link via AppTrove API - link will NOT be visible in dashboard',
      details: `All ${endpoints.length} API endpoints failed. Last error: ${lastError || 'Unknown'}`,
      lastResponse: lastResponse,
      attemptedEndpoints: endpoints.length,
      note: '⚠️ CRITICAL: Link was NOT created in AppTrove. Please create it manually in AppTrove dashboard to ensure it appears and tracking works correctly.',
      requiresManualCreation: true,
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
