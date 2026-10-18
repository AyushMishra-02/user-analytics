const express = require('express');
const router = express.Router();
const {
  getHeatmapData,
  getTrackedPages,
  getOverviewStats,
  resetAllData,
} = require('../controllers/analyticsController');
const { seedDatabase } = require('../seed/seedData');

// GET /api/analytics/heatmap - Fetch click data for a page (for heatmap)
router.get('/heatmap', getHeatmapData);

// GET /api/analytics/pages - Fetch list of unique tracked pages
router.get('/pages', getTrackedPages);

// GET /api/analytics/overview - Fetch overall metrics (sessions, events, views, clicks)
router.get('/overview', getOverviewStats);

// POST /api/analytics/seed - Seed realistic demo sessions and events
router.post('/seed', async (req, res) => {
  try {
    await seedDatabase();
    return res.json({ success: true, message: 'Database successfully seeded with realistic demo data.' });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

// DELETE /api/analytics/reset - Clean slate
router.delete('/reset', resetAllData);

module.exports = router;
