import React, { useState } from 'react';
import { Search, ArrowUpDown, ChevronRight, Clock, Eye, MousePointerClick, Globe, ExternalLink } from 'lucide-react';

export default function SessionList({ sessions, onSelectSession, onSearch, currentSearch, totalSessions }) {
  const [localSearch, setLocalSearch] = useState(currentSearch || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
  };

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title">
            <span>Tracked User Sessions</span>
            <span className="badge badge-purple">{totalSessions} sessions</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Click on any session row to inspect its chronological event journey.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by session ID or URL..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '32px', width: '260px' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
          {localSearch && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setLocalSearch('');
                onSearch('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No sessions found.</p>
          <p style={{ fontSize: '0.85rem' }}>
            Try clearing your search query or seed demo data from the top bar.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Total Events</th>
                <th>Views / Clicks</th>
                <th>Duration</th>
                <th>Pages Visited</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.sessionId || session._id}
                  className="clickable-row"
                  onClick={() => onSelectSession(session.sessionId)}
                >
                  <td>
                    <div className="session-id-badge" title={session.sessionId}>
                      {session.sessionId.length > 24
                        ? session.sessionId.slice(0, 22) + '...'
                        : session.sessionId}
                    </div>
                  </td>

                  <td>
                    <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                      {session.totalEvents} events
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className="badge badge-emerald" title="Page Views">
                        <Eye size={12} />
                        {session.pageViews || 0}
                      </span>
                      <span className="badge badge-amber" title="Clicks">
                        <MousePointerClick size={12} />
                        {session.clicks || 0}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Clock size={13} />
                      <span>{session.durationSeconds || 0}s</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxWidth: '280px' }}>
                      {(session.pagesVisited || []).slice(0, 2).map((url, i) => {
                        const short = url.replace(/^https?:\/\/[^/]+/, '') || url;
                        return (
                          <span
                            key={i}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              color: '#cbd5e1',
                            }}
                            title={url}
                          >
                            {short}
                          </span>
                        );
                      })}
                      {(session.pagesVisited || []).length > 2 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          +{(session.pagesVisited || []).length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {formatDate(session.lastActive)}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#60a5fa' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession(session.sessionId);
                      }}
                    >
                      <span>Journey</span>
                      <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
