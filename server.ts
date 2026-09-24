import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Cloud Run and deployment health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Serve static assets with caching headers
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Fallback to index.html for Single Page Application client routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('Warning: dist/ directory not found. Serving fallback message.');
  app.get('*', (_req, res) => {
    res.status(200).send('Z.Z KHATA server started. Running build step...');
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Z.Z KHATA] Server running at http://0.0.0.0:${PORT}`);
});
