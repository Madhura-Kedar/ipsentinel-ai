import React from 'react';

export default function DashboardView({ onStartAnalysis }) {
  return (
    <div className="dashboard-view">
      <div className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-tag"><span>✦</span> AI-POWERED IP INTELLIGENCE</div>
        <h1 className="hero-title">Analyze Your <span>Innovation</span></h1>
        <p className="hero-subtitle">
          Uncover patent novelty, assess conflicts, and turn technical ideas into defendable intellectual property.
        </p>
        <div className="hero-actions">
          <button className="btn btn-secondary">
            <span>↑</span> Upload PDF
          </button>
          <button className="btn btn-secondary">
            <span>📋</span> Paste Text
          </button>
          <button className="btn btn-primary" onClick={onStartAnalysis}>
            <span>✦</span> Start Analysis <span>→</span>
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Patents Searched</span>
            <span className="metric-icon" style={{ color: '#22d3ee' }}>🔍</span>
          </div>
          <div className="metric-value">24,891</div>
          <div className="metric-trend trend-up">↑ 12.5%</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Novelty Score</span>
            <span className="metric-icon" style={{ color: '#8b5cf6' }}>✦</span>
          </div>
          <div className="metric-value">87.4%</div>
          <div className="metric-trend trend-up">↑ 5.2%</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Conflict Risk</span>
            <span className="metric-icon" style={{ color: '#10b981' }}>🛡</span>
          </div>
          <div className="metric-value">Low</div>
          <div className="metric-trend trend-down">↓ -10.7%</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Similar Patents</span>
            <span className="metric-icon" style={{ color: '#f59e0b' }}>📄</span>
          </div>
          <div className="metric-value">126</div>
          <div className="metric-trend trend-up">↑ +8 today</div>
        </div>
      </div>

      <div className="lower-layout">
        <div className="lower-left">
          <div className="charts-row">
            <div className="dashboard-card chart-card">
              <h3 className="card-title">Novelty Trend</h3>
              <div className="chart-container" style={{ alignItems: 'flex-end', paddingBottom: '20px' }}>
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 500 150">
                  <path d="M0,120 Q50,110 100,90 T200,80 T300,50 T400,60 T500,20 L500,150 L0,150 Z" fill="rgba(34, 211, 238, 0.1)" />
                  <path d="M0,120 Q50,110 100,90 T200,80 T300,50 T400,60 T500,20" fill="none" stroke="#22d3ee" strokeWidth="3" />
                  <circle cx="350" cy="55" r="4" fill="#0a0f1c" stroke="#22d3ee" strokeWidth="2" />
                </svg>
                <div style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem' }}>
                  <span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                </div>
              </div>
            </div>
            
            <div className="dashboard-card donut-card">
              <h3 className="card-title">Conflict Distribution</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div className="donut-chart">
                  <div className="donut-inner">
                    <span className="donut-val">24</span>
                    <span className="donut-lbl">findings</span>
                  </div>
                </div>
                <div className="donut-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }}></div>High risk 12%</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#f59e0b' }}></div>Moderate 31%</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#22d3ee' }}></div>Low risk 57%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '0', marginTop: '24px' }}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Recent Analyses</h3>
              <span style={{ color: '#22d3ee', fontSize: '0.85rem', cursor: 'pointer' }}>View all</span>
            </div>
            <div className="table-container">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Invention</th>
                    <th>Reference</th>
                    <th>Novelty</th>
                    <th>Risk</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>Smart Grid Predictive Node</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap' }}>Semantic & conflict analysis</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>US 2024/018925</td>
                    <td><span style={{ color: '#22d3ee', fontWeight: 600 }}>87%</span></td>
                    <td><span className="badge badge-green">Low</span></td>
                    <td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>2h ago</td>
                    <td style={{ color: '#64748b' }}>&gt;</td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>Bio-polymer Packaging Film</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap' }}>Semantic & conflict analysis</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>EP 4 382 891</td>
                    <td><span style={{ color: '#34d399', fontWeight: 600 }}>74%</span></td>
                    <td><span className="badge badge-yellow">Medium</span></td>
                    <td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>Yesterday</td>
                    <td style={{ color: '#64748b' }}>&gt;</td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>Adaptive Battery Thermal Control</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap' }}>Semantic & conflict analysis</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>WO 2024/115892</td>
                    <td><span style={{ color: '#22d3ee', fontWeight: 600 }}>91%</span></td>
                    <td><span className="badge badge-green">Low</span></td>
                    <td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>Jun 18</td>
                    <td style={{ color: '#64748b' }}>&gt;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="lower-right">
          <div className="dashboard-card side-panel-card">
            <div className="recommendation-card">
              <div className="hero-tag"><span>✦</span> AI Recommendations</div>
              <div className="rec-title">Strengthen your battery claim scope</div>
              <div className="rec-text">Broaden the thermal control language to improve differentiation from 3 high-similarity filings.</div>
              <a href="#" className="rec-link">Explore suggestion →</a>
            </div>
            
            <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              Patent Alerts <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>3 new</span>
            </h3>
            
            <div className="alert-item">
              <div className="alert-dot" style={{ background: '#8b5cf6' }}></div>
              <div className="alert-content">
                <p>New competitor filing</p>
                <span>Tesla - EV thermal management</span>
              </div>
            </div>
            <div className="alert-item">
              <div className="alert-dot" style={{ background: '#22d3ee' }}></div>
              <div className="alert-content">
                <p>Possible citation match</p>
                <span>US 11,284,227 - 89% relevance</span>
              </div>
            </div>
            <div className="alert-item" style={{ marginBottom: '32px' }}>
              <div className="alert-dot" style={{ background: '#f59e0b' }}></div>
              <div className="alert-content">
                <p>Monitoring update</p>
                <span>2 portfolio changes detected</span>
              </div>
            </div>

            <h3 className="card-title" style={{ fontSize: '1rem' }}>Recent Activity</h3>
            <div className="activity-item">
              <div className="activity-icon">✓</div>
              <div className="alert-content">
                <p>Analysis completed</p>
                <span>12 min ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="alert-content">
                <p>Report exported</p>
                <span>Yesterday</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">▤</div>
              <div className="alert-content">
                <p>Landscape updated</p>
                <span>Jun 21</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
