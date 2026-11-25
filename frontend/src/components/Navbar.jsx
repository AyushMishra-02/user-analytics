import React from 'react';
import {
  Activity,
  BarChart3,
  Users,
  Flame,
  Radio,
  Code2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Globe,
  Download,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BACKEND_ORIGIN } from '../api/client';

export default function Navbar({
  activeTab,
  setActiveTab,
  onRefresh,
  onSeed,
  onExportCsv,
  onOpenSiteManager,
  isRefreshing,
  isSeeding,
}) {
  const { user, sites, activeSite, setActiveSite, logout } = useAuth();

  const demoStoreUrl = activeSite?.siteId
    ? `${BACKEND_ORIGIN}/demo/index.html?siteId=${encodeURIComponent(activeSite.siteId)}`
    : `${BACKEND_ORIGIN}/demo/index.html`;

  return (
    <header className="navbar">
      <div className="navbar-inner" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-name">CausalFunnel</span>
              <span className="brand-badge">SaaS</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user?.name || 'Analytics Dashboard'}
            </div>
          </div>
        </div>

        {/* Multi-Tenant Site Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Globe size={15} color="#38bdf8" />
          <select
            className="select-input"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.82rem', maxWidth: '190px' }}
            value={activeSite?.siteId || ''}
            onChange={(e) => {
              const found = sites.find((s) => s.siteId === e.target.value);
              if (found) setActiveSite(found);
            }}
            title="Switch tracked website"
          >
            {sites.map((s) => (
              <option key={s.siteId} value={s.siteId}>
                {s.name} ({s.domain})
              </option>
            ))}
          </select>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenSiteManager}
            title="Manage or add websites"
            style={{ padding: '0.35rem 0.6rem' }}
          >
            <Plus size={14} />
            <span>Sites</span>
          </button>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={16} />
            <span>Overview</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <Users size={16} />
            <span>Sessions</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <Flame size={16} />
            <span>Heatmap</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Radio size={16} />
            <span>Live</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            <Code2 size={16} />
            <span>Tracker</span>
          </button>
        </nav>

        <div className="nav-right-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onSeed}
            disabled={isSeeding || !activeSite}
            title="Seed realistic demo e-commerce sessions for active site"
          >
            <Sparkles size={14} color="#8b5cf6" />
            <span>{isSeeding ? 'Seeding...' : 'Seed'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onExportCsv}
            disabled={!activeSite}
            title="Export sessions as CSV"
          >
            <Download size={14} color="#10b981" />
            <span>CSV</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <a
            href={demoStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
            title="Open Demo E-Commerce Store linked to your active Site ID"
          >
            <span>Demo Store</span>
            <ExternalLink size={14} />
          </a>

          <button
            className="btn btn-ghost btn-sm"
            onClick={logout}
            title="Sign out"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
