# 📊 CausalFunnel - User Session Analytics & Heatmap Application

A production-grade, full-stack user session tracking and interaction analytics platform built for **CausalFunnel**. The application captures real-time user interactions (`page_view` and `click` with precise coordinates) via a lightweight client-side JavaScript tracker and visualizes complete user journeys and page heatmaps through a modern, high-performance React dashboard.

---

## 🌟 Highlights & Key Features

### 1. Client-Side JavaScript Tracking Library (`tracker.js`)
- **Zero Dependencies**: Lightweight standalone script (`< 4KB`) easily embedded via `<script>` tag on any website.
- **Session Persistence**: Generates and persists unique UUID v4 session IDs in `localStorage` with automatic fallback to `document.cookie` if storage is restricted.
- **Automatic Event Tracking**:
  - `page_view`: Captured on initial load and listens to Single Page Application (SPA) History API route changes (`pushState`, `replaceState`, `popstate`).
  - `click`: Captures exact coordinates (`clickX`, `clickY`), document scroll offsets, viewport dimensions (`window.innerWidth`, `window.innerHeight`), and element context (tag name, class, ID, inner text).
- **Resilient Delivery**: Implements `navigator.sendBeacon()` with fallback to `fetch(..., { keepalive: true })`, batching events to prevent network congestion and guaranteeing delivery even during page unload or tab closure.
- **Developer & HUD Hooks**: Exposes global `window.CausalTracker` with `.track()`, `.trackPageView()`, `.getSessionId()`, and `.onEvent()` callbacks.

### 2. Robust Backend API (Node.js + Express + MongoDB)
- **Structured Schema & Indexing**: Mongoose models for `Event` and `Session` with compound indexes (`{ sessionId: 1, timestamp: 1 }` and `{ pageUrl: 1, eventType: 1 }`) for fast queries.
- **Real-Time Session Aggregates**: Automatically creates or updates session documents on every incoming event (incrementing total events, page views, clicks, and tracking unique visited pages).
- **Zero-Config Resiliency**: Connects to any configured MongoDB Atlas or local MongoDB instance, with an automatic fallback to an embedded in-memory MongoDB daemon (`mongodb-memory-server`) so reviewers can clone and run immediately without configuring a database.
- **CORS & Static Serving**: Pre-configured to serve `/tracker.js` and host the interactive demo e-commerce store at `/demo`.

### 3. Modern React Analytics Dashboard (Vite + React)
- **Sessions View**: Filterable and searchable table of all user sessions displaying total events, views/clicks ratio, duration in seconds, and pages visited.
- **User Journey Timeline**: Clicking any session opens a modal with a step-by-step visual timeline of all actions in chronological order with relative time offsets (`+0s`, `+4s`, `+18s`), event badges, and click metadata.
- **Interactive Heatmap View**:
  - Dynamic page URL dropdown selector.
  - Dual visualization: **Individual Visual Dot Matrix** and **Radial Thermal Density Gradient** rendered via HTML5 Canvas.
  - Interactive click inspector tooltip and top clicked elements breakdown.
  - Dynamic radius adjustment slider.
- **Live Event Stream**: Real-time polling stream showing incoming events as they happen with pause/resume controls.
- **Overview Metrics**: High-level KPIs (Total Sessions, Interactions, Page Views, Clicks, Avg Duration) and top-visited pages table.

### 4. Interactive Demo E-Commerce Store (`Aura Store`)
- Multi-page e-commerce storefront (`index.html`, `products.html`, `cart.html`) integrated with `tracker.js`.
- Features an on-screen **Live Analytics HUD Widget** in the lower corner showing the current session ID, live tracking counter, and instant traffic simulation controls.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Client Tracker** | Vanilla JavaScript (ES6+), Beacon API, LocalStorage / Cookies, SPA History API |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), `mongodb-memory-server`, CORS, Morgan |
| **Frontend Dashboard** | React 19, Vite, Lucide React Icons, Vanilla CSS Design System |
| **Demo Application** | Semantic HTML5, Vanilla CSS3 (Dark Mode), Vanilla JS |

---

## 🚀 Quick Start & Setup Guide

### Prerequisites
- **Node.js** (v18+ recommended, v20+ supported)
- **npm** (v9+)

### Option A: Quick Launch (Both Backend & Frontend)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AyushMishra-02/user-analytics.git
   cd user-analytics
   ```

2. **Install all dependencies:**
   ```bash
   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   cd ..
   ```

3. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *The backend starts at `http://localhost:5000`.*
   *(Note: An embedded in-memory MongoDB will launch automatically if no `MONGO_URI` is set).*

4. **Start the Frontend Dashboard (in a second terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   *The dashboard will be accessible at `http://localhost:5173`.*

5. **Access the Demo Store & Seed Data:**
   - **Dashboard**: [http://localhost:5173](http://localhost:5173)
   - **Demo E-Commerce Store**: [http://localhost:5000/demo/index.html](http://localhost:5000/demo/index.html)
   - **Seed Realistic Demo Data**: Click the **"Seed Data"** button in the dashboard navbar or run `npm run seed` in `backend/`.

---

## 📡 API Reference

### 1. Ingest Events
- **`POST /api/events`**
- Supports both single event objects and batched event arrays.
```json
{
  "sessionId": "cf_a81b2c-9012-4f81",
  "eventType": "click",
  "pageUrl": "http://localhost:5000/demo/products.html",
  "timestamp": "2026-10-18T08:06:27.559Z",
  "clickX": 720,
  "clickY": 510,
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "elementTag": "BUTTON",
  "elementText": "Add to Cart - SoundPro Max"
}
```

### 2. Fetch Sessions List
- **`GET /api/sessions?page=1&limit=50&search=...`**
- Returns all sessions with total events, page views, clicks, duration, and visited pages.

### 3. Fetch Session Journey (Chronological Timeline)
- **`GET /api/sessions/:sessionId`**
- Returns session summary and the ordered array of events with calculated relative time offsets (`stepNumber`, `offsetSeconds`, `formattedOffset`).

### 4. Fetch Heatmap Data
- **`GET /api/analytics/heatmap?url=http://localhost:5000/demo/products.html`**
- Returns all click coordinates, normalized percentages (`percentX`, `percentY`), and element details for the requested page URL.

### 5. Fetch Tracked Pages Summary
- **`GET /api/analytics/pages`**
- Returns list of unique tracked URLs with total views and click counts.

### 6. Overview Metrics & KPIs
- **`GET /api/analytics/overview`**
- Returns total sessions, total events, page view/click counts, and average session duration.

### 7. Seed Demo Data
- **`POST /api/analytics/seed`**
- Populates the database with realistic multi-step e-commerce user journeys and heatmap clusters.

---

## 💻 How to Use the Client Tracking Script

Add the following tag into any webpage to begin tracking:

```html
<script
  src="http://localhost:5000/tracker.js"
  data-endpoint="http://localhost:5000/api/events"
  async>
</script>
```

### Programmatic Tracking (Optional)
```javascript
// Track custom actions manually
window.CausalTracker.track('click', {
  clickX: 420,
  clickY: 310,
  elementTag: 'BUTTON',
  elementText: 'Checkout Now',
  metadata: { cartTotal: 349.00 }
});
```

---

## ⚖️ Assumptions & Engineering Trade-offs

1. **Responsive Heatmap Coordinate Normalization**:
   - *Challenge*: Users browse websites on differing screen sizes (mobile 390px, desktop 1440px). Raw pixel coordinates from mobile would misalign on desktop heatmaps.
   - *Solution*: The tracker records both absolute `(clickX, clickY)` and viewport dimensions `(viewportWidth, viewportHeight)`. The backend computes normalized percentages `(percentX, percentY)`, enabling responsive canvas heatmap rendering across varied viewports.

2. **Session Storage Hierarchy (`localStorage` + Cookie Fallback)**:
   - *Trade-off*: `localStorage` provides persistent client storage across tabs and browser restarts, but can be blocked in strict privacy modes or iframes.
   - *Decision*: The tracker first checks `localStorage`. If inaccessible, it falls back to a 1-day `SameSite=Lax` cookie.

3. **Beacon Delivery with Queue Batching**:
   - *Trade-off*: Sending an immediate HTTP request on every click creates network churn, but batching too long risks losing events if the user navigates away.
   - *Decision*: Events are buffered in memory and dispatched every 800ms or when the queue reaches 10 items. Furthermore, `visibilitychange`, `pagehide`, and `beforeunload` events trigger an immediate flush using `navigator.sendBeacon()`, ensuring zero data loss on page exit.

4. **Zero-Configuration MongoDB Strategy**:
   - *Assumption*: Reviewers and hiring managers may evaluate the project on machines without an active MongoDB daemon or with strict network policies blocking Atlas SRV records.
   - *Solution*: The backend tries `process.env.MONGO_URI` first. If absent or unreachable, it dynamically initializes an embedded `mongodb-memory-server` instance. This guarantees that anyone can run `npm run dev` and test immediately without database configuration hurdles.

5. **Single Page Application (SPA) Support**:
   - The tracking library monkey-patches `history.pushState` and `history.replaceState` and listens to `popstate` and `hashchange`. This enables automatic page view tracking in modern frameworks (Next.js, React Router, Vue) without manual route hooks.

---

## 📂 Project Structure

```
user-analytics-app/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & in-memory fallback
│   ├── controllers/
│   │   ├── analyticsController.js# Heatmap, pages & overview statistics
│   │   ├── eventController.js    # Event ingestion & session updates
│   │   └── sessionController.js  # Sessions list & user journey timeline
│   ├── models/
│   │   ├── Event.js              # Event schema with compound indexes
│   │   └── Session.js            # Session aggregate schema
│   ├── public/
│   │   └── tracker.js            # Static client tracking library
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── eventRoutes.js
│   │   └── sessionRoutes.js
│   ├── seed/
│   │   └── seedData.js           # Realistic demo e-commerce journeys
│   ├── server.js                 # Express application entry
│   └── package.json
├── demo-site/
│   ├── index.html                # Aura Store Home
│   ├── products.html             # Catalog & Filter page
│   ├── cart.html                 # Cart & Checkout page
│   ├── styles.css                # Store styling
│   └── demo.js                   # Demo store interactivity & live HUD
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # API integration client
│   │   ├── components/
│   │   │   ├── HeatmapViewer.jsx # Dual-mode heatmap (thermal & dot)
│   │   │   ├── LiveEventFeed.jsx # Real-time event ingestion feed
│   │   │   ├── Navbar.jsx        # Navigation & quick actions
│   │   │   ├── SessionList.jsx   # Sessions table with filters
│   │   │   ├── SessionTimelineModal.jsx # Chronological User Journey
│   │   │   ├── StatsOverview.jsx # High-level KPIs & top pages
│   │   │   └── TrackerCodeSnippet.jsx   # Embed instructions
│   │   ├── App.jsx               # Main React application
│   │   ├── index.css             # Design system styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── package.json                  # Root orchestration
└── README.md
```

---

## 👨‍💻 Author
**Ayush Mishra**  
- GitHub: [@AyushMishra-02](https://github.com/AyushMishra-02)
- Repository: [https://github.com/AyushMishra-02/user-analytics](https://github.com/AyushMishra-02/user-analytics)
