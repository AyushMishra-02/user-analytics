const Event = require('../models/Event');
const Session = require('../models/Session');
const Site = require('../models/Site');

// Mask IP address for privacy compliance (GDPR-friendly: zero out last octet)
const anonymizeIp = (rawIp) => {
  if (!rawIp || rawIp === 'Unknown') return 'Unknown';
  const ip = String(rawIp).split(',')[0].trim();
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }
  return 'Anonymized';
};

// Helper to update session document based on event (scoped by siteId + sessionId)
const updateSessionData = async (event, req) => {
  const { siteId, sessionId, eventType, pageUrl, timestamp } = event;
  const eventTime = timestamp ? new Date(timestamp) : new Date();

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown';
  const ip = anonymizeIp(rawIp);

  const updateFields = {
    $set: { lastActive: eventTime },
    $setOnInsert: {
      siteId,
      sessionId,
      startTime: eventTime,
      userAgent,
      ip,
    },
    $inc: { totalEvents: 1 },
    $addToSet: { pagesVisited: pageUrl },
  };

  if (eventType === 'page_view') {
    updateFields.$inc.pageViews = 1;
  } else if (eventType === 'click' || eventType === 'rage_click') {
    updateFields.$inc.clicks = 1;
  }

  await Session.findOneAndUpdate(
    { siteId, sessionId },
    updateFields,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// @desc    Receive and store events (single or batch) from tracker.js
// @route   POST /api/events
exports.receiveEvents = async (req, res) => {
  try {
    let payload = req.body;

    // Handle beacon text payloads if parsed as string
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    if (!payload) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    const rawEvents = Array.isArray(payload) ? payload : [payload];
    if (rawEvents.length === 0) {
      return res.status(400).json({ error: 'No events provided in array' });
    }

    // Determine siteId from query param, header, or first event
    const fallbackSiteId = req.query.siteId || req.headers['x-site-id'] || rawEvents[0]?.siteId;

    // Collect unique siteIds in this batch and verify they exist & are active
    const candidateSiteIds = [
      ...new Set(
        rawEvents
          .map((ev) => ev.siteId || fallbackSiteId)
          .filter(Boolean)
          .map((s) => String(s).trim())
      ),
    ];

    if (candidateSiteIds.length === 0) {
      return res.status(400).json({
        error: 'siteId is required. Pass data-site-id on your tracker script or siteId in payload.',
      });
    }

    const validSites = await Site.find({
      siteId: { $in: candidateSiteIds },
      isActive: true,
    }).select('siteId');

    const validSiteIdSet = new Set(validSites.map((s) => s.siteId));

    if (validSiteIdSet.size === 0) {
      return res.status(403).json({ error: 'Invalid or inactive siteId' });
    }

    const validatedEvents = [];

    for (const item of rawEvents) {
      const itemSiteId = String(item.siteId || fallbackSiteId || '').trim();
      const {
        sessionId,
        eventType,
        pageUrl,
        timestamp,
        clickX,
        clickY,
        viewportWidth,
        viewportHeight,
        scrollX,
        scrollY,
        elementTag,
        elementId,
        elementClass,
        elementText,
        metadata,
      } = item;

      if (!itemSiteId || !validSiteIdSet.has(itemSiteId) || !sessionId || !eventType || !pageUrl) {
        continue;
      }

      const eventDoc = {
        siteId: itemSiteId,
        sessionId: String(sessionId).trim(),
        eventType: String(eventType).trim().toLowerCase(),
        pageUrl: String(pageUrl).trim(),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        clickX: typeof clickX === 'number' ? clickX : (item.x !== undefined ? Number(item.x) : null),
        clickY: typeof clickY === 'number' ? clickY : (item.y !== undefined ? Number(item.y) : null),
        viewportWidth: typeof viewportWidth === 'number' ? viewportWidth : null,
        viewportHeight: typeof viewportHeight === 'number' ? viewportHeight : null,
        scrollX: typeof scrollX === 'number' ? scrollX : null,
        scrollY: typeof scrollY === 'number' ? scrollY : null,
        elementTag: elementTag || item.tagName || null,
        elementId: elementId || null,
        elementClass: elementClass || item.className || null,
        elementText: elementText ? String(elementText).slice(0, 150) : null,
        metadata: metadata || {},
      };

      validatedEvents.push(eventDoc);
    }

    if (validatedEvents.length === 0) {
      return res.status(400).json({
        error: 'Validation failed: every event must have a valid siteId, sessionId, eventType, and pageUrl',
      });
    }

    const insertedEvents = await Event.insertMany(validatedEvents);

    await Promise.all(
      validatedEvents.map((ev) => updateSessionData(ev, req))
    );

    return res.status(201).json({
      success: true,
      message: `Successfully stored ${insertedEvents.length} event(s)`,
      count: insertedEvents.length,
      events: insertedEvents,
    });
  } catch (error) {
    console.error('Error storing event(s):', error);
    return res.status(500).json({
      error: 'Failed to process events',
      details: error.message,
    });
  }
};

// @desc    Get recent events stream for a specific site
// @route   GET /api/events?siteId=...
exports.getRecentEvents = async (req, res) => {
  try {
    const siteId = req.site.siteId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const events = await Event.find({ siteId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return res.status(500).json({ error: 'Server error fetching events' });
  }
};
