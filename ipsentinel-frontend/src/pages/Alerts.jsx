import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import MetricCard from '../components/ui/MetricCard';
import { Bell, Search, Filter, ShieldAlert, CheckCircle, Info, TrendingUp, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getAllAnalyses } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

const Alerts = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [alerts, setAlerts] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Newest');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      showToast("Unable to load notifications.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAnalyses(getAllAnalyses());
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/alerts/${id}/read`, { method: 'POST' });
      setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (e) {
      showToast("Failed to mark read", "error");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`http://localhost:8000/alerts/read-all`, { method: 'POST' });
      setAlerts(alerts.map(a => ({ ...a, read: true })));
      showToast("All alerts marked as read", "success");
    } catch (e) {
      showToast("Failed to mark all read", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/alerts/${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter(a => a.id !== id));
      showToast("Alert deleted", "success");
    } catch (e) {
      showToast("Failed to delete alert", "error");
    }
  };

  const handleReview = (alert) => {
    handleMarkAsRead(alert.id);
    
    // Attempt to resolve analysis ID by summary matching
    const matchedAnalysis = analyses.find(a => a.summary === alert.invention_name || a.title === alert.invention_name);
    
    if (matchedAnalysis) {
      navigate(`/analysis/${matchedAnalysis.id}`);
    } else {
      showToast("Original analysis is no longer available.", "warning");
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;
  const highRiskCount = alerts.filter(a => a.severity === 'high').length;
  const mediumRiskCount = alerts.filter(a => a.severity === 'medium').length;

  let filtered = alerts.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.message.toLowerCase().includes(q) && !a.invention_name.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (severityFilter !== 'All' && a.severity.toLowerCase() !== severityFilter.toLowerCase()) return false;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Unread' && a.read) return false;
      if (statusFilter === 'Read' && !a.read) return false;
    }
    if (typeFilter !== 'All') {
      if (typeFilter === 'New Match' && a.type !== 'new_match') return false;
      if (typeFilter === 'Risk Increase' && a.type !== 'risk_increase') return false;
      if (typeFilter === 'Monitoring Update' && a.type !== 'monitoring_update') return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortOption === 'Oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortOption === 'Highest Severity') {
      const sMap = { high: 3, medium: 2, low: 1, info: 0 };
      return sMap[b.severity] - sMap[a.severity];
    }
    return new Date(b.created_at) - new Date(a.created_at); // default Newest
  });

  const getSeverityIcon = (sev) => {
    if (sev === 'high') return <ShieldAlert size={20} color="var(--danger)" />;
    if (sev === 'medium') return <AlertTriangle size={20} color="var(--warning)" />;
    if (sev === 'low') return <TrendingUp size={20} color="var(--success)" />;
    return <Info size={20} color="var(--accent-cyan)" />;
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">System</span>
          <h1 className="dashboard-title">Notifications & Alerts</h1>
          <p className="dashboard-subtitle">Review important changes detected across your monitored inventions.</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="outline" onClick={handleMarkAllRead}>Mark All as Read</Button>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
        <MetricCard title="Unread Alerts" value={unreadCount} icon={<Bell size={24} color="var(--accent-cyan)" />} />
        <MetricCard title="High Risk" value={highRiskCount} icon={<ShieldAlert size={24} color="var(--danger)" />} />
        <MetricCard title="Medium Risk" value={mediumRiskCount} icon={<AlertTriangle size={24} color="var(--warning)" />} />
        <MetricCard title="Total Notifications" value={alerts.length} icon={<CheckCircle size={24} color="var(--success)" />} />
      </div>

      <Card>
        <CardHeader title="Alert History">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Search alerts..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }} 
              />
            </div>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <option value="All">Severity: All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Info">Info</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <option value="All">Status: All</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <option value="All">Type: All</option>
              <option value="New Match">New Match</option>
              <option value="Risk Increase">Risk Increase</option>
              <option value="Monitoring Update">Monitoring Update</option>
            </select>
            <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <option value="Newest">Sort: Newest</option>
              <option value="Oldest">Sort: Oldest</option>
              <option value="Highest Severity">Sort: Highest Severity</option>
            </select>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading alerts...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <Bell size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No alerts yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your monitored inventions don't have any significant changes.</p>
              <Button variant="primary" onClick={() => navigate('/protection/monitoring')}>View IP Monitoring</Button>
            </div>
          ) : (
            <div>
              {filtered.map(alert => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', borderBottom: '1px solid var(--border-color)', background: alert.read ? 'var(--bg-surface)' : 'rgba(34, 211, 238, 0.03)' }}>
                  <div style={{ padding: '8px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{alert.title}</span>
                          {!alert.read && <Badge variant="primary">New</Badge>}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{alert.message}</div>
                      </div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-tertiary)' }}>Invention:</span> <strong style={{ color: 'var(--text-primary)' }}>{alert.invention_name}</strong></div>
                      {alert.patent_id && (
                        <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-tertiary)' }}>Match:</span> <strong style={{ color: 'var(--text-primary)' }}>{alert.patent_id} - {alert.patent_title}</strong></div>
                      )}
                      {alert.similarity && (
                        <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-tertiary)' }}>Similarity:</span> <strong style={{ color: 'var(--text-primary)' }}>{alert.similarity}%</strong></div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Button variant="primary" onClick={() => handleReview(alert)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Review</Button>
                      {!alert.read && <Button variant="secondary" onClick={() => handleMarkAsRead(alert.id)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Mark as Read</Button>}
                      <Button variant="outline" onClick={() => handleDelete(alert.id)} style={{ color: 'var(--danger)', borderColor: 'var(--border-color)', fontSize: '0.8rem', padding: '6px 12px', marginLeft: 'auto' }}>
                        <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Alerts;
