import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import DiscoverEventsPage from './pages/DiscoverEventsPage';
import ClubsDirectoryPage from './pages/ClubsDirectoryPage';
import CoordinatorDashboardPage from './pages/CoordinatorDashboardPage';
import AdminGovernancePage from './pages/AdminGovernancePage';
import MyEventsPage from './pages/MyEventsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

import EventDetailModal from './components/modals/EventDetailModal';
import CreateEventModal from './components/modals/CreateEventModal';
import ClubDetailModal from './components/modals/ClubDetailModal';

function AppContent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation matching designs */}
      <Sidebar onCreateEventClick={() => setCreateEventOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Navbar */}
        <Navbar
          onCreateEventClick={() => setCreateEventOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dynamic Pages */}
        <main className="flex-1 pb-16">
          <Routes>
            <Route
              path="/"
              element={
                <DiscoverEventsPage
                  onSelectEvent={(ev) => setSelectedEvent(ev)}
                  onNavigateToClubs={() => navigate('/clubs')}
                />
              }
            />
            <Route
              path="/clubs"
              element={
                <ClubsDirectoryPage
                  onSelectClub={(c) => setSelectedClub(c)}
                  onSelectEvent={(ev) => setSelectedEvent(ev)}
                />
              }
            />
            <Route
              path="/coordinator"
              element={<CoordinatorDashboardPage />}
            />
            <Route
              path="/governance"
              element={<AdminGovernancePage />}
            />
            <Route
              path="/my-events"
              element={
                <MyEventsPage
                  onSelectEvent={(ev) => setSelectedEvent(ev)}
                />
              }
            />
            <Route
              path="/announcements"
              element={<AnnouncementsPage />}
            />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegisteredChange={() => {
            // Re-fetch event if needed
            setSelectedEvent(prev => prev ? { ...prev, is_registered: !prev.is_registered } : null);
          }}
        />
      )}

      {selectedClub && (
        <ClubDetailModal
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          onSelectEvent={(ev) => {
            setSelectedClub(null);
            setSelectedEvent(ev);
          }}
        />
      )}

      {createEventOpen && (
        <CreateEventModal
          onClose={() => setCreateEventOpen(false)}
          onCreated={(newEvent) => {
            alert('Event successfully submitted!');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
