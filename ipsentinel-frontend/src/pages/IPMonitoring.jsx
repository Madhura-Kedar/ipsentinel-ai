import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Radar, Plus, Bell, Clock, AlertTriangle, ShieldCheck, RefreshCw, Trash2, ChevronRight, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import '../components/dashboard/Dashboard.css';

const IPMonitoring = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [monitors, setMonitors] = useState([]);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const fetchMonitors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/monitors');
      if (!response.ok) throw new Error('Failed to fetch monitors');
      const data = await response.json();
      setMonitors(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading monitors', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const handleCheckNow = async (monitorId) => {
    if (isChecking) return;
    setIsChecking(true);
    showToast('Scanning patent landscape...', 'info');
    try {
      const response = await fetch(`http://localhost:8000/monitors/${monitorId}/check`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Check failed');
      }
      const data = await response.json();
      
      const newMatchesCount = data.new_matches.length;
      const riskChangesCount = data.risk_changes.length;
      
      if (newMatchesCount > 0 || riskChangesCount > 0) {
        showToast(`${newMatchesCount + riskChangesCount} new alerts detected.`, 'warning');
      } else {
        showToast(`Monitoring check completed. No significant changes detected.`, 'success');
      }
      
      // Refresh list
      await fetchMonitors();
      // If the checked monitor is currently selected, update its view
      if (selectedMonitor && selectedMonitor.id === monitorId) {
        const mResponse = await fetch(`http://localhost:8000/monitors/${monitorId}`);
        const mData = await mResponse.json();
        setSelectedMonitor(mData);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error running check', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async (monitorId) => {
    if (!window.confirm("Delete this monitor?")) return;
    try {
      const response = await fetch(`http://localhost:8000/monitors/${monitorId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      showToast('Monitor deleted', 'success');
      setMonitors(monitors.filter(m => m.id !== monitorId));
      if (selectedMonitor?.id === monitorId) setSelectedMonitor(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // derived stats
  const activeCount = monitors.length;
  const highRiskCount = monitors.filter(m => m.highest_risk === 'High').length;
  const totalMatches = monitors.reduce((sum, m) => sum + m.matches_count, 0);

  // -- Render Empty State ------------------------------------------------------------------
  if (!isLoading && monitors.length === 0) {
    return (
      <div className="page-container">
         <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">Continuous Tracking</span>
            <h1 className="dashboard-title">IP Monitoring</h1>
            <p className="dashboard-subtitle">Monitor competitors and track your portfolio assets in real-time.</p>
          </div>
        </div>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <Radar size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No inventions are currently being monitored.</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Create an analysis and click "Monitor This Invention" to start tracking.
            </p>
            <Button variant="primary" onClick={() => navigate('/analysis/new')}>Start New Analysis</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // -- Detail View --------------------------------------------------------------------------
  if (selectedMonitor) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedMonitor(null)}>
          <span style={{ fontSize: '0.85rem' }}>← Back to Dashboard</span>
        </div>
        
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">Invention Overview</span>
            <h1 className="dashboard-title">{selectedMonitor.title}</h1>
            <p className="dashboard-subtitle">Last checked: {selectedMonitor.last_checked ? new Date(selectedMonitor.last_checked).toLocaleString() : 'Never'}</p>
          </div>
          <div className="dashboard-actions">
            <Button variant="outline" onClick={() => handleDelete(selectedMonitor.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
               Delete Monitor
            </Button>
            <Button variant="primary" onClick={() => handleCheckNow(selectedMonitor.id)} disabled={isChecking} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isChecking ? <RefreshCw size={16} className="lucide-spin" /> : <Radar size={16} />} 
              {isChecking ? 'Scanning...' : 'Check Now'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <Card>
            <CardHeader title="Invention Details" />
            <CardBody>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>SUMMARY</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{selectedMonitor.summary}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>TECHNICAL FEATURES</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {selectedMonitor.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </CardBody>
          </Card>

          <div style={{ padding: '12px 14px', background: 'rgba(34,211,238,0.05)', borderRadius: '8px', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Info size={15} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              <strong>AI similarity monitoring</strong> is informational and based on semantic vector distance. It does not constitute a legal infringement or patentability opinion.
            </p>
          </div>

          <Card>
            <CardHeader title="Potentially Relevant Patents" badge={selectedMonitor.matches_count > 0 ? selectedMonitor.matches_count.toString() : null} />
            <div className="recent-table-container">
              {selectedMonitor.matches.length > 0 ? (
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Risk</th>
                      <th>Patent</th>
                      <th>Similarity</th>
                      <th>Matching Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMonitor.matches.sort((a,b) => b.similarity - a.similarity).map((match, i) => (
                      <tr key={i}>
                        <td>
                          <Badge variant={match.risk === 'High' ? 'danger' : match.risk === 'Medium' ? 'warning' : 'success'}>
                            {match.risk} Risk
                          </Badge>
                        </td>
                        <td>
                           <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{match.publication_number}</div>
                           <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.title}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.similarity}%</td>
                        <td>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {match.matching_features.map((mf, j) => (
                               <span key={j}>• {mf}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                 <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   {selectedMonitor.last_checked ? 'No relevant patents found in the last check.' : 'Click "Check Now" to scan the patent database.'}
                 </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // -- Dashboard View -----------------------------------------------------------------------
  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Continuous Tracking</span>
          <h1 className="dashboard-title">IP Monitoring</h1>
          <p className="dashboard-subtitle">Monitor competitors and track your portfolio assets in real-time.</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="primary" onClick={() => navigate('/analysis/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Track New Asset
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <CardBody style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34, 211, 238, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radar size={20} color="var(--accent-cyan)" />
              </div>
              <Badge variant="primary">Active</Badge>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{activeCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assets Tracked</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="var(--danger)" />
              </div>
              <Badge variant={highRiskCount > 0 ? "danger" : "default"}>{highRiskCount > 0 ? "Action Required" : "All Clear"}</Badge>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{highRiskCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>High Risk Assets</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} color="var(--warning)" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{totalMatches}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Relevant Patents</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} color="var(--success)" />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>100%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Protection Coverage</div>
          </CardBody>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card>
          <CardHeader title="Tracked Assets" />
          <div className="recent-table-container">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Invention Name</th>
                  <th>Status</th>
                  <th>Last Checked</th>
                  <th>Matches</th>
                  <th>Highest Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</td>
                    <td><Badge variant={item.status === 'Active' ? 'success' : 'secondary'}>{item.status}</Badge></td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{item.last_checked ? new Date(item.last_checked).toLocaleDateString() : 'Never'}</td>
                    <td>
                      {item.matches_count > 0 ? (
                        <Badge variant="default">{item.matches_count} Matches</Badge>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>0 Matches</span>
                      )}
                    </td>
                    <td>
                      {item.highest_risk !== 'None' ? (
                          <Badge variant={item.highest_risk === 'High' ? 'danger' : item.highest_risk === 'Medium' ? 'warning' : 'success'}>
                            {item.highest_risk}
                          </Badge>
                      ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <Button variant="outline" size="sm" onClick={() => setSelectedMonitor(item)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                           View Results
                         </Button>
                         <Button variant="primary" size="sm" onClick={() => handleCheckNow(item.id)} disabled={isChecking} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                           Check Now
                         </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IPMonitoring;
