import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'database.json');
const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY;
const APPTROVE_API_URL = process.env.APPTROVE_API_URL || 'https://api.apptrove.com';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

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

// AppTrove API helper functions
async function getLinkTemplates() {
  try {
    const response = await axios.get(`${APPTROVE_API_URL}/internal/link-template`, {
      headers: {
        'api-key': APPTROVE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        status: 'active',
        limit: 100
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching link templates:', error.response?.data || error.message);
    throw error;
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
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const db = await readDB();

    // Check if user already exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      phone,
      platform: platform || '',
      socialHandle: socialHandle || '',
      followerCount: followerCount || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get link templates
    let trackierLink = null;
    let linkError = null;

    if (APPTROVE_API_KEY) {
      try {
        const templates = await getLinkTemplates();
        
        // Use the first active template or a default one
        const template = templates.linkTemplateList?.[0];
        
        if (template) {
          // Create UniLink for this user
          // Note: You may need to adjust this based on actual AppTrove API
          const linkData = await createUniLink(template.id, newUser.id, {
            name: newUser.name,
            email: newUser.email
          });
          
          // Try different possible response fields
          trackierLink = linkData.link || linkData.url || linkData.unilink || linkData.data?.link || null;
          
          // If link creation failed but we have template info, create a placeholder
          if (!trackierLink && !linkData.error) {
            // Generate a placeholder link - replace with actual API response
            trackierLink = `${APPTROVE_API_URL}/link/${newUser.id}`;
          }
        } else {
          // No template available, create a placeholder link
          trackierLink = `${APPTROVE_API_URL}/link/${newUser.id}`;
        }
      } catch (error) {
        console.error('Error creating Trackier link:', error);
        linkError = error.message;
        // Continue with user creation even if link creation fails
      }
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
        templateId: templates?.linkTemplateList?.[0]?.id || null,
        createdAt: new Date().toISOString()
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
        ? 'User created successfully, but link creation failed. Please contact support.'
        : 'User registered successfully and Trackier link created'
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
app.get('/api/users', async (req, res) => {
  try {
    const db = await readDB();
    const { search, platform, status, sortBy, sortOrder } = req.query;
    
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

// Update user information
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, phone, platform, socialHandle, followerCount, status } = req.body;
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
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json(db.users[userIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
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

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
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

// Initialize server
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`🔑 AppTrove API: ${APPTROVE_API_KEY ? 'Configured' : 'Not configured'}`);
  });
}

startServer().catch(console.error);
