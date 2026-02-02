import express from 'express';
import { serveStatic } from 'serve-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
}).on('error', (err) => {
  console.error('Failed to start frontend server:', err);
  process.exit(1);
});
