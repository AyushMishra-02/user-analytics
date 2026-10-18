const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
    pageViews: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    pagesVisited: [
      {
        type: String,
      },
    ],
    userAgent: {
      type: String,
      default: 'Unknown',
    },
    ip: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for session duration in seconds
SessionSchema.virtual('durationSeconds').get(function () {
  if (!this.startTime || !this.lastActive) return 0;
  return Math.max(0, Math.round((new Date(this.lastActive) - new Date(this.startTime)) / 1000));
});

SessionSchema.set('toJSON', { virtuals: true });
SessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', SessionSchema);
