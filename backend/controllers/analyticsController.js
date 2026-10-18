const Event = require('../models/Event');
const Session = require('../models/Session');

// @desc    Fetch click data for a specific page (for heatmap)
// @route   GET /api/analytics/heatmap
exports.getHeatmapData = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || url.trim() === '') {
      return res.status(400).json({ error: 'Page URL query parameter "url" is required' });
    }

    const decodedUrl = decodeURIComponent(url.trim());

    // Match exact URL or relaxed path match
    const filter = {
      pageUrl: decodedUrl,
      eventType: 'click',
      clickX: { $ne: null },
      clickY: { $ne: null },
    };

    const clicks = await Event.find(filter, {
      clickX: 1,
      clickY: 1,
      viewportWidth: 1,
      viewportHeight: 1,
      scrollX: 1,
      scrollY: 1,
      elementTag: 1,
      elementId: 1,
      elementClass: 1,
      elementText: 1,
      timestamp: 1,
      sessionId: 1,
    }).sort({ timestamp: -1 });

    // Calculate aggregated click points / clusters
    // Also provide normalized (0 - 100%) coordinates where viewportWidth/Height are available
    const points = clicks.map((c) => {
      let percentX = null;
      let percentY = null;

      if (c.viewportWidth && c.viewportWidth > 0) {
        percentX = Math.min(100, Math.max(0, (c.clickX / c.viewportWidth) * 100));
      }
      if (c.viewportHeight && c.viewportHeight > 0) {
        percentY = Math.min(100, Math.max(0, (c.clickY / c.viewportHeight) * 100));
      }

      return {
        x: c.clickX,
        y: c.clickY,
        percentX: percentX !== null ? Math.round(percentX * 10) / 10 : null,
        percentY: percentY !== null ? Math.round(percentY * 10) / 10 : null,
        viewportWidth: c.viewportWidth,
        viewportHeight: c.viewportHeight,
        elementTag: c.elementTag,
        elementText: c.elementText,
        timestamp: c.timestamp,
        sessionId: c.sessionId,
      };
    });

    return res.json({
      success: true,
      pageUrl: decodedUrl,
      totalClicks: clicks.length,
      points,
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return res.status(500).json({
      error: 'Failed to fetch heatmap data',
      details: error.message,
    });
  }
};

// @desc    Fetch list of tracked pages with visit counts
// @route   GET /api/analytics/pages
exports.getTrackedPages = async (req, res) => {
  try {
    const pageStats = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          totalEvents: { $sum: 1 },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          lastTracked: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          url: '$_id',
          totalEvents: 1,
          pageViews: 1,
          clicks: 1,
          lastTracked: 1,
        },
      },
      { $sort: { clicks: -1, pageViews: -1 } },
    ]);

    return res.json({
      success: true,
      count: pageStats.length,
      pages: pageStats,
    });
  } catch (error) {
    console.error('Error fetching tracked pages:', error);
    return res.status(500).json({ error: 'Failed to fetch tracked pages' });
  }
};

// @desc    Fetch high-level overview metrics & KPIs
// @route   GET /api/analytics/overview
exports.getOverviewStats = async (req, res) => {
  try {
    const [
      totalSessions,
      totalEvents,
      pageViewsCount,
      clicksCount,
      topPages,
      sessionsAggregate,
    ] = await Promise.all([
      Session.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ eventType: 'page_view' }),
      Event.countDocuments({ eventType: 'click' }),
      Event.aggregate([
        {
          $group: {
            _id: '$pageUrl',
            views: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 6 },
        {
          $project: {
            _id: 0,
            url: '$_id',
            views: 1,
            clicks: 1,
            total: 1,
          },
        },
      ]),
      Session.aggregate([
        {
          $project: {
            durationSeconds: {
              $divide: [{ $subtract: ['$lastActive', '$startTime'] }, 1000],
            },
            totalEvents: 1,
          },
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$durationSeconds' },
            avgEventsPerSession: { $avg: '$totalEvents' },
          },
        },
      ]),
    ]);

    const avgDuration = sessionsAggregate[0]?.avgDuration
      ? Math.round(sessionsAggregate[0].avgDuration)
      : 0;
    const avgEventsPerSession = sessionsAggregate[0]?.avgEventsPerSession
      ? Math.round(sessionsAggregate[0].avgEventsPerSession * 10) / 10
      : 0;

    return res.json({
      success: true,
      kpis: {
        totalSessions,
        totalEvents,
        pageViews: pageViewsCount,
        clicks: clicksCount,
        avgDurationSeconds: avgDuration,
        avgEventsPerSession,
      },
      topPages,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
};

// @desc    Reset all analytics data (clean slate)
// @route   DELETE /api/analytics/reset
exports.resetAllData = async (req, res) => {
  try {
    await Promise.all([Event.deleteMany({}), Session.deleteMany({})]);
    return res.json({ success: true, message: 'All analytics data successfully cleared.' });
  } catch (error) {
    console.error('Error clearing data:', error);
    return res.status(500).json({ error: 'Failed to reset data' });
  }
};
