import React from 'react';
import { ShieldAlert, Compass, FileCheck } from 'lucide-react';

export function TabBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'personal', label: 'Personal Safety', icon: ShieldAlert },
    { id: 'journey', label: 'Journey', icon: Compass },
    { id: 'cyber', label: 'Cyber Safety', icon: FileCheck }
  ];

  return (
    <nav className="bottom-tab-bar" aria-label="Main Navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
            role="tab"
          >
            <div className="tab-icon-wrapper">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
