import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export default function TrackerCodeSnippet() {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);

  const scriptTagCode = `<!-- CausalFunnel Analytics Tracker -->
<script
  src="http://localhost:5000/tracker.js"
  data-endpoint="http://localhost:5000/api/events"
  async>
</script>`;

  const customEventCode = `// Optional: Programmatic custom tracking
window.CausalTracker.track('click', {
  clickX: 450,
  clickY: 320,
  elementTag: 'BUTTON',
  elementText: 'Complete Purchase',
  metadata: { orderId: 'ord_99182', amount: 349.00 }
});`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'snippet') {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else {
      setCopiedNpm(true);
      setTimeout(() => setCopiedNpm(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Quick Integration Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Terminal size={18} color="#3b82f6" />
            <span>Client Tracking Script Installation</span>
          </h2>
          <span className="badge badge-emerald">Zero Dependency</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Add this script snippet to the <code>&lt;head&gt;</code> or bottom of <code>&lt;body&gt;</code> on any webpage.
          It automatically tracks <strong>page views</strong>, <strong>clicks with coordinates</strong>, and persists the <strong>session ID</strong> in <code>localStorage</code> (with cookie fallback).
        </p>

        <div style={{ position: 'relative', background: '#0b1120', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '1.25rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ position: 'absolute', top: '10px', right: '10px' }}
            onClick={() => copyToClipboard(scriptTagCode, 'snippet')}
          >
            {copiedSnippet ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8', overflowX: 'auto' }}>
            {scriptTagCode}
          </pre>
        </div>
      </div>

      {/* Feature Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            <Zap size={16} color="#fbbf24" />
            Automatic Click & Coordinate Capture
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Listens to global clicks, captures exact <code>pageX, pageY</code> coordinates, element tags (<code>BUTTON</code>, <code>A</code>, <code>INPUT</code>), element inner text, and viewport dimensions for responsive heatmap normalization.
          </p>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            Resilient Session Management
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Generates UUID v4 session identifiers stored in <code>localStorage</code> with graceful fallback to <code>document.cookie</code>. Maintains session continuity across tabs and page reloads.
          </p>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            <Terminal size={16} color="#8b5cf6" />
            Beacon & Batch Delivery
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Batches events to optimize network bandwidth and uses <code>navigator.sendBeacon()</code> to guarantee event delivery even when a user suddenly closes or leaves the page.
          </p>
        </div>
      </div>

      {/* Programmatic API Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>
            Programmatic Tracking API
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => copyToClipboard(customEventCode, 'custom')}
          >
            {copiedNpm ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedNpm ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <div style={{ background: '#0b1120', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '1rem' }}>
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#c084fc', overflowX: 'auto' }}>
            {customEventCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
