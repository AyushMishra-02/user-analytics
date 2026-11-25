const express = require('express');
const router = express.Router();
const { receiveEvents, getRecentEvents } = require('../controllers/eventController');
const { protect, verifySiteAccess } = require('../middleware/authMiddleware');

// POST /api/events - Public ingestion endpoint for tracker.js (validated via siteId)
router.post('/', receiveEvents);

// GET /api/events - Protected recent events stream scoped by siteId
router.get('/', protect, verifySiteAccess, getRecentEvents);

module.exports = router;
