const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['page_view', 'click', 'scroll', 'custom'],
      index: true,
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Click coordinates (for click events)
    clickX: {
      type: Number,
      default: null,
    },
    clickY: {
      type: Number,
      default: null,
    },
    // Viewport & document metrics for responsive heatmap normalization
    viewportWidth: {
      type: Number,
      default: null,
    },
    viewportHeight: {
      type: Number,
      default: null,
    },
    scrollX: {
      type: Number,
      default: null,
    },
    scrollY: {
      type: Number,
      default: null,
    },
    // Clicked element metadata
    elementTag: {
      type: String,
      default: null,
    },
    elementId: {
      type: String,
      default: null,
    },
    elementClass: {
      type: String,
      default: null,
    },
    elementText: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying events by session ordered by timestamp
EventSchema.index({ sessionId: 1, timestamp: 1 });
// Compound index for querying heatmap clicks by pageUrl
EventSchema.index({ pageUrl: 1, eventType: 1 });

module.exports = mongoose.model('Event', EventSchema);
