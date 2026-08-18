import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Map, Loader2, Target, AlertCircle, Info, ChevronRight, Radar } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { updateAnalysis } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const getDensityColor = (density) => {
  switch (density) {
    case 'High':   return '#ef4444'; // red
    case 'Medium': return '#f59e0b'; // amber
    case 'Low':    return '#22c55e'; // green
    default:       return '#64748b';
  }
};

const getRiskColor = (risk) => {
  switch (risk) {
    case 'High':   return 'var(--danger)';
    case 'Medium': return 'var(--warning)';
    case 'Low':    return 'var(--success)';
    default:       return 'var(--text-secondary)';
  }
};

// Custom tooltip rendered by Recharts
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '12px 16px',
      maxWidth: '260px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', fontSize: '0.85rem', lineHeight: 1.4 }}>
        {d.title.length > 80 ? d.title.slice(0, 80) + '…' : d.title}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        {d.patent_id}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: getRiskColorBg(d.risk), color: getRiskColor(d.risk), fontSize: '0.75rem', fontWeight: 600 }}>
          {d.risk} Risk
        </span>
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: getDensityBg(d.density), color: getDensityColor(d.density), fontSize: '0.75rem', fontWeight: 600 }}>
          {d.density} Density
        </span>
      </div>
    </div>
  );
};

const getRiskColorBg = (r) => {
  if (r === 'High')   return 'rgba(239,68,68,0.15)';
  if (r === 'Medium') return 'rgba(245,158,11,0.15)';
  return 'rgba(34,197,94,0.15)';
};

const getDensityBg = (d) => {
  if (d === 'High')   return 'rgba(239,68,68,0.12)';
  if (d === 'Medium') return 'rgba(245,158,11,0.12)';
  return 'rgba(34,197,94,0.12)';
};

// ── main component ────────────────────────────────────────────────────────────
const PatentLandscape = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { showToast } = useToast();

  // Pull context from navigation state (same pattern as InnovationMentor)
  const analysisData = location.state?.analysisData || null;
  const queryText    = analysisData?.summary || '';

  const [points, setPoints]           = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [total, setTotal]             = useState(0);
  const [isLoading, setIsLoading]     = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'High' | 'Medium' | 'Low'

  const fetchLandscape = useCallback(async (query = '') => {
    setIsLoading(true);
    setSelectedPoint(null);
    try {
      const response = await fetch('http://localhost:8000/patent-landscape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k: 50 })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${response.status}`);
      }
      const data = await response.json();
      setPoints(data.points || []);
      setOpportunities(data.opportunities || []);
      setTotal(data.total || 0);
      
      if (location.state?.analysisId) {
         updateAnalysis(location.state.analysisId, 'landscapeData', data);
      }
      
      showToast(`Landscape loaded — ${data.total} patents mapped`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load landscape', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMonitor = async () => {
    if (!analysisData) return;
    try {
      const response = await fetch('http://localhost:8000/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Invention from Landscape",
          summary: analysisData.summary,
          features: analysisData.technical_features || [],
          keywords: analysisData.keywords || [],
          risk_score: "None"
        })
      });
      if (!response.ok) throw new Error("Failed to create monitor");
      showToast("Invention added to IP Monitoring", "success");
      navigate('/monitoring');
    } catch (e) {
       showToast("Failed to create monitor", "error");
    }
  };

  // Auto-load on mount
  useEffect(() => {
    fetchLandscape(queryText);
  }, []);

  const filteredPoints = activeFilter === 'All'
    ? points
    : points.filter(p => p.density === activeFilter);

  // ── render: empty state ───────────────────────────────────────────────────
  if (!isLoading && points.length === 0 && !isLoading) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">Intelligence</span>
            <h1 className="dashboard-title">Patent Landscape</h1>
            <p className="dashboard-subtitle">Visualise technology clusters and discover innovation opportunities.</p>
          </div>
        </div>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <Map size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              {isLoading ? 'Loading Landscape...' : 'No Patent Search Results Available'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Start a new analysis to map your invention's patent landscape, or load the full dataset.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => navigate('/analysis/new')}>Start New Analysis</Button>
              <Button variant="primary" onClick={() => fetchLandscape('')}>Load Full Dataset</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── render: loading ───────────────────────────────────────────────────────
  const loadingCard = isLoading && (
    <Card>
      <CardBody style={{ textAlign: 'center', padding: '64px' }}>
        <Loader2 size={48} className="lucide-spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 24px' }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Building Patent Landscape</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Extracting 384-dim embeddings → PCA 2D projection → density analysis…
        </p>
      </CardBody>
    </Card>
  );

  // ── render: main ──────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Intelligence</span>
          <h1 className="dashboard-title">Patent Landscape</h1>
          <p className="dashboard-subtitle">Visualise technology clusters and discover innovation opportunities.</p>
        </div>
        <div className="dashboard-actions">
          {analysisData && (
            <Badge variant="default" style={{ marginRight: '8px' }}>
              Context: {analysisData.summary?.slice(0, 40)}…
            </Badge>
          )}
          {analysisData && (
             <Button variant="outline" onClick={handleMonitor} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                <Radar size={16} /> Monitor This Invention
             </Button>
          )}
          <Button variant="secondary" onClick={() => fetchLandscape(queryText)} disabled={isLoading}>
            {isLoading ? <><Loader2 size={14} className="lucide-spin" style={{ marginRight: '6px' }} />Loading…</> : 'Refresh'}
          </Button>
        </div>
      </div>

      {isLoading ? loadingCard : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>

          {/* LEFT — scatter chart + opportunities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Chart */}
            <Card>
              <CardHeader
                title="Technology Landscape Map"
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="primary">{total} Patents Mapped</Badge>
                  </div>
                }
              />
              <CardBody>
                {/* Density filter buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {['All', 'High', 'Medium', 'Low'].map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      style={{
                        padding: '4px 14px',
                        borderRadius: '16px',
                        border: `1px solid ${activeFilter === f ? getDensityColor(f) : 'var(--border-color)'}`,
                        background: activeFilter === f ? getDensityBg(f) : 'transparent',
                        color: activeFilter === f ? getDensityColor(f) : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {f === 'All' ? 'All Densities' : `${f} Density`}
                    </button>
                  ))}
                </div>

                <div style={{ width: '100%', height: '440px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        type="number" dataKey="x" name="PC1"
                        domain={[-1.1, 1.1]} stroke="var(--text-tertiary)"
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                        label={{ value: 'Technology Vector 1 (PC1)', position: 'insideBottom', offset: -8, fill: 'var(--text-tertiary)', fontSize: 11 }}
                      />
                      <YAxis
                        type="number" dataKey="y" name="PC2"
                        domain={[-1.1, 1.1]} stroke="var(--text-tertiary)"
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                        label={{ value: 'PC2', angle: -90, position: 'insideLeft', fill: 'var(--text-tertiary)', fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Scatter
                        name="Patents"
                        data={filteredPoints}
                        onClick={(payload) => {
                          // payload from recharts onClick is the raw data object
                          const d = payload?.patent_id ? payload : payload?.payload;
                          if (d) setSelectedPoint(d);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {filteredPoints.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getDensityColor(entry.density)}
                            opacity={selectedPoint?.patent_id === entry.patent_id ? 1 : 0.75}
                            stroke={selectedPoint?.patent_id === entry.patent_id ? '#fff' : 'transparent'}
                            strokeWidth={2}
                            r={selectedPoint?.patent_id === entry.patent_id ? 8 : 5}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'High Patent Density (Crowded area)', color: '#ef4444' },
                    { label: 'Medium Patent Density', color: '#f59e0b' },
                    { label: 'Low Patent Density (Less explored)', color: '#22c55e' },
                  ].map(({ label, color }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      {label}
                    </span>
                  ))}
                </div>

                {/* Disclaimer */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', padding: '10px 14px', background: 'rgba(245,158,11,0.07)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Info size={14} color="var(--warning)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Colour indicates <strong>patent density</strong> based on PCA-projected embedding proximity.
                    Green = lower concentration of semantically similar patents.
                    This does <em>not</em> imply patentability, freedom-to-operate, or legal clearance.
                    Professional IP review is always recommended.
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Opportunities */}
            {opportunities.length > 0 && (
              <Card>
                <CardHeader title="Potential Innovation Opportunities" />
                <CardBody>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {opportunities.map((opp, i) => (
                      <div key={i} style={{
                        padding: '16px',
                        background: 'var(--bg-app)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        borderLeft: '4px solid #22c55e',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Target size={14} color="#22c55e" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {opp.title.length > 70 ? opp.title.slice(0, 70) + '…' : opp.title}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {opp.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '12px', textAlign: 'center' }}>
                    Opportunities are identified by low-density patent regions only — not by legal analysis.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* RIGHT — detail panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card style={{ position: 'sticky', top: '24px' }}>
              <CardHeader title="Patent Details" />
              <CardBody>
                {selectedPoint ? (
                  <div>
                    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{selectedPoint.patent_id}</div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {selectedPoint.title}
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ padding: '10px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Risk Level</div>
                        <div style={{ fontWeight: 700, color: getRiskColor(selectedPoint.risk) }}>{selectedPoint.risk}</div>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Density</div>
                        <div style={{ fontWeight: 700, color: getDensityColor(selectedPoint.density) }}>{selectedPoint.density}</div>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Similarity</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(selectedPoint.similarity * 100)}%</div>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Density Score</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPoint.density_score}/100</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Technical Summary</div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                        {selectedPoint.abstract || 'No abstract available.'}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                      <div>PC1: {selectedPoint.x}</div>
                      <div>PC2: {selectedPoint.y}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={32} style={{ color: 'var(--border-color)', marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Click a point on the map to view patent details.</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Stats summary */}
            {points.length > 0 && (
              <Card>
                <CardHeader title="Density Summary" />
                <CardBody>
                  {['High', 'Medium', 'Low'].map(d => {
                    const count = points.filter(p => p.density === d).length;
                    const pct = Math.round(count / points.length * 100);
                    return (
                      <div key={d} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d} Density</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: getDensityColor(d) }}>{count} patents ({pct}%)</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--bg-app)', borderRadius: '2px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: getDensityColor(d), borderRadius: '2px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatentLandscape;
