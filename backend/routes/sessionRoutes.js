const express = require('express');
const router = express.Router();
const { getSessions, getSessionEvents } = require('../controllers/sessionController');

// GET /api/sessions - Fetch a list of sessions with event counts & filters
router.get('/', getSessions);

// GET /api/sessions/:sessionId - Fetch all events for a specific session (User Journey)
router.get('/:sessionId', getSessionEvents);

module.exports = router;
