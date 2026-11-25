import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  GitBranch,
  ShieldAlert,
  Cpu,
  BookOpen,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { fetchResearchInsights } from '../api/client';

export default function ResearchInsights({ siteId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResearch = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchResearchInsights(siteId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to compute Markov & Entropy models');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadResearch();
  }, [loadResearch]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <FlaskConical size={28} color="#38bdf8" style={{ marginBottom: '0.75rem' }} />
        <p>Computing Absorbing Markov Fundamental Matrix N = (I - Q)⁻¹ & Shannon Entropy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#fda4af' }}>
        {error}
      </div>
    );
  }

  const markov = data?.markov || {};
  const anomalies = data?.anomalies || {};
  const states = markov.states || [];
  const matrix = markov.transitionMatrix || [];
  const removalEffects = markov.removalEffects || [];
  const sessions = anomalies.sessions || [];

  const getBadgeStyle = (cls) => {
    if (cls === 'Bot / Script Anomaly') {
      return { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' };
    }
    if (cls === 'Frustrated User') {
      return { background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.4)' };
    }
    if (cls === 'Single-Hit Bounce') {
      return { background: 'rgba(100, 116, 139, 0.2)', color: '#cbd5e1', borderColor: 'rgba(100, 116, 139, 0.4)' };
    }
    return { background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.35)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.15rem' }}>
            <FlaskConical size={20} color="#a78bfa" />
            <span>Markov-Chain Attribution & Entropy Anomaly Lab</span>
            <span className="badge badge-purple">Research Engine</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '0.25rem' }}>
            Real-time Absorbing Markov Chain modeling (<code>N = (I - Q)⁻¹</code>) and Information-Theoretic clickstream anomaly scoring.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadResearch}>
          <RefreshCw size={14} />
          <span>Recompute Models</span>
        </button>
      </div>

      {/* Research KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#8b5cf6' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Deep Engagement Prob</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{markov.baselineEngagementProb || 0}%</div>
          <div className="kpi-subtext">
            <span>Absorption probability B₀,₀ from START</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#06b6d4' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Expected Steps to Exit</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <GitBranch size={18} />
            </div>
          </div>
          <div className="kpi-value">{markov.expectedStepsFromStart || 0}</div>
          <div className="kpi-subtext">
            <span>{markov.totalTransitions || 0} state transitions modeled</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#3b82f6' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Mean Path Entropy H(X)</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div className="kpi-value">{anomalies.avgEntropy || 0} bits</div>
          <div className="kpi-subtext">
            <span>Shannon navigation randomness</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#f43f5e' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Anomalies Detected</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-value">{anomalies.anomalousCount || 0}</div>
          <div className="kpi-subtext">
            <span>Out of {anomalies.totalAnalyzed || 0} analyzed sessions</span>
          </div>
        </div>
      </div>

      {/* Removal Effect + Transition Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Removal Effect */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <GitBranch size={17} color="#38bdf8" />
              <span>Markov Removal Effect (Page Attribution)</span>
            </h3>
            <span className="badge badge-blue">Causal Impact</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Measures how much total deep-engagement probability drops if a given page node is removed from the transition graph.
          </p>

          {removalEffects.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Seed data or browse multiple pages to compute removal effects.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {removalEffects.map((item) => (
                <div key={item.page}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{item.page}</span>
                    <span style={{ color: '#38bdf8', fontWeight: '700' }}>-{item.removalEffectPercent}% drop</span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, item.removalEffectPercent)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #8b5cf6, #38bdf8)',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transition Probability Matrix */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Cpu size={17} color="#a78bfa" />
              <span>Transition Probability Matrix P</span>
            </h3>
            <span className="badge badge-purple">{states.length} States</span>
          </div>
          {states.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No transitions recorded yet.</p>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>From \ To</th>
                    {states.map((s) => (
                      <th key={s} style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {s.length > 14 ? s.slice(0, 12) + '..' : s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {states.map((rowState, i) => (
                    <tr key={rowState}>
                      <td style={{ fontWeight: '700', color: '#fff', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {rowState.length > 14 ? rowState.slice(0, 12) + '..' : rowState}
                      </td>
                      {(matrix[i] || []).map((prob, j) => {
                        const alpha = Math.min(0.65, prob * 0.7);
                        return (
                          <td
                            key={j}
                            style={{
                              textAlign: 'center',
                              background: prob > 0 ? `rgba(59, 130, 246, ${alpha})` : 'transparent',
                              color: prob > 0 ? '#fff' : 'var(--text-dim)',
                              fontWeight: prob > 0.2 ? '700' : '400',
                            }}
                          >
                            {prob > 0 ? prob.toFixed(2) : '·'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Session Anomaly & Bot/Frustration Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <ShieldAlert size={18} color="#fb7185" />
            <span>Session Anomaly, Frustration & Bot Classification</span>
          </h3>
          <span className="badge badge-amber">Entropy + Timing CV</span>
        </div>

        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No sessions analyzed yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Classification</th>
                  <th>Anomaly Score</th>
                  <th>Entropy H(X)</th>
                  <th>Avg Δt / CV</th>
                  <th>Diagnostic Signals</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.sessionId}>
                    <td>
                      <span className="session-id-badge">{s.sessionId.slice(0, 18)}...</span>
                    </td>
                    <td>
                      <span className="badge" style={getBadgeStyle(s.classification)}>
                        {s.classification}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: s.anomalyScore >= 45 ? '#fb7185' : s.anomalyScore >= 25 ? '#fbbf24' : '#34d399' }}>
                        {s.anomalyScore} / 100
                      </strong>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {s.entropy} bits
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.avgDeltaMs}ms (CV={s.timingCV})
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {s.reasons.length > 0 ? s.reasons.join(' • ') : 'Normal human cadence'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mathematical Formulation & Academic References */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <BookOpen size={18} color="#34d399" />
            <span>Mathematical Formulation & Literature Grounding</span>
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <div>
            <strong style={{ color: '#fff' }}>1. Absorbing Markov Chain Attribution</strong>
            <p style={{ marginTop: '0.35rem' }}>
              Models user navigation as a discrete-time Markov chain with transient page states <code>Q</code> and absorbing outcome states <code>R</code> (Deep Engaged vs. Bounce). The Fundamental Matrix <code>N = (I - Q)⁻¹</code> yields expected steps to exit, and <code>B = N · R</code> gives exact conversion probability. Removal Effect measures causal importance via state-deletion counterfactuals (<em>Anderl et al., IJRM 2016</em>).
            </p>
          </div>
          <div>
            <strong style={{ color: '#fff' }}>2. Information-Theoretic Anomaly Detection</strong>
            <p style={{ marginTop: '0.35rem' }}>
              Computes Shannon Entropy <code>H(X) = -∑ p(xᵢ) log₂ p(xᵢ)</code> over session state-action tokens alongside inter-event temporal Coefficient of Variation (<code>CV = σ / μ</code>) and spatial rage-click bursts (<code>≤ 40px, ≤ 800ms</code>) to distinguish normal human exploration from frustrated UX friction and scripted bots (<em>Shannon, 1948</em>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
