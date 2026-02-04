import express from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const startTime = new Date();

console.log(`[Frontend] Starting server on port ${PORT}...`);
console.log(`[Frontend] Serving from: ${path.join(__dirname, 'dist')}`);

// Health check endpoint - must respond immediately for Kubernetes probes
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    service: 'Partners Portal Frontend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((new Date() - startTime) / 1000)
  });
});

// Serve static files from dist directory
app.use(serveStatic(path.join(__dirname, 'dist'), {
  index: ['index.html'],
  fallthrough: true
}));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ [Frontend] Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ [Frontend] Health check: http://0.0.0.0:${PORT}/health`);
});
