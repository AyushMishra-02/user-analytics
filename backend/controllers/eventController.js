const Event = require('../models/Event');
const Session = require('../models/Session');

// Helper to update session document based on event
const updateSessionData = async (event, req) => {
  const { sessionId, eventType, pageUrl, timestamp } = event;
  const eventTime = timestamp ? new Date(timestamp) : new Date();

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown';

  const updateFields = {
    $set: { lastActive: eventTime },
    $setOnInsert: {
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
  } else if (eventType === 'click') {
    updateFields.$inc.clicks = 1;
  }

  await Session.findOneAndUpdate(
    { sessionId },
    updateFields,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// @desc    Receive and store events (single or batch)
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

    // Support both single event object and array of events
    const rawEvents = Array.isArray(payload) ? payload : [payload];

    if (rawEvents.length === 0) {
      return res.status(400).json({ error: 'No events provided in array' });
    }

    const validatedEvents = [];

    for (const item of rawEvents) {
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

      // Validation
      if (!sessionId || !eventType || !pageUrl) {
        continue; // Skip malformed item
      }

      const eventDoc = {
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
        error: 'Validation failed: every event must have sessionId, eventType, and pageUrl',
      });
    }

    // Insert events into DB
    const insertedEvents = await Event.insertMany(validatedEvents);

    // Update Session aggregates in parallel
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

// @desc    Get recent events stream
// @route   GET /api/events
exports.getRecentEvents = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const events = await Event.find()
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
