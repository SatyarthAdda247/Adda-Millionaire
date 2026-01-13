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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  // Basic phone validation - accepts digits, spaces, dashes, parentheses, plus
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10;
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

async function createUniLink(templateId, userId, userData) {
  try {
    // Note: You'll need to check the actual AppTrove API documentation
    // for the correct endpoint and parameters to create a UniLink
    // This is a placeholder implementation
    
    // Common endpoints to try:
    // - POST /internal/unilink
    // - POST /internal/unilink/create
    // - POST /api/unilink
    
    const response = await axios.post(
      `${APPTROVE_API_URL}/internal/unilink`,
      {
        templateId: templateId,
        userId: userId,
        name: userData.name || `Link for ${userData.email}`,
        // Add other required fields based on AppTrove API documentation
        // Common fields might include:
        // - campaignId
        // - deepLink
        // - fallbackUrl
        // - etc.
      },
      {
        headers: {
          'api-key': APPTROVE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    // If the endpoint doesn't work, log the error but don't fail completely
    console.error('Error creating UniLink:', error.response?.data || error.message);
    
    // Return a placeholder link structure that can be used
    // In production, you might want to handle this differently
    return {
      link: null,
      error: error.message,
      // Some APIs return the link in different fields
      url: null,
      unilink: null
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

// Register new user and create Trackier link
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, phone, platform, socialHandle, followerCount } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, and phone are required' 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address' 
      });
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number',
        details: 'Please provide a valid phone number (at least 10 digits)' 
      });
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPhone = phone.trim();

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

    // Create new user with pending approval status
    const newUser = {
      id: uuidv4(),
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      platform: (platform || '').trim(),
      socialHandle: (socialHandle || '').trim(),
      followerCount: (followerCount || '').trim(),
      status: 'pending', // New users need approval
      approvalStatus: 'pending', // pending, approved, rejected
      adminNotes: '',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get link templates and create Trackier link
    let trackierLink = null;
    let linkError = null;
    let templateId = null;

    if (APPTROVE_API_KEY) {
      try {
        const templates = await getLinkTemplates();
        
        // Use the first active template or a default one
        const template = templates.linkTemplateList?.[0];
        templateId = template?.id || null;
        
        if (template) {
          // Create UniLink for this user
          const linkData = await createUniLink(template.id, newUser.id, {
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone
          });
          
          // Try different possible response fields (AppTrove API may return link in different formats)
          trackierLink = linkData.link || 
                        linkData.url || 
                        linkData.unilink || 
                        linkData.data?.link || 
                        linkData.data?.url ||
                        linkData.data?.unilink ||
                        null;
          
          // If link creation failed, log but continue
          if (!trackierLink) {
            if (linkData.error) {
              linkError = linkData.error;
            } else {
              // Generate a placeholder link that can be updated later
              trackierLink = `https://trackier.link/${newUser.id}`;
              linkError = 'Link created but may need manual verification';
            }
          }
        } else {
          // No template available, create a placeholder link
          trackierLink = `https://trackier.link/${newUser.id}`;
          linkError = 'No active template found. Link created as placeholder.';
        }
      } catch (error) {
        console.error('Error creating Trackier link:', {
          message: error.message,
          userId: newUser.id,
          email: newUser.email
        });
        linkError = error.message;
        // Create placeholder link so user can still be registered
        trackierLink = `https://trackier.link/${newUser.id}`;
      }
    } else {
      // No API key configured, create placeholder link
      trackierLink = `https://trackier.link/${newUser.id}`;
      linkError = 'AppTrove API key not configured. Link is a placeholder.';
    }

    // Save user to database
    db.users.push(newUser);
    await writeDB(db);

    // Save link if created
    if (trackierLink) {
      const newLink = {
        id: uuidv4(),
        userId: newUser.id,
        link: trackierLink,
        templateId: templateId,
        status: linkError ? 'pending' : 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.links.push(newLink);
      await writeDB(db);
    }

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        trackierLink: trackierLink || null
      },
      message: linkError 
        ? 'User created successfully. Trackier link may need verification.'
        : 'User registered successfully and Trackier link created',
      warning: linkError || null
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

// Get user by email
app.get('/api/users/email/:email', async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.email === req.params.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.socialHandle.toLowerCase().includes(searchLower)
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

// Get analytics for a specific user
app.get('/api/users/:id/analytics', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const db = await readDB();
    
    let analytics = db.analytics.filter(a => a.userId === req.params.id);
    
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

// Approve user (admin only)
app.post('/api/users/:id/approve', isAdmin, async (req, res) => {
  try {
    const { adminNotes, approvedBy } = req.body;
    const db = await readDB();
    
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    db.users[userIndex].approvalStatus = 'approved';
    db.users[userIndex].status = 'active';
    db.users[userIndex].approvedBy = approvedBy || 'admin';
    db.users[userIndex].approvedAt = new Date().toISOString();
    if (adminNotes) db.users[userIndex].adminNotes = adminNotes;
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      user: db.users[userIndex],
      message: 'User approved successfully'
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
