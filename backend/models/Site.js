const mongoose = require('mongoose');
const crypto = require('crypto');

const SiteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: 100,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    siteId: {
      type: String,
      unique: true,
      index: true,
    },
    apiKey: {
      type: String,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate siteId and apiKey before saving
SiteSchema.pre('save', function (next) {
  if (!this.siteId) {
    this.siteId = 'site_' + crypto.randomBytes(8).toString('hex');
  }
  if (!this.apiKey) {
    this.apiKey = 'cf_live_' + crypto.randomBytes(20).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Site', SiteSchema);
