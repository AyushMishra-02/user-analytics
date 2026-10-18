const Session = require('../models/Session');
const Event = require('../models/Event');

// @desc    Fetch a list of sessions with event counts
// @route   GET /api/sessions
exports.getSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'lastActive',
      order = 'desc',
      search = '',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const sortOrder = order === 'asc' ? 1 : -1;

    const filter = {};
    if (search && search.trim() !== '') {
      const q = search.trim();
      filter.$or = [
        { sessionId: { $regex: q, $options: 'i' } },
        { pagesVisited: { $elemMatch: { $regex: q, $options: 'i' } } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Session.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({
      error: 'Failed to fetch sessions',
      details: error.message,
    });
  }
};

// @desc    Fetch all events for a specific session (User Journey)
// @route   GET /api/sessions/:sessionId
exports.getSessionEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Find session summary
    const session = await Session.findOne({ sessionId });

    // Fetch all events for this session, strictly in chronological order
    const events = await Event.find({ sessionId }).sort({ timestamp: 1 });

    if (!session && events.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate time offsets from the very first event
    const firstEventTime = events.length > 0 ? new Date(events[0].timestamp).getTime() : 0;

    const timeline = events.map((event, index) => {
      const eventTime = new Date(event.timestamp).getTime();
      const offsetSeconds = Math.max(0, Math.round((eventTime - firstEventTime) / 1000));
      return {
        ...event.toObject(),
        stepNumber: index + 1,
        offsetSeconds,
        formattedOffset: `+${offsetSeconds}s`,
      };
    });

    return res.json({
      success: true,
      session: session || {
        sessionId,
        startTime: events[0]?.timestamp,
        lastActive: events[events.length - 1]?.timestamp,
        totalEvents: events.length,
      },
      totalEvents: timeline.length,
      timeline,
    });
  } catch (error) {
    console.error('Error fetching session journey:', error);
    return res.status(500).json({
      error: 'Failed to fetch session journey',
      details: error.message,
    });
  }
};
