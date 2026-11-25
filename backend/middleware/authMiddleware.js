const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Site = require('../models/Site');

const JWT_SECRET = process.env.JWT_SECRET || 'causalfunnel_dev_secret_change_in_prod';

/**
 * Protect routes with JWT Bearer token
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
  }
};

/**
 * Verify that the authenticated user owns the requested siteId
 * Looks for siteId in req.query.siteId, req.params.siteId, or req.body.siteId
 */
const verifySiteAccess = async (req, res, next) => {
  try {
    const siteId = req.query.siteId || req.params.siteId || req.body?.siteId;

    if (!siteId) {
      return res.status(400).json({ error: 'siteId query parameter is required' });
    }

    const site = await Site.findOne({ siteId, user: req.user._id });
    if (!site) {
      return res.status(403).json({ error: 'Access denied: Site not found or unauthorized' });
    }

    req.site = site;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify site access' });
  }
};

module.exports = { protect, verifySiteAccess, JWT_SECRET };
