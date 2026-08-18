import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  ShieldAlert, Activity, CheckCircle, TrendingUp, Lightbulb, 
  GitBranch, Radar, FileSearch, Search, Filter, Trash2, ArrowRight, Map,
  Plus, AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { getAllAnalyses, deleteAnalysis } from '../utils/analysisStore';
import { useToast } from '../contexts/ToastContext';
import '../components/dashboard/Dashboard.css';

const RISK_COLORS = {
  'High': 'var(--danger)',
  'Medium': 'var(--warning)',
  'Low': 'var(--success)'
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [analyses, setAnalyses] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monitorFilter, setMonitorFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Most Recent');

  const loadData = () => {
    setAnalyses(getAllAnalyses());
    fetch('http://localhost:8000/monitors')
      .then(res => res.json())
      .then(data => setMonitors(data))
      .catch(console.error);
    fetch('http://localhost:8000/alerts')
      .then(res => res.json())
      .then(data => {
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAlerts(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Delete this analysis? All locally stored analysis results associated with this invention will be removed from this browser.")) {
      deleteAnalysis(id);
      loadData();
      showToast("Analysis deleted", "success");
    }
  };

  const isMonitored = (summary) => monitors.some(m => m.summary === summary);

  const getStatus = (a) => {
    const featureCount = [
      a.analysisData, a.searchData, a.riskData, a.mitigationData, 
      a.whatIfData, a.mentorData, a.landscapeData, a.draftData, isMonitored(a.summary)
    ].filter(Boolean).length;
    return featureCount >= 4 ? 'Completed' : 'In Progress';
  };

  // Metrics
  const totalAnalyses = analyses.length;
  let highRiskCount = 0;
  let medRiskCount = 0;
  let lowRiskCount = 0;
  let monitoredCount = 0;
  let opportunityCount = 0;
  
  analyses.forEach(a => {
    const risk = a.riskData?.overall_risk;
    if (risk === 'High') highRiskCount++;
    if (risk === 'Medium') medRiskCount++;
    if (risk === 'Low') lowRiskCount++;
    if (isMonitored(a.summary)) monitoredCount++;
    if (a.landscapeData?.opportunities?.length > 0) opportunityCount++;
  });

  const riskPieData = [
    { name: 'High', value: highRiskCount },
    { name: 'Medium', value: medRiskCount },
    { name: 'Low', value: lowRiskCount }
  ].filter(d => d.value > 0);

  // Filtering
  let filtered = analyses.filter(a => {
    // Search
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      const matchesTitle = a.title.toLowerCase().includes(sq);
      const matchesSummary = a.summary?.toLowerCase().includes(sq);
      const matchesDomain = a.analysisData?.technology_domain?.toLowerCase().includes(sq);
      if (!matchesTitle && !matchesSummary && !matchesDomain) return false;
    }
    
    // Risk Filter
    if (riskFilter !== 'All') {
      const risk = a.riskData?.overall_risk || 'Unknown';
      if (risk !== riskFilter) return false;
    }

    // Status Filter
    if (statusFilter !== 'All') {
      if (getStatus(a) !== statusFilter) return false;
    }

    // Monitoring Filter
    if (monitorFilter !== 'All') {
      const monitored = isMonitored(a.summary);
      if (monitorFilter === 'Monitored' && !monitored) return false;
      if (monitorFilter === 'Not Monitored' && monitored) return false;
    }

    return true;
  });

  // Sorting
  filtered = filtered.sort((a, b) => {
    switch (sortOption) {
      case 'Oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'Highest Risk': {
        const riskRank = { 'High': 3, 'Medium': 2, 'Low': 1, 'Unknown': 0 };
        return (riskRank[b.riskData?.overall_risk || 'Unknown'] - riskRank[a.riskData?.overall_risk || 'Unknown']);
      }
      case 'Lowest Risk': {
        const riskRank = { 'High': 3, 'Medium': 2, 'Low': 1, 'Unknown': 4 }; // Unknown at bottom
        return (riskRank[a.riskData?.overall_risk || 'Unknown'] - riskRank[b.riskData?.overall_risk || 'Unknown']);
      }
      case 'Alphabetical':
        return a.title.localeCompare(b.title);
      case 'Most Recent':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Attention Required Items
  const attentionItems = [];
  
  // 1. Unread High Risk Alerts
  const unreadHighRiskAlerts = alerts.filter(a => !a.read && a.severity === 'high');
  unreadHighRiskAlerts.forEach(a => {
    const matchedAnalysis = analyses.find(an => an.summary === a.invention_name || an.title === a.invention_name);
    attentionItems.push({
      title: a.title,
      message: `High-risk patent match detected for ${a.invention_name}.`,
      actionText: 'Review Alert',
      action: () => {
        fetch(`http://localhost:8000/alerts/${a.id}/read`, { method: 'POST' });
        if (matchedAnalysis) {
          navigate(`/analysis/${matchedAnalysis.id}`);
        } else {
          navigate('/alerts');
        }
      }
    });
  });

  // 2. Standard Items
  analyses.forEach(a => {
    // Only add if we don't already have an alert for this invention
    const hasAlert = unreadHighRiskAlerts.some(al => al.invention_name === a.title || al.invention_name === a.summary);
    
    if (!hasAlert) {
      if (a.riskData?.overall_risk === 'High' && !isMonitored(a.summary)) {
        attentionItems.push({
          title: a.title,
          message: 'Monitoring is not enabled for this high-risk invention.',
          actionText: 'Enable Monitoring',
          action: () => navigate('/protection/monitoring')
        });
      } else if (a.riskData?.overall_risk === 'High') {
        attentionItems.push({
          title: a.title,
          message: 'High Risk score identified. Review mitigations.',
          actionText: 'Review Risk',
          action: () => navigate('/intelligence/risk', { state: { analysisId: a.id, analysisData: a.analysisData } })
        });
      } else if (!a.landscapeData) {
        attentionItems.push({
          title: a.title,
          message: 'Run Patent Landscape to explore innovation opportunities.',
          actionText: 'Explore Landscape',
          action: () => navigate('/intelligence/landscape', { state: { analysisId: a.id, analysisData: a.analysisData } })
        });
      }
    }
  });

  if (analyses.length === 0) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">Overview</span>
            <h1 className="dashboard-title">IP Intelligence Dashboard</h1>
            <p className="dashboard-subtitle">Monitor your inventions, patent risks, and innovation opportunities.</p>
          </div>
          <div className="dashboard-actions">
            <Button variant="primary" onClick={() => navigate('/analysis/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> New Patent Analysis
            </Button>
          </div>
        </div>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <FileSearch size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No analyses yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Start by analyzing your first invention to discover patent risks, opportunities, and design-arounds.
            </p>
            <Button variant="primary" onClick={() => navigate('/analysis/new')}>Start New Analysis</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const getNextStep = (a) => {
    if (!a.riskData) return { label: 'Continue Risk Analysis', path: '/intelligence/risk' };
    if (!a.mitigationData) return { label: 'Continue Risk Analysis', path: '/intelligence/risk' };
    if (!a.whatIfData) return { label: 'Run What-If Simulator', path: '/intelligence/what-if' };
    if (!a.landscapeData) return { label: 'Explore Landscape', path: '/intelligence/landscape' };
    if (!a.draftData) return { label: 'Draft Assistant', path: '/protection/draft' };
    return { label: 'View Reports', path: '/reports' };
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Overview</span>
          <h1 className="dashboard-title">IP Intelligence Dashboard</h1>
          <p className="dashboard-subtitle">Monitor your inventions, patent risks, and innovation opportunities.</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="primary" onClick={() => navigate('/analysis/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSearch size={16} /> New Patent Analysis
          </Button>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '32px' }}>
        <MetricCard title="Total Analyses" value={totalAnalyses} icon={<Activity size={24} color="var(--accent-cyan)" />} />
        <MetricCard title="High Risk" value={highRiskCount} icon={<ShieldAlert size={24} color="var(--danger)" />} />
        <MetricCard title="Medium Risk" value={medRiskCount} icon={<ShieldAlert size={24} color="var(--warning)" />} />
        <MetricCard title="Low Risk" value={lowRiskCount} icon={<CheckCircle size={24} color="var(--success)" />} />
        <MetricCard title="Monitored" value={monitoredCount} icon={<Radar size={24} color="var(--accent-purple)" />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Main List */}
        <Card>
          <CardHeader title="Recent Analyses">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text" 
                  placeholder="Search analyses..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }} 
                />
              </div>
              <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <option value="All">Risk: All</option>
                <option value="High">Risk: High</option>
                <option value="Medium">Risk: Medium</option>
                <option value="Low">Risk: Low</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <option value="All">Status: All</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
              <select value={monitorFilter} onChange={e => setMonitorFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <option value="All">Monitoring: All</option>
                <option value="Monitored">Monitored</option>
                <option value="Not Monitored">Not Monitored</option>
              </select>
              <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <option value="Most Recent">Sort: Most Recent</option>
                <option value="Oldest">Sort: Oldest</option>
                <option value="Highest Risk">Sort: Highest Risk</option>
                <option value="Lowest Risk">Sort: Lowest Risk</option>
                <option value="Alphabetical">Sort: Alphabetical</option>
              </select>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No analyses match the current filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px' }}>Invention</th>
                      <th style={{ padding: '16px' }}>Risk Level</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px' }}>Monitoring</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => {
                      const r = a.riskData?.overall_risk || 'Unknown';
                      const s = getStatus(a);
                      const m = isMonitored(a.summary);
                      const next = getNextStep(a);
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.title}</div>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '4px' }}>
                              {a.analysisData?.technology_domain || 'Unknown Domain'} • {new Date(a.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {a.riskData ? (
                              <div>
                                <div style={{ color: RISK_COLORS[r] || 'var(--text-secondary)', fontWeight: 600 }}>{r}</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Score: {a.riskData.overall_score}/100</div>
                              </div>
                            ) : <span style={{ color: 'var(--text-tertiary)' }}>Not Evaluated</span>}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <Badge variant={s === 'Completed' ? 'success' : 'default'}>{s}</Badge>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {m ? <span style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Radar size={14}/> Active</span> : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Off</span>}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <Button variant="secondary" onClick={() => navigate(`/analysis/${a.id}`)}>Open</Button>
                              <Button variant="outline" onClick={() => navigate(next.path, { state: { analysisId: a.id, analysisData: a.analysisData } })}>{next.label}</Button>
                              <Button variant="outline" onClick={() => navigate('/reports', { state: { selectedAnalysisId: a.id } })}>Report</Button>
                              <Button variant="outline" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)', borderColor: 'var(--border-color)' }}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card>
            <CardHeader title="Risk Distribution" />
            <CardBody>
              {riskPieData.length > 0 ? (
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                    {riskPieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: RISK_COLORS[d.name] }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px 0' }}>No risk data available.</div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Innovation Opportunities" />
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(34, 211, 238, 0.1)', padding: '16px', borderRadius: '8px' }}>
                  <Map size={24} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {opportunityCount}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {opportunityCount > 0 ? 'Analyses with identified landscape opportunities.' : 'Run Patent Landscape to discover opportunity zones.'}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {attentionItems.length > 0 && (
            <Card>
              <CardHeader title="Attention Required" />
              <CardBody style={{ padding: 0 }}>
                {attentionItems.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ padding: '16px', borderBottom: i < attentionItems.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{item.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '12px' }}>{item.message}</div>
                    <Button variant="secondary" onClick={item.action} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                      {item.actionText} <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </Button>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          
          <Card>
            <CardHeader title="Recent Alerts">
              <Button variant="secondary" onClick={() => navigate('/alerts')} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>View All</Button>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: alert.read ? 'transparent' : 'rgba(34, 211, 238, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {alert.severity === 'high' ? <ShieldAlert size={16} color="var(--danger)" /> : <AlertTriangle size={16} color="var(--warning)" />}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{alert.title}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>
                    {alert.invention_name}
                  </div>
                  {alert.similarity && (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                      {alert.similarity}% similarity
                    </div>
                  )}
                </div>
              ))}
              {alerts.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No recent alerts.</div>
              )}
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
