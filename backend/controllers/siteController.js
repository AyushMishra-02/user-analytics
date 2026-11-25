const crypto = require('crypto');
const Site = require('../models/Site');
const Event = require('../models/Event');
const Session = require('../models/Session');

// @desc    Get all sites belonging to the authenticated user
// @route   GET /api/sites
exports.getSites = async (req, res) => {
  try {
    const sites = await Site.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, sites });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return res.status(500).json({ error: 'Failed to fetch sites' });
  }
};

// @desc    Register a new website to track
// @route   POST /api/sites
exports.createSite = async (req, res) => {
  try {
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: 'Site name and domain are required' });
    }

    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');

    const site = await Site.create({
      user: req.user._id,
      name: name.trim(),
      domain: cleanDomain,
    });

    return res.status(201).json({ success: true, site });
  } catch (error) {
    console.error('Error creating site:', error);
    return res.status(500).json({ error: 'Failed to create site', details: error.message });
  }
};

// @desc    Delete a site and all its analytics data
// @route   DELETE /api/sites/:siteId
exports.deleteSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const site = await Site.findOneAndDelete({ siteId, user: req.user._id });

    if (!site) {
      return res.status(404).json({ error: 'Site not found or unauthorized' });
    }

    await Promise.all([
      Event.deleteMany({ siteId }),
      Session.deleteMany({ siteId }),
    ]);

    return res.json({ success: true, message: 'Site and all associated analytics deleted' });
  } catch (error) {
    console.error('Error deleting site:', error);
    return res.status(500).json({ error: 'Failed to delete site' });
  }
};

// @desc    Regenerate API key for a site
// @route   POST /api/sites/:siteId/regenerate-key
exports.regenerateApiKey = async (req, res) => {
  try {
    const { siteId } = req.params;
    const newApiKey = 'cf_live_' + crypto.randomBytes(20).toString('hex');

    const site = await Site.findOneAndUpdate(
      { siteId, user: req.user._id },
      { apiKey: newApiKey },
      { new: true }
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found or unauthorized' });
    }

    return res.json({ success: true, site });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return res.status(500).json({ error: 'Failed to regenerate API key' });
  }
};
