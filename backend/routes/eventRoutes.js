const express = require('express');
const router = express.Router();
const { receiveEvents, getRecentEvents } = require('../controllers/eventController');

// POST /api/events - Receive and store single or batch events
router.post('/', receiveEvents);

// GET /api/events - Get recent events stream
router.get('/', getRecentEvents);

module.exports = router;
