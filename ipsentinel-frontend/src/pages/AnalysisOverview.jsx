import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getAnalysisById } from '../utils/analysisStore';
import { 
  ShieldAlert, Activity, CheckCircle, Lightbulb, GitBranch, Map, 
  FileSignature, Search, Radar, ArrowLeft, Play
} from 'lucide-react';
import '../components/dashboard/Dashboard.css';

const AnalysisOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [isMonitored, setIsMonitored] = useState(false);

  useEffect(() => {
    const loaded = getAnalysisById(id);
    setAnalysis(loaded);
    
    if (loaded) {
      fetch('http://localhost:8000/monitors')
        .then(res => res.json())
        .then(data => {
          setIsMonitored(data.some(m => m.summary === loaded.summary));
        })
        .catch(console.error);
    }
  }, [id]);

  if (!analysis) {
    return (
      <div className="page-container">
        <h2 style={{ color: 'var(--text-primary)' }}>Analysis not found</h2>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const navState = { state: { analysisId: analysis.id, analysisData: analysis.analysisData } };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <Button variant="outline" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
          <span className="dashboard-label">Analysis Overview</span>
          <h1 className="dashboard-title">{analysis.title}</h1>
          <p className="dashboard-subtitle">{analysis.summary}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card>
            <CardHeader title="Invention Details" />
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Technology Domain</div>
                  <div style={{ color: 'var(--text-primary)' }}>{analysis.analysisData?.technology_domain || 'Unknown'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Risk Level</div>
                  <div style={{ color: analysis.riskData ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                    {analysis.riskData ? analysis.riskData.overall_risk : 'Not Evaluated'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Technical Features</div>
              <ul style={{ paddingLeft: '24px', color: 'var(--text-primary)' }}>
                {analysis.analysisData?.technical_features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Feature Progress" />
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <FeatureRow 
                  title="IP Search" 
                  icon={<Search size={16} />} 
                  isComplete={!!analysis.searchData} 
                  action={() => navigate('/search/ip', navState)} 
                />
                <FeatureRow 
                  title="Risk Analysis" 
                  icon={<ShieldAlert size={16} />} 
                  isComplete={!!analysis.riskData} 
                  action={() => navigate('/intelligence/risk', navState)} 
                />
                <FeatureRow 
                  title="What-If Simulator" 
                  icon={<GitBranch size={16} />} 
                  isComplete={!!analysis.whatIfData} 
                  action={() => navigate('/intelligence/what-if', navState)} 
                />
                <FeatureRow 
                  title="Innovation Mentor" 
                  icon={<Lightbulb size={16} />} 
                  isComplete={!!analysis.mentorData} 
                  action={() => navigate('/intelligence/mentor', navState)} 
                />
                <FeatureRow 
                  title="Patent Landscape" 
                  icon={<Map size={16} />} 
                  isComplete={!!analysis.landscapeData} 
                  action={() => navigate('/intelligence/landscape', navState)} 
                />
                <FeatureRow 
                  title="Draft Assistant" 
                  icon={<FileSignature size={16} />} 
                  isComplete={!!analysis.draftData} 
                  action={() => navigate('/protection/draft', navState)} 
                />
                <FeatureRow 
                  title="IP Monitoring" 
                  icon={<Radar size={16} />} 
                  isComplete={isMonitored} 
                  action={() => navigate('/protection/monitoring')} 
                />
              </div>
            </CardBody>
          </Card>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button 
                  variant="primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => navigate('/reports', { state: { selectedAnalysisId: analysis.id } })}
                >
                  <Activity size={16} /> View Intelligence Report
                </Button>
                <Button 
                  variant="outline" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => navigate('/intelligence/risk', navState)}
                >
                  <Play size={16} /> Continue Risk Analysis
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ title, icon, isComplete, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ color: isComplete ? 'var(--success)' : 'var(--text-tertiary)' }}>
        {isComplete ? <CheckCircle size={20} /> : icon}
      </div>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{title}</span>
    </div>
    <Button variant="secondary" onClick={action}>
      {isComplete ? 'Review' : 'Start'}
    </Button>
  </div>
);

export default AnalysisOverview;
