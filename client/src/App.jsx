import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { FloatingJourneyWidget } from './components/FloatingJourneyWidget';
import { AreYouSafeModal } from './components/AreYouSafeModal';
import { DevOutboxModal } from './components/DevOutboxModal';
import { Home } from './screens/Home';
import { Journey } from './screens/Journey';
import { Helplines } from './screens/Helplines';
import { CyberHome } from './screens/CyberHome';
import { Contacts } from './screens/Contacts';
import { Settings } from './screens/Settings';
import { Login } from './screens/Login';
import { PublicTrackScreen } from './screens/PublicTrackScreen';
import { useOnline } from './hooks/useOnline';
import { useJourney } from './hooks/useJourney';
import { api, getStoredUser, setToken, setStoredUser, getToken } from './lib/api';

export function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [activeTab, setActiveTab] = useState('personal'); // personal, journey, cyber
  const [currentScreen, setCurrentScreen] = useState('tabs'); // tabs, contacts, settings, helplines
  const [discreetMode, setDiscreetMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showOutbox, setShowOutbox] = useState(false);
  const [contacts, setContacts] = useState([]);

  // Public contact tracking route detection (hash routing)
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const { isOnline, pendingQueueCount, flushQueue } = useOnline();
  const {
    activeJourney,
    loading: journeyLoading,
    showSafePrompt,
    startJourney,
    stopJourney,
    respondSafe,
    refreshJourney
  } = useJourney();

  // Load contacts
  const fetchContacts = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.getContacts();
      setContacts(data || []);
    } catch (e) {
      console.warn('Could not fetch contacts:', e);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchContacts();
    }
  }, [currentUser, fetchContacts]);

  // Handle Discreet Mode DOM mutation (Title, Favicon, Manifest)
  useEffect(() => {
    const favicon = document.getElementById('app-favicon');
    const manifest = document.getElementById('app-manifest');

    if (discreetMode) {
      document.title = 'Notes - Personal Memo';
      if (favicon) favicon.setAttribute('href', '/icons/notes.svg');
      if (manifest) manifest.setAttribute('href', '/manifest-discreet.json');
    } else {
      document.title = 'SafeSakhi';
      if (favicon) favicon.setAttribute('href', '/icons/shield.svg');
      if (manifest) manifest.setAttribute('href', '/manifest.json');
    }
  }, [discreetMode]);

  // Handle Dark Mode DOM attribute
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const handleToggleDiscreet = async () => {
    const next = !discreetMode;
    setDiscreetMode(next);
    if (currentUser) {
      api.updateMe({ discreet_mode: next }).catch(() => {});
    }
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setCurrentScreen('tabs');
  };

  // Check if public tracking link is active in hash: e.g. #/track/sos/:token or #/track/journey/:token
  if (hash.startsWith('#/track/sos/')) {
    const token = hash.replace('#/track/sos/', '');
    return <PublicTrackScreen token={token} type="sos" />;
  }
  if (hash.startsWith('#/track/journey/')) {
    const token = hash.replace('#/track/journey/', '');
    return <PublicTrackScreen token={token} type="journey" />;
  }

  // If user not authenticated, render Login/Register
  if (!currentUser) {
    return (
      <Login
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.discreet_mode) setDiscreetMode(true);
        }}
      />
    );
  }

  return (
    <>
      <Header
        discreetMode={discreetMode}
        onToggleDiscreet={handleToggleDiscreet}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenSettings={() => setCurrentScreen('settings')}
        onOpenOutbox={() => setShowOutbox(true)}
        isOnline={isOnline}
        pendingCount={pendingQueueCount}
        activeJourney={activeJourney}
      />

      {/* Screen Render Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentScreen === 'contacts' && (
          <Contacts
            contacts={contacts}
            onRefresh={fetchContacts}
            onBack={() => setCurrentScreen('tabs')}
          />
        )}

        {currentScreen === 'settings' && (
          <Settings
            discreetMode={discreetMode}
            onToggleDiscreet={handleToggleDiscreet}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            currentUser={currentUser}
            onLogout={handleLogout}
            onBack={() => setCurrentScreen('tabs')}
          />
        )}

        {currentScreen === 'helplines' && (
          <Helplines
            onTriggerSos={() => {
              setCurrentScreen('tabs');
              setActiveTab('personal');
            }}
          />
        )}

        {currentScreen === 'tabs' && (
          <>
            {activeTab === 'personal' && (
              <Home
                isOnline={isOnline}
                contacts={contacts}
                onNavigateToContacts={() => setCurrentScreen('contacts')}
              />
            )}

            {activeTab === 'journey' && (
              <Journey
                journey={activeJourney}
                onStartJourney={startJourney}
                onStopJourney={stopJourney}
                onNotSafe={() => setCurrentScreen('helplines')}
                loading={journeyLoading}
              />
            )}

            {activeTab === 'cyber' && <CyberHome />}
          </>
        )}
      </main>

      {/* Draggable Floating Journey Widget (docked above tab bar on every screen while journey active) */}
      {activeJourney && activeJourney.status === 'active' && (
        <FloatingJourneyWidget
          journey={activeJourney}
          onStopSharing={stopJourney}
          onNotSafe={() => setCurrentScreen('helplines')}
        />
      )}

      {/* "Are you safe?" Stop Detection Modal */}
      {showSafePrompt && (
        <AreYouSafeModal
          onSafe={() => respondSafe(true)}
          onNotSafe={() => {
            respondSafe(false);
            setCurrentScreen('helplines');
          }}
        />
      )}

      {/* Developer SMS/WhatsApp Outbox Inspector Modal */}
      {showOutbox && <DevOutboxModal onClose={() => setShowOutbox(false)} />}

      {/* Bottom Tab Bar (exactly 3 tabs) */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setCurrentScreen('tabs');
        }}
      />
    </>
  );
}
