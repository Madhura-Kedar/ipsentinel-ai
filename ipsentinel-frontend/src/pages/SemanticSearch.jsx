import React, { useState } from 'react';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { BrainCircuit, Loader2, Target, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import '../components/dashboard/Dashboard.css';

const SemanticSearch = () => {
  const { showToast } = useToast();
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      showToast('Please enter a description of your invention', 'error');
      return;
    }
    
    setIsSearching(true);
    setHasSearched(false);
    
    try {
      const response = await fetch('http://localhost:8000/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, k: 5 })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setHasSearched(true);
        if (data.results.length === 0) {
          showToast('No semantic matches found', 'warning');
        } else {
          showToast('Semantic search complete', 'success');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error connecting to Semantic Search API', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const insertExample = () => {
    setQuery('Predictive thermal management for distributed battery systems using a neural network to estimate localized heat loads.');
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">AI-Powered Search</span>
          <h1 className="dashboard-title">Semantic Patent Search</h1>
          <p className="dashboard-subtitle">
            Search patents based on technical meaning and concepts rather than exact keywords. Describe your invention in natural language.
          </p>
        </div>
      </div>

      <Card style={{ marginBottom: '32px' }}>
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <BrainCircuit size={20} style={{ position: 'absolute', left: '20px', top: '20px', color: 'var(--accent-purple)' }} />
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Describe the technical problem, solution, and novel mechanism...' 
              rows={4}
              style={{ width: '100%', padding: '20px 20px 20px 52px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', fontSize: '1rem', resize: 'vertical', lineHeight: '1.5' }}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={insertExample}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
            >
              Load example query
            </button>
            <Button variant="primary" onClick={handleSearch} disabled={isSearching || !query.trim()} style={{ padding: '12px 32px' }}>
              {isSearching ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 size={16} className="lucide-spin" /> Analyzing FAISS Vector Index...</span> : 'Semantic Search'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {hasSearched && (
        <div>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Semantic Matches ({results.length})</h3>
          
          {results.length === 0 ? (
            <Card>
              <CardBody style={{ textAlign: 'center', padding: '48px' }}>
                <BrainCircuit size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No semantically similar patents found for this query.</p>
              </CardBody>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {results.map(match => (
                <Card key={match.id} style={{ borderLeft: `4px solid ${match.risk === 'High' ? 'var(--danger)' : match.risk === 'Medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                  <CardBody style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{match.publication}</span>
                        <Badge variant="default">{match.technology}</Badge>
                      </div>
                      <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-primary)' }}>{match.title}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        <strong>Abstract:</strong> {match.explanation}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '32px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Target size={16} color="var(--accent-cyan)" />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Semantic Similarity</span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{match.similarity}%</div>
                      </div>
                      
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <AlertTriangle size={16} color={match.risk === 'High' ? 'var(--danger)' : match.risk === 'Medium' ? 'var(--warning)' : 'var(--success)'} />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Similarity Risk</span>
                        </div>
                        <Badge variant={match.risk === 'High' ? 'danger' : match.risk === 'Medium' ? 'warning' : 'success'}>
                          {match.risk} Risk
                        </Badge>
                      </div>
                      
                      <Button variant="outline" fullWidth style={{ marginTop: 'auto' }}>Compare Claims</Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SemanticSearch;
