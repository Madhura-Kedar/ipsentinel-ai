import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut, Settings, ShieldAlert, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { getAllAnalyses } from '../../utils/analysisStore';

const Topbar = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  
  const notifRef = useRef(null);

  const fetchAlerts = async () => {
    try {
      const urRes = await fetch('http://localhost:8000/alerts/unread');
      if (urRes.ok) {
        const urData = await urRes.json();
        setUnreadCount(urData.unread_count);
      }
      const alRes = await fetch('http://localhost:8000/alerts');
      if (alRes.ok) {
        let alData = await alRes.json();
        alData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentAlerts(alData.slice(0, 5));
      }
    } catch (e) {
      console.error("Failed to load alerts");
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Polling for unread alerts
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      showToast('Searching IP databases...', 'success');
      navigate('/search/ip');
      setSearchQuery('');
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleAlertClick = async (alert) => {
    setShowNotifications(false);
    try {
      await fetch(`http://localhost:8000/alerts/${alert.id}/read`, { method: 'POST' });
      fetchAlerts();
    } catch (e) {}

    const analyses = getAllAnalyses();
    const matchedAnalysis = analyses.find(a => a.summary === alert.invention_name || a.title === alert.invention_name);
    
    if (matchedAnalysis) {
      navigate(`/analysis/${matchedAnalysis.id}`);
    } else {
      showToast("Original analysis is no longer available.", "warning");
      navigate('/alerts');
    }
  };

  const getSeverityIcon = (sev) => {
    if (sev === 'high') return <ShieldAlert size={16} color="var(--danger)" />;
    if (sev === 'medium') return <AlertTriangle size={16} color="var(--warning)" />;
    if (sev === 'low') return <TrendingUp size={16} color="var(--success)" />;
    return <Info size={16} color="var(--accent-cyan)" />;
  };

  return (
    <header className="topbar">
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search patents, technologies, or keywords..." 
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <div className="search-shortcut">⌘K</div>
      </div>

      <div className="topbar-actions">
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={handleNotificationClick}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '350px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Recent Alerts</span>
              </div>
              
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {recentAlerts.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Bell size={24} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                    <p>No alerts yet.</p>
                  </div>
                ) : (
                  recentAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      onClick={() => handleAlertClick(alert)}
                      style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: alert.read ? 'transparent' : 'rgba(34, 211, 238, 0.05)', display: 'flex', gap: '12px' }}
                    >
                      <div style={{ marginTop: '2px' }}>{getSeverityIcon(alert.severity)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{alert.title}</span>
                          {!alert.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                          {alert.invention_name}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>
                          {alert.similarity && `${alert.similarity}% similarity • `}{new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button 
                  onClick={() => { setShowNotifications(false); navigate('/alerts'); }}
                  style={{ color: 'var(--accent-cyan)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  View All Alerts
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="user-menu" style={{ position: 'relative' }}>
          <div 
            className="user-menu-trigger"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">JD</div>
            <div className="user-info">
              <span className="user-name">Jane Doe</span>
              <span className="user-role">Patent Analyst</span>
            </div>
            <ChevronDown size={16} className="user-dropdown-icon" />
          </div>

          {showUserMenu && (
            <div className="user-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', minWidth: '200px', zIndex: 10 }}>
              <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/settings'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}>
                <Settings size={16} /> Settings
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
              <button className="dropdown-item" onClick={() => setShowUserMenu(false)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'var(--danger)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
