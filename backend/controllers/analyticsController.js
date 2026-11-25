const Event = require('../models/Event');
const Session = require('../models/Session');

// Helper to build date range filter
const buildDateFilter = (startDate, endDate, field = 'timestamp') => {
  if (!startDate && !endDate) return {};
  const range = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return { [field]: range };
};

// @desc    Fetch click data for a specific page & site (for heatmap)
// @route   GET /api/analytics/heatmap?siteId=...&url=...
exports.getHeatmapData = async (req, res) => {
  try {
    const siteId = req.site.siteId;
    const { url, startDate, endDate } = req.query;

    if (!url || url.trim() === '') {
      return res.status(400).json({ error: 'Page URL query parameter "url" is required' });
    }

    const decodedUrl = decodeURIComponent(url.trim());

    const filter = {
      siteId,
      pageUrl: decodedUrl,
      eventType: { $in: ['click', 'rage_click'] },
      clickX: { $ne: null },
      clickY: { $ne: null },
      ...buildDateFilter(startDate, endDate, 'timestamp'),
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
      eventType: 1,
      timestamp: 1,
      sessionId: 1,
    }).sort({ timestamp: -1 });

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
        isRageClick: c.eventType === 'rage_click',
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

// @desc    Fetch list of tracked pages with visit counts for a site
// @route   GET /api/analytics/pages?siteId=...
exports.getTrackedPages = async (req, res) => {
  try {
    const siteId = req.site.siteId;
    const { startDate, endDate } = req.query;

    const matchStage = {
      siteId,
      ...buildDateFilter(startDate, endDate, 'timestamp'),
    };

    const pageStats = await Event.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$pageUrl',
          totalEvents: { $sum: 1 },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $in: ['$eventType', ['click', 'rage_click']] }, 1, 0] },
          },
          rageClicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'rage_click'] }, 1, 0] },
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
          rageClicks: 1,
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

// @desc    Fetch high-level overview metrics & KPIs for a site (with date range & bounce rate)
// @route   GET /api/analytics/overview?siteId=...
exports.getOverviewStats = async (req, res) => {
  try {
    const siteId = req.site.siteId;
    const { startDate, endDate } = req.query;

    const eventMatch = { siteId, ...buildDateFilter(startDate, endDate, 'timestamp') };
    const sessionMatch = { siteId, ...buildDateFilter(startDate, endDate, 'lastActive') };

    const [
      totalSessions,
      bouncedSessions,
      totalEvents,
      pageViewsCount,
      clicksCount,
      rageClicksCount,
      scrollEventsCount,
      topPages,
      sessionsAggregate,
    ] = await Promise.all([
      Session.countDocuments(sessionMatch),
      Session.countDocuments({ ...sessionMatch, pageViews: { $lte: 1 } }),
      Event.countDocuments(eventMatch),
      Event.countDocuments({ ...eventMatch, eventType: 'page_view' }),
      Event.countDocuments({ ...eventMatch, eventType: { $in: ['click', 'rage_click'] } }),
      Event.countDocuments({ ...eventMatch, eventType: 'rage_click' }),
      Event.countDocuments({ ...eventMatch, eventType: 'scroll' }),
      Event.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: '$pageUrl',
            views: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $in: ['$eventType', ['click', 'rage_click']] }, 1, 0] } },
            rageClicks: { $sum: { $cond: [{ $eq: ['$eventType', 'rage_click'] }, 1, 0] } },
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
            rageClicks: 1,
            total: 1,
          },
        },
      ]),
      Session.aggregate([
        { $match: sessionMatch },
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
    const bounceRate = totalSessions > 0
      ? Math.round((bouncedSessions / totalSessions) * 100)
      : 0;

    return res.json({
      success: true,
      kpis: {
        totalSessions,
        totalEvents,
        pageViews: pageViewsCount,
        clicks: clicksCount,
        rageClicks: rageClicksCount,
        scrollEvents: scrollEventsCount,
        bounceRate,
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

// @desc    Export sessions or events as CSV or JSON for a site
// @route   GET /api/analytics/export?siteId=...&format=csv|json
exports.exportAnalyticsData = async (req, res) => {
  try {
    const siteId = req.site.siteId;
    const format = (req.query.format || 'csv').toLowerCase();

    const sessions = await Session.find({ siteId }).sort({ lastActive: -1 }).limit(1000);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="causalfunnel-${siteId}-sessions.json"`);
      return res.send(JSON.stringify(sessions, null, 2));
    }

    // Build CSV
    const headers = ['sessionId', 'startTime', 'lastActive', 'durationSeconds', 'totalEvents', 'pageViews', 'clicks', 'pagesVisited'];
    const escapeCsv = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = sessions.map((s) =>
      [
        s.sessionId,
        s.startTime?.toISOString() || '',
        s.lastActive?.toISOString() || '',
        s.durationSeconds || 0,
        s.totalEvents || 0,
        s.pageViews || 0,
        s.clicks || 0,
        (s.pagesVisited || []).join(' | '),
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="causalfunnel-${siteId}-sessions.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({ error: 'Failed to export analytics data' });
  }
};

// @desc    Reset all analytics data for a specific site
// @route   DELETE /api/analytics/reset?siteId=...
exports.resetAllData = async (req, res) => {
  try {
    const siteId = req.site.siteId;
    await Promise.all([Event.deleteMany({ siteId }), Session.deleteMany({ siteId })]);
    return res.json({ success: true, message: `All analytics data for site ${siteId} cleared.` });
  } catch (error) {
    console.error('Error clearing data:', error);
    return res.status(500).json({ error: 'Failed to reset data' });
  }
};
