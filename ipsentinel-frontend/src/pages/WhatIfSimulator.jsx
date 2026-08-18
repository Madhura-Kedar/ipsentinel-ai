import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Play, RotateCcw, Activity, ShieldAlert, Zap, TrendingUp, TrendingDown, CheckCircle, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { updateAnalysis } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

const WhatIfSimulator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [summary, setSummary] = useState('');
  const [originalFeatures, setOriginalFeatures] = useState([]);
  const [modifiedFeatures, setModifiedFeatures] = useState([]);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    if (location.state && location.state.analysisData) {
      setSummary(location.state.analysisData.summary);
      setOriginalFeatures([...location.state.analysisData.technical_features]);
      setModifiedFeatures([...location.state.analysisData.technical_features]);
    }
  }, [location.state]);

  const handleManualRun = () => {
    // Example Irrigation Simulation as requested by User
    const demoSummary = "A smart irrigation system automatically controls water delivery to crops by integrating data from soil moisture sensors and weather forecasts.";
    const demoFeatures = [
      "Soil moisture sensors",
      "Weather forecasts integration",
      "Automatic control of water delivery"
    ];
    setSummary(demoSummary);
    setOriginalFeatures(demoFeatures);
    
    // Auto-setup the modified feature for the demo
    const modified = [
      "Soil moisture sensors",
      "Weather forecasts integration",
      "Semi-automatic water delivery recommendations requiring human approval"
    ];
    setModifiedFeatures(modified);
    setSimulationResult(null);
  };

  const handleUpdateFeature = (index, value) => {
    const newFeatures = [...modifiedFeatures];
    newFeatures[index] = value;
    setModifiedFeatures(newFeatures);
  };

  const handleRemoveFeature = (index) => {
    const newFeatures = modifiedFeatures.filter((_, i) => i !== index);
    setModifiedFeatures(newFeatures);
  };

  const handleAddFeature = () => {
    setModifiedFeatures([...modifiedFeatures, ""]);
  };

  const handleReset = () => {
    setModifiedFeatures([...originalFeatures]);
    setSimulationResult(null);
  };

  const handleSimulate = async () => {
    const filteredFeatures = modifiedFeatures.filter(f => f.trim() !== "");
    if (filteredFeatures.length === 0) {
      showToast('Please provide at least one technical feature', 'error');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const response = await fetch('http://localhost:8000/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          original_features: originalFeatures,
          modified_features: filteredFeatures
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Simulation failed';
        if (errorData.detail) {
          errMsg = Array.isArray(errorData.detail) ? errorData.detail.map(e => e.msg).join(', ') : errorData.detail;
        }
        throw new Error(errMsg);
      }
      const data = await response.json();
      
      setSimulationResult(data);
      if (location.state?.analysisId) {
         updateAnalysis(location.state.analysisId, 'whatIfData', data);
      }
      showToast('Simulation complete', 'success');
      
      // Clean up empty strings that were filtered out
      setModifiedFeatures(filteredFeatures);
    } catch (err) {
      console.error("Backend Error Details:", err);
      
      const errMsg = err.message || "";
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        showToast('AI quota exceeded. Please wait a minute before running another simulation.', 'error');
      } else {
        showToast(errMsg, 'error');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'High': return 'var(--danger)';
      case 'Medium': return 'var(--warning)';
      case 'Low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const ImpactMetric = ({ label, original, modified, change, icon, changeValue }) => {
    const isPositive = changeValue <= 0; // Negative risk change is good
    return (
      <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {icon} {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Original</div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>{original}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ height: '1px', width: '40px', background: 'var(--border-color)', position: 'relative', margin: '12px 0' }}>
              <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '0', height: '0', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid var(--border-color)' }}></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Simulated</div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>{modified}</div>
          </div>
        </div>
        
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net Change</span>
          <span style={{ 
            fontSize: '0.9rem', 
            fontWeight: 700, 
            color: changeValue === 0 ? 'var(--text-secondary)' : isPositive ? 'var(--success)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: changeValue === 0 ? 'rgba(255,255,255,0.05)' : isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {changeValue < 0 ? <TrendingDown size={14} /> : changeValue > 0 ? <TrendingUp size={14} /> : null}
            {change}
          </span>
        </div>
      </div>
    );
  };

  if (!summary) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">Test Changes</span>
            <h1 className="dashboard-title">What-If Simulator</h1>
            <p className="dashboard-subtitle">Modify your invention and see how technical changes affect patent risk.</p>
          </div>
        </div>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '48px' }}>
            <Activity size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>No invention data available for simulation.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => navigate('/analysis/new')}>Start New Analysis</Button>
              <Button variant="primary" onClick={handleManualRun}>Run Example Simulation</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Test Changes</span>
          <h1 className="dashboard-title">What-If Simulator</h1>
          <p className="dashboard-subtitle">Modify your invention and see how technical changes affect patent risk.</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="secondary" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={16} /> Reset
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSimulate} 
            disabled={isSimulating}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isSimulating ? (
              <><Loader2 size={16} className="lucide-spin" /> Simulating...</>
            ) : (
              <><Play size={16} /> Run Simulation</>
            )}
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: simulationResult ? '1fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Editor Column */}
        <div style={{ display: 'grid', gap: '24px' }}>
          <Card>
            <CardHeader title="Current Invention Context" />
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 0 }}>
                {summary}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Technical Features Simulator" action={
              <Button variant="outline" onClick={handleAddFeature} style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Plus size={14} /> Add Feature
              </Button>
            } />
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modifiedFeatures.map((feat, idx) => {
                  const isModified = originalFeatures[idx] !== feat;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <textarea 
                        value={feat}
                        onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                        placeholder="Describe technical feature..."
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'var(--bg-app)',
                          border: isModified ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          resize: 'vertical',
                          minHeight: '60px',
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          transition: 'border 0.2s'
                        }}
                      />
                      <Button variant="secondary" onClick={() => handleRemoveFeature(idx)} style={{ padding: '12px', height: 'auto' }}>
                        <Trash2 size={16} color="var(--danger)" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Results Column */}
        {simulationResult && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <Card style={{ borderTop: `4px solid ${simulationResult.score_change < 0 ? 'var(--success)' : simulationResult.score_change > 0 ? 'var(--danger)' : 'var(--border-color)'}` }}>
              <CardHeader title="Simulation Results" />
              <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <ImpactMetric 
                    label="Overall Risk Score" 
                    original={`${simulationResult.before_analysis.overall_score}/100`}
                    modified={`${simulationResult.after_analysis.overall_score}/100`}
                    changeValue={simulationResult.score_change}
                    change={simulationResult.score_change === 0 ? '0 points' : `${simulationResult.score_change > 0 ? '+' : ''}${simulationResult.score_change} points`}
                    icon={<Zap size={16} />}
                  />
                  <ImpactMetric 
                    label="Risk Level" 
                    original={simulationResult.before_analysis.overall_risk}
                    modified={simulationResult.after_analysis.overall_risk}
                    changeValue={simulationResult.score_change}
                    change={simulationResult.score_change < 0 ? 'Risk Reduced' : simulationResult.score_change > 0 ? 'Risk Increased' : 'No Change'}
                    icon={<ShieldAlert size={16} />}
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="AI Explanation" />
              <CardBody>
                <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {simulationResult.ai_explanation}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Feature-Level Comparison" />
              <div className="recent-table-container">
                <table className="recent-table" style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Modified Feature</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Simulated Risk</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.after_analysis.heatmap_data.map((item, idx) => {
                      const originalFeature = simulationResult.before_analysis.heatmap_data.find(f => f.feature === item.feature);
                      const originalRisk = originalFeature ? originalFeature.risk : null;
                      
                      let statusBadge = null;
                      if (!originalRisk) {
                        statusBadge = <Badge variant="success">Added</Badge>;
                      } else if (originalRisk !== item.risk) {
                        statusBadge = <Badge variant="warning">{originalRisk} → {item.risk}</Badge>;
                      } else {
                        statusBadge = <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Unchanged</span>;
                      }

                      return (
                        <tr key={idx}>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {item.feature}
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <Badge style={{ backgroundColor: getRiskColor(item.risk), color: '#fff' }}>{item.risk}</Badge>
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}
                    {simulationResult.before_analysis.heatmap_data.map((item, idx) => {
                      const stillExists = simulationResult.after_analysis.heatmap_data.find(f => f.feature === item.feature);
                      if (!stillExists) {
                        return (
                          <tr key={`removed-${idx}`}>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem', textDecoration: 'line-through' }}>
                              {item.feature}
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                              -
                            </td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                              <Badge variant="danger">Removed</Badge>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

        {/* Send to Draft Assistant */}
        {simulationResult && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button
              variant="primary"
              onClick={() => navigate('/protection/draft', {
                state: {
                  analysisData: location.state?.analysisData || { summary, technical_features: originalFeatures },
                  whatIfResult: simulationResult,
                  riskData: simulationResult.after_analysis
                }
              })}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Send to Draft Assistant →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatIfSimulator;
