import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import SessionList from './components/SessionList';
import SessionTimelineModal from './components/SessionTimelineModal';
import HeatmapViewer from './components/HeatmapViewer';
import LiveEventFeed from './components/LiveEventFeed';
import TrackerCodeSnippet from './components/TrackerCodeSnippet';
import AuthPage from './components/AuthPage';
import SiteManagerModal from './components/SiteManagerModal';
import { useAuth } from './context/AuthContext';
import {
  fetchOverviewStats,
  fetchSessions,
  fetchSessionDetails,
  fetchTrackedPages,
  fetchHeatmapData,
  seedDemoData,
  downloadCsvExport,
} from './api/client';

function getDateRangeBounds(preset) {
  if (!preset || preset === 'all') return {};
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  const start = new Date(now);
  if (preset === '7d') start.setDate(start.getDate() - 7);
  if (preset === '30d') start.setDate(start.getDate() - 30);
  const startDate = start.toISOString().split('T')[0];
  return { startDate, endDate };
}

export default function App() {
  const { user, activeSite, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [trackedPages, setTrackedPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedSessionData, setSelectedSessionData] = useState(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [isSiteManagerOpen, setIsSiteManagerOpen] = useState(false);

  // Status flags
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Main data loader scoped by activeSite.siteId and dateRange
  const loadDashboardData = useCallback(
    async (search = searchQuery, range = dateRange) => {
      if (!activeSite?.siteId) return;
      const bounds = getDateRangeBounds(range);
      try {
        setIsRefreshing(true);
        const [overviewData, sessionsData, pagesData] = await Promise.all([
          fetchOverviewStats(activeSite.siteId, bounds).catch(() => null),
          fetchSessions(activeSite.siteId, { search, ...bounds }).catch(() => ({ sessions: [], total: 0 })),
          fetchTrackedPages(activeSite.siteId, bounds).catch(() => ({ pages: [] })),
        ]);

        if (overviewData) setOverview(overviewData);
        if (sessionsData) {
          setSessions(sessionsData.sessions || []);
          setTotalSessions(sessionsData.total || 0);
        }
        if (pagesData) setTrackedPages(pagesData.pages || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeSite?.siteId, searchQuery, dateRange]
  );

  useEffect(() => {
    if (user && activeSite?.siteId) {
      loadDashboardData();
    }
  }, [user, activeSite?.siteId, dateRange, loadDashboardData]);

  const handleSelectSession = async (sessionId) => {
    if (!activeSite?.siteId) return;
    try {
      setIsTimelineLoading(true);
      setSelectedSessionData({ session: { sessionId }, timeline: [] });
      const data = await fetchSessionDetails(activeSite.siteId, sessionId);
      setSelectedSessionData(data);
    } catch (err) {
      console.error('Failed to load session timeline:', err);
      showNotification('Failed to load session journey');
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    loadDashboardData(q, dateRange);
  };

  const handleSeed = async () => {
    if (!activeSite?.siteId) return;
    try {
      setIsSeeding(true);
      await seedDemoData(activeSite.siteId);
      showNotification(`Sample sessions seeded for ${activeSite.name}!`);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to seed:', err);
      showNotification('Error seeding data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCsv = async () => {
    if (!activeSite?.siteId) return;
    try {
      await downloadCsvExport(activeSite.siteId);
      showNotification('Sessions CSV exported!');
    } catch (err) {
      showNotification('Failed to export CSV');
    }
  };

  const scopedFetchHeatmap = useCallback(
    (url) => {
      if (!activeSite?.siteId) return Promise.resolve({ points: [], totalClicks: 0 });
      return fetchHeatmapData(activeSite.siteId, url, getDateRangeBounds(dateRange));
    },
    [activeSite?.siteId, dateRange]
  );

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading CausalFunnel...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app-container">
      {toastMessage && (
        <div className="toast show" style={{ zIndex: 999999 }}>
          {toastMessage}
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadDashboardData()}
        onSeed={handleSeed}
        onExportCsv={handleExportCsv}
        onOpenSiteManager={() => setIsSiteManagerOpen(true)}
        isRefreshing={isRefreshing}
        isSeeding={isSeeding}
      />

      <main className="main-content">
        {!activeSite ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Website Selected</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Register your first website to generate a Site ID and start tracking visitors.
            </p>
            <button className="btn btn-primary" onClick={() => setIsSiteManagerOpen(true)}>
              Add Your First Website
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <StatsOverview
                overview={overview}
                onNavigateTab={(tab) => setActiveTab(tab)}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionList
                sessions={sessions}
                totalSessions={totalSessions}
                onSelectSession={handleSelectSession}
                onSearch={handleSearch}
                currentSearch={searchQuery}
              />
            )}

            {activeTab === 'heatmap' && (
              <HeatmapViewer
                pages={trackedPages}
                fetchHeatmapData={scopedFetchHeatmap}
              />
            )}

            {activeTab === 'live' && <LiveEventFeed siteId={activeSite.siteId} />}

            {activeTab === 'setup' && <TrackerCodeSnippet />}
          </>
        )}
      </main>

      {selectedSessionData && (
        <SessionTimelineModal
          sessionData={selectedSessionData}
          isLoading={isTimelineLoading}
          onClose={() => setSelectedSessionData(null)}
        />
      )}

      {isSiteManagerOpen && (
        <SiteManagerModal
          onClose={() => setIsSiteManagerOpen(false)}
          onNotify={showNotification}
        />
      )}
    </div>
  );
}
