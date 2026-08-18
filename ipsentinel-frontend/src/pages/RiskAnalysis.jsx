import React, { useState, useEffect } from 'react';
import { useNavigate as useNavigateHook } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ShieldAlert, AlertTriangle, CheckCircle, Loader2, Lightbulb, Zap, HelpCircle, Radar } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { updateAnalysis } from '../utils/analysisStore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../components/dashboard/Dashboard.css';

const RiskAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateTo = useNavigateHook();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const [isMitigating, setIsMitigating] = useState(false);
  const [mitigationData, setMitigationData] = useState(null);

  useEffect(() => {
    // If analysisData exists from the previous step, automatically run risk analysis
    if (location.state && location.state.analysisData) {
      runRiskAnalysis(location.state.analysisData);
    }
  }, [location.state]);

  const runRiskAnalysis = async (analysisData) => {
    setIsLoading(true);
    setError(null);
    setRiskData(null);
    setSelectedFeature(null);
    setMitigationData(null);

    try {
      const response = await fetch('http://localhost:8000/risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: analysisData.summary,
          technical_features: analysisData.technical_features
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = `Server returned ${response.status}`;
        if (errorData.detail) {
           errMsg = Array.isArray(errorData.detail) ? errorData.detail.map(e => e.msg).join(', ') : errorData.detail;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setRiskData(data);
      if (location.state?.analysisId) {
         updateAnalysis(location.state.analysisId, 'riskData', data);
      }
      showToast('Risk Analysis complete', 'success');
    } catch (err) {
      console.error("Risk Analysis Error:", err);
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        setError('AI quota temporarily exceeded. Please wait a moment and try again.');
        showToast('AI quota temporarily exceeded. Please wait a moment.', 'error');
      } else {
        setError(msg || 'Failed to run Risk Analysis');
        showToast(msg || 'Failed to run Risk Analysis', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMitigations = async () => {
    if (!riskData || !riskData.heatmap_data) return;

    setIsMitigating(true);
    try {
      const response = await fetch('http://localhost:8000/mitigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: riskData.heatmap_data })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = `Server returned ${response.status}`;
        if (errorData.detail) {
           errMsg = Array.isArray(errorData.detail) ? errorData.detail.map(e => e.msg).join(', ') : errorData.detail;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setMitigationData(data.mitigations);
      if (location.state?.analysisId) {
         updateAnalysis(location.state.analysisId, 'mitigationData', data.mitigations);
      }
      showToast('Mitigation Strategies generated', 'success');
      
      // Scroll down to the mitigations
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 200);
      
    } catch (err) {
      console.error("Mitigation Error:", err);
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        showToast('AI quota temporarily exceeded. Please wait a moment.', 'error');
      } else {
        showToast(msg || 'Failed to generate mitigations', 'error');
      }
    } finally {
      setIsMitigating(false);
    }
  };

  const exportJSON = () => {
    if (!riskData) return;
    
    const exportPayload = {
      report_type: "IPSentinel AI Risk Analysis",
      generated_at: new Date().toISOString(),
      overall_risk_score: riskData.overall_score,
      risk_level: riskData.overall_risk,
      potential_conflicts: riskData.potential_conflicts || [],
      technical_features: riskData.technical_features || [],
      novel_features: riskData.novel_features_list || [],
      mitigations: mitigationData || []
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "risk_analysis_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('JSON data exported successfully', 'success');
  };

  const exportPDF = () => {
    if (!riskData) return;
    
    const doc = new jsPDF();
    const invData = location.state?.analysisData || {};
    
    // 1. IPSentinel AI branding and title
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('IPSentinel AI', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(71, 85, 105);
    doc.text('Risk Analysis Report', 14, 30);
    
    // 2. Invention details
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Invention Details', 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Title: ${invData.title || 'Not Specified'}`, 14, 52);
    doc.text(`Domain: ${invData.technology_domain || 'Not Specified'}`, 14, 58);
    doc.text(`Inventor: ${invData.primary_inventor || 'Not Specified'}`, 14, 64);
    
    // 3, 4, 5. Metrics
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Summary Metrics', 14, 75);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Overall Risk: ${riskData.overall_risk} (Score: ${riskData.overall_score}/100)`, 14, 82);
    doc.text(`Potential Conflicts: ${riskData.conflicts_identified}`, 14, 88);
    doc.text(`Novel Features: ${riskData.novel_features}`, 14, 94);
    
    // 6. AI Risk Heatmap
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('AI Risk Heatmap', 14, 105);
    
    const heatmapHeaders = [['Feature / Technical Component', 'Novelty', 'Similarity', 'Conflict', 'Overall Risk']];
    const heatmapBody = riskData.heatmap_data?.map(f => [
      f.feature,
      f.novelty,
      f.similarity,
      f.conflict,
      f.risk
    ]) || [];
    
    doc.autoTable({
      startY: 110,
      head: heatmapHeaders,
      body: heatmapBody,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 9 }
    });
    
    // 7. Feature-level Results
    let currentY = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Feature-Level Explanations', 14, currentY);
    currentY += 8;
    
    riskData.heatmap_data?.forEach((f, i) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${f.feature}`, 14, currentY);
      currentY += 5;
      
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Match: ${f.matched_patent_id}`, 14, currentY);
      currentY += 5;
      
      const splitText = doc.splitTextToSize(f.explanation, 180);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 4) + 8;
    });
    
    // 8. AI Mitigation Recommendations
    if (mitigationData && mitigationData.length > 0) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 5;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('AI Mitigation Recommendations', 14, currentY);
      
      const mitigationHeaders = [['Patent / Reference ID', 'Feature', 'Priority', 'Identified Risk', 'Design-Around Strategy', 'Next Step']];
      const mitigationBody = mitigationData.map(m => [
        m.matched_patent_id,
        m.feature,
        m.priority,
        m.why_it_is_risky,
        m.suggested_design_around,
        m.recommended_mitigation
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: mitigationHeaders,
        body: mitigationBody,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30 }
        }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      currentY += 10;
    }
    
    // 9. Disclaimer
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const disclaimer = "Disclaimer: This AI-generated risk analysis report is for informational purposes only and does not constitute legal advice. Features and risks identified are based on automated semantic analysis and should be independently verified by a qualified patent attorney.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitDisclaimer, 14, currentY);
    
    doc.save('ipsentinel_risk_analysis.pdf');
    showToast('PDF Report exported successfully', 'success');
  };

  const handleManualRun = () => {
    navigate('/analysis/new');
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'High': return 'var(--danger)';
      case 'Medium': return 'var(--warning)';
      case 'Low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getRiskBg = (level) => {
    switch(level) {
      case 'High': return 'rgba(239, 68, 68, 0.15)';
      case 'Medium': return 'rgba(245, 158, 11, 0.15)';
      case 'Low': return 'rgba(34, 197, 94, 0.15)';
      default: return 'transparent';
    }
  };

  const HeatmapCell = ({ level }) => (
    <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{
        display: 'inline-block',
        padding: '6px 16px',
        borderRadius: '6px',
        backgroundColor: getRiskBg(level),
        color: getRiskColor(level),
        fontWeight: 600,
        fontSize: '0.85rem',
        minWidth: '80px'
      }}>
        {level}
      </div>
    </td>
  );

  const handleMonitor = async () => {
    if (!location.state?.analysisData) return;
    try {
      const response = await fetch('http://localhost:8000/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Invention from Risk Analysis",
          summary: location.state.analysisData.summary,
          features: location.state.analysisData.technical_features,
          keywords: location.state.analysisData.keywords || [],
          risk_score: riskData ? riskData.overall_risk : "None"
        })
      });
      if (!response.ok) throw new Error("Failed to create monitor");
      showToast("Invention added to IP Monitoring", "success");
      navigate('/monitoring');
    } catch (e) {
       showToast("Failed to create monitor", "error");
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Intelligence</span>
          <h1 className="dashboard-title">Risk Analysis</h1>
          <p className="dashboard-subtitle">Identify potential conflicts and assess novelty risks at the feature level.</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="outline" disabled={!riskData} onClick={exportJSON}>Export JSON Data</Button>
          <Button variant="secondary" disabled={!riskData} onClick={exportPDF}>Export Report</Button>
          <Button variant="primary" disabled={!riskData || isMitigating} onClick={generateMitigations}>
            {isMitigating ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 size={16} className="lucide-spin" /> Generating...</span> : 'Generate Mitigations'}
          </Button>
        </div>
      </div>

      {!location.state?.analysisData && !riskData && !isLoading && !error ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <AlertTriangle size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Invention Context</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              No invention analysis is currently loaded. Please start a new analysis to perform risk assessment.
            </p>
            <Button variant="primary" onClick={handleManualRun}>Start New Analysis</Button>
          </CardBody>
        </Card>
      ) : isLoading || (!riskData && !error && location.state?.analysisData) ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <Loader2 size={48} className="lucide-spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Assessing IP Risk</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Comparing technical features against global patent databases and identifying conflicts...</p>
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <AlertTriangle size={48} style={{ color: 'var(--danger)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Analysis Failed</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{error}</p>
            <Button variant="primary" onClick={() => runRiskAnalysis(location.state?.analysisData)}>Retry Analysis</Button>
          </CardBody>
        </Card>
      ) : riskData ? (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: getRiskBg(riskData.overall_risk), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={24} color={getRiskColor(riskData.overall_risk)} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overall Risk Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {riskData.overall_risk} ({riskData.overall_score}/100)
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={24} color="var(--warning)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Potential Conflicts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{riskData.conflicts_identified} Identified</div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={24} color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Novel Features</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{riskData.novel_features} Strong</div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="AI Risk Heatmap" action={
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Legend:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getRiskBg('Low') }}></div> Low</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getRiskBg('Medium') }}></div> Medium</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getRiskBg('High') }}></div> High</span>
              </div>
            } />
            <div className="recent-table-container">
              <table className="recent-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Feature / Technical Component</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Novelty</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Similarity</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Conflict</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Overall Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.heatmap_data.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedFeature(item)}
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: selectedFeature?.id === item.id ? 'var(--bg-surface-hover)' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => {
                        if (selectedFeature?.id !== item.id) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.feature}
                      </td>
                      <HeatmapCell level={item.novelty} />
                      <HeatmapCell level={item.similarity} />
                      <HeatmapCell level={item.conflict} />
                      <HeatmapCell level={item.risk} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          {mitigationData && (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>AI Mitigation Recommendations</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {mitigationData.map((mitigation, idx) => (
                  <Card key={idx} style={{ borderLeft: `4px solid ${getRiskColor(mitigation.risk_level)}` }}>
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <Badge variant="default" style={{ marginBottom: '8px', display: 'inline-block' }}>{mitigation.matched_patent}</Badge>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{mitigation.feature}</h3>
                        </div>
                        <Badge variant={mitigation.risk_level === 'High' ? 'danger' : mitigation.risk_level === 'Medium' ? 'warning' : 'success'}>
                          {mitigation.priority} Priority
                        </Badge>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                            <HelpCircle size={16} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Identified Risk</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {mitigation.why_it_is_risky}
                          </p>
                        </div>
                        
                        <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                            <Lightbulb size={16} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Design-Around Strategy</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {mitigation.suggested_design_around}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ marginTop: '4px' }}>
                          <Zap size={16} color="var(--accent-purple)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Recommended Next Step</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{mitigation.recommended_mitigation}</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '8px' }}>
                  Disclaimer: These AI-generated recommendations are for technical design-around exploration and do not constitute legal clearance or guarantee patentability.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
                  <Button variant="outline" onClick={handleMonitor} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radar size={16} /> Monitor This Invention
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigateTo('/protection/draft', {
                      state: {
                        analysisId: location.state?.analysisId,
                        analysisData: location.state?.analysisData,
                        riskData: riskData,
                        mitigations: mitigationData
                      }
                    })}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    Send to Draft Assistant →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {selectedFeature && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-color)', zIndex: 1000, padding: '24px', boxShadow: '-4px 0 24px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Feature Details</h3>
            <Button variant="secondary" onClick={() => setSelectedFeature(null)}>Close</Button>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Component</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFeature.feature}</div>
          </div>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Overall Risk ({selectedFeature.score}/100)</span>
              <span style={{ color: getRiskColor(selectedFeature.risk), fontWeight: 700 }}>{selectedFeature.risk}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Similarity Match</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedFeature.matched_patent_id}</span>
            </div>
          </div>

          <Card style={{ marginBottom: '24px' }}>
            <CardHeader title="AI Explanation" />
            <CardBody>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedFeature.explanation}
              </p>
            </CardBody>
          </Card>

          <Button variant="primary" style={{ width: '100%' }} onClick={() => {
            setSelectedFeature(null);
            generateMitigations();
          }}>Generate Mitigations</Button>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
