const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/siteRoutes');
const eventRoutes = require('./routes/eventRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Site-Id'],
  })
);

// Body parsers - support JSON & text (sendBeacon uses text/plain or blob)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.text({ type: ['text/plain', 'text/*'], limit: '5mb' }));

app.use(morgan('dev'));

// Rate limiting for production resiliency
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later.' },
});

const ingestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Event rate limit exceeded.' },
});

// Static tracker delivery: allow any website to include <script src=".../tracker.js" data-site-id="..."></script>
app.get('/tracker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile(path.join(__dirname, 'public', 'tracker.js'));
});

// Serve the interactive Demo E-Commerce Store directly
app.use('/demo', express.static(path.join(__dirname, '..', 'demo-site')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/events', ingestLimiter, eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check & API Index
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'CausalFunnel Multi-Tenant Analytics API',
    version: '2.0.0',
    documentation: {
      trackerScript: '/tracker.js',
      demoStore: '/demo',
      endpoints: {
        auth: 'POST /api/auth/register | POST /api/auth/login | GET /api/auth/me',
        sites: 'GET/POST /api/sites | DELETE /api/sites/:siteId',
        events: 'POST /api/events | GET /api/events?siteId=...',
        sessions: 'GET /api/sessions?siteId=... | GET /api/sessions/:sessionId?siteId=...',
        heatmap: 'GET /api/analytics/heatmap?siteId=...&url={pageUrl}',
        trackedPages: 'GET /api/analytics/pages?siteId=...',
        overviewStats: 'GET /api/analytics/overview?siteId=...',
        exportData: 'GET /api/analytics/export?siteId=...&format=csv|json',
        seedDemoData: 'POST /api/analytics/seed?siteId=...',
        resetData: 'DELETE /api/analytics/reset?siteId=...',
      },
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 CausalFunnel Multi-Tenant Server running on port ${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`📦 Tracker Script: http://localhost:${PORT}/tracker.js`);
  console.log(`🛍️ Demo Store: http://localhost:${PORT}/demo`);
  console.log(`===============================================`);
});

module.exports = app;
