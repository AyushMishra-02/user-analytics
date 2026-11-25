/**
 * Research-Grade Behavioral Analytics Engine
 * 1. Absorbing Markov Chain (Transition Matrix, Fundamental Matrix N = (I - Q)^-1, Removal Effect)
 * 2. Information-Theoretic & Statistical Anomaly Detection (Shannon Entropy, Inter-Event CV, Frustration Index)
 */

/**
 * Clean URL into a readable state label (e.g. "/demo/products.html" -> "/products.html")
 */
function normalizeState(url) {
  if (!url) return '/';
  try {
    const u = new URL(url, 'http://localhost');
    let path = u.pathname || '/';
    if (path.startsWith('/demo/')) path = path.replace('/demo', '');
    return path || '/';
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, '') || '/';
  }
}

/**
 * Gauss-Jordan Matrix Inversion for Fundamental Matrix N = (I - Q)^-1
 */
function invertMatrix(matrix) {
  const n = matrix.length;
  if (n === 0) return [];

  const aug = matrix.map((row, i) => [
    ...row.map((v) => v),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }

    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) {
      // Singular or near-singular fallback: perturb diagonal slightly
      aug[col][col] = 1e-6;
    }

    const div = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= div;
    }

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

/**
 * Compute Absorbing Markov Chain metrics from chronological session page sequences.
 * Transient states: START + unique pages
 * Absorbing states: DEEP_ENGAGED (3+ page views or cart/checkout), BOUNCE_EXIT (1-2 views)
 */
function computeMarkovAnalysis(sessionMap) {
  const paths = [];
  const stateSet = new Set();

  for (const [, events] of sessionMap.entries()) {
    const pageEvents = events.filter((e) => e.eventType === 'page_view');
    if (pageEvents.length === 0) continue;

    const seq = [];
    for (const ev of pageEvents) {
      const s = normalizeState(ev.pageUrl);
      // Collapse consecutive reloads of the exact same page for cleaner state transitions
      if (seq.length === 0 || seq[seq.length - 1] !== s) {
        seq.push(s);
        stateSet.add(s);
      }
    }

    const totalClicks = events.filter((e) => e.eventType === 'click' || e.eventType === 'rage_click').length;
    const isDeepEngaged =
      seq.length >= 3 ||
      totalClicks >= 3 ||
      seq.some((s) => /cart|checkout|pricing|contact|signup/i.test(s));

    const absorbing = isDeepEngaged ? 'DEEP_ENGAGED' : 'BOUNCE_EXIT';
    paths.push(['START', ...seq, absorbing]);
  }

  if (paths.length === 0) {
    return {
      states: [],
      transientStates: [],
      absorbingStates: ['DEEP_ENGAGED', 'BOUNCE_EXIT'],
      transitionMatrix: [],
      removalEffects: [],
      expectedStepsFromStart: 0,
      baselineEngagementProb: 0,
      totalTransitions: 0,
    };
  }

  const transientStates = ['START', ...Array.from(stateSet).slice(0, 12)];
  const absorbingStates = ['DEEP_ENGAGED', 'BOUNCE_EXIT'];
  const allStates = [...transientStates, ...absorbingStates];
  const idxMap = new Map(allStates.map((s, i) => [s, i]));

  const k = allStates.length;
  const tCount = transientStates.length;
  const counts = Array.from({ length: k }, () => Array(k).fill(0));
  let totalTransitions = 0;

  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const fromIdx = idxMap.get(path[i]);
      const toIdx = idxMap.get(path[i + 1]);
      if (fromIdx !== undefined && toIdx !== undefined) {
        counts[fromIdx][toIdx] += 1;
        totalTransitions += 1;
      }
    }
  }

  // Absorbing states stay in themselves with probability 1
  for (const abs of absorbingStates) {
    const aIdx = idxMap.get(abs);
    counts[aIdx][aIdx] = 1;
  }

  // Normalize rows into Transition Probability Matrix P
  const P = counts.map((row) => {
    const sum = row.reduce((a, b) => a + b, 0);
    if (sum === 0) return row.map(() => 0);
    return row.map((v) => Math.round((v / sum) * 1000) / 1000);
  });

  // Helper: compute absorption probability into DEEP_ENGAGED from START, optionally removing a state
  const solveAbsorption = (removedState = null) => {
    // Build Q (tCount x tCount) and R (tCount x 2)
    const Q = Array.from({ length: tCount }, () => Array(tCount).fill(0));
    const R = Array.from({ length: tCount }, () => Array(2).fill(0));
    const remIdx = removedState ? idxMap.get(removedState) : -1;

    for (let i = 0; i < tCount; i++) {
      if (i === remIdx) continue;
      for (let j = 0; j < tCount; j++) {
        if (j === remIdx) {
          // Transitions into removed state redirect to BOUNCE_EXIT
          R[i][1] += P[i][j];
        } else {
          Q[i][j] = P[i][j];
        }
      }
      R[i][0] += P[i][tCount]; // DEEP_ENGAGED
      R[i][1] += P[i][tCount + 1]; // BOUNCE_EXIT
    }

    // I - Q
    const IminusQ = Q.map((row, i) =>
      row.map((val, j) => (i === j ? 1 - val : -val))
    );

    const N = invertMatrix(IminusQ);

    // Expected steps from START (row 0 of N summed)
    const expectedSteps = N[0] ? N[0].reduce((a, b) => a + b, 0) : 0;

    // B = N * R -> B[0][0] is probability START reaches DEEP_ENGAGED
    let deepProb = 0;
    for (let j = 0; j < tCount; j++) {
      deepProb += (N[0]?.[j] || 0) * R[j][0];
    }

    return {
      deepProb: Math.min(1, Math.max(0, deepProb)),
      expectedSteps: Math.max(0, Math.round(expectedSteps * 100) / 100),
    };
  };

  const baseline = solveAbsorption(null);

  // Removal Effect per page state
  const removalEffects = [];
  for (const state of transientStates) {
    if (state === 'START') continue;
    const without = solveAbsorption(state);
    const drop = baseline.deepProb > 0
      ? ((baseline.deepProb - without.deepProb) / baseline.deepProb) * 100
      : 0;
    removalEffects.push({
      page: state,
      removalEffectPercent: Math.max(0, Math.round(drop * 10) / 10),
      probWithoutPage: Math.round(without.deepProb * 1000) / 10,
    });
  }
  removalEffects.sort((a, b) => b.removalEffectPercent - a.removalEffectPercent);

  return {
    states: allStates,
    transientStates,
    absorbingStates,
    transitionMatrix: P,
    removalEffects,
    expectedStepsFromStart: baseline.expectedSteps,
    baselineEngagementProb: Math.round(baseline.deepProb * 1000) / 10,
    totalTransitions,
  };
}

/**
 * Compute Shannon Entropy H(X) = -sum(p_i * log2(p_i)) over visited URLs/event types
 */
function shannonEntropy(items) {
  if (!items || items.length === 0) return 0;
  const freq = new Map();
  for (const item of items) {
    freq.set(item, (freq.get(item) || 0) + 1);
  }
  const n = items.length;
  let h = 0;
  for (const count of freq.values()) {
    const p = count / n;
    h -= p * Math.log2(p);
  }
  return Math.round(h * 1000) / 1000;
}

/**
 * Behavioral Anomaly, Frustration & Bot Detection per session
 */
function computeSessionAnomalies(sessionMap) {
  const results = [];

  for (const [sessionId, events] of sessionMap.entries()) {
    if (events.length === 0) continue;

    // 1. Path & Event Entropy
    const tokens = events.map((e) => `${e.eventType}:${normalizeState(e.pageUrl)}`);
    const entropy = shannonEntropy(tokens);

    // 2. Inter-event time intervals (ms)
    const deltas = [];
    for (let i = 1; i < events.length; i++) {
      const dt = new Date(events[i].timestamp).getTime() - new Date(events[i - 1].timestamp).getTime();
      if (dt >= 0) deltas.push(dt);
    }

    const avgDeltaMs = deltas.length > 0
      ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
      : 0;

    let cv = 0; // Coefficient of variation (std / mean)
    if (deltas.length >= 2 && avgDeltaMs > 0) {
      const variance = deltas.reduce((acc, d) => acc + Math.pow(d - avgDeltaMs, 2), 0) / deltas.length;
      cv = Math.round((Math.sqrt(variance) / avgDeltaMs) * 100) / 100;
    }

    // 3. Rage clicks & scroll engagement
    const rageClicks = events.filter((e) => e.eventType === 'rage_click').length;
    const totalClicks = events.filter((e) => e.eventType === 'click' || e.eventType === 'rage_click').length;
    const scrolls = events.filter((e) => e.eventType === 'scroll').length;

    // 4. Composite Anomaly Score (0-100)
    let score = 0;
    const reasons = [];

    // Superhuman speed (< 200ms avg between >=4 events) -> Bot-like
    if (events.length >= 4 && avgDeltaMs > 0 && avgDeltaMs < 250) {
      score += 45;
      reasons.push(`Superhuman cadence (${avgDeltaMs}ms avg)`);
    }

    // Robotic low variance (CV < 0.15 across >= 4 intervals) -> Scripted bot
    if (deltas.length >= 4 && cv < 0.15) {
      score += 30;
      reasons.push(`Robotic timing regularity (CV=${cv})`);
    }

    // Rage click frustration
    if (rageClicks > 0) {
      score += Math.min(50, rageClicks * 25);
      reasons.push(`${rageClicks} rage-click burst(s)`);
    }

    // Very low entropy on high event count -> Repetitive looping
    if (events.length >= 6 && entropy < 0.8) {
      score += 25;
      reasons.push(`Low path entropy (H=${entropy})`);
    }

    score = Math.min(100, score);

    let classification = 'Normal Human';
    if (rageClicks > 0 && score >= 25 && !(avgDeltaMs > 0 && avgDeltaMs < 250 && deltas.length >= 4)) {
      classification = 'Frustrated User';
    } else if (score >= 45) {
      classification = 'Bot / Script Anomaly';
    } else if (scrolls === 0 && totalClicks === 0 && events.length === 1) {
      classification = 'Single-Hit Bounce';
    }

    results.push({
      sessionId,
      eventCount: events.length,
      entropy,
      avgDeltaMs,
      timingCV: cv,
      rageClicks,
      anomalyScore: score,
      classification,
      reasons,
    });
  }

  results.sort((a, b) => b.anomalyScore - a.anomalyScore);

  const avgEntropy = results.length > 0
    ? Math.round((results.reduce((s, r) => s + r.entropy, 0) / results.length) * 1000) / 1000
    : 0;

  const anomalousCount = results.filter((r) => r.anomalyScore >= 25).length;

  return {
    sessions: results.slice(0, 50),
    avgEntropy,
    anomalousCount,
    totalAnalyzed: results.length,
  };
}

module.exports = {
  computeMarkovAnalysis,
  computeSessionAnomalies,
};
