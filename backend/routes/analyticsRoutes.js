const express = require('express');
const router = express.Router();
const {
  getHeatmapData,
  getTrackedPages,
  getOverviewStats,
  exportAnalyticsData,
  getResearchInsights,
  resetAllData,
} = require('../controllers/analyticsController');
const { seedDatabase } = require('../seed/seedData');
const { protect, verifySiteAccess } = require('../middleware/authMiddleware');

router.use(protect, verifySiteAccess);

// GET /api/analytics/heatmap?siteId=...&url=...
router.get('/heatmap', getHeatmapData);

// GET /api/analytics/pages?siteId=...
router.get('/pages', getTrackedPages);

// GET /api/analytics/overview?siteId=...
router.get('/overview', getOverviewStats);

// GET /api/analytics/export?siteId=...&format=csv|json
router.get('/export', exportAnalyticsData);

// GET /api/analytics/research?siteId=...
router.get('/research', getResearchInsights);

// POST /api/analytics/seed?siteId=...
router.post('/seed', async (req, res) => {
  try {
    await seedDatabase(req.site.siteId);
    return res.json({
      success: true,
      message: `Database seeded with realistic demo data for site ${req.site.name}.`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

// DELETE /api/analytics/reset?siteId=...
router.delete('/reset', resetAllData);

module.exports = router;
