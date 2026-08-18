import React from 'react';

export default function Sidebar({ currentView, setCurrentView }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'new-analysis', label: 'New Analysis', icon: '＋' },
    { id: 'patent-search', label: 'Patent Search', icon: '🔍' },
    { id: 'semantic-search', label: 'Semantic Search', icon: '∞' },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: '◯' },
    { id: 'draft-assistant', label: 'Draft Assistant', icon: '✎' },
    { id: 'patent-landscape', label: 'Patent Landscape', icon: '▤' },
    { id: 'reports', label: 'Reports', icon: '📄' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">IP</div>
        <div>
          <div className="brand-text">IPSentinel <span style={{ color: '#60a5fa' }}>AI</span></div>
          <div className="brand-subtitle">Track. Detect. Protect.</div>
        </div>
      </div>
      
      <div className="sidebar-nav">
        {menuItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
      
      <div style={{ padding: '20px', marginTop: 'auto' }}>
        <div className="nav-item">
          <span className="nav-item-icon">⚙</span> Settings
        </div>
        <div style={{ background: 'rgba(34, 211, 238, 0.05)', border: '1px solid rgba(34, 211, 238, 0.2)', padding: '12px', borderRadius: '8px', marginTop: '16px' }}>
          <div style={{ color: '#22d3ee', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✦</span> Analyst Pro
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
            Your intelligence workspace is active.
          </div>
        </div>
      </div>
    </div>
  );
}
