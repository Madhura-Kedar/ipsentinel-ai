import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Search, Filter, ExternalLink, ChevronDown, CheckSquare, Square, FileText, Stamp, Copyright, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { updateAnalysis } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

const IPSearch = () => {
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('Patent');
  const [selectedItems, setSelectedItems] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const toggleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      showToast("Please enter a search query", "error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          type: activeTab.toLowerCase(),
          limit: 50
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setTotalResults(data.total);
        // Persist if in analysis flow
        if (location.state?.analysisId) {
          updateAnalysis(location.state.analysisId, 'searchData', data.results);
        }
        if (data.total === 0) {
          showToast(`No ${activeTab.toLowerCase()}s found for your query.`, "warning");
        } else {
          showToast(`Found ${data.total} results`, "success");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to search service. Please try again.");
      showToast("Failed to connect to search service.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run search if tab changes and we already have a query
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const FilterSelect = ({ label }) => (
    <div style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <ChevronDown size={14} color="var(--text-tertiary)" />
    </div>
  );

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Global Discovery</span>
          <h1 className="dashboard-title">IP Search</h1>
          <p className="dashboard-subtitle">Query global databases across patents, trademarks, and copyrights.</p>
        </div>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <CardBody>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--accent-cyan)', borderRadius: '8px', padding: '0 16px', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.2)' }}>
              <Search size={20} color="var(--accent-cyan)" />
              <input 
                type="text" 
                placeholder="Search queries, numbers, assignees, or boolean logic..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              style={{ padding: '0 24px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isLoading && <Loader2 size={16} className="lucide-spin" />}
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Filter size={16} color="var(--text-tertiary)" style={{ alignSelf: 'center', marginRight: '4px' }} />
              <FilterSelect label="Jurisdiction (All)" />
              <FilterSelect label="Status (Active/Pending)" />
              <FilterSelect label="Filing Date (Last 5 Yrs)" />
              <FilterSelect label="Assignee/Owner" />
            </div>
            
            <button style={{ color: 'var(--accent-cyan)', background: 'transparent', border: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              Advanced Search
            </button>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {[
          { id: 'Patent', icon: <FileText size={16} />, count: activeTab === 'Patent' ? totalResults : 0 },
          { id: 'Trademark', icon: <Stamp size={16} />, count: activeTab === 'Trademark' ? totalResults : 0 },
          { id: 'Copyright', icon: <Copyright size={16} />, count: activeTab === 'Copyright' ? totalResults : 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItems([]); setResults([]); setTotalResults(0); }}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.id ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.id} <span style={{ background: activeTab === tab.id ? 'rgba(34, 211, 238, 0.2)' : 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{activeTab} Results</span>
              {selectedItems.length > 0 && (
                <Badge variant="primary">{selectedItems.length} Selected</Badge>
              )}
            </div>
          }
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="outline" disabled={selectedItems.length === 0}>Compare</Button>
              <Button variant="outline" disabled={selectedItems.length === 0}>Export ({selectedItems.length})</Button>
            </div>
          }
        />
        <div className="recent-table-container">
          <table className="recent-table">
            <thead>
              {activeTab === 'Patent' && (
                <tr>
                  <th style={{ width: '40px', padding: '16px' }}></th>
                  <th style={{ width: '30%' }}>ID / Title</th>
                  <th style={{ width: '40%' }}>Abstract</th>
                  <th>Assignee</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              )}
              {activeTab !== 'Patent' && (
                <tr>
                  <th style={{ width: '40px', padding: '16px' }}></th>
                  <th>Title / Mark</th>
                  <th>Owner</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px' }}>
                    <Loader2 size={32} className="lucide-spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Searching global databases...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px' }}>
                    <p style={{ color: 'var(--danger)' }}>{error}</p>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px' }}>
                    <Search size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No {activeTab.toLowerCase()} results found. Try a different query.</p>
                  </td>
                </tr>
              ) : (
                results.map(result => (
                  <tr key={result.id} style={{ backgroundColor: selectedItems.includes(result.id) ? 'var(--bg-surface-hover)' : 'transparent' }}>
                    <td style={{ padding: '16px', cursor: 'pointer', verticalAlign: 'top' }} onClick={() => toggleSelect(result.id)}>
                      {selectedItems.includes(result.id) ? <CheckSquare size={18} color="var(--accent-cyan)" /> : <Square size={18} color="var(--text-tertiary)" />}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>{result.id}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.title}</div>
                    </td>
                    
                    {activeTab === 'Patent' ? (
                      <>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', verticalAlign: 'top' }}>
                          {result.abstract ? (result.abstract.length > 150 ? result.abstract.substring(0, 150) + '...' : result.abstract) : 'No abstract available.'}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>{result.applicant}</td>
                        <td style={{ verticalAlign: 'top' }}>{result.source}</td>
                        <td style={{ verticalAlign: 'top' }}>
                          <Badge variant="success">{result.status}</Badge>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ verticalAlign: 'top' }}>{result.applicant || 'Unknown'}</td>
                        <td style={{ verticalAlign: 'top' }}>{result.type}</td>
                        <td style={{ verticalAlign: 'top' }}>
                          <Badge variant="primary">{result.status || 'Active'}</Badge>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default IPSearch;
