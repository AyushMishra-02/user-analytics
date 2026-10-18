import React, { useEffect } from 'react';
import { X, Eye, MousePointerClick, Clock, Globe, Laptop, ArrowRight, Layers, Sparkles } from 'lucide-react';

export default function SessionTimelineModal({ sessionData, onClose, isLoading }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sessionData && !isLoading) return null;

  const session = sessionData?.session || {};
  const timeline = sessionData?.timeline || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>User Journey Timeline</span>
              <span className="badge badge-purple">{timeline.length} Events</span>
            </div>
            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="session-id-badge">{session.sessionId}</span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Session Overview Mini Bar */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between' }}>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Session Duration</span>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} color="#38bdf8" />
                <span>{session.durationSeconds || 0} seconds</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unique Pages</span>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Globe size={15} color="#34d399" />
                <span>{(session.pagesVisited || []).length} pages</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Client Device</span>
              <div style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.userAgent || 'Standard Browser'}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div className="live-pulse-dot" style={{ width: '12px', height: '12px', marginBottom: '1rem' }}></div>
              <p>Loading chronological event journey...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>No events recorded for this session.</p>
            </div>
          ) : (
            <div className="timeline-container">
              <div className="timeline-line" />

              {timeline.map((event) => {
                const isClick = event.eventType === 'click';
                const isPageView = event.eventType === 'page_view';

                return (
                  <div key={event._id || event.stepNumber} className="timeline-step">
                    {/* Node Circle */}
                    <div
                      className="timeline-node"
                      style={{
                        borderColor: isClick ? '#f43f5e' : '#06b6d4',
                        color: isClick ? '#fb7185' : '#22d3ee',
                      }}
                    >
                      {event.stepNumber}
                    </div>

                    {/* Step Card */}
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isPageView ? (
                            <span className="badge badge-blue">
                              <Eye size={12} />
                              PAGE_VIEW
                            </span>
                          ) : (
                            <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                              <MousePointerClick size={12} />
                              CLICK
                            </span>
                          )}

                          <span className="timeline-offset">{event.formattedOffset}</span>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* URL */}
                      <div className="timeline-url">
                        <Globe size={13} style={{ flexShrink: 0 }} />
                        <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{event.pageUrl}</span>
                      </div>

                      {/* Click Metadata (if click) */}
                      {isClick && (
                        <div className="timeline-details">
                          <div>
                            Coordinates: <span className="timeline-coord-tag">X: {event.clickX}px, Y: {event.clickY}px</span>
                          </div>

                          {event.viewportWidth && (
                            <div>
                              Viewport: <span className="timeline-coord-tag">{event.viewportWidth} &times; {event.viewportHeight}</span>
                            </div>
                          )}

                          {event.elementTag && (
                            <div>
                              Element: <span className="timeline-coord-tag">&lt;{event.elementTag}&gt;</span>
                            </div>
                          )}

                          {event.elementText && (
                            <div style={{ width: '100%' }}>
                              Text: <span style={{ color: '#fff', fontWeight: '600', fontStyle: 'italic' }}>"{event.elementText}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Journey
          </button>
        </div>
      </div>
    </div>
  );
}
