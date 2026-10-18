import React from 'react';
import { Activity, BarChart3, Users, Flame, Radio, Code2, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onRefresh, onSeed, isRefreshing, isSeeding }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-name">CausalFunnel</span>
              <span className="brand-badge">Analytics</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Session Tracking & Heatmap Dashboard
            </div>
          </div>
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
            <span>Live Stream</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            <Code2 size={16} />
            <span>JS Tracker</span>
          </button>
        </nav>

        <div className="nav-right-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onSeed}
            disabled={isSeeding}
            title="Seed realistic demo e-commerce sessions"
          >
            <Sparkles size={14} color="#8b5cf6" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>

          <a
            href="http://localhost:5000/demo/index.html"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
            title="Open Demo E-Commerce Store with Tracker"
          >
            <span>Demo Store</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}
