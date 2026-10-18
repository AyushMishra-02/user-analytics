import React from 'react';
import { Users, MousePointerClick, Eye, Clock, Layers, TrendingUp, ExternalLink, ArrowRight } from 'lucide-react';

export default function StatsOverview({ overview, onNavigateTab }) {
  const kpis = overview?.kpis || {
    totalSessions: 0,
    totalEvents: 0,
    pageViews: 0,
    clicks: 0,
    avgDurationSeconds: 0,
    avgEventsPerSession: 0,
  };

  const topPages = overview?.topPages || [];

  const clickRate = kpis.totalEvents > 0
    ? Math.round((kpis.clicks / kpis.totalEvents) * 100)
    : 0;
  const pageViewRate = kpis.totalEvents > 0
    ? Math.round((kpis.pageViews / kpis.totalEvents) * 100)
    : 0;

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#3b82f6' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Total Sessions</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.totalSessions}</div>
          <div className="kpi-subtext">
            <span>Unique browser sessions tracked</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#8b5cf6' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Total Interactions</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.totalEvents}</div>
          <div className="kpi-subtext">
            <span>~{kpis.avgEventsPerSession} events / session</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#06b6d4' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Page Views</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Eye size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.pageViews}</div>
          <div className="kpi-subtext">
            <span>{pageViewRate}% of total activity</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-glow" style={{ background: '#f43f5e' }}></div>
          <div className="kpi-header">
            <span className="kpi-title">Clicks Recorded</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              <MousePointerClick size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.clicks}</div>
          <div className="kpi-subtext">
            <span>{clickRate}% interaction rate</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Event Distribution & Top Pages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Interaction Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} color="#3b82f6" />
              Interaction Share
            </h3>
            <span className="badge badge-blue">Real-time</span>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#60a5fa' }}>Page Views: {kpis.pageViews}</span>
              <span style={{ color: '#fb7185' }}>Clicks: {kpis.clicks}</span>
            </div>
            {/* Visual Progress Bar */}
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${pageViewRate}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                  transition: 'width 0.5s ease',
                }}
                title={`Page Views: ${pageViewRate}%`}
              />
              <div
                style={{
                  width: `${clickRate}%`,
                  background: 'linear-gradient(90deg, #f43f5e, #fbbf24)',
                  transition: 'width 0.5s ease',
                }}
                title={`Clicks: ${clickRate}%`}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <Clock size={14} />
                <span>Avg Duration</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
                {kpis.avgDurationSeconds}s
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <Layers size={14} />
                <span>Events / Session</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
                {kpis.avgEventsPerSession}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onNavigateTab('sessions')}
            >
              <span>Explore Sessions</span>
              <ArrowRight size={14} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onNavigateTab('heatmap')}
            >
              <span>View Heatmaps</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Top Pages Table Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Eye size={18} color="#06b6d4" />
              Most Visited & Clicked Pages
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top {topPages.length}</span>
          </div>

          {topPages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p>No page activity recorded yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Click "Seed Data" or visit the demo store to track events.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Page URL</th>
                    <th>Views</th>
                    <th>Clicks</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, idx) => {
                    const shortUrl = page.url.replace(/^https?:\/\/[^/]+/, '') || page.url;
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.85rem' }} title={page.url}>
                            {shortUrl}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                            {page.url}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-blue">{page.views}</span>
                        </td>
                        <td>
                          <span className="badge badge-amber">{page.clicks}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '700', color: '#fff' }}>{page.total}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
