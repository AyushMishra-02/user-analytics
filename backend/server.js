const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers - support JSON & text (sendBeacon uses text/plain or blob)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.text({ type: ['text/plain', 'text/*'], limit: '5mb' }));

app.use(morgan('dev'));

// Static tracker delivery: allow any website to include <script src="http://localhost:5000/tracker.js"></script>
app.get('/tracker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'tracker.js'));
});

// Serve the interactive Demo E-Commerce Store directly
app.use('/demo', express.static(path.join(__dirname, '..', 'demo-site')));

// API Routes
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check & API Index
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'CausalFunnel User Analytics API',
    version: '1.0.0',
    documentation: {
      trackerScript: '/tracker.js',
      demoStore: '/demo',
      endpoints: {
        events: 'POST /api/events',
        recentEvents: 'GET /api/events',
        sessions: 'GET /api/sessions',
        sessionDetail: 'GET /api/sessions/:sessionId',
        heatmap: 'GET /api/analytics/heatmap?url={pageUrl}',
        trackedPages: 'GET /api/analytics/pages',
        overviewStats: 'GET /api/analytics/overview',
        seedDemoData: 'POST /api/analytics/seed',
        resetData: 'DELETE /api/analytics/reset',
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
  console.log(`🚀 CausalFunnel Analytics Server running on port ${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`📦 Tracker Script: http://localhost:${PORT}/tracker.js`);
  console.log(`🛍️ Demo Store: http://localhost:${PORT}/demo`);
  console.log(`===============================================`);
});

module.exports = app;
