/**
 * CausalFunnel Analytics Tracking Library
 * Lightweight client-side session tracker and event collector.
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.CausalTracker && window.CausalTracker._initialized) {
    return;
  }

  // Detect script tag configuration
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  const scriptEndpoint = currentScript ? currentScript.getAttribute('data-endpoint') : null;
  const scriptAutoTrack = currentScript ? currentScript.getAttribute('data-auto-track') !== 'false' : true;

  // Defaults
  const CONFIG = {
    endpoint: scriptEndpoint || 'http://localhost:5000/api/events',
    sessionKey: 'cf_session_id',
    sessionCookieDays: 1,
    batchIntervalMs: 800,
    maxBatchSize: 10,
    autoTrackPageViews: true,
    autoTrackClicks: true,
    debug: true,
  };

  const state = {
    sessionId: null,
    queue: [],
    batchTimer: null,
    listeners: [],
  };

  /**
   * UUID v4 Generator
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Cookie Helpers (Fallback if localStorage is blocked)
   */
  function setCookie(name, value, days) {
    try {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
    } catch (e) {
      // Ignore cookie errors
    }
  }

  function getCookie(name) {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
    } catch (e) {
      // Ignore cookie errors
    }
    return null;
  }

  /**
   * Get or Create Session ID
   * Stored in localStorage with fallback to cookie
   */
  function initSessionId() {
    let sid = null;

    // 1. Try localStorage
    try {
      if (typeof window.localStorage !== 'undefined') {
        sid = window.localStorage.getItem(CONFIG.sessionKey);
      }
    } catch (e) {
      // LocalStorage access might be restricted in some contexts
    }

    // 2. Fallback to Cookie
    if (!sid) {
      sid = getCookie(CONFIG.sessionKey);
    }

    // 3. Generate new session ID if none found
    if (!sid) {
      sid = 'cf_' + generateUUID();
      try {
        if (typeof window.localStorage !== 'undefined') {
          window.localStorage.setItem(CONFIG.sessionKey, sid);
        }
      } catch (e) {}
      setCookie(CONFIG.sessionKey, sid, CONFIG.sessionCookieDays);
    }

    state.sessionId = sid;
    return sid;
  }

  /**
   * Send events payload to backend API
   */
  function sendPayload(events) {
    if (!events || events.length === 0) return;

    const payload = JSON.stringify(events);
    const endpoint = CONFIG.endpoint;

    // 1. Try navigator.sendBeacon (ideal for analytics, doesn't block unloads)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const success = navigator.sendBeacon(endpoint, blob);
        if (success) {
          if (CONFIG.debug) console.log('[CausalTracker] Sent via sendBeacon:', events.length, 'events');
          return;
        }
      } catch (e) {
        // Fallback to fetch
      }
    }

    // 2. Fetch with keepalive
    if (typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true,
      })
        .then((res) => {
          if (CONFIG.debug) console.log('[CausalTracker] Sent via fetch:', events.length, 'events');
        })
        .catch((err) => {
          if (CONFIG.debug) console.warn('[CausalTracker] Delivery failed:', err.message);
        });
      return;
    }

    // 3. Fallback to XMLHttpRequest
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    } catch (e) {}
  }

  /**
   * Flush queue immediately
   */
  function flush() {
    if (state.batchTimer) {
      clearTimeout(state.batchTimer);
      state.batchTimer = null;
    }

    if (state.queue.length === 0) return;

    const toSend = state.queue.slice();
    state.queue = [];
    sendPayload(toSend);
  }

  /**
   * Queue event for delivery
   */
  function queueEvent(eventData) {
    state.queue.push(eventData);

    // Notify local in-page listeners (e.g., debug HUDs or demo inspector)
    for (const listener of state.listeners) {
      try {
        listener(eventData);
      } catch (e) {}
    }

    // If max batch size reached, flush immediately
    if (state.queue.length >= CONFIG.maxBatchSize) {
      flush();
      return;
    }

    // Schedule delayed flush
    if (!state.batchTimer) {
      state.batchTimer = setTimeout(flush, CONFIG.batchIntervalMs);
    }
  }

  /**
   * Track an event
   */
  function track(eventType, details = {}) {
    if (!state.sessionId) {
      initSessionId();
    }

    const event = {
      sessionId: state.sessionId,
      eventType: String(eventType).toLowerCase(),
      pageUrl: details.pageUrl || window.location.href,
      timestamp: details.timestamp || new Date().toISOString(),
      clickX: details.clickX !== undefined ? details.clickX : null,
      clickY: details.clickY !== undefined ? details.clickY : null,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : null,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : null,
      scrollX: typeof window !== 'undefined' ? (window.scrollX || window.pageXOffset || 0) : 0,
      scrollY: typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset || 0) : 0,
      elementTag: details.elementTag || null,
      elementId: details.elementId || null,
      elementClass: details.elementClass || null,
      elementText: details.elementText || null,
      metadata: {
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        screen: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '',
        title: typeof document !== 'undefined' ? document.title : '',
        ...details.metadata,
      },
    };

    queueEvent(event);
  }

  /**
   * Track page view
   */
  function trackPageView(pageUrl) {
    track('page_view', {
      pageUrl: pageUrl || window.location.href,
    });
    // Flush page view immediately so it registers right away
    flush();
  }

  /**
   * Global click listener
   */
  function handleClick(e) {
    try {
      const target = e.target;
      if (!target) return;

      const clickX = e.pageX !== undefined ? e.pageX : e.clientX;
      const clickY = e.pageY !== undefined ? e.pageY : e.clientY;

      let elementText = '';
      if (target.innerText) {
        elementText = target.innerText.trim().slice(0, 100);
      } else if (target.value) {
        elementText = String(target.value).trim().slice(0, 100);
      } else if (target.getAttribute && target.getAttribute('aria-label')) {
        elementText = target.getAttribute('aria-label').trim().slice(0, 100);
      }

      track('click', {
        clickX,
        clickY,
        elementTag: target.tagName || null,
        elementId: target.id || null,
        elementClass: target.className && typeof target.className === 'string' ? target.className : null,
        elementText,
      });
    } catch (err) {
      if (CONFIG.debug) console.warn('[CausalTracker] Click capture error:', err);
    }
  }

  /**
   * SPA Route Change Listeners
   */
  function setupSPATracking() {
    let lastUrl = window.location.href;

    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        trackPageView(currentUrl);
      }
    };

    // Monkey-patch pushState & replaceState
    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        checkUrlChange();
      };
    }

    const originalReplaceState = history.replaceState;
    if (originalReplaceState) {
      history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        checkUrlChange();
      };
    }

    window.addEventListener('popstate', checkUrlChange);
    window.addEventListener('hashchange', checkUrlChange);
  }

  /**
   * Initialize Tracker
   */
  function init(customConfig = {}) {
    Object.assign(CONFIG, customConfig);

    initSessionId();

    if (CONFIG.autoTrackClicks) {
      document.addEventListener('click', handleClick, true);
    }

    if (CONFIG.autoTrackPageViews) {
      // Track initial page view
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        trackPageView();
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          trackPageView();
        });
      }
      setupSPATracking();
    }

    // Flush remaining events before unload
    const unloadHandler = () => flush();
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', unloadHandler);
    window.addEventListener('beforeunload', unloadHandler);

    if (CONFIG.debug) {
      console.log(`[CausalTracker] Initialized with session: ${state.sessionId}`);
    }
  }

  // Public API
  const CausalTracker = {
    _initialized: true,
    init,
    track,
    trackPageView,
    flush,
    getSessionId: () => state.sessionId,
    resetSession: () => {
      try {
        window.localStorage.removeItem(CONFIG.sessionKey);
      } catch (e) {}
      setCookie(CONFIG.sessionKey, '', -1);
      state.sessionId = null;
      return initSessionId();
    },
    onEvent: (cb) => {
      if (typeof cb === 'function') state.listeners.push(cb);
    },
  };

  window.CausalTracker = CausalTracker;

  // Auto-init if enabled
  if (scriptAutoTrack) {
    init();
  }
})(window, document);
