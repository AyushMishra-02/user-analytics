const express = require('express');
const router = express.Router();
const { getSessions, getSessionEvents } = require('../controllers/sessionController');
const { protect, verifySiteAccess } = require('../middleware/authMiddleware');

router.use(protect, verifySiteAccess);

// GET /api/sessions?siteId=... - Fetch a list of sessions with event counts & filters
router.get('/', getSessions);

// GET /api/sessions/:sessionId?siteId=... - Fetch all events for a specific session
router.get('/:sessionId', getSessionEvents);

module.exports = router;
