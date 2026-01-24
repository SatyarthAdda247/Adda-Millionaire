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
    // NOTE: Vercel serverless functions CANNOT access VITE_ prefixed variables
    // Old backend used Secret ID/Key with Basic Auth as PRIMARY method
    // Priority: Non-VITE env vars > VITE_ vars (for local dev) > Hardcoded fallbacks
    const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || process.env.VITE_APPTROVE_API_KEY || '82aa3b94-bb98-449d-a372-4a8a98e319f0';
    const APPTROVE_SDK_KEY = process.env.APPTROVE_SDK_KEY || process.env.VITE_APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_REPORTING_API_KEY = process.env.APPTROVE_REPORTING_API_KEY || process.env.VITE_APPTROVE_REPORTING_API_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
    const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || process.env.VITE_APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
    const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || process.env.VITE_APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
    const APPTROVE_DOMAIN = process.env.APPTROVE_DOMAIN || process.env.VITE_APPTROVE_DOMAIN || 'applink.reevo.in';
    const APPTROVE_ANDROID_APP_ID = process.env.APPTROVE_ANDROID_APP_ID || process.env.VITE_APPTROVE_ANDROID_APP_ID || 'com.addaeducation.reevo';
    const APPTROVE_API_URL = (process.env.APPTROVE_API_URL || process.env.VITE_APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');
    
    // Log which variables are being used (for debugging)
    console.log(`[AppTrove Create Link] Environment check:`);
    console.log(`  - APPTROVE_SECRET_ID: ${APPTROVE_SECRET_ID ? `SET (${APPTROVE_SECRET_ID.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - APPTROVE_SECRET_KEY: ${APPTROVE_SECRET_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`  - APPTROVE_API_KEY: ${APPTROVE_API_KEY ? `SET (${APPTROVE_API_KEY.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`  - API URL: ${APPTROVE_API_URL}`);

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
    // CRITICAL: Verify template exists before trying to create links
    let templateIdVariants = [templateId];
    let template: any = null;
    let templateFetchFailed = false;
    let availableTemplateIds: string[] = [];
    let templateVerificationResult: any = null;
    
    try {
      // Add timeout for template fetch (5 seconds)
      const templateController = new AbortController();
      const templateTimeoutId = setTimeout(() => templateController.abort(), 5000);
      
      let templateResponse: Response;
      try {
        console.log(`[AppTrove] Fetching templates to verify template ID "${templateId}" exists...`);
        
        // Try multiple auth methods for template fetch (matching templates.ts)
        // Priority: Reporting API Key (works!) > S2S API Key > Basic Auth > SDK Key
        const templateAuthHeaders = APPTROVE_REPORTING_API_KEY ? {
          'api-key': APPTROVE_REPORTING_API_KEY,
          'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
          'Accept': 'application/json'
        } : APPTROVE_API_KEY ? {
          'api-key': APPTROVE_API_KEY,
          'Accept': 'application/json'
        } : APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY ? {
          'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
          'Accept': 'application/json'
        } : APPTROVE_SDK_KEY ? {
          'api-key': APPTROVE_SDK_KEY,
          'Accept': 'application/json'
        } : {};
        
        templateResponse = await fetch(
          `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`,
          {
            headers: templateAuthHeaders,
            signal: templateController.signal,
          }
        );
        clearTimeout(templateTimeoutId);
      } catch (templateError: any) {
        clearTimeout(templateTimeoutId);
        templateFetchFailed = true;
        if (templateError.name === 'AbortError') {
          console.warn('[AppTrove] ⚠️ Template fetch timeout - will try with provided templateId only');
        } else {
          console.warn('[AppTrove] ⚠️ Template fetch error - will try with provided templateId only:', templateError.message);
        }
      }
      
      if (!templateFetchFailed && templateResponse) {
        const responseStatus = templateResponse.status;
        const responseText = await templateResponse.text().catch(() => '');
        
        if (templateResponse.ok) {
          let templateData: any = null;
          try {
            templateData = JSON.parse(responseText);
          } catch {
            templateData = null;
          }
          const templates = templateData?.data?.linkTemplateList || templateData?.linkTemplateList || [];
          
          console.log(`[AppTrove] Found ${templates.length} templates`);
          console.log(`[AppTrove] Template IDs available:`, templates.map((t: any) => t._id || t.id || t.oid).filter(Boolean).join(', '));
          
          template = templates.find((t: any) => 
            t._id === templateId || t.id === templateId || t.oid === templateId
          );
          
          // Store available template IDs for error reporting
          availableTemplateIds = templates.map((t: any) => t._id || t.id || t.oid).filter(Boolean);
          
          if (template) {
            // Add template ID variants - prioritize oid (found in testing: shNYmkCqk9)
            if (template.oid && template.oid !== templateId) {
              templateIdVariants.unshift(template.oid); // Add oid first (most likely to work)
            }
            if (template._id && template._id !== templateId) {
              templateIdVariants.push(template._id);
            }
            if (template.id && template.id !== templateId) {
              templateIdVariants.push(template.id);
            }
            
            console.log(`[AppTrove] ✅ Template "${templateId}" found!`);
            console.log(`[AppTrove] Template name: ${template.name}`);
            console.log(`[AppTrove] Template ID variants: ${templateIdVariants.join(', ')}`);
            
            templateVerificationResult = {
              found: true,
              templateId: templateId,
              templateName: template.name,
              templateIdVariants: templateIdVariants,
              domain: template.domain,
              androidAppID: template.androidAppID || template.androidAppId || template.packageName || template.androidPackage,
              hasPlayStoreConfig: !!(template.notInstalled?.androidRdtCUrl || template.androidRdtCUrl),
            };
            
            // Log template data for debugging - including Play Store configuration
            console.log('[AppTrove] Template details:', templateVerificationResult);
            
            // Warn if Play Store configuration is missing
            if (!template.notInstalled?.androidRdtCUrl && !template.androidRdtCUrl) {
              console.warn('⚠️ WARNING: Template does not have Play Store URL configured!');
              console.warn('⚠️ Links created from this template may not redirect to Play Store.');
              console.warn('⚠️ Please configure Play Store URL in AppTrove dashboard for template:', templateId);
            }
          } else {
            console.error(`[AppTrove] ❌ Template "${templateId}" NOT FOUND in available templates!`);
            const availableTemplates = templates.map((t: any) => ({
              _id: t._id,
              id: t.id,
              oid: t.oid,
              name: t.name
            }));
            console.error(`[AppTrove] Available templates:`, availableTemplates);
            console.error(`[AppTrove] This is likely why all endpoints return 404 - template doesn't exist!`);
            
            templateVerificationResult = {
              found: false,
              requestedTemplateId: templateId,
              availableTemplateIds: availableTemplateIds,
              availableTemplates: availableTemplates,
            };
          }
        } else {
          // Template fetch failed - log error but continue
          console.warn(`[AppTrove] ⚠️ Template fetch failed with status ${responseStatus}`);
          console.warn(`[AppTrove] Response:`, responseText.substring(0, 500));
          console.warn(`[AppTrove] Will try to create link anyway with templateId "${templateId}"`);
          
          templateVerificationResult = {
            fetchFailed: true,
            status: responseStatus,
            error: responseText.substring(0, 200),
            requestedTemplateId: templateId,
            note: 'Template verification failed - proceeding with provided templateId',
          };
        }
      }
    } catch (e: any) {
      console.warn('[AppTrove] ⚠️ Could not fetch template variants:', e.message);
      console.warn('[AppTrove] Will try with provided templateId only');
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

    // Method 4: Reporting API Key (works for templates, try for link creation)
    for (const id of templateIdVariants) {
      if (APPTROVE_REPORTING_API_KEY) {
        endpoints.push({
          url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(id)}/link`,
          auth: 'reporting-api-key',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'api-key': APPTROVE_REPORTING_API_KEY,
            'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
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
        
        // Add timeout to prevent hanging requests (10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        let response: Response;
        try {
          response = await fetch(endpoint.url, {
            method: 'POST',
            headers: endpoint.headers,
            body: JSON.stringify(endpoint.payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(`Request timeout after 10 seconds - ${endpoint.url}`);
          } else if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
            throw new Error(`Connection refused - AppTrove API may be down or unreachable`);
          } else if (fetchError.code === 'ETIMEDOUT' || fetchError.message?.includes('timeout')) {
            throw new Error(`Connection timeout - AppTrove API took too long to respond`);
          } else if (fetchError.message?.includes('fetch failed')) {
            throw new Error(`Network error - Unable to reach AppTrove API: ${fetchError.message}`);
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
            const domain = data?.domain || data?.data?.domain || template?.domain || APPTROVE_DOMAIN;
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
        const errorMsg = error.message || 'Network error';
        lastError = errorMsg;
        
        // Log specific connection errors
        if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
          console.error(`[AppTrove] ⏱️ Timeout error: ${endpoint.url} (${endpoint.auth})`);
          console.error(`[AppTrove] AppTrove API took too long to respond (>10s)`);
        } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Connection refused')) {
          console.error(`[AppTrove] 🔌 Connection refused: ${endpoint.url} (${endpoint.auth})`);
          console.error(`[AppTrove] AppTrove API may be down or unreachable`);
        } else if (errorMsg.includes('Network error') || errorMsg.includes('fetch failed')) {
          console.error(`[AppTrove] 🌐 Network error: ${endpoint.url} (${endpoint.auth})`);
          console.error(`[AppTrove] Unable to reach AppTrove API: ${errorMsg}`);
        } else {
          console.error(`[AppTrove] ❌ Endpoint error: ${endpoint.url} (${endpoint.auth})`, error);
        }
        continue;
      }
    }

    // All endpoints failed - this is CRITICAL
    // URL construction fallback creates links that aren't registered in AppTrove dashboard
    // We MUST return an error so admin knows to create link manually
    console.error('[AppTrove] ❌ CRITICAL: All API endpoints failed!');
    console.error('[AppTrove] Attempted endpoints:', endpoints.length);
    console.error('[AppTrove] Template ID:', templateId);
    console.error('[AppTrove] Template ID variants tried:', templateIdVariants.join(', '));
    console.error('[AppTrove] Last error:', lastError);
    console.error('[AppTrove] Last response status:', lastResponse?.status);
    console.error('[AppTrove] Last response data:', JSON.stringify(lastResponse?.data, null, 2).substring(0, 1000));
    console.error('[AppTrove] Endpoints tried:');
    endpoints.forEach((ep, idx) => {
      console.error(`  ${idx + 1}. ${ep.url} (${ep.auth})`);
    });
    
    // Provide helpful error message based on last response
    let helpfulError = `All ${endpoints.length} API endpoints failed. Last error: ${lastError || 'Unknown'}`;
    if (lastResponse?.status === 404) {
      helpfulError += '\n\nPossible causes:\n';
      helpfulError += '1. Template ID "wBehUW" may be incorrect - verify in AppTrove dashboard\n';
      helpfulError += '2. API endpoint URL may be wrong - check APPTROVE_API_URL\n';
      helpfulError += '3. Template may not exist or may be inactive\n';
      helpfulError += '4. API endpoint structure may have changed\n';
    } else if (lastResponse?.status === 401) {
      helpfulError += '\n\nAuthentication failed - check:\n';
      helpfulError += '1. APPTROVE_SECRET_ID and APPTROVE_SECRET_KEY are set correctly\n';
      helpfulError += '2. Credentials have permission to create links\n';
    }
    
    return res.status(200).json({
      success: false,
      error: 'Failed to create link via AppTrove API - link will NOT be visible in dashboard',
      details: helpfulError,
      lastResponse: lastResponse,
      attemptedEndpoints: endpoints.length,
      templateId: templateId,
      templateIdVariants: templateIdVariants,
      endpointsTried: endpoints.map(ep => ({ url: ep.url, auth: ep.auth })),
      templateVerification: templateVerificationResult,
      availableTemplateIds: availableTemplateIds,
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
