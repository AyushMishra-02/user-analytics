/**
 * CausalFunnel Multi-Tenant Analytics Tracking Library (v2.0)
 * Lightweight client-side session tracker, heatmap, scroll depth & rage-click collector.
 */
(function (window, document) {
  'use strict';

  if (window.CausalTracker && window.CausalTracker._initialized) {
    return;
  }

  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  // Extract siteId & endpoint from script attributes or src query params
  let scriptSiteId = currentScript ? currentScript.getAttribute('data-site-id') : null;
  let scriptEndpoint = currentScript ? currentScript.getAttribute('data-endpoint') : null;
  const scriptAutoTrack = currentScript ? currentScript.getAttribute('data-auto-track') !== 'false' : true;
  const scriptRespectDnt = currentScript ? currentScript.getAttribute('data-respect-dnt') !== 'false' : true;

  if (currentScript && currentScript.src) {
    try {
      const urlObj = new URL(currentScript.src, window.location.href);
      if (!scriptSiteId) scriptSiteId = urlObj.searchParams.get('siteId');
      if (!scriptEndpoint) scriptEndpoint = `${urlObj.origin}/api/events`;
    } catch (e) {}
  }

  const CONFIG = {
    siteId: scriptSiteId || null,
    endpoint: scriptEndpoint || 'http://localhost:5000/api/events',
    sessionKey: 'cf_session_id',
    sessionCookieDays: 1,
    batchIntervalMs: 800,
    maxBatchSize: 10,
    autoTrackPageViews: true,
    autoTrackClicks: true,
    autoTrackScroll: true,
    detectRageClicks: true,
    respectDnt: scriptRespectDnt,
    debug: false,
  };

  const state = {
    sessionId: null,
    queue: [],
    batchTimer: null,
    listeners: [],
    scrollMilestones: new Set(),
    recentClicks: [],
  };

  function isDntEnabled() {
    if (!CONFIG.respectDnt) return false;
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt === '1' || dnt === 'yes';
  }

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

  function setCookie(name, value, days) {
    try {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
    } catch (e) {}
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
    } catch (e) {}
    return null;
  }

  function initSessionId() {
    const key = CONFIG.siteId ? `${CONFIG.sessionKey}_${CONFIG.siteId}` : CONFIG.sessionKey;
    let sid = null;
    try {
      if (typeof window.localStorage !== 'undefined') {
        sid = window.localStorage.getItem(key);
      }
    } catch (e) {}

    if (!sid) sid = getCookie(key);

    if (!sid) {
      sid = 'cf_' + generateUUID();
      try {
        if (typeof window.localStorage !== 'undefined') {
          window.localStorage.setItem(key, sid);
        }
      } catch (e) {}
      setCookie(key, sid, CONFIG.sessionCookieDays);
    }

    state.sessionId = sid;
    return sid;
  }

  function sendPayload(events) {
    if (!events || events.length === 0) return;
    const payload = JSON.stringify(events);
    const endpoint = CONFIG.endpoint;

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const success = navigator.sendBeacon(endpoint, blob);
        if (success) return;
      } catch (e) {}
    }

    if (typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
      return;
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    } catch (e) {}
  }

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

  function queueEvent(eventData) {
    state.queue.push(eventData);
    for (const listener of state.listeners) {
      try {
        listener(eventData);
      } catch (e) {}
    }
    if (state.queue.length >= CONFIG.maxBatchSize) {
      flush();
      return;
    }
    if (!state.batchTimer) {
      state.batchTimer = setTimeout(flush, CONFIG.batchIntervalMs);
    }
  }

  function track(eventType, details = {}) {
    if (isDntEnabled()) return;
    if (!CONFIG.siteId) {
      if (CONFIG.debug) console.warn('[CausalTracker] Missing siteId. Skipping event.');
      return;
    }
    if (!state.sessionId) {
      initSessionId();
    }

    const event = {
      siteId: CONFIG.siteId,
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

  function trackPageView(pageUrl) {
    state.scrollMilestones.clear();
    track('page_view', {
      pageUrl: pageUrl || window.location.href,
    });
    flush();
  }

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

      const payload = {
        clickX,
        clickY,
        elementTag: target.tagName || null,
        elementId: target.id || null,
        elementClass: target.className && typeof target.className === 'string' ? target.className : null,
        elementText,
      };

      // Rage Click Detection: 3+ clicks within 800ms inside a 40px radius
      if (CONFIG.detectRageClicks) {
        const now = Date.now();
        state.recentClicks = state.recentClicks.filter((c) => now - c.t < 800);
        state.recentClicks.push({ x: clickX, y: clickY, t: now });

        const nearby = state.recentClicks.filter(
          (c) => Math.hypot(c.x - clickX, c.y - clickY) <= 40
        );

        if (nearby.length >= 3) {
          state.recentClicks = []; // Reset after triggering
          track('rage_click', {
            ...payload,
            metadata: { burstCount: nearby.length },
          });
          return;
        }
      }

      track('click', payload);
    } catch (err) {}
  }

  function handleScroll() {
    try {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const winHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollable = docHeight - winHeight;
      if (scrollable <= 0) return;

      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const percent = Math.min(100, Math.round((scrollTop / scrollable) * 100));

      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (percent >= m && !state.scrollMilestones.has(m)) {
          state.scrollMilestones.add(m);
          track('scroll', {
            metadata: { scrollDepthPercent: m },
          });
        }
      }
    } catch (e) {}
  }

  function setupSPATracking() {
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        trackPageView(currentUrl);
      }
    };

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

  function init(customConfig = {}) {
    Object.assign(CONFIG, customConfig);
    if (isDntEnabled()) return;
    initSessionId();

    if (CONFIG.autoTrackClicks) {
      document.addEventListener('click', handleClick, true);
    }

    if (CONFIG.autoTrackScroll) {
      let scrollTimer = null;
      window.addEventListener(
        'scroll',
        () => {
          if (scrollTimer) return;
          scrollTimer = setTimeout(() => {
            scrollTimer = null;
            handleScroll();
          }, 250);
        },
        { passive: true }
      );
    }

    if (CONFIG.autoTrackPageViews) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        trackPageView();
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          trackPageView();
        });
      }
      setupSPATracking();
    }

    const unloadHandler = () => flush();
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', unloadHandler);
    window.addEventListener('beforeunload', unloadHandler);
  }

  const CausalTracker = {
    _initialized: true,
    init,
    track,
    trackPageView,
    flush,
    getSessionId: () => state.sessionId,
    getSiteId: () => CONFIG.siteId,
    resetSession: () => {
      const key = CONFIG.siteId ? `${CONFIG.sessionKey}_${CONFIG.siteId}` : CONFIG.sessionKey;
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
      setCookie(key, '', -1);
      state.sessionId = null;
      return initSessionId();
    },
    onEvent: (cb) => {
      if (typeof cb === 'function') state.listeners.push(cb);
    },
  };

  window.CausalTracker = CausalTracker;

  if (scriptAutoTrack && CONFIG.siteId) {
    init();
  }
})(window, document);
