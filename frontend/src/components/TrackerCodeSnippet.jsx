import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldCheck, Zap, AlertTriangle, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BACKEND_ORIGIN } from '../api/client';

export default function TrackerCodeSnippet() {
  const { activeSite } = useAuth();
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);

  const siteId = activeSite?.siteId || 'YOUR_SITE_ID';

  const scriptTagCode = `<!-- CausalFunnel Analytics Tracker (${activeSite?.name || 'Website'}) -->
<script
  src="${BACKEND_ORIGIN}/tracker.js"
  data-site-id="${siteId}"
  data-respect-dnt="true"
  async>
</script>`;

  const customEventCode = `// Optional: Programmatic custom tracking
window.CausalTracker.track('custom', {
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
            <span>Install Tracker for {activeSite?.name || 'Your Website'}</span>
          </h2>
          <span className="badge badge-emerald">Site ID: {siteId}</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Paste this snippet into the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of any website (HTML, React, Next.js, WordPress, portfolio).
          Events are automatically isolated to <strong>{activeSite?.domain || 'your domain'}</strong>.
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>
            <Zap size={16} color="#fbbf24" />
            Click & Heatmap Capture
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Captures exact <code>pageX, pageY</code> coordinates, element tags, inner text, and viewport size for responsive thermal heatmaps.
          </p>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>
            <ArrowDownCircle size={16} color="#38bdf8" />
            Scroll Depth Milestones
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Automatically logs 25%, 50%, 75%, and 100% scroll milestones on every page to measure real content engagement.
          </p>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>
            <AlertTriangle size={16} color="#fb7185" />
            Rage Click Detection
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Detects frustration bursts (3+ rapid clicks within 800ms in a 40px radius) and flags broken or confusing UI elements.
          </p>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            Privacy-First & Resilient
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Respects browser <code>Do-Not-Track</code> headers, anonymizes visitor IPs on ingestion, and uses <code>sendBeacon()</code> for zero data loss.
          </p>
        </div>
      </div>

      {/* Programmatic API Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>
            Programmatic Custom Event API
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
