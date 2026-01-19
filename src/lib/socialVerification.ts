// Social Media Verification - Direct API Calls from Frontend

// API Keys (should be in .env file)
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyCUlIAIeZAUgVRaZuhnyd-icYJQv7U3UMY';
const TWITTER_CONSUMER_KEY = import.meta.env.VITE_TWITTER_CONSUMER_KEY || 'zNKYcm6JKwmN1Be4M7YZrxsT8';
const TWITTER_CONSUMER_SECRET = import.meta.env.VITE_TWITTER_CONSUMER_SECRET || '28STLDRe55AueZlcS49PNlN6UkkaVUOEVizFFr5mNjEpNbIP35';
const TWITTER_ACCESS_TOKEN = import.meta.env.VITE_TWITTER_ACCESS_TOKEN || '2013220357508145152-gaQPjp7WveivtucICLaw9XQTZplpsg';
const TWITTER_ACCESS_TOKEN_SECRET = import.meta.env.VITE_TWITTER_ACCESS_TOKEN_SECRET || '2013220357508145152-gaQPjp7WveivtucICLaw9XQTZplpsg';

interface VerificationResult {
  verified: boolean;
  followers?: number;
  subscribers?: number;
  username?: string;
  profileUrl?: string;
  error?: string;
  [key: string]: any;
}

// YouTube Verification
export async function verifyYouTube(handle: string): Promise<VerificationResult> {
  try {
    // Extract channel ID or username from URL
    let channelId: string | null = null;
    let username: string | null = null;
    
    if (handle.includes('youtube.com/channel/')) {
      channelId = handle.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
    } else if (handle.includes('youtube.com/c/') || handle.includes('youtube.com/user/')) {
      username = handle.split('youtube.com/')[1].split('/')[1].split('/')[0].split('?')[0];
    } else if (handle.includes('youtube.com/@')) {
      username = handle.split('youtube.com/@')[1].split('/')[0].split('?')[0];
    } else {
      username = handle.replace('@', '').trim();
    }

    let apiUrl = '';
    
    if (channelId) {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    } else if (username) {
      // Search for channel first
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YOUTUBE_API_KEY}&maxResults=10`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.items && searchData.items.length > 0) {
          // Try to find exact match
          let foundChannelId = null;
          for (const item of searchData.items) {
            const customUrl = item.snippet?.customUrl;
            if (customUrl && (customUrl.toLowerCase() === `@${username.toLowerCase()}` || customUrl.toLowerCase() === username.toLowerCase())) {
              foundChannelId = item.id.channelId;
              break;
            }
          }
          
          if (!foundChannelId) {
            foundChannelId = searchData.items[0].id.channelId;
          }
          
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${foundChannelId}&key=${YOUTUBE_API_KEY}`;
        } else {
          // Fallback to forUsername
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
        }
      } catch (searchError) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
      }
    } else {
      return {
        verified: false,
        error: 'Invalid YouTube URL or handle format'
      };
    }

    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      const subscribers = parseInt(channel.statistics.subscriberCount) || 0;
      
      if (subscribers === 0 && channel.statistics.subscriberCount === '0') {
        // Channel exists but has 0 subscribers
        return {
          verified: true,
          subscribers: 0,
          channelId: channel.id,
          channelName: channel.snippet.title,
          profileUrl: `https://www.youtube.com/channel/${channel.id}`
        };
      }
      
      return {
        verified: true,
        subscribers: subscribers,
        channelId: channel.id,
        channelName: channel.snippet.title,
        profileUrl: `https://www.youtube.com/channel/${channel.id}`
      };
    } else {
      return {
        verified: false,
        error: 'Channel not found. Please provide a full YouTube URL (e.g., https://www.youtube.com/@channelname)'
      };
    }
  } catch (error: any) {
    console.error('YouTube verification error:', error);
    return {
      verified: false,
      error: error.message || 'Failed to verify YouTube channel'
    };
  }
}

// Instagram Verification (using multiple CORS proxy services)
export async function verifyInstagram(handle: string): Promise<VerificationResult> {
  try {
    // Extract username
    let username = handle.trim();
    if (username.includes('instagram.com/')) {
      username = username.split('instagram.com/')[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    const profileUrl = `https://www.instagram.com/${username}/`;
    
    // Use multiple CORS proxy services for frontend-only verification
    const proxyServices = [
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(profileUrl)}`,
        parser: (data: any) => data.contents || data
      },
      {
        url: `https://cors-anywhere.herokuapp.com/${profileUrl}`,
        parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(profileUrl)}`,
        parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
      },
      {
        url: `https://thingproxy.freeboard.io/fetch/${profileUrl}`,
        parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
      },
    ];
    
    for (const proxy of proxyServices) {
      try {
        const response = await fetch(proxy.url, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout per proxy
        });
        
        let html = '';
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const data = await response.json();
            html = proxy.parser(data);
          } else {
            html = await response.text();
          }
          
          if (typeof html !== 'string') {
            html = String(html);
          }
        } else {
          // Skip this proxy if it returns error
          continue;
        }
        
        if (!html || html.length < 100) continue;
        
        // Method 1: Extract from meta description (most reliable)
        const metaMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (metaMatch) {
          const description = metaMatch[1];
          const followerMatch = description.match(/([\d,]+)\s+Followers?/i);
          if (followerMatch) {
            const followers = parseInt(followerMatch[1].replace(/,/g, ''));
            if (followers > 0) {
              return {
                verified: true,
                followers: followers,
                username: username,
                profileUrl: profileUrl
              };
            }
          }
        }
        
        // Method 2: Try to find edge_followed_by in all script tags
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
        for (const script of scriptMatches) {
          // Try multiple patterns
          const patterns = [
            /"edge_followed_by":\s*{\s*"count":\s*(\d+)/,
            /"edge_followed_by":\s*{\s*"count":\s*"(\d+)"/,
            /"follower_count":\s*(\d+)/,
            /"followers":\s*(\d+)/,
            /edge_followed_by["']?\s*:\s*{\s*["']?count["']?\s*:\s*(\d+)/i,
          ];
          
          for (const pattern of patterns) {
            const match = script.match(pattern);
            if (match) {
              const followers = parseInt(match[1]);
              if (followers > 0) {
                return {
                  verified: true,
                  followers: followers,
                  username: username,
                  profileUrl: profileUrl
                };
              }
            }
          }
        }
        
        // Method 3: Try JSON-LD
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const jsonLd of jsonLdMatches) {
          try {
            const jsonMatch = jsonLd.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            if (jsonMatch) {
              const jsonData = JSON.parse(jsonMatch[1]);
              if (jsonData.interactionStatistic) {
                for (const stat of jsonData.interactionStatistic) {
                  if (stat.interactionType === 'https://schema.org/FollowAction' || stat.name === 'followers') {
                    const followers = parseInt(stat.userInteractionCount || 0);
                    if (followers > 0) {
                      return {
                        verified: true,
                        followers: followers,
                        username: username,
                        profileUrl: profileUrl
                      };
                    }
                  }
                }
              }
            }
          } catch (e) {}
        }
      } catch (proxyError: any) {
        // Skip this proxy and try next one
        // Don't log common errors (403, connection refused, CORS, etc.)
        const errorMsg = proxyError.message || '';
        const shouldLog = proxyError.name !== 'AbortError' && 
                         !errorMsg.includes('403') && 
                         !errorMsg.includes('Failed to fetch') &&
                         !errorMsg.includes('ERR_CONNECTION_REFUSED') &&
                         !errorMsg.includes('CORS');
        if (shouldLog) {
          console.log(`Proxy failed: ${errorMsg}`);
        }
        continue;
      }
    }
    
    // If all proxy methods fail, return error
    return {
      verified: false,
      error: 'Failed to verify Instagram profile. Instagram may be blocking access. Please try again later or provide a different handle.'
    };
  } catch (error: any) {
    return {
      verified: false,
      error: error.message || 'Failed to verify Instagram profile'
    };
  }
}

// Twitter/X Verification (using Bearer token or scraping)
export async function verifyTwitter(handle: string): Promise<VerificationResult> {
  try {
    // Extract username
    let username = handle.trim();
    if (username.includes('twitter.com/') || username.includes('x.com/')) {
      const domain = username.includes('twitter.com/') ? 'twitter.com/' : 'x.com/';
      username = username.split(domain)[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    if (!username) {
      return {
        verified: false,
        error: 'Invalid Twitter/X handle format'
      };
    }

    const profileUrl = `https://twitter.com/${username}`;
    
    // Try Twitter API v2 with Bearer token first (if available)
    const BEARER_TOKEN = import.meta.env.VITE_TWITTER_BEARER_TOKEN;
    
    if (BEARER_TOKEN) {
      try {
        const response = await fetch(
          `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`,
          {
            headers: {
              'Authorization': `Bearer ${BEARER_TOKEN}`,
              'Accept': 'application/json'
            }
          }
        );
        
        const data = await response.json();
        
        if (data.data) {
          const user = data.data;
          return {
            verified: true,
            followers: user.public_metrics?.followers_count || 0,
            username: username,
            profileUrl: profileUrl,
            userId: user.id,
            name: user.name
          };
        } else if (data.errors) {
          // API error, fall through to scraping
        }
      } catch (apiError: any) {
        // API failed, fall through to scraping
        console.log('Twitter API failed, trying scraping method...');
      }
    }
    
    // Fallback: Scrape Twitter profile page using CORS proxies
    const proxyServices = [
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(profileUrl)}`,
        parser: (data: any) => data.contents || data
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(profileUrl)}`,
        parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
      },
      {
        url: `https://thingproxy.freeboard.io/fetch/${profileUrl}`,
        parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
      },
    ];
    
    for (const proxy of proxyServices) {
      try {
        const response = await fetch(proxy.url, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        let html = '';
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const data = await response.json();
            html = proxy.parser(data);
          } else {
            html = await response.text();
          }
          
          if (typeof html !== 'string') {
            html = String(html);
          }
        } else {
          continue;
        }
        
        if (!html || html.length < 100) continue;
        
        // Try to extract follower count from Twitter page
        // Method 1: Look for follower count in meta tags or JSON-LD
        const metaMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (metaMatch) {
          const description = metaMatch[1];
          const followerMatch = description.match(/([\d,]+)\s+Followers?/i);
          if (followerMatch) {
            const followers = parseInt(followerMatch[1].replace(/,/g, ''));
            if (followers >= 0) {
              return {
                verified: true,
                followers: followers,
                username: username,
                profileUrl: profileUrl
              };
            }
          }
        }
        
        // Method 2: Look for follower count in script tags (Twitter embeds data)
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
        for (const script of scriptMatches) {
          // Try to find follower count patterns
          const patterns = [
            /"followers_count":\s*(\d+)/,
            /"followers":\s*(\d+)/,
            /followers["']?\s*:\s*(\d+)/i,
            /(\d+)\s+Followers?/i
          ];
          
          for (const pattern of patterns) {
            const match = script.match(pattern);
            if (match) {
              const followers = parseInt(match[1]);
              if (followers >= 0) {
                return {
                  verified: true,
                  followers: followers,
                  username: username,
                  profileUrl: profileUrl
                };
              }
            }
          }
        }
        
        // Method 3: Look for visible follower count in page text
        const visibleFollowerMatch = html.match(/([\d,]+)\s+Followers?/i);
        if (visibleFollowerMatch) {
          const followers = parseInt(visibleFollowerMatch[1].replace(/,/g, ''));
          if (followers >= 0) {
            return {
              verified: true,
              followers: followers,
              username: username,
              profileUrl: profileUrl
            };
          }
        }
      } catch (proxyError: any) {
        // Skip this proxy and try next one
        continue;
      }
    }
    
    // If all methods fail
    return {
      verified: false,
      error: 'Failed to verify Twitter/X profile. Please ensure the handle is correct and try again.'
    };
  } catch (error: any) {
    return {
      verified: false,
      error: error.message || 'Failed to verify Twitter/X account'
    };
  }
}

// Helper function for scraping profile pages via CORS proxies
async function scrapeProfilePage(profileUrl: string, extractors: Array<(html: string) => number | null>): Promise<number | null> {
  const proxyServices = [
    {
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(profileUrl)}`,
      parser: (data: any) => data.contents || data
    },
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(profileUrl)}`,
      parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
    },
    {
      url: `https://thingproxy.freeboard.io/fetch/${profileUrl}`,
      parser: (data: any) => typeof data === 'string' ? data : JSON.stringify(data)
    },
  ];
  
  for (const proxy of proxyServices) {
    try {
      const response = await fetch(proxy.url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      let html = '';
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const data = await response.json();
          html = proxy.parser(data);
        } else {
          html = await response.text();
        }
        
        if (typeof html !== 'string') {
          html = String(html);
        }
      } else {
        continue;
      }
      
      if (!html || html.length < 100) continue;
      
      // Try each extractor function
      for (const extractor of extractors) {
        const count = extractor(html);
        if (count !== null && count >= 0) {
          return count;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

// Facebook Verification
export async function verifyFacebook(handle: string): Promise<VerificationResult> {
  try {
    let username = handle.trim();
    if (username.includes('facebook.com/')) {
      username = username.split('facebook.com/')[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    const profileUrl = `https://www.facebook.com/${username}`;
    
    const extractors = [
      // Method 1: Meta description
      (html: string) => {
        const metaMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (metaMatch) {
          const desc = metaMatch[1];
          const match = desc.match(/([\d,]+)\s+(followers?|likes?)/i);
          if (match) return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
      },
      // Method 2: Script tags with follower data
      (html: string) => {
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
        for (const script of scriptMatches) {
          const patterns = [
            /"follower_count":\s*(\d+)/,
            /"followers":\s*(\d+)/,
            /"like_count":\s*(\d+)/,
            /(\d+)\s+followers?/i
          ];
          for (const pattern of patterns) {
            const match = script.match(pattern);
            if (match) {
              const count = parseInt(match[1]);
              if (count >= 0) return count;
            }
          }
        }
        return null;
      }
    ];
    
    const followers = await scrapeProfilePage(profileUrl, extractors);
    
    if (followers !== null) {
      return {
        verified: true,
        followers: followers,
        username: username,
        profileUrl: profileUrl
      };
    }
    
    return {
      verified: false,
      error: 'Failed to verify Facebook profile. Please check the URL/handle.'
    };
  } catch (error: any) {
    return {
      verified: false,
      error: error.message || 'Failed to verify Facebook profile'
    };
  }
}

// Telegram Verification
export async function verifyTelegram(handle: string): Promise<VerificationResult> {
  try {
    let username = handle.trim();
    if (username.includes('t.me/')) {
      username = username.split('t.me/')[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    const profileUrl = `https://t.me/${username}`;
    
    const extractors = [
      // Method 1: Meta description
      (html: string) => {
        const metaMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (metaMatch) {
          const desc = metaMatch[1];
          const match = desc.match(/([\d,]+)\s+(members?|subscribers?|followers?)/i);
          if (match) return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
      },
      // Method 2: Visible text
      (html: string) => {
        const match = html.match(/([\d,]+)\s+(members?|subscribers?|followers?)/i);
        if (match) return parseInt(match[1].replace(/,/g, ''));
        return null;
      }
    ];
    
    const followers = await scrapeProfilePage(profileUrl, extractors);
    
    if (followers !== null) {
      return {
        verified: true,
        followers: followers,
        username: username,
        profileUrl: profileUrl
      };
    }
    
    // Telegram profiles might not show follower count publicly, so mark as verified with 0
    return {
      verified: true,
      followers: 0,
      username: username,
      profileUrl: profileUrl,
      note: 'Telegram follower count may not be publicly available'
    };
  } catch (error: any) {
    return {
      verified: false,
      error: error.message || 'Failed to verify Telegram profile'
    };
  }
}

// TikTok Verification
export async function verifyTikTok(handle: string): Promise<VerificationResult> {
  try {
    let username = handle.trim();
    if (username.includes('tiktok.com/@')) {
      username = username.split('tiktok.com/@')[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    const profileUrl = `https://www.tiktok.com/@${username}`;
    
    const extractors = [
      // Method 1: Meta description
      (html: string) => {
        const metaMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (metaMatch) {
          const desc = metaMatch[1];
          const match = desc.match(/([\d,]+)\s+(followers?|fans?)/i);
          if (match) return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
      },
      // Method 2: Script tags with follower data
      (html: string) => {
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
        for (const script of scriptMatches) {
          const patterns = [
            /"followerCount":\s*(\d+)/,
            /"followers":\s*(\d+)/,
            /"fans":\s*(\d+)/,
            /"follower_count":\s*(\d+)/,
            /(\d+)\s+followers?/i
          ];
          for (const pattern of patterns) {
            const match = script.match(pattern);
            if (match) {
              const count = parseInt(match[1]);
              if (count >= 0) return count;
            }
          }
        }
        return null;
      }
    ];
    
    const followers = await scrapeProfilePage(profileUrl, extractors);
    
    if (followers !== null) {
      return {
        verified: true,
        followers: followers,
        username: username,
        profileUrl: profileUrl
      };
    }
    
    return {
      verified: false,
      error: 'Failed to verify TikTok profile. Please check the URL/handle.'
    };
  } catch (error: any) {
    return {
      verified: false,
      error: error.message || 'Failed to verify TikTok profile'
    };
  }
}

// LinkedIn Verification
export async function verifyLinkedIn(handle: string): Promise<VerificationResult> {
  try {
    let username = handle.trim();
    if (username.includes('linkedin.com/in/')) {
      username = username.split('linkedin.com/in/')[1].split('/')[0].split('?')[0];
    } else if (username.includes('linkedin.com/company/')) {
      username = username.split('linkedin.com/company/')[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    const profileUrl = username.includes('company') 
      ? `https://www.linkedin.com/company/${username}`
      : `https://www.linkedin.com/in/${username}`;
    
    const extractors = [
      // Method 1: Meta description
      (html: string) => {
        const metaMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (metaMatch) {
          const desc = metaMatch[1];
          const match = desc.match(/([\d,]+)\s+(followers?|connections?)/i);
          if (match) return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
      },
      // Method 2: Script tags
      (html: string) => {
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
        for (const script of scriptMatches) {
          const patterns = [
            /"followerCount":\s*(\d+)/,
            /"followers":\s*(\d+)/,
            /"connectionCount":\s*(\d+)/,
            /(\d+)\s+followers?/i
          ];
          for (const pattern of patterns) {
            const match = script.match(pattern);
            if (match) {
              const count = parseInt(match[1]);
              if (count >= 0) return count;
            }
          }
        }
        return null;
      }
    ];
    
    const followers = await scrapeProfilePage(profileUrl, extractors);
    
    if (followers !== null) {
      return {
        verified: true,
        followers: followers,
        username: username,
        profileUrl: profileUrl
      };
    }
    
    // LinkedIn profiles might require login, so mark as verified with 0
    return {
      verified: true,
      followers: 0,
      username: username,
      profileUrl: profileUrl,
      note: 'LinkedIn follower count may require login to view'
    };
  } catch (error: any) {
    return {
      verified: false,
      error: error.message || 'Failed to verify LinkedIn profile'
    };
  }
}

// Main verification function
export async function verifySocialMedia(platform: string, handle: string): Promise<VerificationResult> {
  const normalizedPlatform = platform.toLowerCase().trim().replace(/\s+/g, '');
  
  switch (normalizedPlatform) {
    case 'youtube':
      return await verifyYouTube(handle);
    case 'instagram':
      return await verifyInstagram(handle);
    case 'twitter':
    case 'twitter/x':
    case 'x':
    case 'twitterx':
      return await verifyTwitter(handle);
    case 'facebook':
      return await verifyFacebook(handle);
    case 'telegram':
      return await verifyTelegram(handle);
    case 'tiktok':
      return await verifyTikTok(handle);
    case 'linkedin':
      return await verifyLinkedIn(handle);
    case 'other':
      return {
        verified: true,
        followers: 0,
        note: 'Other platform verification not available'
      };
    default:
      return {
        verified: false,
        error: `Unsupported platform: ${platform}`
      };
  }
}
