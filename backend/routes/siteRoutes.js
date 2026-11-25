const express = require('express');
const router = express.Router();
const {
  getSites,
  createSite,
  deleteSite,
  regenerateApiKey,
} = require('../controllers/siteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSites);
router.post('/', createSite);
router.delete('/:siteId', deleteSite);
router.post('/:siteId/regenerate-key', regenerateApiKey);

module.exports = router;
