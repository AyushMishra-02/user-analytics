const mongoose = require('mongoose');
const Event = require('../models/Event');
const Session = require('../models/Session');
require('dotenv').config();

const sampleSessions = [
  {
    sessionId: 'sess_buyer_8921a',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    startTimeOffsetMinutes: 120,
    steps: [
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 0,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 4,
        clickX: 480,
        clickY: 340,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Shop New Arrivals',
      },
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 6,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 12,
        clickX: 320,
        clickY: 420,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Filter: Electronics',
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 24,
        clickX: 710,
        clickY: 510,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Add to Cart - Wireless Earbuds Pro',
      },
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/cart.html',
        offsetSec: 28,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/cart.html',
        offsetSec: 36,
        clickX: 860,
        clickY: 480,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Proceed to Secure Checkout',
      },
    ],
  },
  {
    sessionId: 'sess_browser_3490b',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    startTimeOffsetMinutes: 90,
    steps: [
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 0,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 8,
        clickX: 250,
        clickY: 75,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'A',
        elementText: 'Features & Pricing',
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 19,
        clickX: 820,
        clickY: 75,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'INPUT',
        elementText: 'Search products...',
      },
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 26,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 35,
        clickX: 420,
        clickY: 520,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'DIV',
        elementText: 'View Details - Noise Cancelling Headset',
      },
    ],
  },
  {
    sessionId: 'sess_curious_7712c',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15',
    startTimeOffsetMinutes: 60,
    steps: [
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 0,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 5,
        clickX: 210,
        clickY: 340,
        viewportWidth: 390,
        viewportHeight: 844,
        elementTag: 'BUTTON',
        elementText: 'Explore Summer Sale',
      },
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 9,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 15,
        clickX: 200,
        clickY: 480,
        viewportWidth: 390,
        viewportHeight: 844,
        elementTag: 'BUTTON',
        elementText: 'Add to Cart - Minimalist Watch',
      },
    ],
  },
  {
    sessionId: 'sess_quickbounce_1194d',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    startTimeOffsetMinutes: 40,
    steps: [
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 0,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/index.html',
        offsetSec: 3,
        clickX: 1100,
        clickY: 75,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Sign In / Account',
      },
    ],
  },
  {
    sessionId: 'sess_vip_shopper_9921e',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0',
    startTimeOffsetMinutes: 20,
    steps: [
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 0,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 7,
        clickX: 490,
        clickY: 420,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Filter: Premium Leather',
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/products.html',
        offsetSec: 14,
        clickX: 720,
        clickY: 510,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Add to Cart - Italian Leather Wallet',
      },
      {
        type: 'page_view',
        url: 'http://localhost:5000/demo/cart.html',
        offsetSec: 18,
      },
      {
        type: 'click',
        url: 'http://localhost:5000/demo/cart.html',
        offsetSec: 25,
        clickX: 860,
        clickY: 480,
        viewportWidth: 1440,
        viewportHeight: 900,
        elementTag: 'BUTTON',
        elementText: 'Proceed to Secure Checkout',
      },
    ],
  },
];

async function seedDatabase() {
  console.log('Clearing existing events and sessions for clean seed...');
  await Event.deleteMany({});
  await Session.deleteMany({});

  const now = Date.now();
  let totalEventsCreated = 0;

  for (const item of sampleSessions) {
    const baseStartTime = new Date(now - item.startTimeOffsetMinutes * 60 * 1000);
    const eventDocs = [];
    let pageViews = 0;
    let clicks = 0;
    const pagesVisitedSet = new Set();
    let lastActive = baseStartTime;

    for (const step of item.steps) {
      const stepTime = new Date(baseStartTime.getTime() + step.offsetSec * 1000);
      lastActive = stepTime;
      pagesVisitedSet.add(step.url);

      if (step.type === 'page_view') pageViews++;
      if (step.type === 'click') clicks++;

      eventDocs.push({
        sessionId: item.sessionId,
        eventType: step.type,
        pageUrl: step.url,
        timestamp: stepTime,
        clickX: step.clickX || null,
        clickY: step.clickY || null,
        viewportWidth: step.viewportWidth || 1440,
        viewportHeight: step.viewportHeight || 900,
        elementTag: step.elementTag || null,
        elementText: step.elementText || null,
        metadata: {
          userAgent: item.userAgent,
          screen: `${step.viewportWidth || 1440}x${step.viewportHeight || 900}`,
        },
      });
    }

    await Event.insertMany(eventDocs);
    totalEventsCreated += eventDocs.length;

    await Session.create({
      sessionId: item.sessionId,
      startTime: baseStartTime,
      lastActive: lastActive,
      totalEvents: eventDocs.length,
      pageViews,
      clicks,
      pagesVisited: Array.from(pagesVisitedSet),
      userAgent: item.userAgent,
      ip: '127.0.0.1',
    });
  }

  console.log(`Seeded ${sampleSessions.length} sessions with ${totalEventsCreated} events successfully.`);
}

if (require.main === module) {
  const { connectDB } = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('Seed completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Seed error:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };
