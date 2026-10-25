import React, { useState } from 'react';
import { Shield, BookOpen, Moon, Sun, Trash2, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

export function Settings({
  discreetMode,
  onToggleDiscreet,
  darkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  onBack
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllData = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await api.deleteAllData();
      alert('All your personal data, GPS history, and encrypted evidence files have been permanently erased.');
      onLogout();
    } catch (err) {
      alert('Failed to erase data: ' + err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
          App Settings & Privacy
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Logged in as <strong>{currentUser?.name || 'SafeSakhi User'}</strong> ({currentUser?.email})
        </p>
      </div>

      {/* Discreet Mode Toggle */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {discreetMode ? <BookOpen size={20} color="var(--primary)" /> : <Shield size={20} color="var(--primary)" />}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                Discreet Disguise Mode
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {discreetMode
                  ? 'Disguised as "Notes" with memo icon'
                  : 'Display standard SafeSakhi branding'}
              </div>
            </div>
          </div>

          <button
            className={`btn ${discreetMode ? 'btn-primary' : 'btn-light'}`}
            onClick={onToggleDiscreet}
            style={{ minHeight: '38px', padding: '6px 16px', fontSize: '13px', fontWeight: 700 }}
          >
            {discreetMode ? 'Active (Notes)' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {darkMode ? <Sun size={20} color="var(--primary)" /> : <Moon size={20} color="var(--primary)" />}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                Theme Appearance
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {darkMode ? 'Deep navy dark mode' : 'Soft yellow & white daylight mode'}
              </div>
            </div>
          </div>

          <button
            className="btn btn-light"
            onClick={onToggleDarkMode}
            style={{ minHeight: '38px', padding: '6px 16px', fontSize: '13px', fontWeight: 700 }}
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Privacy-first: Delete all my data */}
      <div className="card" style={{ border: deleteConfirm ? '2px solid #D9534F' : '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Trash2 size={20} color="#D9534F" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#D9534F' }}>
            Delete All My Data
          </h3>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
          Permanently wipes all your database records, emergency contacts, GPS breadcrumbs, and physical encrypted evidence files on disk. This cannot be undone.
        </p>

        {deleteConfirm ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setDeleteConfirm(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              className="btn"
              onClick={handleDeleteAllData}
              disabled={deleting}
              style={{
                flex: 1,
                backgroundColor: '#D9534F',
                color: '#FFFFFF',
                fontWeight: 800
              }}
            >
              <AlertTriangle size={18} /> Confirm Delete Everything
            </button>
          </div>
        ) : (
          <button
            className="btn btn-outline"
            onClick={handleDeleteAllData}
            style={{ width: '100%', color: '#D9534F', borderColor: '#D9534F' }}
          >
            Delete All My Data
          </button>
        )}
      </div>

      {/* Logout */}
      <div className="card">
        <button
          className="btn btn-outline"
          onClick={onLogout}
          style={{ width: '100%', minHeight: '48px', fontSize: '15px', fontWeight: 700 }}
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>

      {onBack && (
        <button
          className="btn btn-primary"
          onClick={onBack}
          style={{ width: '100%', minHeight: '52px', marginTop: '10px' }}
        >
          Back to Safety Dashboard
        </button>
      )}
    </div>
  );
}
