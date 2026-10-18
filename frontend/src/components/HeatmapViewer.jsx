import React, { useState, useEffect, useRef } from 'react';
import { Flame, MousePointerClick, Filter, Eye, Layers, ExternalLink, Info, Sliders } from 'lucide-react';

export default function HeatmapViewer({ pages, initialUrl, fetchHeatmapData }) {
  const [selectedUrl, setSelectedUrl] = useState(initialUrl || (pages[0]?.url || ''));
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'dots', 'thermal'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [radius, setRadius] = useState(35);
  const [opacity, setOpacity] = useState(0.85);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Sync selected URL if pages update
  useEffect(() => {
    if (!selectedUrl && pages.length > 0) {
      setSelectedUrl(pages[0].url);
    }
  }, [pages, selectedUrl]);

  // Load heatmap data on selectedUrl change
  useEffect(() => {
    if (!selectedUrl) return;

    let isMounted = true;
    setLoading(true);

    fetchHeatmapData(selectedUrl)
      .then((data) => {
        if (isMounted) {
          setHeatmapData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Heatmap load error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedUrl, fetchHeatmapData]);

  // Render Canvas-based smooth thermal gradient heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapData || heatmapData.points.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (viewMode === 'dots') return; // Only dots requested

    // Create an offscreen grayscale intensity canvas
    const intensityCanvas = document.createElement('canvas');
    intensityCanvas.width = width;
    intensityCanvas.height = height;
    const ictx = intensityCanvas.getContext('2d');

    // Draw radial blur gradients for each click point
    for (const pt of heatmapData.points) {
      // Calculate responsive scaled x and y
      let px = pt.x;
      let py = pt.y;

      // If coordinates exceed canvas bounds or normalized percent is available, scale appropriately
      if (pt.percentX !== null && pt.percentY !== null) {
        px = (pt.percentX / 100) * width;
        py = (pt.percentY / 100) * height;
      } else if (pt.viewportWidth && pt.viewportWidth > 0) {
        px = (pt.x / pt.viewportWidth) * width;
        py = (pt.y / (pt.viewportHeight || 900)) * height;
      }

      const grad = ictx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, `rgba(0, 0, 0, ${opacity * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ictx.fillStyle = grad;
      ictx.beginPath();
      ictx.arc(px, py, radius, 0, Math.PI * 2);
      ictx.fill();
    }

    // Colorize grayscale image with thermal gradient
    const imgData = ictx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Thermal color spectrum lookup helper
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3]; // 0 to 255
      if (alpha === 0) continue;

      const norm = alpha / 255;
      let r = 0, g = 0, b = 0;

      if (norm < 0.25) {
        // Blue to Cyan
        const t = norm / 0.25;
        r = 0;
        g = Math.round(180 * t);
        b = 255;
      } else if (norm < 0.5) {
        // Cyan to Green
        const t = (norm - 0.25) / 0.25;
        r = 0;
        g = 255;
        b = Math.round(255 * (1 - t));
      } else if (norm < 0.75) {
        // Green to Yellow
        const t = (norm - 0.5) / 0.25;
        r = Math.round(255 * t);
        g = 255;
        b = 0;
      } else {
        // Yellow to Bright Red
        const t = (norm - 0.75) / 0.25;
        r = 255;
        g = Math.round(255 * (1 - t));
        b = 0;
      }

      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = Math.min(240, Math.round(alpha * 1.6));
    }

    ctx.putImageData(imgData, 0, 0);
  }, [heatmapData, viewMode, radius, opacity]);

  const points = heatmapData?.points || [];
  const totalClicks = heatmapData?.totalClicks || 0;

  // Group top clicked elements
  const elementCounts = {};
  for (const p of points) {
    const key = p.elementText
      ? `<${p.elementTag || 'ELEMENT'}> "${p.elementText}"`
      : `<${p.elementTag || 'ELEMENT'}> (X: ${p.x}, Y: ${p.y})`;
    elementCounts[key] = (elementCounts[key] || 0) + 1;
  }
  const topElements = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div>
      {/* Top Controls Bar */}
      <div className="heatmap-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#3b82f6" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Target Page:</span>
          </div>

          <select
            className="select-input"
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
          >
            {pages.length === 0 && <option value="">No pages tracked yet</option>}
            {pages.map((p) => {
              const short = p.url.replace(/^https?:\/\/[^/]+/, '') || p.url;
              return (
                <option key={p.url} value={p.url}>
                  {short} ({p.clicks || 0} clicks)
                </option>
              );
            })}
          </select>

          <span className="badge badge-amber">
            <MousePointerClick size={12} />
            {totalClicks} Clicks Recorded
          </span>
        </div>

        {/* View mode toggle & density sliders */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: '0.2rem', borderRadius: '8px' }}>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'both' ? 'active' : ''}`}
              style={{
                background: viewMode === 'both' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'both' ? '#fff' : 'var(--text-muted)',
              }}
              onClick={() => setViewMode('both')}
            >
              Hybrid
            </button>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'thermal' ? 'active' : ''}`}
              style={{
                background: viewMode === 'thermal' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'thermal' ? '#fff' : 'var(--text-muted)',
              }}
              onClick={() => setViewMode('thermal')}
            >
              Density Thermal
            </button>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'dots' ? 'active' : ''}`}
              style={{
                background: viewMode === 'dots' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'dots' ? '#fff' : 'var(--text-muted)',
              }}
              onClick={() => setViewMode('dots')}
            >
              Dot Positions
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Radius:</span>
            <input
              type="range"
              min="15"
              max="70"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: '70px', accentColor: '#3b82f6' }}
            />
          </div>
        </div>
      </div>

      {/* Main Heatmap Stage Card */}
      <div className="heatmap-stage-card">
        {/* Canvas & Overlay Container */}
        <div
          ref={containerRef}
          className="heatmap-canvas-container"
          style={{ position: 'relative', width: '100%', height: '580px', overflow: 'hidden' }}
        >
          {/* Mock E-Commerce Visual Wireframe underneath so clicks correspond to real buttons & cards */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '2rem',
              pointerEvents: 'none',
              opacity: 0.35,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Header wireframe */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.75rem' }}>
              <div style={{ width: '140px', height: '24px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '60px', height: '20px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}></div>
                <div style={{ width: '60px', height: '20px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}></div>
                <div style={{ width: '80px', height: '20px', background: 'rgba(59,130,246,0.3)', borderRadius: '999px' }}></div>
              </div>
            </div>

            {/* Hero Wireframe */}
            <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '380px', height: '32px', background: 'rgba(255,255,255,0.25)', borderRadius: '6px' }}></div>
              <div style={{ width: '480px', height: '16px', background: 'rgba(255,255,255,0.12)', borderRadius: '4px' }}></div>
              <div style={{ width: '160px', height: '38px', background: 'rgba(59,130,246,0.5)', borderRadius: '8px', marginTop: '0.5rem' }}></div>
            </div>

            {/* Cards Wireframe */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '1rem', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ height: '70px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
                  <div style={{ height: '16px', width: '80%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}></div>
                  <div style={{ height: '28px', background: 'rgba(59,130,246,0.4)', borderRadius: '6px' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas for Radial Thermal Heat Gradient */}
          <canvas
            ref={canvasRef}
            width={1100}
            height={580}
            className="heatmap-canvas"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />

          {/* Interactive Dot Overlay */}
          {(viewMode === 'dots' || viewMode === 'both') && (
            <div className="heatmap-dot-overlay">
              {points.map((pt, idx) => {
                let leftPercent = pt.percentX !== null ? pt.percentX : 50;
                let topPercent = pt.percentY !== null ? pt.percentY : 50;

                return (
                  <div
                    key={idx}
                    className="click-dot"
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                    }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    title={`Click at (${pt.x}, ${pt.y}) - ${pt.elementText || pt.elementTag || 'Element'}`}
                  />
                );
              })}
            </div>
          )}

          {/* Hovered Tooltip Inspector Card */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--border-medium)',
                borderRadius: '10px',
                padding: '0.85rem 1.15rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                zIndex: 50,
                fontSize: '0.82rem',
                backdropFilter: 'blur(8px)',
                maxWidth: '280px',
              }}
            >
              <div style={{ fontWeight: '700', color: '#fff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MousePointerClick size={14} color="#f43f5e" />
                <span>Click Inspector</span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Coords: <strong style={{ color: '#fff' }}>X: {hoveredPoint.x}px, Y: {hoveredPoint.y}px</strong>
              </div>
              {hoveredPoint.elementTag && (
                <div style={{ color: 'var(--text-muted)' }}>
                  Element: <span className="timeline-coord-tag">&lt;{hoveredPoint.elementTag}&gt;</span>
                </div>
              )}
              {hoveredPoint.elementText && (
                <div style={{ color: '#e2e8f0', marginTop: '0.25rem', fontStyle: 'italic' }}>
                  "{hoveredPoint.elementText}"
                </div>
              )}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                Session: {hoveredPoint.sessionId?.slice(0, 16)}...
              </div>
            </div>
          )}

          {/* Zero clicks state */}
          {totalClicks === 0 && !loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                background: 'rgba(15, 23, 42, 0.85)',
              }}
            >
              <Flame size={36} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff' }}>No click events for this URL yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Interact with the demo store or click "Simulate Traffic" to generate clicks.
              </p>
            </div>
          )}
        </div>

        {/* Heatmap Legend & Top Elements Drawer */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'rgba(22, 32, 54, 0.6)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Thermal Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Intensity:</span>
            <span style={{ fontSize: '0.72rem', color: '#60a5fa' }}>Low (1 click)</span>
            <div
              style={{
                width: '140px',
                height: '10px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>High Density</span>
          </div>

          {/* Top Click Targets List */}
          {topElements.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Top Targets:</span>
              {topElements.map(([label, count], i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                  }}
                  title={label}
                >
                  {label.length > 25 ? label.slice(0, 24) + '...' : label}{' '}
                  <strong style={{ color: '#fb7185' }}>({count})</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
