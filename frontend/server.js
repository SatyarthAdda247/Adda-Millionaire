const express = require('express');
const { serveStatic } = require('serve-static');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'ok',
    service: 'Partners Portal Frontend',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from dist directory
app.use(serveStatic(path.join(__dirname, 'dist'), {
  index: ['index.html']
}));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
