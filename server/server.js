import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'database.json');
const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY;
const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || '696dd5aa03258f6b929b7e97';
const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || 'f5a2d4a4-5389-429a-8aa9-cf0d09e9be86';
const APPTROVE_API_URL = process.env.APPTROVE_API_URL || 'https://api.apptrove.com';

// Social Media API Credentials
const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || 'zNKYcm6JKwmN1Be4M7YZrxsT8';
const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || '28STLDRe55AueZlcS49PNlN6UkkaVUOEVizFFr5mNjEpNbIP35';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '2013220357508145152-gaQPjp7WveivtucICLaw9XQTZplpsg';
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET || '2013220357508145152-gaQPjp7WveivtucICLaw9XQTZplpsg';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyCUlIAIeZAUgVRaZuhnyd-icYJQv7U3UMY';

// Admin configuration
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

// Security: Rate limiting store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window
const RATE_LIMIT_AUTH_MAX = 5; // Max auth attempts per window

// Security: Rate limiting middleware
function rateLimit(maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}-${req.path}`;
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return next();
    }
    
    const record = rateLimitStore.get(key);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + RATE_LIMIT_WINDOW;
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests', 
        message: 'Please try again later',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
}

// Security: Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

// Security: Input sanitization middleware
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS attempts
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
}

// Security: Secure headers middleware
function secureHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// Security: Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Apply secure headers to all routes
app.use(secureHeaders);

// Security: Apply input sanitization
app.use(sanitizeInput);

// CORS with security - Allow multiple origins for development and production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://adda-millionaire.vercel.app',
  'https://edurise.vercel.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

// Allow any Vercel preview deployments (must be defined before CORS middleware)
const vercelPreviewPattern = /^https:\/\/.*\.vercel\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow specific origins and Vercel deployments
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) !== -1 || vercelPreviewPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all localhost, 127.0.0.1, and Vercel preview origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.indexOf(origin) !== -1 || vercelPreviewPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 hours
}));

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    // Check if user is an admin
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email found in Google profile'));
    }
    
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
      return done(new Error('Access denied. Admin email not authorized.'));
    }
    
    return done(null, {
      id: profile.id,
      email: email,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
}

// Admin authentication middleware (temporarily disabled - will configure auth later)
function isAdmin(req, res, next) {
  // Temporarily allow all requests - auth will be configured later
  return next();
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  // Initialize database file if it doesn't exist
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData = {
      users: [],
      links: [],
      analytics: [] // Track clicks, conversions, earnings per affiliate
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Database helper functions
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], links: [] };
  }
}

async function writeDB(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Validation helpers
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Basic phone validation - accepts digits, spaces, dashes, parentheses, plus
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

// Security: Additional input validation
function validateInput(input, type) {
  if (typeof input !== 'string') return false;
  
  // Remove potential dangerous characters
  const dangerousChars = /[<>'"&]/g;
  if (dangerousChars.test(input)) return false;
  
  // Length limits
  if (input.length > 1000) return false;
  
  if (type === 'email') return validateEmail(input);
  if (type === 'phone') return validatePhone(input);
  if (type === 'name') {
    // Name should be alphanumeric with spaces, hyphens, and common unicode characters
    return /^[\p{L}\s\-'\.]+$/u.test(input) && input.length >= 2 && input.length <= 100;
  }
  
  return true;
}

// AppTrove API helper functions
async function getLinkTemplates() {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    const response = await axios.get(`${APPTROVE_API_URL}/internal/link-template`, {
      headers: {
        'api-key': APPTROVE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        status: 'active',
        limit: 100
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Handle different response structures
    if (response.data) {
      // Check if data is nested
      if (response.data.data && response.data.data.linkTemplateList) {
        return response.data.data;
      }
      if (response.data.linkTemplateList) {
        return response.data;
      }
      // Sometimes it's just the list directly
      if (Array.isArray(response.data)) {
        return { linkTemplateList: response.data };
      }
    }
    
    return { linkTemplateList: [] };
  } catch (error) {
    console.error('Error fetching link templates:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Return empty templates instead of throwing to allow user creation
    return { linkTemplateList: [] };
  }
}

// AppTrove API: Get App IDs from existing apps
async function getAppIds() {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    // Try to fetch apps list - this endpoint might vary
    // Common endpoints: /internal/app, /internal/apps, /api/apps
    const endpoints = [
      `${APPTROVE_API_URL}/internal/app`,
      `${APPTROVE_API_URL}/internal/apps`,
      `${APPTROVE_API_URL}/api/apps`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'api-key': APPTROVE_API_KEY,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        if (response.data) {
          return {
            success: true,
            apps: response.data.apps || response.data.data || response.data,
            message: 'Apps fetched successfully'
          };
        }
      } catch (err) {
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw err;
        }
        continue;
      }
    }

    return { success: false, apps: [], error: 'Could not fetch apps' };
  } catch (error) {
    console.error('Error fetching App IDs:', error.message);
    return {
      success: false,
      apps: [],
      error: error.message
    };
  }
}

// AppTrove API: Create UniLink Template for affiliate
// POST /internal/link-template
async function createUniLinkTemplate(userId, userName, templateConfig = {}) {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    // Get App IDs from environment or try to fetch from API
    let iosAppID = process.env.APPTROVE_IOS_APP_ID || '';
    let androidAppID = process.env.APPTROVE_ANDROID_APP_ID || '';

    // If App IDs not in env, try to get from API
    if (!iosAppID || !androidAppID) {
      console.log('App IDs not found in environment, attempting to fetch from AppTrove...');
      const appsResult = await getAppIds();
      if (appsResult.success && appsResult.apps.length > 0) {
        // Try to find Android app (most common)
        const androidApp = appsResult.apps.find(app => 
          app.platform === 'android' || 
          app.os === 'android' || 
          app.operatingSystem === 'Android'
        );
        if (androidApp && androidApp.appID) {
          androidAppID = androidApp.appID;
          console.log(`Found Android App ID: ${androidAppID}`);
        }

        // Try to find iOS app
        const iosApp = appsResult.apps.find(app => 
          app.platform === 'ios' || 
          app.os === 'ios' || 
          app.operatingSystem === 'iOS'
        );
        if (iosApp && iosApp.appID) {
          iosAppID = iosApp.appID;
          console.log(`Found iOS App ID: ${iosAppID}`);
        }
      }
    }

    // Default template configuration
    const defaultConfig = {
      status: 'active',
      name: `${userName} - Affiliate Template`,
      domain: process.env.APPTROVE_DOMAIN || 'track.u9ilnk.me', // Your AppTrove domain
      iosAppID: iosAppID || process.env.APPTROVE_IOS_APP_ID || '',
      androidAppID: androidAppID || process.env.APPTROVE_ANDROID_APP_ID || '',
      desktopBhv: {
        rdt: 'store',
        rdtCUrl: process.env.APPTROVE_DESKTOP_URL || ''
      },
      notInstalled: {
        iosRdt: 'store',
        androidRdt: 'store',
        iosRdtCUrl: process.env.APPTROVE_IOS_STORE_URL || '',
        androidRdtCUrl: process.env.APPTROVE_ANDROID_STORE_URL || ''
      },
      installed: {
        fallbackScheme: process.env.APPTROVE_FALLBACK_SCHEME || '',
        iosRdt: 'app_links',
        androidRdt: 'app_links',
        // androidSha256 is REQUIRED by AppTrove API - must be an array with at least one value
        androidSha256: process.env.APPTROVE_ANDROID_SHA256 
          ? [process.env.APPTROVE_ANDROID_SHA256] 
          : (process.env.APPTROVE_ANDROID_SHA256_PLACEHOLDER ? [process.env.APPTROVE_ANDROID_SHA256_PLACEHOLDER] : ['placeholder_sha256']),
        iosTeamID: process.env.APPTROVE_IOS_TEAM_ID || '',
        iosBundleId: process.env.APPTROVE_IOS_BUNDLE_ID || ''
      },
      ...templateConfig
    };

    // Validate required fields - but allow creation to proceed to see actual API error
    if (!defaultConfig.androidAppID && !defaultConfig.iosAppID) {
      console.warn('⚠️  Warning: No App IDs configured. Template creation may fail.');
      console.warn('   Please set APPTROVE_ANDROID_APP_ID and/or APPTROVE_IOS_APP_ID in .env');
      console.warn('   Or ensure your app is configured in AppTrove dashboard');
    }

    const response = await axios.post(
      `${APPTROVE_API_URL}/internal/link-template`,
      defaultConfig,
      {
        headers: {
          'api-key': APPTROVE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    const templateData = response.data;
    return {
      success: true,
      templateId: templateData.data?.id || templateData.id || templateData.templateId,
      template: templateData.data || templateData,
      message: templateData.message || 'Template created successfully'
    };
  } catch (error) {
    console.error('Error creating UniLink Template:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message,
      templateId: null
    };
  }
}

// Generate unique link ID for URL construction
function generateUniqueLinkId(linkName) {
  // Generate a short unique ID (similar to AppTrove's format)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const timestamp = Date.now().toString(36);
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const nameHash = linkName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(36);
  return (timestamp + nameHash + random).substring(0, 12);
}

// AppTrove API: Create UniLink from template
// Since AppTrove API endpoints for creating links return 404/405, we use multiple fallback methods:
// 1. Browser automation (if Puppeteer available)
// 2. Construct tracking URL using AppTrove's click URL format (works for tracking)
async function createUniLinkFromTemplate(templateId, linkName, customParams = {}) {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    if (!templateId) {
      throw new Error('Template ID is required');
    }

    // Get template details to find domain
    let template;
    try {
      const templateInfo = await axios.get(
        `${APPTROVE_API_URL}/internal/link-template`,
        {
          headers: { 'api-key': APPTROVE_API_KEY },
          params: { status: 'active', limit: 100 }
        }
      );
      template = templateInfo.data?.data?.linkTemplateList?.find(
        t => t._id === templateId || t.id === templateId || t.oid === templateId
      );
    } catch (err) {
      console.error('Error fetching template info:', err.message);
    }

    // If template not found via list, try direct fetch
    if (!template) {
      try {
        const directTemplate = await axios.get(
          `${APPTROVE_API_URL}/internal/link/${templateId}`,
          {
            headers: { 'api-key': APPTROVE_API_KEY }
          }
        );
        template = directTemplate.data?.data?.linkTemplate;
      } catch (err) {
        console.error('Error fetching template directly:', err.message);
      }
    }

    // AppTrove API endpoints for creating links using Secret ID and Secret Key
    // Prepare template ID variants
    const templateIdVariants = [templateId];
    if (template?.oid && template.oid !== templateId) {
      templateIdVariants.push(template.oid);
    }
    if (template?._id && template._id !== templateId) {
      templateIdVariants.push(template._id);
    }
    // Try multiple authentication methods and endpoints
    const endpoints = [
      // Method 1: Using Secret ID and Secret Key with Basic Auth
      ...templateIdVariants.map(id => ({
        url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
        method: 'POST',
        payload: { 
          name: linkName,
          campaign: customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: customParams.deepLink || '',
          status: 'active',
          ...customParams 
        },
        auth: 'basic' // Use Basic Auth with secret ID and key
      })),
      // Method 2: Using Secret ID and Secret Key as headers
      ...templateIdVariants.map(id => ({
        url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
        method: 'POST',
        payload: { 
          name: linkName,
          campaign: customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: customParams.deepLink || '',
          status: 'active',
          ...customParams 
        },
        auth: 'secret-headers' // Use secret ID and key as headers
      })),
      // Method 3: Using API Key (fallback)
      ...templateIdVariants.map(id => ({
        url: `${APPTROVE_API_URL}/internal/link-template/${id}/link`,
        method: 'POST',
        payload: { 
          name: linkName,
          campaign: customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: customParams.deepLink || '',
          status: 'active',
          ...customParams 
        },
        auth: 'api-key' // Use API key header
      })),
      // Alternative endpoints
      {
        url: `${APPTROVE_API_URL}/internal/unilink`,
        method: 'POST',
        payload: { 
          templateId: templateId, 
          name: linkName,
          campaign: customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: customParams.deepLink || '',
          status: 'active',
          ...customParams 
        },
        auth: 'basic'
      },
      {
        url: `${APPTROVE_API_URL}/internal/link-template/link`,
        method: 'POST',
        payload: { 
          templateId: templateId, 
          name: linkName,
          campaign: customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: customParams.deepLink || '',
          status: 'active',
          ...customParams 
        },
        auth: 'basic'
      },
      // Try v2 API endpoints
      ...templateIdVariants.map(id => ({
        url: `${APPTROVE_API_URL}/v2/link-template/${id}/link`,
        method: 'POST',
        payload: { 
          name: linkName,
          campaign: customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: customParams.deepLink || '',
          status: 'active',
          ...customParams 
        },
        auth: 'basic'
      }))
    ];

    for (const endpoint of endpoints) {
      try {
        // Build headers based on authentication method
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        // Add authentication based on method
        if (endpoint.auth === 'basic') {
          // Basic Auth: secret ID as username, secret key as password
          const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
          headers['Authorization'] = `Basic ${authString}`;
        } else if (endpoint.auth === 'secret-headers') {
          // Secret ID and Key as separate headers
          headers['secret-id'] = APPTROVE_SECRET_ID;
          headers['secret-key'] = APPTROVE_SECRET_KEY;
          headers['X-Secret-ID'] = APPTROVE_SECRET_ID;
          headers['X-Secret-Key'] = APPTROVE_SECRET_KEY;
        } else if (endpoint.auth === 'api-key' && APPTROVE_API_KEY) {
          // API Key header (fallback)
          headers['api-key'] = APPTROVE_API_KEY;
        }

        console.log(`Trying ${endpoint.method} ${endpoint.url} with ${endpoint.auth} auth`);
        
        const response = await axios({
          method: endpoint.method,
          url: endpoint.url,
          data: endpoint.payload,
          headers: headers,
          timeout: 20000,
          validateStatus: (status) => status < 500 // Don't throw on 4xx, only 5xx
        });
        
        // Check for success (200-299) or created (201)
        if (response.status >= 200 && response.status < 300) {
          console.log(`✅ Success with ${endpoint.method} ${endpoint.url} using ${endpoint.auth} auth!`);
          const linkData = response.data;
          
          const unilinkUrl = 
            linkData.shortUrl || linkData.longUrl || linkData.link || linkData.url ||
            linkData.data?.shortUrl || linkData.data?.longUrl || linkData.data?.link ||
            linkData.data?.url || linkData.result?.link || linkData.result?.url || null;

          const linkId = 
            linkData._id || linkData.id || linkData.linkId ||
            linkData.data?._id || linkData.data?.id || linkData.data?.linkId ||
            linkData.result?.id || linkData.result?.linkId || null;

          if (unilinkUrl) {
            console.log(`✅ Link created successfully via API!`);
            console.log(`   URL: ${unilinkUrl}`);
            console.log(`   Link ID: ${linkId || 'N/A'}`);
            return {
              success: true,
              link: unilinkUrl,
              linkId: linkId,
              data: {
                ...linkData,
                createdVia: 'api-direct',
                authMethod: endpoint.auth
              }
            };
          } else {
            console.log(`⚠️  Success response but no URL found in:`, JSON.stringify(linkData).substring(0, 200));
          }
        } else if (response.status === 401) {
          console.log(`❌ 401 Unauthorized - Check secret ID/key permissions`);
        } else if (response.status === 403) {
          console.log(`❌ 403 Forbidden - Check secret ID/key permissions`);
        } else if (response.status === 404) {
          console.log(`❌ 404 Not Found - Endpoint may not exist`);
        } else if (response.status === 405) {
          console.log(`❌ 405 Method Not Allowed - ${endpoint.method} not supported`);
        } else {
          console.log(`❌ Status ${response.status} - ${response.statusText || 'Unknown error'}`);
          if (response.data) {
            console.log(`   Response:`, JSON.stringify(response.data).substring(0, 200));
          }
        }
      } catch (err) {
        // Network errors or 5xx errors
        if (err.response) {
          const status = err.response.status;
          const data = err.response.data;
          if (status === 401) {
            console.log(`❌ 401 Unauthorized for ${endpoint.method} ${endpoint.url} with ${endpoint.auth} auth`);
          } else if (status === 403) {
            console.log(`❌ 403 Forbidden for ${endpoint.method} ${endpoint.url} with ${endpoint.auth} auth`);
          } else if (status === 404) {
            console.log(`❌ 404 Not Found for ${endpoint.method} ${endpoint.url}`);
          } else if (status === 405) {
            console.log(`❌ 405 Method Not Allowed for ${endpoint.method} ${endpoint.url}`);
          } else {
            console.log(`❌ Error ${status} for ${endpoint.method} ${endpoint.url}:`, data ? JSON.stringify(data).substring(0, 200) : err.message);
          }
        } else {
          console.log(`❌ Network error for ${endpoint.method} ${endpoint.url}: ${err.message}`);
        }
        // Continue to next endpoint
        if (endpoint === endpoints[endpoints.length - 1]) {
          console.log('⚠️  All API endpoints failed, trying fallback methods...');
        }
        continue;
      }
    }

    // If all API endpoints failed, try URL construction as fallback
    console.log('⚠️  All direct API endpoints failed. Using URL construction fallback...');
    const domain = template?.domain || process.env.APPTROVE_DOMAIN || 'applink.reevo.in';
    const androidAppID = template?.androidAppID || process.env.APPTROVE_ANDROID_APP_ID;
    
    if (androidAppID) {
      const linkId = generateUniqueLinkId(linkName);
      const mediaSource = customParams.mediaSource || 'affiliate';
      const campaign = customParams.campaign || linkName.replace(/\s+/g, '-').toLowerCase().substring(0, 50);
      const deepLink = customParams.deepLink || '';
      
      const params = new URLSearchParams({
        pid: mediaSource,
        campaign: campaign,
        templateId: templateId
      });
      
      if (deepLink) {
        params.append('dlv', deepLink);
      }
      
      const trackingUrl = `https://click.trackier.io/c/${androidAppID}?${params.toString()}`;
      
      console.log('⚠️  Using URL construction fallback');
      console.log('   URL:', trackingUrl);
      console.log('   Note: This URL will work for tracking but may not appear in dashboard');
      
      return {
        success: true,
        link: trackingUrl,
        linkId: linkId,
        data: {
          createdVia: 'url-construction-fallback',
          templateId: templateId,
          domain: domain,
          androidAppID: androidAppID,
          note: 'Link constructed using URL format. API endpoints were not available. Link will track installs and purchases.'
        },
        note: 'Link constructed using URL format - functional for tracking'
      };
    }
    
    // If all methods fail, return error
    return {
      success: false,
      error: 'Unable to create link via API or URL construction.',
      details: 'All API endpoints failed and Android App ID not found. Please check:',
      solution: {
        steps: [
          '1. Verify APPTROVE_SECRET_ID and APPTROVE_SECRET_KEY are correct in .env',
          '2. Set APPTROVE_ANDROID_APP_ID in .env (from template)',
          '3. Or manually create link at https://dashboard.apptrove.com',
          '4. Navigate to Deep Links > EduRise template',
          '5. Click "Add Link" button and create the link'
        ],
        templateId: templateId,
        templateName: template?.name || 'EduRise',
        dashboardUrl: 'https://dashboard.apptrove.com',
        secretId: APPTROVE_SECRET_ID,
        hasSecretKey: !!APPTROVE_SECRET_KEY
      },
      link: null
    };
  } catch (error) {
    console.error('Error creating UniLink:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message,
      link: null,
      responseData: error.response?.data
    };
  }
}

// Browser automation function to create link in AppTrove dashboard
// This is a workaround since AppTrove doesn't have a public API for link creation
async function createLinkViaBrowserAutomation(templateId, linkName, domain) {
  try {
    const puppeteer = await import('puppeteer').catch(() => null);
    
    if (!puppeteer) {
      return {
        success: false,
        error: 'Puppeteer not installed. Install it with: npm install puppeteer'
      };
    }
    
    // Check for AppTrove dashboard credentials
    const APPTROVE_EMAIL = process.env.APPTROVE_EMAIL;
    const APPTROVE_PASSWORD = process.env.APPTROVE_PASSWORD;
    
    if (!APPTROVE_EMAIL || !APPTROVE_PASSWORD) {
      return {
        success: false,
        error: 'AppTrove dashboard credentials not configured. Set APPTROVE_EMAIL and APPTROVE_PASSWORD in .env file.'
      };
    }
    
    console.log('   Launching browser for automation...');
    
    // Production-ready Puppeteer configuration
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Overcome limited resource problems
      '--disable-accelerated-2d-canvas',
      '--disable-gpu', // Disable GPU hardware acceleration
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080'
    ];
    
    // Use executable path if provided (for production environments)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    
    const launchOptions = {
      headless: true,
      args: browserArgs,
      timeout: 60000 // 60 second timeout
    };
    
    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }
    
    // For production, consider using a remote browser service
    const browserWSEndpoint = process.env.PUPPETEER_WS_ENDPOINT;
    let browser;
    let isRemoteBrowser = false;
    
    if (browserWSEndpoint) {
      // Connect to remote browser (e.g., Browserless.io, self-hosted)
      console.log('   Connecting to remote browser service...');
      browser = await puppeteer.default.connect({
        browserWSEndpoint: browserWSEndpoint
      });
      isRemoteBrowser = true;
    } else {
      // Launch local browser
      browser = await puppeteer.default.launch(launchOptions);
    }
    
    try {
      const page = await browser.newPage();
      
      // Navigate to AppTrove dashboard login
      console.log('   Navigating to AppTrove dashboard...');
      await page.goto('https://dashboard.apptrove.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Login
      console.log('   Logging in...');
      await page.type('input[type="email"], input[name="email"]', APPTROVE_EMAIL, { delay: 100 });
      await page.type('input[type="password"], input[name="password"]', APPTROVE_PASSWORD, { delay: 100 });
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      // Navigate to Deep Links > Template
      console.log('   Navigating to template page...');
      const templateUrl = `https://dashboard.apptrove.com/v2/app/${templateId}/settings?tab=details`;
      await page.goto(templateUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for page to load and find "Add Link" button
      console.log('   Looking for Add Link button...');
      await page.waitForSelector('button:has-text("Add Link"), a:has-text("Add Link"), [data-testid*="add"], button[class*="add"]', { timeout: 10000 });
      
      // Click Add Link button
      await page.click('button:has-text("Add Link"), a:has-text("Add Link")');
      await page.waitForTimeout(3000);
      
      // STEP 1: Fill Basic Details (multi-step form)
      // Based on the image: Link Name, Campaign Name, Deep Linking, Status
      console.log('   Step 1: Filling Basic Details...');
      
      // Wait for form modal/dialog to appear
      await page.waitForTimeout(2000);
      
      // Wait for form inputs to appear
      await page.waitForSelector('input[type="text"], input[placeholder*="Name"], input[placeholder*="Enter"]', { timeout: 15000 });
      
      // Get all text inputs on the page
      const allInputs = await page.$$('input[type="text"], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])');
      console.log(`   Found ${allInputs.length} input fields`);
      
      // Fill Link Name* (required) - first input with "Name" placeholder
      let nameFilled = false;
      for (const input of allInputs) {
        const placeholder = await input.evaluate(el => el.getAttribute('placeholder') || '');
        const name = await input.evaluate(el => el.getAttribute('name') || '');
        const label = await input.evaluate(el => {
          const lbl = el.closest('label') || el.previousElementSibling;
          return lbl?.textContent || '';
        });
        
        if (placeholder.toLowerCase().includes('name') && 
            !placeholder.toLowerCase().includes('campaign') &&
            !name.toLowerCase().includes('campaign')) {
          await input.click({ clickCount: 3 });
          await input.type(linkName, { delay: 50 });
          nameFilled = true;
          console.log('   ✅ Filled Link Name');
          break;
        }
      }
      
      if (!nameFilled && allInputs.length > 0) {
        // Fallback: fill first input
        await allInputs[0].click({ clickCount: 3 });
        await allInputs[0].type(linkName, { delay: 50 });
        console.log('   ✅ Filled first input as Link Name');
      }
      
      await page.waitForTimeout(500);
      
      // Fill Campaign Name* (required) - second input
      const campaignName = process.env.APPTROVE_DEFAULT_CAMPAIGN || linkName;
      let campaignFilled = false;
      for (const input of allInputs) {
        const placeholder = await input.evaluate(el => el.getAttribute('placeholder') || '');
        const name = await input.evaluate(el => el.getAttribute('name') || '');
        
        if (placeholder.toLowerCase().includes('campaign') || name.toLowerCase().includes('campaign')) {
          await input.click({ clickCount: 3 });
          await input.type(campaignName, { delay: 50 });
          campaignFilled = true;
          console.log('   ✅ Filled Campaign Name');
          break;
        }
      }
      
      if (!campaignFilled && allInputs.length > 1) {
        await allInputs[1].click({ clickCount: 3 });
        await allInputs[1].type(campaignName, { delay: 50 });
        console.log('   ✅ Filled second input as Campaign Name');
      }
      
      await page.waitForTimeout(500);
      
      // Fill Deep Linking* (required) - third input
      const deepLinking = process.env.APPTROVE_DEEP_LINKING || 'default';
      let deepLinkFilled = false;
      for (const input of allInputs) {
        const placeholder = await input.evaluate(el => el.getAttribute('placeholder') || '');
        const name = await input.evaluate(el => el.getAttribute('name') || '');
        
        if (placeholder.toLowerCase().includes('deep') || name.toLowerCase().includes('deep')) {
          await input.click({ clickCount: 3 });
          await input.type(deepLinking, { delay: 50 });
          deepLinkFilled = true;
          console.log('   ✅ Filled Deep Linking');
          break;
        }
      }
      
      if (!deepLinkFilled && allInputs.length > 2) {
        await allInputs[2].click({ clickCount: 3 });
        await allInputs[2].type(deepLinking, { delay: 50 });
        console.log('   ✅ Filled third input as Deep Linking');
      }
      
      await page.waitForTimeout(500);
      
      // Ensure Status is set to Active (radio button)
      const radioButtons = await page.$$('input[type="radio"]');
      if (radioButtons.length > 0) {
        // Try to find and click "Active" radio
        for (const radio of radioButtons) {
          const value = await radio.evaluate(el => el.getAttribute('value') || '');
          const checked = await radio.evaluate(el => el.checked);
          if (value.toLowerCase() === 'active' && !checked) {
            await radio.click();
            console.log('   ✅ Set Status to Active');
            break;
          }
        }
        // If no active found, click first (usually active)
        const firstChecked = await radioButtons[0].evaluate(el => el.checked);
        if (!firstChecked) {
          await radioButtons[0].click();
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Click Next button to proceed to Advanced Settings
      console.log('   Clicking Next to proceed to Advanced Settings...');
      const nextButtons = await page.$$('button');
      let nextClicked = false;
      
      for (const btn of nextButtons) {
        const text = await btn.evaluate(el => el.textContent || '');
        if (text.includes('Next') || text.includes('>')) {
          const isVisible = await btn.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          if (isVisible) {
            await btn.click();
            nextClicked = true;
            console.log('   ✅ Clicked Next button');
            break;
          }
        }
      }
      
      if (!nextClicked) {
        // Try to find green/primary button (usually Next)
        const primaryButtons = await page.$$('button[class*="primary"], button[class*="green"], button[style*="green"]');
        if (primaryButtons.length > 0) {
          await primaryButtons[0].click();
          console.log('   ✅ Clicked primary button (likely Next)');
        }
      }
      
      await page.waitForTimeout(3000);
      
      // STEP 2: Advanced Settings (use defaults, click Next)
      console.log('   Step 2: Advanced Settings (using defaults)...');
      await page.waitForTimeout(2000);
      
      // Look for Next button again
      const nextButtons2 = await page.$$('button');
      for (const btn of nextButtons2) {
        const text = await btn.evaluate(el => el.textContent || '');
        if (text.includes('Next') || text.includes('>')) {
          await btn.click();
          console.log('   ✅ Clicked Next to proceed to Redirection');
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      
      // STEP 3: Redirection (use template defaults, submit)
      console.log('   Step 3: Redirection (using template defaults)...');
      await page.waitForTimeout(2000);
      
      // Click Create/Submit button
      console.log('   Submitting form...');
      const allButtons = await page.$$('button');
      let submitted = false;
      
      // Look for Create, Submit, or final Next button
      for (const btn of allButtons) {
        const text = await btn.evaluate(el => el.textContent || '');
        const isPrimary = await btn.evaluate(el => {
          const classList = Array.from(el.classList);
          return classList.some(c => c.includes('primary') || c.includes('green') || c.includes('submit'));
        });
        
        if (text.includes('Create') || text.includes('Submit') || text.includes('Save') || 
            (text.includes('Next') && isPrimary)) {
          const isVisible = await btn.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          if (isVisible) {
            await btn.click();
            submitted = true;
            console.log(`   ✅ Clicked submit button: ${text}`);
            break;
          }
        }
      }
      
      if (!submitted) {
        // Fallback: click the most prominent button (usually green/primary)
        const primaryBtns = await page.$$('button[class*="primary"], button[class*="green"], button[style*="green"]');
        if (primaryBtns.length > 0) {
          await primaryBtns[0].click();
          console.log('   ✅ Clicked primary button as submit');
        } else {
          throw new Error('Could not find submit button');
        }
      }
      
      // Wait for link creation to complete
      console.log('   Waiting for link creation to complete...');
      await page.waitForTimeout(5000);
      
      // Try to extract the created link URL
      console.log('   Extracting created link URL...');
      
      // Wait for success message or page update
      await page.waitForTimeout(4000);
      
      // Close any success modal/dialog if present
      try {
        const closeButtons = await page.$$('button[aria-label*="close"], button[aria-label*="Close"], [class*="close"], button:has-text("×")');
        if (closeButtons.length > 0) {
          await closeButtons[0].click();
          await page.waitForTimeout(1000);
        }
      } catch (err) {
        // Ignore
      }
      
      // Navigate to template links page to find the newly created link
      console.log('   Navigating to template links page to find created link...');
      const listUrls = [
        `https://dashboard.apptrove.com/v2/app/${templateId}`,
        `https://dashboard.apptrove.com/v2/app/${templateId}/settings`,
        `https://dashboard.apptrove.com/v2/app/${templateId}/settings?tab=details`,
        `https://dashboard.apptrove.com/deep-links/${templateId}`,
        `https://dashboard.apptrove.com/unilink/${templateId}`
      ];
      
      let linkUrl = null;
      
      for (const listUrl of listUrls) {
        try {
          console.log(`   Trying URL: ${listUrl}`);
          await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 20000 });
          await page.waitForTimeout(5000); // Wait for table/list to load
          
          // Refresh the page to ensure latest data
          await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
          await page.waitForTimeout(3000);
          
          // Look for the link in the list/table
          linkUrl = await page.evaluate((linkName) => {
            // Method 1: Search all text for the link name and nearby URLs
            const allText = document.body.innerText || document.body.textContent || '';
            const linkNameIndex = allText.indexOf(linkName);
            
            if (linkNameIndex !== -1) {
              // Extract surrounding text to find URL
              const surroundingText = allText.substring(Math.max(0, linkNameIndex - 200), linkNameIndex + 500);
              const urlMatches = surroundingText.match(/https?:\/\/[^\s]+(applink|trackier|u9ilnk)[^\s]*/g);
              if (urlMatches && urlMatches.length > 0) {
                return urlMatches[0].trim();
              }
            }
            
            // Method 2: Look in table rows
            const rows = document.querySelectorAll('tr, [class*="row"], [class*="item"], [role="row"]');
            for (const row of rows) {
              const rowText = row.textContent || '';
              if (rowText.includes(linkName)) {
                // Look for URL in this row
                const linkElements = row.querySelectorAll('a[href], input[value], code, pre, [class*="url"], [class*="link"]');
                for (const el of linkElements) {
                  const url = el.href || el.value || el.textContent || el.innerText;
                  if (url && (url.includes('applink') || url.includes('trackier') || url.includes('u9ilnk') || url.includes('/d/'))) {
                    const cleanUrl = url.trim().split('\n')[0].split(' ')[0];
                    if (cleanUrl.startsWith('http')) {
                      return cleanUrl;
                    }
                  }
                }
              }
            }
          
          // Method 3: Search all links on page
          const allLinks = document.querySelectorAll('a[href], input[value], code, pre');
          for (const link of allLinks) {
            const url = link.href || link.value || link.textContent || link.innerText;
            if (url && (url.includes('applink') || url.includes('trackier') || url.includes('u9ilnk') || url.includes('/d/'))) {
              const cleanUrl = url.trim().split('\n')[0].split(' ')[0];
              if (cleanUrl.startsWith('http')) {
                // Verify this is a recent link (check if link name is nearby in DOM)
                const parent = link.closest('tr, [class*="row"], [class*="item"]');
                if (parent && parent.textContent.includes(linkName)) {
                  return cleanUrl;
                }
              }
            }
          }
          
          return null;
        }, linkName);
        
        if (linkUrl) {
          console.log(`   ✅ Found link URL: ${linkUrl}`);
          break;
        }
      } catch (err) {
        console.log(`   Error checking ${listUrl}:`, err.message);
        continue;
      }
      
      // If still not found, try one more time with a longer wait
      if (!linkUrl) {
        console.log('   Link not found yet, waiting longer and retrying...');
        await page.waitForTimeout(5000);
        
        try {
          await page.goto(`https://dashboard.apptrove.com/v2/app/${templateId}`, { 
            waitUntil: 'networkidle2', 
            timeout: 20000 
          });
          await page.waitForTimeout(5000);
          
          linkUrl = await page.evaluate((linkName) => {
            // Comprehensive search
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const text = el.textContent || '';
              if (text.includes(linkName)) {
                // Check for URL in this element or children
                const urlMatch = text.match(/https?:\/\/[^\s]+(applink|trackier|u9ilnk)[^\s]*/);
                if (urlMatch) {
                  return urlMatch[0].trim();
                }
              }
            }
            return null;
          }, linkName);
        } catch (err) {
          console.log('   Final retry failed:', err.message);
        }
      }
    }
      
      // Prepare result based on whether we found the URL
      let result;
      if (linkUrl) {
        // Extract link ID from URL
        let linkId = null;
        if (linkUrl.includes('/d/')) {
          linkId = linkUrl.split('/d/')[1]?.split('?')[0]?.split('/')[0];
        } else if (linkUrl.includes('/c/')) {
          linkId = linkUrl.split('/c/')[1]?.split('?')[0];
        } else {
          linkId = generateUniqueLinkId(linkName);
        }
        
        console.log('   ✅ Successfully created link in AppTrove dashboard!');
        console.log(`   Link URL: ${linkUrl}`);
        console.log(`   Link ID: ${linkId}`);
        
        result = {
          success: true,
          link: linkUrl.trim(),
          linkId: linkId,
          data: { 
            createdVia: 'browser-automation',
            note: 'Link created in AppTrove dashboard and will appear in the dashboard'
          }
        };
      } else {
        // Link was likely created but we couldn't extract URL
        // This can happen if the dashboard takes time to update
        console.log('   ⚠️  Link likely created but URL extraction failed');
        console.log('   The link should appear in the AppTrove dashboard');
        console.log(`   Please check: https://dashboard.apptrove.com/v2/app/${templateId}`);
        
        result = {
          success: true,
          link: null, // Will need to be manually retrieved from dashboard
          linkId: generateUniqueLinkId(linkName),
          data: { 
            createdVia: 'browser-automation',
            note: `Link "${linkName}" created successfully in AppTrove dashboard. Please check the dashboard to retrieve the link URL. The link should appear in the template links list.`,
            dashboardUrl: `https://dashboard.apptrove.com/v2/app/${templateId}`
          },
          warning: 'Link created but URL could not be automatically extracted. Please check AppTrove dashboard to retrieve the link URL.'
        };
      }
      
      // Close/disconnect browser properly before returning
      if (isRemoteBrowser) {
        await browser.disconnect();
      } else {
        await browser.close();
      }
      
      return result;
    } catch (err) {
      // Ensure browser is closed/disconnected even on error
      try {
        if (typeof browser !== 'undefined' && browser) {
          if (isRemoteBrowser) {
            await browser.disconnect();
          } else {
            await browser.close();
          }
        }
      } catch (closeErr) {
        // Ignore close errors
      }
      
      return {
        success: false,
        error: `Browser automation failed: ${err.message}`,
        details: 'This could be due to: page structure changes, login issues, network problems, or server limitations. Check AppTrove dashboard manually.',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Failed to initialize browser automation: ${err.message}`,
      details: 'Make sure Puppeteer is installed: npm install puppeteer'
    };
  }
}

// AppTrove API: Get unilink analytics/stats using Reporting API (Secret ID/Key)
async function getUniLinkStats(linkId) {
  // Validate linkId
  if (!linkId || typeof linkId !== 'string' || linkId.trim() === '') {
    console.log('Invalid linkId provided to getUniLinkStats:', linkId);
    return {
      success: false,
      error: 'Invalid linkId',
      data: {
        clicks: 0,
        conversions: 0,
        installs: 0,
        purchases: 0,
        revenue: 0,
        earnings: 0,
        ctr: 0,
        conversionRate: 0,
        installRate: 0,
        purchaseRate: 0
      }
    };
  }

  try {
    // Try multiple endpoints and authentication methods
    const endpoints = [
      {
        url: `${APPTROVE_API_URL}/internal/unilink/${linkId}/stats`,
        auth: 'secret-basic'
      },
      {
        url: `${APPTROVE_API_URL}/api/v1/reporting/link/${linkId}`,
        auth: 'secret-basic'
      },
      {
        url: `${APPTROVE_API_URL}/api/reporting/link/${linkId}`,
        auth: 'secret-basic'
      },
      {
        url: `${APPTROVE_API_URL}/v1/reporting/link/${linkId}`,
        auth: 'secret-basic'
      },
      {
        url: `${APPTROVE_API_URL}/internal/unilink/${linkId}/stats`,
        auth: 'api-key'
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        // Add authentication
        if (endpoint.auth === 'secret-basic') {
          const authString = Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64');
          headers['Authorization'] = `Basic ${authString}`;
        } else if (endpoint.auth === 'api-key' && APPTROVE_API_KEY) {
          headers['api-key'] = APPTROVE_API_KEY;
        }

        const response = await axios.get(endpoint.url, {
          headers,
          timeout: 15000,
          validateStatus: (status) => status < 500
        });

        if (response.status >= 200 && response.status < 300) {
          // Normalize the response data
          const data = response.data?.data || response.data;
          
          return {
            success: true,
            data: {
              clicks: data.clicks || data.totalClicks || data.impressions || 0,
              conversions: data.conversions || data.totalConversions || data.installs || 0,
              installs: data.installs || data.totalInstalls || 0,
              purchases: data.purchases || data.totalPurchases || 0,
              revenue: data.revenue || data.totalRevenue || data.earnings || 0,
              earnings: data.earnings || data.totalEarnings || 0,
              ctr: data.ctr || (data.clicks && data.impressions ? (data.clicks / data.impressions * 100) : 0),
              conversionRate: data.conversionRate || (data.clicks && data.conversions ? (data.conversions / data.clicks * 100) : 0),
              installRate: data.installRate || (data.clicks && data.installs ? (data.installs / data.clicks * 100) : 0),
              purchaseRate: data.purchaseRate || (data.installs && data.purchases ? (data.purchases / data.installs * 100) : 0),
              raw: data // Keep raw data for reference
            }
          };
        }
      } catch (err) {
        if (err.response && err.response.status < 500) {
          // 4xx errors - try next endpoint
          continue;
        }
        // 5xx or network errors - log and continue
        console.log(`Error with ${endpoint.url}:`, err.message);
      }
    }

    // If all endpoints fail, return empty stats
    return {
      success: false,
      error: 'Unable to fetch stats from AppTrove API',
      data: {
        clicks: 0,
        conversions: 0,
        installs: 0,
        purchases: 0,
        revenue: 0,
        earnings: 0,
        ctr: 0,
        conversionRate: 0,
        installRate: 0,
        purchaseRate: 0
      }
    };
  } catch (error) {
    console.error('Error fetching UniLink stats:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      success: false,
      error: error.message,
      data: {
        clicks: 0,
        conversions: 0,
        installs: 0,
        purchases: 0,
        revenue: 0,
        earnings: 0,
        ctr: 0,
        conversionRate: 0,
        installRate: 0,
        purchaseRate: 0
      }
    };
  }
}

// Social Media Verification Functions
async function verifyInstagram(handle) {
  try {
    // Extract username from URL or handle
    let username = handle.trim();
    if (username.includes('instagram.com/')) {
      username = username.split('instagram.com/')[1].split('/')[0].split('?')[0];
    }
    username = username.replace('@', '').trim();

    const profileUrl = `https://www.instagram.com/${username}/`;
    
    // Scrape Instagram public profile page
    try {
      const response = await axios.get(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      // Check if profile exists (404 means not found)
      if (response.status === 404) {
        return {
          verified: false,
          error: 'Instagram profile not found'
        };
      }

      // Parse HTML to extract follower count
      const html = response.data;
      
      // Try to find follower count in JSON-LD or meta tags
      // Instagram stores data in window._sharedData
      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
      if (sharedDataMatch) {
        try {
          const sharedData = JSON.parse(sharedDataMatch[1]);
          const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
          if (user) {
            const followers = parseInt(user.edge_followed_by?.count || 0);
            return {
              verified: true,
              followers: followers,
              username: username,
              profileUrl: profileUrl,
              profilePic: user.profile_pic_url,
              fullName: user.full_name
            };
          }
        } catch (e) {
          console.error('Error parsing Instagram sharedData:', e.message);
        }
      }

      // Try alternative: window.__additionalDataLoaded
      const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\)/);
      if (additionalDataMatch) {
        try {
          const data = JSON.parse(additionalDataMatch[1]);
          const user = data?.graphql?.user;
          if (user) {
            const followers = parseInt(user.edge_followed_by?.count || 0);
            return {
              verified: true,
              followers: followers,
              username: username,
              profileUrl: profileUrl
            };
          }
        } catch (e) {
          console.error('Error parsing Instagram additionalData:', e.message);
        }
      }

      // Fallback: Try to extract from meta tags
      const metaMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
      if (metaMatch) {
        const description = metaMatch[1];
        const followerMatch = description.match(/([\d,]+)\s+Followers/);
        if (followerMatch) {
          const followers = parseInt(followerMatch[1].replace(/,/g, ''));
          return {
            verified: true,
            followers: followers,
            username: username,
            profileUrl: profileUrl
          };
        }
      }

      // Last resort: Try to find in script tags
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
      for (const script of scriptMatches) {
        const jsonMatch = script.match(/"edge_followed_by":\s*{\s*"count":\s*(\d+)/);
        if (jsonMatch) {
          const followers = parseInt(jsonMatch[1]);
          return {
            verified: true,
            followers: followers,
            username: username,
            profileUrl: profileUrl
          };
        }
      }

      // If we can't parse, but page loaded, assume verified but no count
      return {
        verified: true,
        followers: 0,
        username: username,
        profileUrl: profileUrl,
        note: 'Profile found but follower count could not be extracted. Instagram may have changed their page structure.'
      };
    } catch (scrapeError) {
      // If scraping fails, check if it's a 404 (user doesn't exist)
      if (scrapeError.response?.status === 404 || scrapeError.response?.status === 403) {
        return {
          verified: false,
          error: scrapeError.response?.status === 403 
            ? 'Instagram profile is private or blocked'
            : 'Instagram profile not found'
        };
      }
      throw scrapeError;
    }
  } catch (error) {
    console.error('Instagram verification error:', error.message);
    return {
      verified: false,
      error: error.response?.status === 404 ? 'Profile not found' : 'Failed to verify Instagram profile'
    };
  }
}

async function verifyYouTube(handle) {
  try {
    // Extract channel ID or username from URL
    let channelId = null;
    let username = null;
    
    if (handle.includes('youtube.com/channel/')) {
      channelId = handle.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
    } else if (handle.includes('youtube.com/c/') || handle.includes('youtube.com/user/')) {
      username = handle.split('youtube.com/')[1].split('/')[1].split('/')[0].split('?')[0];
    } else if (handle.includes('youtube.com/@')) {
      username = handle.split('youtube.com/@')[1].split('/')[0].split('?')[0];
    } else {
      username = handle.replace('@', '').trim();
    }

    // Use YouTube Data API v3 with provided API key
    if (!YOUTUBE_API_KEY) {
      return {
        verified: false,
        error: 'YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable.'
      };
    }

    let apiUrl = '';
    if (channelId) {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    } else if (username) {
      // For @username format, we need to search first, then get channel details
      // YouTube API doesn't directly support @username lookup
      try {
        // First, search for the channel by handle
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YOUTUBE_API_KEY}&maxResults=1`;
        const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
        
        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
          // Found channel via search, now get full details
          const foundChannelId = searchResponse.data.items[0].id.channelId;
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${foundChannelId}&key=${YOUTUBE_API_KEY}`;
        } else {
          // Try forUsername (deprecated but might work for some channels)
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
        }
      } catch (searchError) {
        // If search fails, try forUsername directly
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
      }
    } else {
      return {
        verified: false,
        error: 'Invalid YouTube URL or handle format. Please provide a full YouTube URL or channel ID.'
      };
    }

    const response = await axios.get(apiUrl, { timeout: 10000 });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      return {
        verified: true,
        subscribers: parseInt(channel.statistics.subscriberCount) || 0,
        channelId: channel.id,
        channelName: channel.snippet.title,
        profileUrl: `https://www.youtube.com/channel/${channel.id}`
      };
    } else {
      return {
        verified: false,
        error: 'Channel not found. Please provide a full YouTube channel URL (e.g., https://www.youtube.com/@channelname or https://www.youtube.com/channel/CHANNEL_ID)'
      };
    }
  } catch (error) {
    console.error('YouTube verification error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    let errorMessage = 'Failed to verify YouTube channel';
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors[0].message || errorMessage;
      }
      
      // Handle specific API errors
      if (apiError.code === 403) {
        errorMessage = 'YouTube API quota exceeded or access denied. Please check your API key.';
      } else if (apiError.code === 400) {
        errorMessage = 'Invalid YouTube channel format. Please provide a full URL or channel ID.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      verified: false,
      error: errorMessage
    };
  }
}

async function verifyFacebook(handle) {
  try {
    // Extract page/username from URL
    let pageId = null;
    let username = null;
    
    if (handle.includes('facebook.com/')) {
      const path = handle.split('facebook.com/')[1].split('/')[0].split('?')[0];
      if (path && !path.includes('pages') && !path.includes('profile')) {
        username = path;
      }
    } else {
      username = handle.replace('@', '').trim();
    }

    // Note: Facebook Graph API requires access token
    // You'll need to set FACEBOOK_ACCESS_TOKEN in environment variables
    const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!FACEBOOK_ACCESS_TOKEN) {
      return {
        verified: false,
        error: 'Facebook API access token not configured. Please set FACEBOOK_ACCESS_TOKEN environment variable.'
      };
    }

    // Try to get page info
    const apiUrl = `https://graph.facebook.com/v18.0/${username || pageId}?fields=name,fan_count&access_token=${FACEBOOK_ACCESS_TOKEN}`;
    
    const response = await axios.get(apiUrl, { timeout: 10000 });
    
    if (response.data) {
      return {
        verified: true,
        followers: parseInt(response.data.fan_count) || 0,
        pageName: response.data.name,
        pageId: response.data.id
      };
    } else {
      return {
        verified: false,
        error: 'Page not found'
      };
    }
  } catch (error) {
    console.error('Facebook verification error:', error.message);
    return {
      verified: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to verify Facebook page'
    };
  }
}

async function verifyTwitter(handle) {
  try {
    // Extract username from URL or handle
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

    // Twitter API v2 - Get user by username
    // Using OAuth 1.0a for authentication
    
    // Generate OAuth signature
    const oauthParams = {
      oauth_consumer_key: TWITTER_CONSUMER_KEY,
      oauth_token: TWITTER_ACCESS_TOKEN,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0'
    };

    const baseUrl = `https://api.twitter.com/2/users/by/username/${username}`;
    const queryParams = { 'user.fields': 'public_metrics' };
    
    // Create parameter string for signature (include query params)
    const allParams = { ...oauthParams, ...queryParams };
    const paramString = Object.entries(allParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

    const signatureBaseString = `GET&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(TWITTER_CONSUMER_SECRET)}&${encodeURIComponent(TWITTER_ACCESS_TOKEN_SECRET)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');

    oauthParams.oauth_signature = signature;

    // Create Authorization header
    const authHeader = 'OAuth ' + Object.entries(oauthParams)
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(String(v))}"`)
      .join(', ');

    try {
      // Try Twitter API v2 first
      const response = await axios.get(baseUrl, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        },
        params: queryParams,
        timeout: 10000
      });

      if (response.data?.data) {
        const user = response.data.data;
        const followers = user.public_metrics?.followers_count || 0;
        return {
          verified: true,
          followers: followers,
          username: username,
          profileUrl: `https://twitter.com/${username}`,
          userId: user.id,
          name: user.name
        };
      } else {
        return {
          verified: false,
          error: 'User not found'
        };
      }
    } catch (apiError) {
      console.error('Twitter API v2 error:', apiError.response?.data || apiError.message);
      
      // Fallback: Try v1.1 API
      try {
        const v1Url = `https://api.twitter.com/1.1/users/show.json`;
        const v1Params = { screen_name: username };
        
        // Recreate signature for v1.1
        const v1OauthParams = {
          oauth_consumer_key: TWITTER_CONSUMER_KEY,
          oauth_token: TWITTER_ACCESS_TOKEN,
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
          oauth_nonce: crypto.randomBytes(16).toString('hex'),
          oauth_version: '1.0'
        };
        
        const v1AllParams = { ...v1OauthParams, ...v1Params };
        const v1ParamString = Object.entries(v1AllParams)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
        
        const v1SignatureBaseString = `GET&${encodeURIComponent(v1Url)}&${encodeURIComponent(v1ParamString)}`;
        const v1Signature = crypto.createHmac('sha1', signingKey).update(v1SignatureBaseString).digest('base64');
        v1OauthParams.oauth_signature = v1Signature;
        
        const v1AuthHeader = 'OAuth ' + Object.entries(v1OauthParams)
          .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(String(v))}"`)
          .join(', ');

        const v1Response = await axios.get(v1Url, {
          headers: {
            'Authorization': v1AuthHeader,
            'Accept': 'application/json'
          },
          params: v1Params,
          timeout: 10000
        });

        if (v1Response.data) {
          return {
            verified: true,
            followers: v1Response.data.followers_count || 0,
            username: username,
            profileUrl: `https://twitter.com/${username}`,
            name: v1Response.data.name
          };
        }
      } catch (v1Error) {
        console.error('Twitter API v1.1 error:', v1Error.response?.data || v1Error.message);
      }
      
      // If both fail, return error
      return {
        verified: false,
        error: apiError.response?.data?.detail || apiError.response?.data?.title || apiError.message || 'Failed to verify Twitter/X account'
      };
    }
  } catch (error) {
    console.error('Twitter verification error:', error.message);
    return {
      verified: false,
      error: error.message || 'Failed to verify Twitter/X account'
    };
  }
}

async function verifySocialMedia(platform, handle) {
  // Normalize platform name (handle case variations and spaces)
  const normalizedPlatform = platform.toLowerCase().trim().replace(/\s+/g, '');
  
  console.log(`Verifying platform: "${platform}" -> normalized: "${normalizedPlatform}"`);
  
  switch (normalizedPlatform) {
    case 'instagram':
      return await verifyInstagram(handle);
    case 'youtube':
      return await verifyYouTube(handle);
    case 'facebook':
      return await verifyFacebook(handle);
    case 'twitter':
    case 'twitter/x':
    case 'x':
    case 'twitterx':
      return await verifyTwitter(handle);
    case 'telegram':
    case 'tiktok':
    case 'linkedin':
    case 'other':
      // For platforms without API access, return basic validation
      return {
        verified: true,
        followers: 0,
        note: `${platform} verification not yet implemented. Handle saved but not verified.`
      };
    default:
      return {
        verified: false,
        error: `Unsupported platform: ${platform}. Supported platforms: Instagram, YouTube, Facebook, Twitter/X, Telegram, TikTok, LinkedIn, Other`
      };
  }
}

// AppTrove API: Get template link list (to find existing links)
async function getTemplateLinks(templateId) {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    // Try multiple endpoint formats
    const endpoints = [
      `${APPTROVE_API_URL}/internal/link-template/${templateId}/links`,
      `${APPTROVE_API_URL}/internal/link/${templateId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'api-key': APPTROVE_API_KEY,
            'Accept': 'application/json'
          },
          params: {
            limit: 100
          },
          timeout: 10000
        });
        
        // Handle different response structures
        const links = response.data?.data?.linkList || 
                     response.data?.linkList || 
                     response.data?.links || 
                     response.data?.data || 
                     [];
        
        return {
          success: true,
          links: Array.isArray(links) ? links : []
        };
      } catch (err) {
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw err;
        }
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching template links:', {
      message: error.message,
      status: error.response?.status
    });
    
    return {
      success: false,
      links: []
    };
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Google OAuth routes
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/admin/login?error=auth_failed' }),
    (req, res) => {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`);
    }
  );

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json({ user: req.user, authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
}

// Get link templates
app.get('/api/templates', async (req, res) => {
  try {
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    const templates = await getLinkTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

// Get links for a specific template (admin only)
app.get('/api/templates/:templateId/links', isAdmin, async (req, res) => {
  try {
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }

    const { templateId } = req.params;
    const { page, limit, name, status } = req.query;

    const result = await getTemplateLinks(templateId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100,
      name: name || '',
      status: status || ''
    });

    if (result.success) {
      res.json({
        success: true,
        links: result.linkList,
        pagination: result.pagination,
        template: result.linkTemplate
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        links: []
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template links', details: error.message });
  }
});

// Social media verification endpoint
app.post('/api/social/verify', rateLimit(10), async (req, res) => {
  try {
    const { platform, handle } = req.body;

    if (!platform || !handle) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Platform and handle are required'
      });
    }

    console.log(`Verifying ${platform} handle: ${handle}`);
    
    const result = await verifySocialMedia(platform, handle);
    
    if (result.verified) {
      res.json({
        verified: true,
        followers: result.followers || result.subscribers || 0,
        subscribers: result.subscribers || result.followers || 0,
        ...result
      });
    } else {
      res.status(400).json({
        verified: false,
        error: result.error || 'Verification failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      verified: false,
      error: 'Failed to verify social media profile',
      details: error.message
    });
  }
});

// Register new user and create Trackier link
app.post('/api/users/register', rateLimit(RATE_LIMIT_AUTH_MAX), async (req, res) => {
  try {
    const { name, email, phone, followerCount, socialHandles } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, and phone are required' 
      });
    }

    // Validate and sanitize inputs with security checks
    if (!validateInput(name, 'name')) {
      return res.status(400).json({ 
        error: 'Invalid name format',
        details: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes' 
      });
    }

    // Validate email format
    if (!validateInput(email, 'email')) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address' 
      });
    }

    // Validate phone format
    if (!validateInput(phone, 'phone')) {
      return res.status(400).json({ 
        error: 'Invalid phone number',
        details: 'Please provide a valid phone number (10-15 digits)' 
      });
    }

    // Sanitize inputs
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedEmail = email.trim().toLowerCase().substring(0, 255);
    const sanitizedPhone = phone.trim().substring(0, 20);

    const db = await readDB();

    // Check if user already exists
    const existingUser = db.users.find(u => u.email === sanitizedEmail);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        details: 'A user with this email already exists',
        userId: existingUser.id,
        trackierLink: db.links.find(l => l.userId === existingUser.id)?.link || null
      });
    }

    // Process social handles
    const processedHandles = Array.isArray(socialHandles) ? socialHandles.map(h => ({
      platform: (h.platform || '').trim(),
      handle: (h.handle || '').trim(),
      verified: h.verified || false,
      verifiedFollowers: h.verifiedFollowers || 0,
      verifiedAt: h.verifiedAt || null
    })).filter(h => h.platform && h.handle) : [];

    // Calculate total verified followers
    const totalVerifiedFollowers = processedHandles
      .filter(h => h.verified)
      .reduce((sum, h) => sum + (h.verifiedFollowers || 0), 0);

    // Get primary platform (first verified handle, or first handle)
    const primaryPlatform = processedHandles.find(h => h.verified)?.platform || 
                            processedHandles[0]?.platform || '';

    // Create new user with pending approval status
    const newUser = {
      id: uuidv4(),
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      platform: primaryPlatform,
      socialHandle: processedHandles[0]?.handle || '', // Keep for backward compatibility
      followerCount: (followerCount || '').trim(),
      socialHandles: processedHandles, // New field for multiple handles
      totalVerifiedFollowers: totalVerifiedFollowers,
      status: 'pending', // New users need approval
      approvalStatus: 'pending', // pending, approved, rejected
      adminNotes: '',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save user to database (link will be created after approval)
    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        approvalStatus: 'pending'
      },
      message: 'Your application has been submitted successfully. It is pending admin approval. You will receive an email once approved.'
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Get user by ID (with stats from AppTrove)
app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's links
    const userLinks = db.links.filter(l => l.userId === user.id);
    
    // Calculate stats from local analytics
    const userAnalytics = db.analytics.filter(a => a.userId === user.id);
    const totalClicks = userAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const totalConversions = userAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
    const totalEarnings = userAnalytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;
    
    // Try to fetch latest stats from AppTrove if link exists
    if (userLinks.length > 0 && userLinks[0].linkId && APPTROVE_API_KEY && user.approvalStatus === 'approved') {
      try {
        const apptroveStats = await getUniLinkStats(userLinks[0].linkId);
        if (apptroveStats.success && apptroveStats.data) {
          // Use AppTrove data if available, otherwise use local
          const apptroveData = apptroveStats.data;
          const apptroveClicks = apptroveData.clicks || apptroveData.totalClicks || totalClicks;
          const apptroveConversions = apptroveData.conversions || apptroveData.totalConversions || totalConversions;
          const apptroveEarnings = apptroveData.earnings || apptroveData.totalEarnings || totalEarnings;
          const apptroveRate = apptroveClicks > 0 ? (apptroveConversions / apptroveClicks * 100).toFixed(2) : 0;
          
          const apptroveInstalls = apptroveData.installs || apptroveData.totalInstalls || 0;
          const apptrovePurchases = apptroveData.purchases || apptroveData.subscriptions || apptroveData.totalPurchases || 0;
          
          return res.json({
            ...user,
            links: userLinks.map(link => ({
              id: link.id,
              link: link.link,
              linkId: link.linkId,
              templateId: link.templateId,
              status: link.status,
              createdAt: link.createdAt,
              updatedAt: link.updatedAt
            })),
            stats: {
              totalClicks: apptroveClicks,
              totalConversions: apptroveConversions,
              totalEarnings: apptroveEarnings,
              totalInstalls: apptroveInstalls,
              totalPurchases: apptrovePurchases,
              conversionRate: parseFloat(apptroveRate),
              installRate: apptroveClicks > 0 ? ((apptroveInstalls / apptroveClicks) * 100).toFixed(2) : 0,
              purchaseRate: apptroveInstalls > 0 ? ((apptrovePurchases / apptroveInstalls) * 100).toFixed(2) : 0,
              lastActivity: userAnalytics.length > 0 
                ? userAnalytics[userAnalytics.length - 1].date 
                : user.createdAt,
              source: 'apptrove'
            }
          });
        }
      } catch (error) {
        console.error('Error fetching AppTrove stats for user:', error);
        // Fall through to return local stats
      }
    }

    // Calculate installs and purchases from analytics
    const totalInstalls = userAnalytics.reduce((sum, a) => sum + (a.installs || 0), 0);
    const totalPurchases = userAnalytics.reduce((sum, a) => sum + (a.purchases || 0), 0);
    const installRate = totalClicks > 0 ? ((totalInstalls / totalClicks) * 100).toFixed(2) : 0;
    const purchaseRate = totalInstalls > 0 ? ((totalPurchases / totalInstalls) * 100).toFixed(2) : 0;

    res.json({
      ...user,
      links: userLinks.map(link => ({
        id: link.id,
        link: link.link,
        linkId: link.linkId,
        templateId: link.templateId,
        status: link.status,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      })),
      stats: {
        totalClicks,
        totalConversions,
        totalEarnings,
        totalInstalls,
        totalPurchases,
        conversionRate: parseFloat(conversionRate),
        installRate: parseFloat(installRate),
        purchaseRate: parseFloat(purchaseRate),
        lastActivity: userAnalytics.length > 0 
          ? userAnalytics[userAnalytics.length - 1].date 
          : user.createdAt,
        source: 'local'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get user by email
app.get('/api/users/email/:email', rateLimit(RATE_LIMIT_AUTH_MAX), async (req, res) => {
  try {
    // Sanitize email input
    const email = decodeURIComponent(req.params.email).trim().toLowerCase();
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = await readDB();
    const user = db.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is deleted
    if (user.status === 'deleted' || user.approvalStatus === 'deleted') {
      return res.status(403).json({ error: 'User account has been deleted' });
    }

    // Get user's links
    const userLinks = db.links.filter(l => l.userId === user.id);

    res.json({
      ...user,
      links: userLinks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get user by phone
app.get('/api/users/phone/:phone', rateLimit(RATE_LIMIT_AUTH_MAX), async (req, res) => {
  try {
    // Sanitize phone input
    const phone = decodeURIComponent(req.params.phone).trim();
    const phoneDigits = phone.replace(/\D/g, '');
    
    // Validate phone format
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const db = await readDB();
    // Normalize phone numbers for comparison (remove non-digits)
    const user = db.users.find(u => {
      const userPhoneDigits = u.phone.replace(/\D/g, '');
      return userPhoneDigits === phoneDigits || userPhoneDigits.endsWith(phoneDigits) || phoneDigits.endsWith(userPhoneDigits);
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is deleted
    if (user.status === 'deleted' || user.approvalStatus === 'deleted') {
      return res.status(403).json({ error: 'User account has been deleted' });
    }

    // Get user's links
    const userLinks = db.links.filter(l => l.userId === user.id);

    res.json({
      ...user,
      links: userLinks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get all users (admin endpoint) with analytics
app.get('/api/users', isAdmin, async (req, res) => {
  try {
    const db = await readDB();
    const { search, platform, status, approvalStatus, sortBy, sortOrder } = req.query;
    
    let users = db.users.map(user => {
      const userLinks = db.links.filter(l => l.userId === user.id);
      const userAnalytics = db.analytics.filter(a => a.userId === user.id);
      
      // Calculate totals
      const totalClicks = userAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
      const totalConversions = userAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
      const totalEarnings = userAnalytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;
      
      return {
        ...user,
        links: userLinks,
        stats: {
          totalClicks,
          totalConversions,
          totalEarnings,
          conversionRate: parseFloat(conversionRate),
          lastActivity: userAnalytics.length > 0 
            ? userAnalytics[userAnalytics.length - 1].date 
            : user.createdAt
        }
      };
    });
    
    // Filter out deleted users by default (unless explicitly requested)
    const includeDeleted = req.query.includeDeleted === 'true';
    if (!includeDeleted) {
      users = users.filter(u => u.status !== 'deleted' && u.approvalStatus !== 'deleted');
    }
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.socialHandle && u.socialHandle.toLowerCase().includes(searchLower))
      );
    }
    
    if (platform) {
      users = users.filter(u => u.platform === platform);
    }
    
    if (approvalStatus) {
      users = users.filter(u => (u.approvalStatus || 'pending') === approvalStatus);
    }
    
    if (status) {
      users = users.filter(u => (u.status || 'active') === status);
    }
    
    // Apply sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      users.sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name) * order;
        } else if (sortBy === 'createdAt') {
          return (new Date(a.createdAt) - new Date(b.createdAt)) * order;
        } else if (sortBy === 'clicks') {
          return (a.stats.totalClicks - b.stats.totalClicks) * order;
        } else if (sortBy === 'conversions') {
          return (a.stats.totalConversions - b.stats.totalConversions) * order;
        } else if (sortBy === 'earnings') {
          return (a.stats.totalEarnings - b.stats.totalEarnings) * order;
        }
        return 0;
      });
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Get analytics for a specific user (fetches from AppTrove API)
app.get('/api/users/:id/analytics', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const db = await readDB();
    
    // Ensure db structure exists
    if (!db.users) db.users = [];
    if (!db.links) db.links = [];
    if (!db.analytics) db.analytics = [];
    
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is approved
    if (user.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'User not approved', message: 'Analytics are only available for approved users' });
    }
    
    // Get user's link
    const userLink = db.links.find(l => l.userId === user.id);
    
    let analytics = [];
    
    // Try to fetch from AppTrove API if link exists
    if (userLink && userLink.linkId && ((APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) || APPTROVE_API_KEY)) {
      try {
        const apptroveStats = await getUniLinkStats(userLink.linkId);
        
        if (apptroveStats && apptroveStats.success && apptroveStats.data) {
          // Transform AppTrove data to our format
          // Adjust based on actual AppTrove API response structure
          const apptroveData = apptroveStats.data;
          
          // Map AppTrove response to our analytics format
          // Include installs and purchases/subscriptions
          if (apptroveData.clicks || apptroveData.conversions || apptroveData.earnings) {
            analytics = [{
              date: new Date().toISOString(),
              clicks: apptroveData.clicks || apptroveData.totalClicks || 0,
              conversions: apptroveData.conversions || apptroveData.totalConversions || 0,
              earnings: apptroveData.earnings || apptroveData.totalEarnings || 0,
              installs: apptroveData.installs || apptroveData.totalInstalls || 0,
              purchases: apptroveData.purchases || apptroveData.subscriptions || apptroveData.totalPurchases || 0
            }];
          } else if (Array.isArray(apptroveData)) {
            analytics = apptroveData.map(item => ({
              date: item.date || item.timestamp || new Date().toISOString(),
              clicks: item.clicks || 0,
              conversions: item.conversions || 0,
              earnings: item.earnings || item.revenue || 0,
              installs: item.installs || 0,
              purchases: item.purchases || item.subscriptions || 0
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching AppTrove analytics:', error);
        // Fall back to local analytics if AppTrove fails
      }
    }
    
    // Fall back to local analytics if AppTrove data not available
    if (analytics.length === 0) {
      analytics = db.analytics.filter(a => a.userId === req.params.id);
    }
    
    // Apply date filters
    if (startDate) {
      analytics = analytics.filter(a => new Date(a.date) >= new Date(startDate));
    }
    if (endDate) {
      analytics = analytics.filter(a => new Date(a.date) <= new Date(endDate));
    }
    
    // Group by day/week/month if needed
    if (groupBy === 'day') {
      const grouped = {};
      analytics.forEach(a => {
        const date = a.date.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = { date, clicks: 0, conversions: 0, earnings: 0, installs: 0, purchases: 0 };
        }
        grouped[date].clicks += a.clicks || 0;
        grouped[date].conversions += a.conversions || 0;
        grouped[date].earnings += a.earnings || 0;
        grouped[date].installs += a.installs || 0;
        grouped[date].purchases += a.purchases || 0;
      });
      analytics = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Error in /api/users/:id/analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Sync analytics from AppTrove API for a specific user
app.post('/api/users/:id/sync-analytics', async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'User not approved' });
    }
    
    const userLink = db.links.find(l => l.userId === user.id);
    
    if (!userLink || !userLink.linkId) {
      return res.status(404).json({ error: 'User link not found. Please ensure user has been approved and unilink created.' });
    }
    
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    
    // Fetch latest stats from AppTrove using linkId
    console.log(`Fetching analytics for link ${userLink.linkId}`);
    const apptroveStats = await getUniLinkStats(userLink.linkId);
    
    if (apptroveStats.success && apptroveStats.data) {
      // Extract stats from AppTrove response
      const stats = apptroveStats.data;
      
      // Save to local analytics
      const analyticsEntry = {
        id: uuidv4(),
        userId: user.id,
        linkId: userLink.id,
        clicks: stats.clicks || 0,
        impressions: stats.impressions || 0,
        installs: stats.installs || stats.totalInstalls || 0,
        conversions: stats.conversions || 0,
        purchases: stats.purchases || stats.subscriptions || stats.totalPurchases || 0,
        earnings: stats.revenue || stats.earnings || 0,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        source: 'apptrove',
        rawData: apptroveStats.rawData // Store raw data for reference
      };
      
      db.analytics.push(analyticsEntry);
      await writeDB(db);
      
      res.json({
        success: true,
        message: 'Analytics synced successfully from AppTrove',
        data: analyticsEntry,
        stats: {
          clicks: stats.clicks,
          impressions: stats.impressions,
          installs: stats.installs,
          conversions: stats.conversions,
          revenue: stats.revenue
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to sync analytics',
        details: apptroveStats.error || 'Unknown error',
        message: 'Please check AppTrove API configuration and link ID'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync analytics', details: error.message });
  }
});

// Update user information (admin only)
app.put('/api/users/:id', isAdmin, async (req, res) => {
  try {
    const { name, phone, platform, socialHandle, followerCount, status, approvalStatus, adminNotes, unilink, linkId, templateId } = req.body;
    const db = await readDB();
    
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user fields
    if (name) db.users[userIndex].name = name;
    if (phone) db.users[userIndex].phone = phone;
    if (platform !== undefined) db.users[userIndex].platform = platform;
    if (socialHandle !== undefined) db.users[userIndex].socialHandle = socialHandle;
    if (followerCount !== undefined) db.users[userIndex].followerCount = followerCount;
    if (status !== undefined) db.users[userIndex].status = status;
    if (approvalStatus !== undefined) {
      db.users[userIndex].approvalStatus = approvalStatus;
      if (approvalStatus === 'approved') {
        db.users[userIndex].approvedAt = new Date().toISOString();
        db.users[userIndex].status = 'active';
      } else if (approvalStatus === 'rejected') {
        db.users[userIndex].status = 'inactive';
      }
    }
    if (adminNotes !== undefined) db.users[userIndex].adminNotes = adminNotes;
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    // Allow manual unilink assignment
    if (unilink) {
      const existingLinkIndex = db.links.findIndex(l => l.userId === db.users[userIndex].id);
      
      if (existingLinkIndex >= 0) {
        db.links[existingLinkIndex].link = unilink;
        if (linkId) db.links[existingLinkIndex].linkId = linkId;
        if (templateId) db.links[existingLinkIndex].templateId = templateId;
        db.links[existingLinkIndex].status = 'active';
        db.links[existingLinkIndex].updatedAt = new Date().toISOString();
      } else {
        const newLink = {
          id: uuidv4(),
          userId: db.users[userIndex].id,
          link: unilink,
          linkId: linkId || null,
          templateId: templateId || null,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.links.push(newLink);
      }
    }
    
    await writeDB(db);
    
    res.json(db.users[userIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Approve user (admin only) - Creates AppTrove unilink on approval
app.post('/api/users/:id/approve', isAdmin, async (req, res) => {
  try {
    const { adminNotes, approvedBy } = req.body;
    const db = await readDB();
    
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = db.users[userIndex];
    
    // Update user approval status
    db.users[userIndex].approvalStatus = 'approved';
    db.users[userIndex].status = 'active';
    db.users[userIndex].approvedBy = approvedBy || 'admin';
    db.users[userIndex].approvedAt = new Date().toISOString();
    if (adminNotes) db.users[userIndex].adminNotes = adminNotes;
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    // Create AppTrove UniLink Template and Link for approved user
    let unilink = null;
    let linkId = null;
    let templateId = null;
    let linkError = null;
    
    if (APPTROVE_API_KEY) {
      try {
        // Use the "EduRise" template (ID: wBehUW) for all new users
        const EDURISE_TEMPLATE_ID = process.env.APPTROVE_TEMPLATE_ID || 'wBehUW';
        
        console.log(`Using EduRise template (${EDURISE_TEMPLATE_ID}) for user ${user.id} (${user.name})`);
        templateId = EDURISE_TEMPLATE_ID;

        // Create a unilink from the EduRise template
        const linkName = `${user.name} - Affiliate Link`;
        console.log(`Creating UniLink from template ${templateId}`);
        const linkResult = await createUniLinkFromTemplate(templateId, linkName, {
          // Custom parameters if needed
        });

        if (linkResult.success && linkResult.link) {
          unilink = linkResult.link;
          linkId = linkResult.linkId;
          console.log(`✅ UniLink created: ${unilink} (ID: ${linkId})`);
        } else {
          linkError = linkResult.error || 'Failed to create unilink from template';
          console.error('UniLink creation failed:', linkError);
          console.error('Tried template ID:', templateId);
          if (linkResult.responseData) {
            console.error('AppTrove API response:', JSON.stringify(linkResult.responseData, null, 2));
          }
          // Note: Links may need to be created manually in AppTrove dashboard
          console.warn('⚠️  Note: You may need to create the link manually in AppTrove dashboard and assign it to the user');
        }
      } catch (error) {
        console.error('Error creating AppTrove unilink:', error);
        linkError = error.message;
      }
    } else {
      linkError = 'AppTrove API key not configured';
    }
    
    // Save or update link in database
    if (unilink) {
      const existingLinkIndex = db.links.findIndex(l => l.userId === user.id);
      
      if (existingLinkIndex >= 0) {
        // Update existing link
        db.links[existingLinkIndex].link = unilink;
        db.links[existingLinkIndex].linkId = linkId;
        db.links[existingLinkIndex].templateId = templateId;
        db.links[existingLinkIndex].status = 'active';
        db.links[existingLinkIndex].updatedAt = new Date().toISOString();
        console.log(`Updated existing link for user ${user.id}`);
      } else {
        // Create new link entry
        const newLink = {
          id: uuidv4(),
          userId: user.id,
          link: unilink,
          linkId: linkId,
          templateId: templateId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.links.push(newLink);
        console.log(`Created new link entry for user ${user.id}`);
      }
    } else {
      console.warn(`No unilink created for user ${user.id}. Error: ${linkError}`);
    }
    
    await writeDB(db);
    
    // Return response with unilink information
    const updatedUser = {
      ...db.users[userIndex],
      unilink: unilink
    };
    
    res.json({
      success: true,
      user: updatedUser,
      message: unilink 
        ? `User approved successfully! UniLink created: ${unilink}`
        : `User approved successfully. ${linkError ? 'Warning: ' + linkError : 'Unilink creation pending. Please check AppTrove API configuration.'}`,
      unilink: unilink,
      linkId: linkId,
      templateId: templateId,
      warning: linkError || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user', details: error.message });
  }
});

// Reject user (admin only)
app.post('/api/users/:id/reject', isAdmin, async (req, res) => {
  try {
    const { adminNotes, approvedBy } = req.body;
    const db = await readDB();
    
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    db.users[userIndex].approvalStatus = 'rejected';
    db.users[userIndex].status = 'inactive';
    db.users[userIndex].approvedBy = approvedBy || 'admin';
    db.users[userIndex].approvedAt = new Date().toISOString();
    if (adminNotes) db.users[userIndex].adminNotes = adminNotes;
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      user: db.users[userIndex],
      message: 'User rejected'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject user', details: error.message });
  }
});

// Delete user (admin only) - Soft delete
app.delete('/api/users/:id', isAdmin, async (req, res) => {
  try {
    const db = await readDB();
    
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Soft delete - mark as deleted instead of removing
    db.users[userIndex].status = 'deleted';
    db.users[userIndex].approvalStatus = 'deleted';
    db.users[userIndex].deletedAt = new Date().toISOString();
    db.users[userIndex].deletedBy = req.user?.email || 'admin';
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      user: {
        id: db.users[userIndex].id,
        name: db.users[userIndex].name,
        email: db.users[userIndex].email,
        status: 'deleted'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// Record analytics data (clicks, conversions, earnings)
app.post('/api/analytics', async (req, res) => {
  try {
    const { userId, linkId, clicks, conversions, earnings, date } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const db = await readDB();
    
    const analyticsEntry = {
      id: uuidv4(),
      userId,
      linkId: linkId || null,
      clicks: clicks || 0,
      conversions: conversions || 0,
      earnings: earnings || 0,
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    db.analytics.push(analyticsEntry);
    await writeDB(db);
    
    res.status(201).json(analyticsEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record analytics', details: error.message });
  }
});

// Get dashboard statistics (admin only) - Enhanced with AppTrove data
app.get('/api/dashboard/stats', isAdmin, async (req, res) => {
  try {
    const db = await readDB();
    
    // Ensure db structure exists
    if (!db.users) db.users = [];
    if (!db.links) db.links = [];
    if (!db.analytics) db.analytics = [];
    
    const totalAffiliates = db.users.length;
    const activeAffiliates = db.users.filter(u => u.status !== 'inactive').length;
    
    // Fetch stats from AppTrove for all links using Secret ID/Key
    let totalClicks = 0;
    let totalConversions = 0;
    let totalEarnings = 0;
    let totalInstalls = 0;
    let totalPurchases = 0;
    
    // Use Secret ID/Key if available, otherwise fall back to API key
    if ((APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) || APPTROVE_API_KEY) {
      for (const link of db.links) {
        if (link.linkId) {
          try {
            const stats = await getUniLinkStats(link.linkId);
            if (stats && stats.success && stats.data) {
              const data = stats.data;
              totalClicks += data.clicks || 0;
              totalConversions += data.conversions || 0;
              totalEarnings += data.revenue || data.earnings || 0;
              totalInstalls += data.installs || 0;
              totalPurchases += data.purchases || 0;
            }
          } catch (error) {
            console.error(`Error fetching stats for link ${link.linkId}:`, error.message);
            // Continue with next link
          }
        }
      }
    }
    
    // Fallback to local analytics if AppTrove data not available
    if (totalClicks === 0 && totalConversions === 0) {
      totalClicks = db.analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
      totalConversions = db.analytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
      totalEarnings = db.analytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
    }
    
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;
    const installRate = totalClicks > 0 ? (totalInstalls / totalClicks * 100).toFixed(2) : 0;
    const purchaseRate = totalInstalls > 0 ? (totalPurchases / totalInstalls * 100).toFixed(2) : 0;
    
    // Get top performers with AppTrove data
    const userStats = await Promise.all(db.users.map(async (user) => {
      const userLink = db.links.find(l => l.userId === user.id);
      let earnings = 0;
      let clicks = 0;
      let conversions = 0;
      
      if (userLink && userLink.linkId && ((APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) || APPTROVE_API_KEY)) {
        try {
          const stats = await getUniLinkStats(userLink.linkId);
          if (stats && stats.success && stats.data) {
            earnings = stats.data.revenue || stats.data.earnings || 0;
            clicks = stats.data.clicks || 0;
            conversions = stats.data.conversions || 0;
          }
        } catch (error) {
          // Fallback to local
          console.error(`Error fetching stats for user ${user.id}:`, error.message);
        }
      }
      
      if (earnings === 0) {
        const userAnalytics = db.analytics.filter(a => a.userId === user.id);
        earnings = userAnalytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
        clicks = userAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
        conversions = userAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
      }
      
      return { userId: user.id, name: user.name, earnings, clicks, conversions };
    }));
    
    const topPerformers = userStats.sort((a, b) => b.earnings - a.earnings).slice(0, 5);
    
    // Get recent activity
    const recentAnalytics = db.analytics
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(a => {
        const user = db.users.find(u => u.id === a.userId);
        return {
          ...a,
          userName: user?.name || 'Unknown'
        };
      });
    
    res.json({
      overview: {
        totalAffiliates,
        activeAffiliates,
        totalClicks,
        totalConversions,
        totalEarnings,
        totalInstalls,
        totalPurchases,
        conversionRate: parseFloat(conversionRate),
        installRate: parseFloat(installRate),
        purchaseRate: parseFloat(purchaseRate),
        averageEarningsPerAffiliate: activeAffiliates > 0 ? parseFloat((totalEarnings / activeAffiliates).toFixed(2)) : 0
      },
      topPerformers,
      recentActivity: recentAnalytics
    });
  } catch (error) {
    console.error('Error in /api/dashboard/stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get existing links from AppTrove templates (admin only)
app.get('/api/apptrove/templates/:templateId/links', isAdmin, async (req, res) => {
  try {
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    
    const { templateId } = req.params;
    const result = await getTemplateLinks(templateId);
    
    if (result.success) {
      res.json({
        success: true,
        links: result.links.map(link => ({
          id: link._id || link.id,
          name: link.name || link.cname,
          shortUrl: link.shortUrl,
          longUrl: link.longUrl,
          status: link.status,
          createdAt: link.created || link.createdAt,
          clicks: link.clicks || 0,
          conversions: link.conversions || 0
        }))
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch links', details: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch links', details: error.message });
  }
});

// Get all templates (admin only)
app.get('/api/apptrove/templates', isAdmin, async (req, res) => {
  try {
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    
    const templates = await getLinkTemplates();
    res.json({
      success: true,
      templates: templates.linkTemplateList || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

// Create link from template and assign to user (admin only)
app.post('/api/apptrove/templates/:templateId/create-link', isAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, userId } = req.body;
    
    console.log(`Creating link from template ${templateId} for user ${userId}`);
    
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const db = await readDB();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const linkName = name || `${user.name} - Affiliate Link`;
    
    console.log(`Attempting to create unilink: ${linkName} from template ${templateId}`);
    
    // Create unilink from template
    const linkResult = await createUniLinkFromTemplate(templateId, linkName);
    
    console.log('Link creation result:', {
      success: linkResult.success,
      hasLink: !!linkResult.link,
      error: linkResult.error,
      linkId: linkResult.linkId,
      note: linkResult.note
    });
    
    if (linkResult.success && linkResult.link) {
      // Automatically assign the link to the user
      const existingLinkIndex = db.links.findIndex(l => l.userId === userId);
      
      if (existingLinkIndex >= 0) {
        // Update existing link
        db.links[existingLinkIndex].link = linkResult.link;
        db.links[existingLinkIndex].linkId = linkResult.linkId;
        db.links[existingLinkIndex].templateId = templateId;
        db.links[existingLinkIndex].status = 'active';
        db.links[existingLinkIndex].updatedAt = new Date().toISOString();
        console.log(`Updated existing link for user ${userId}`);
      } else {
        // Create new link entry
        const newLink = {
          id: uuidv4(),
          userId: userId,
          link: linkResult.link,
          linkId: linkResult.linkId,
          templateId: templateId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.links.push(newLink);
        console.log(`Created new link entry for user ${userId}`);
      }
      
      await writeDB(db);
      
      // Return success response
      res.json({
        success: true,
        link: linkResult.link,
        linkId: linkResult.linkId,
        templateId: templateId,
        message: 'Link created and assigned successfully'
      });
    } else {
      console.error('Link creation failed:', linkResult);
      
      // Check if this is the "API not available" error with solution
      if (linkResult.solution) {
        return res.status(400).json({
          error: 'AppTrove API does not support programmatic link creation',
          details: linkResult.error,
          solution: linkResult.solution,
          message: 'Links must be created manually in AppTrove dashboard. See solution steps below.',
          help: {
            dashboardUrl: linkResult.solution.dashboardUrl,
            templateId: linkResult.solution.templateId,
            templateName: linkResult.solution.templateName
          }
        });
      }
      
      // Other errors
      res.status(500).json({
        error: linkResult.error || 'Failed to create link',
        details: linkResult.details || 'Unknown error',
        responseData: linkResult.responseData,
        message: 'Please create the link manually in AppTrove dashboard and assign it using the manual URL option.'
      });
    }
  } catch (error) {
    console.error('Error creating link from template:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create link', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Assign existing link to user (admin only)
app.post('/api/users/:id/assign-link', isAdmin, async (req, res) => {
  try {
    const { unilink, linkId, templateId } = req.body;
    
    if (!unilink) {
      return res.status(400).json({ error: 'Unilink URL is required' });
    }
    
    const db = await readDB();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if link already exists
    const existingLinkIndex = db.links.findIndex(l => l.userId === req.params.id);
    
    if (existingLinkIndex >= 0) {
      // Update existing link
      db.links[existingLinkIndex].link = unilink;
      if (linkId) db.links[existingLinkIndex].linkId = linkId;
      if (templateId) db.links[existingLinkIndex].templateId = templateId;
      db.links[existingLinkIndex].status = 'active';
      db.links[existingLinkIndex].updatedAt = new Date().toISOString();
    } else {
      // Create new link entry
      const newLink = {
        id: uuidv4(),
        userId: req.params.id,
        link: unilink,
        linkId: linkId || null,
        templateId: templateId || null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.links.push(newLink);
    }
    
    await writeDB(db);
    
    res.json({
      success: true,
      message: 'Link assigned successfully',
      link: db.links.find(l => l.userId === req.params.id)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign link', details: error.message });
  }
});

// Get analytics data for charts (admin only)
app.get('/api/dashboard/analytics', isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const db = await readDB();
    
    // Ensure db structure exists
    if (!db.links) db.links = [];
    if (!db.analytics) db.analytics = [];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Fetch analytics from AppTrove for all links using Secret ID/Key
    const analyticsMap = new Map();
    
    // Use Secret ID/Key if available, otherwise fall back to API key
    if ((APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) || APPTROVE_API_KEY) {
      for (const link of db.links) {
        if (link.linkId) {
          try {
            const stats = await getUniLinkStats(link.linkId);
            if (stats && stats.success && stats.data) {
              const data = stats.data;
              const date = new Date().toISOString().split('T')[0];
              
              if (!analyticsMap.has(date)) {
                analyticsMap.set(date, { date, clicks: 0, conversions: 0, earnings: 0, installs: 0, purchases: 0 });
              }
              
              const entry = analyticsMap.get(date);
              entry.clicks += data.clicks || 0;
              entry.conversions += data.conversions || 0;
              entry.earnings += data.revenue || data.earnings || 0;
              entry.installs += data.installs || 0;
              entry.purchases += data.purchases || 0;
            }
          } catch (error) {
            console.error(`Error fetching stats for link ${link.linkId}:`, error.message);
            // Continue with next link
          }
        }
      }
    }
    
    // Fallback to local analytics
    if (analyticsMap.size === 0) {
      const localAnalytics = db.analytics.filter(a => new Date(a.date) >= startDate);
      
      localAnalytics.forEach(a => {
        const date = new Date(a.date).toISOString().split('T')[0];
        if (!analyticsMap.has(date)) {
          analyticsMap.set(date, { date, clicks: 0, conversions: 0, earnings: 0, installs: 0, purchases: 0 });
        }
        
        const entry = analyticsMap.get(date);
        entry.clicks += a.clicks || 0;
        entry.conversions += a.conversions || 0;
        entry.earnings += a.earnings || 0;
        entry.installs += a.installs || 0;
        entry.purchases += a.purchases || 0;
      });
    }
    
    const analytics = Array.from(analyticsMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(analytics);
  } catch (error) {
    console.error('Error in /api/dashboard/analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Sync analytics from AppTrove API (if available)
app.post('/api/analytics/sync', async (req, res) => {
  try {
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    
    // This is a placeholder - you'll need to check AppTrove API docs
    // for the actual endpoint to fetch link analytics
    // Common endpoints might be:
    // - GET /internal/unilink/:id/stats
    // - GET /internal/analytics
    // - GET /api/reports
    
    const db = await readDB();
    const links = db.links;
    
    // For each link, fetch stats from AppTrove
    const syncResults = [];
    
    for (const link of links) {
      try {
        // Placeholder - replace with actual API call
        // const response = await axios.get(`${APPTROVE_API_URL}/internal/unilink/${link.id}/stats`, {
        //   headers: { 'api-key': APPTROVE_API_KEY }
        // });
        
        // For now, return a message that sync needs to be implemented
        syncResults.push({
          linkId: link.id,
          status: 'pending',
          message: 'Sync endpoint needs to be configured with AppTrove API'
        });
      } catch (error) {
        syncResults.push({
          linkId: link.id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Sync completed',
      results: syncResults,
      note: 'Please configure AppTrove API endpoint for analytics sync'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync analytics', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Initialize server
async function startServer() {
  try {
    await ensureDataDir();
    
    app.listen(PORT, () => {
      console.log('\n🚀 Server started successfully!');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📊 Database: ${DB_PATH}`);
      console.log(`🔑 AppTrove API: ${APPTROVE_API_KEY ? '✅ Configured' : '⚠️  Not configured (using placeholder links)'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`\n📝 Available endpoints:`);
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/templates`);
      console.log(`   POST /api/users/register`);
      console.log(`   GET  /api/users`);
      console.log(`   GET  /api/users/:id`);
      console.log(`   GET  /api/dashboard/stats`);
      console.log(`\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch(console.error);
