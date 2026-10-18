import React, { useState, useEffect } from 'react';
import { Radio, Eye, MousePointerClick, Pause, Play, RefreshCw, Zap } from 'lucide-react';
import { fetchRecentEvents } from '../api/client';

export default function LiveEventFeed() {
  const [events, setEvents] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const data = await fetchRecentEvents(40);
      setEvents(data.events || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load recent events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Polling loop when isLive is true
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      loadEvents();
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span className="live-pulse-dot" style={{ background: isLive ? '#10b981' : '#64748b' }}></span>
            <span>Live Event Ingestion Stream</span>
            <span className="badge badge-blue">{events.length} Recent Events</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {isLive ? 'Polling server every 2.5s for real-time tracking events.' : 'Live polling paused.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-secondary btn-sm`}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause size={14} /> : <Play size={14} />}
            <span>{isLive ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadEvents}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>Connecting to event stream...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No events logged yet. Seed demo data or visit the demo store to track events.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Session ID</th>
                <th>Page URL</th>
                <th>Details (Coords / Target)</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => {
                const isClick = ev.eventType === 'click';
                const shortUrl = ev.pageUrl?.replace(/^https?:\/\/[^/]+/, '') || ev.pageUrl;

                return (
                  <tr key={ev._id || i}>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                      </span>
                    </td>

                    <td>
                      {isClick ? (
                        <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                          <MousePointerClick size={12} />
                          CLICK
                        </span>
                      ) : (
                        <span className="badge badge-emerald">
                          <Eye size={12} />
                          PAGE_VIEW
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="session-id-badge" title={ev.sessionId}>
                        {ev.sessionId?.slice(0, 16)}...
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: '500', color: '#fff' }} title={ev.pageUrl}>
                        {shortUrl}
                      </span>
                    </td>

                    <td>
                      {isClick ? (
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          <span className="timeline-coord-tag">({ev.clickX}, {ev.clickY})</span>{' '}
                          {ev.elementText ? `"${ev.elementText.slice(0, 30)}"` : `<${ev.elementTag || 'div'}>`}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Initial view &bull; {ev.metadata?.screen || '1440x900'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
