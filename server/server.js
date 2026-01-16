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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'database.json');
const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY;
const APPTROVE_API_URL = process.env.APPTROVE_API_URL || 'https://api.apptrove.com';

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

// CORS with security - Allow multiple origins for development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all localhost and 127.0.0.1 origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.indexOf(origin) !== -1) {
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
    
    if (response.data && response.data.linkTemplateList) {
      return response.data;
    }
    
    // Handle different response structures
    return response.data || { linkTemplateList: [] };
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

// AppTrove API: Create UniLink from template
async function createUniLink(templateId, linkName, customParams = {}) {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    // Based on AppTrove API documentation: https://developers.apptrove.com/docs/mmp-api/unilink/
    // Create a unilink from a template
    const response = await axios.post(
      `${APPTROVE_API_URL}/internal/unilink`,
      {
        templateId: templateId,
        name: linkName,
        ...customParams
      },
      {
        headers: {
          'api-key': APPTROVE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    // AppTrove typically returns the link in various possible fields
    const linkData = response.data;
    return {
      success: true,
      link: linkData.link || linkData.url || linkData.unilink || linkData.data?.link || linkData.data?.url,
      linkId: linkData.id || linkData.linkId || linkData.data?.id,
      data: linkData
    };
  } catch (error) {
    console.error('Error creating UniLink:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      success: false,
      error: error.message,
      link: null
    };
  }
}

// AppTrove API: Get unilink analytics/stats
async function getUniLinkStats(linkId) {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    // Fetch analytics for a specific unilink
    // Adjust endpoint based on actual AppTrove API documentation
    const response = await axios.get(
      `${APPTROVE_API_URL}/internal/unilink/${linkId}/stats`,
      {
        headers: {
          'api-key': APPTROVE_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return {
      success: true,
      data: response.data
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
      data: null
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

    // Note: Instagram Basic Display API requires OAuth, so we'll use a simpler approach
    // For production, you'd need to use Instagram Graph API with proper authentication
    // This is a placeholder that checks if the profile URL is accessible
    
    // Try to fetch profile page (this may be blocked by Instagram, but we'll try)
    const profileUrl = `https://www.instagram.com/${username}/`;
    
    // In a real implementation, you'd use Instagram Graph API
    // For now, we'll return a mock response structure
    // You'll need to implement actual API calls with proper authentication
    
    return {
      verified: true, // Set to false if you want to require actual API verification
      followers: 0, // Will be fetched from actual API
      username: username,
      profileUrl: profileUrl,
      note: 'Instagram verification requires API setup. Please configure Instagram Graph API credentials.'
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message
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

    // Note: YouTube Data API v3 requires an API key
    // You'll need to set YOUTUBE_API_KEY in environment variables
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
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
      // Try to get channel by username (forCustomUrl)
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
    } else {
      return {
        verified: false,
        error: 'Invalid YouTube URL or handle format'
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
        error: 'Channel not found'
      };
    }
  } catch (error) {
    console.error('YouTube verification error:', error.message);
    return {
      verified: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to verify YouTube channel'
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

async function verifySocialMedia(platform, handle) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return await verifyInstagram(handle);
    case 'youtube':
      return await verifyYouTube(handle);
    case 'facebook':
      return await verifyFacebook(handle);
    case 'twitter/x':
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
        error: `Unsupported platform: ${platform}`
      };
  }
}

// AppTrove API: Get template link list (to find existing links)
async function getTemplateLinks(templateId) {
  try {
    if (!APPTROVE_API_KEY) {
      throw new Error('AppTrove API key not configured');
    }

    const response = await axios.get(
      `${APPTROVE_API_URL}/internal/link-template/${templateId}/links`,
      {
        headers: {
          'api-key': APPTROVE_API_KEY,
          'Accept': 'application/json'
        },
        params: {
          limit: 100
        },
        timeout: 10000
      }
    );
    
    return {
      success: true,
      links: response.data.links || response.data.linkList || response.data || []
    };
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
          
          return res.json({
            ...user,
            links: userLinks,
            stats: {
              totalClicks: apptroveClicks,
              totalConversions: apptroveConversions,
              totalEarnings: apptroveEarnings,
              conversionRate: parseFloat(apptroveRate),
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

    res.json({
      ...user,
      links: userLinks,
      stats: {
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate: parseFloat(conversionRate),
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
    if (userLink && userLink.linkId && APPTROVE_API_KEY) {
      try {
        const apptroveStats = await getUniLinkStats(userLink.linkId);
        
        if (apptroveStats.success && apptroveStats.data) {
          // Transform AppTrove data to our format
          // Adjust based on actual AppTrove API response structure
          const apptroveData = apptroveStats.data;
          
          // Map AppTrove response to our analytics format
          // This may need adjustment based on actual API response
          if (apptroveData.clicks || apptroveData.conversions || apptroveData.earnings) {
            analytics = [{
              date: new Date().toISOString(),
              clicks: apptroveData.clicks || apptroveData.totalClicks || 0,
              conversions: apptroveData.conversions || apptroveData.totalConversions || 0,
              earnings: apptroveData.earnings || apptroveData.totalEarnings || 0
            }];
          } else if (Array.isArray(apptroveData)) {
            analytics = apptroveData.map(item => ({
              date: item.date || item.timestamp || new Date().toISOString(),
              clicks: item.clicks || 0,
              conversions: item.conversions || 0,
              earnings: item.earnings || item.revenue || 0
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
          grouped[date] = { date, clicks: 0, conversions: 0, earnings: 0 };
        }
        grouped[date].clicks += a.clicks || 0;
        grouped[date].conversions += a.conversions || 0;
        grouped[date].earnings += a.earnings || 0;
      });
      analytics = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
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
      return res.status(404).json({ error: 'User link not found' });
    }
    
    if (!APPTROVE_API_KEY) {
      return res.status(500).json({ error: 'AppTrove API key not configured' });
    }
    
    // Fetch latest stats from AppTrove
    const apptroveStats = await getUniLinkStats(userLink.linkId);
    
    if (apptroveStats.success && apptroveStats.data) {
      // Save to local analytics
      const analyticsEntry = {
        id: uuidv4(),
        userId: user.id,
        linkId: userLink.id,
        clicks: apptroveStats.data.clicks || apptroveStats.data.totalClicks || 0,
        conversions: apptroveStats.data.conversions || apptroveStats.data.totalConversions || 0,
        earnings: apptroveStats.data.earnings || apptroveStats.data.totalEarnings || 0,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        source: 'apptrove'
      };
      
      db.analytics.push(analyticsEntry);
      await writeDB(db);
      
      res.json({
        success: true,
        message: 'Analytics synced successfully',
        data: analyticsEntry
      });
    } else {
      res.status(500).json({
        error: 'Failed to sync analytics',
        details: apptroveStats.error || 'Unknown error'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync analytics', details: error.message });
  }
});

// Update user information (admin only)
app.put('/api/users/:id', isAdmin, async (req, res) => {
  try {
    const { name, phone, platform, socialHandle, followerCount, status, approvalStatus, adminNotes } = req.body;
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
    
    // Create AppTrove UniLink for approved user
    let unilink = null;
    let linkId = null;
    let linkError = null;
    let templateId = null;
    
    if (APPTROVE_API_KEY) {
      try {
        // Get available templates
        const templates = await getLinkTemplates();
        const template = templates.linkTemplateList?.[0];
        templateId = template?.id || null;
        
        if (template) {
          // Create UniLink for this user
          const linkName = `${user.name} - ${user.email}`;
          const linkResult = await createUniLink(template.id, linkName, {
            // Add any custom parameters for the link
            // These may vary based on AppTrove API requirements
          });
          
          if (linkResult.success && linkResult.link) {
            unilink = linkResult.link;
            linkId = linkResult.linkId;
          } else {
            linkError = linkResult.error || 'Failed to create unilink';
            console.error('UniLink creation failed:', linkError);
          }
        } else {
          linkError = 'No active template found';
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
      }
    }
    
    await writeDB(db);
    
    res.json({
      success: true,
      user: {
        ...db.users[userIndex],
        unilink: unilink
      },
      message: unilink 
        ? 'User approved successfully and unilink created'
        : `User approved successfully. ${linkError ? 'Warning: ' + linkError : 'Unilink creation pending.'}`,
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

// Get dashboard statistics (admin only)
app.get('/api/dashboard/stats', isAdmin, async (req, res) => {
  try {
    const db = await readDB();
    
    const totalAffiliates = db.users.length;
    const activeAffiliates = db.users.filter(u => u.status !== 'inactive').length;
    
    const totalClicks = db.analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const totalConversions = db.analytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
    const totalEarnings = db.analytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;
    
    // Get top performers
    const userStats = db.users.map(user => {
      const userAnalytics = db.analytics.filter(a => a.userId === user.id);
      const earnings = userAnalytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
      return { userId: user.id, name: user.name, earnings };
    }).sort((a, b) => b.earnings - a.earnings).slice(0, 5);
    
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
        conversionRate: parseFloat(conversionRate)
      },
      topPerformers: userStats,
      recentActivity: recentAnalytics
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
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
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
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
