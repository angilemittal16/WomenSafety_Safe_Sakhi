import React from 'react';
import { Shield, BookOpen, Settings, Mail, Moon, Sun, Wifi, WifiOff } from 'lucide-react';

export function Header({
  discreetMode,
  onToggleDiscreet,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenOutbox,
  isOnline,
  pendingCount,
  activeSos,
  activeJourney
}) {
  return (
    <header className="app-header">
      <div className="app-title-group">
        <button
          className="icon-btn"
          onClick={onToggleDiscreet}
          title={discreetMode ? 'Switch to SafeSakhi Mode' : 'Switch to Discreet Notes Mode'}
          aria-label="Toggle Discreet Mode"
        >
          {discreetMode ? (
            <BookOpen size={22} color="var(--primary)" />
          ) : (
            <Shield size={22} color="var(--primary)" />
          )}
        </button>
        <div>
          <h1 className="app-title">{discreetMode ? 'Quick Notes' : 'SafeSakhi'}</h1>
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            {!isOnline ? (
              <span className="status-chip warning" title="SMS fallback mode active">
                <WifiOff size={12} /> Offline - SMS mode
              </span>
            ) : activeSos ? (
              <span className="status-chip pulse" title="SOS alert transmitting">
                SOS Active
              </span>
            ) : activeJourney ? (
              <span className="status-chip pulse" title="Journey tracking active">
                Sharing Journey
              </span>
            ) : (
              <span className="status-chip" title="Connected to network">
                <Wifi size={12} /> Protected
              </span>
            )}
            {pendingCount > 0 && (
              <span className="status-chip" title={`${pendingCount} items waiting to sync`}>
                {pendingCount} queued
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-btn"
          onClick={onOpenOutbox}
          title="SMS / WhatsApp Outbox Inspector"
          aria-label="Open Outbox"
        >
          <Mail size={20} />
        </button>
        <button
          className="icon-btn"
          onClick={onToggleDarkMode}
          title="Toggle Dark Mode"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
