import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import SessionList from './components/SessionList';
import SessionTimelineModal from './components/SessionTimelineModal';
import HeatmapViewer from './components/HeatmapViewer';
import LiveEventFeed from './components/LiveEventFeed';
import TrackerCodeSnippet from './components/TrackerCodeSnippet';
import {
  fetchOverviewStats,
  fetchSessions,
  fetchSessionDetails,
  fetchTrackedPages,
  fetchHeatmapData,
  seedDemoData,
} from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [trackedPages, setTrackedPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected session for user journey modal
  const [selectedSessionData, setSelectedSessionData] = useState(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // Status flags
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Main data loader
  const loadDashboardData = useCallback(async (search = searchQuery) => {
    try {
      setIsRefreshing(true);
      const [overviewData, sessionsData, pagesData] = await Promise.all([
        fetchOverviewStats().catch(() => null),
        fetchSessions({ search }).catch(() => ({ sessions: [], total: 0 })),
        fetchTrackedPages().catch(() => ({ pages: [] })),
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
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle click on a session row to inspect User Journey
  const handleSelectSession = async (sessionId) => {
    try {
      setIsTimelineLoading(true);
      setSelectedSessionData({ session: { sessionId }, timeline: [] });
      const data = await fetchSessionDetails(sessionId);
      setSelectedSessionData(data);
    } catch (err) {
      console.error('Failed to load session timeline:', err);
      showNotification('Failed to load session journey');
    } finally {
      setIsTimelineLoading(false);
    }
  };

  // Handle Search
  const handleSearch = (q) => {
    setSearchQuery(q);
    loadDashboardData(q);
  };

  // Handle Seed Demo Data
  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedDemoData();
      showNotification('Sample e-commerce sessions seeded successfully!');
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to seed:', err);
      showNotification('Error seeding data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="app-container">
      {/* Toast alert */}
      {toastMessage && (
        <div className="toast show" style={{ zIndex: 999999 }}>
          {toastMessage}
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadDashboardData()}
        onSeed={handleSeed}
        isRefreshing={isRefreshing}
        isSeeding={isSeeding}
      />

      {/* Main Page Content */}
      <main className="main-content">
        {activeTab === 'overview' && (
          <StatsOverview
            overview={overview}
            onNavigateTab={(tab) => setActiveTab(tab)}
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
            fetchHeatmapData={fetchHeatmapData}
          />
        )}

        {activeTab === 'live' && <LiveEventFeed />}

        {activeTab === 'setup' && <TrackerCodeSnippet />}
      </main>

      {/* User Journey Modal / Drawer */}
      {selectedSessionData && (
        <SessionTimelineModal
          sessionData={selectedSessionData}
          isLoading={isTimelineLoading}
          onClose={() => setSelectedSessionData(null)}
        />
      )}
    </div>
  );
}
