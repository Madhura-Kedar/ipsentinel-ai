import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  UploadCloud, FileText, CheckCircle2, Loader2, BrainCircuit, Cpu, Tag, 
  Network, AlertTriangle, FileQuestion, Wrench, Layers, Settings, X, Edit3, Save, Info, Lightbulb
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { createAnalysis } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const NewAnalysis = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState('input'); // 'input', 'analyzing', 'understanding', 'refine'
  const [activeTab, setActiveTab] = useState('upload');
  
  // Meta Details
  const [analysisTitle, setAnalysisTitle] = useState('');
  const [analysisDomain, setAnalysisDomain] = useState('');
  const [analysisInventor, setAnalysisInventor] = useState('');
  const [analysisKeywords, setAnalysisKeywords] = useState('');
  
  const [inventionText, setInventionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [analysisData, setAnalysisData] = useState(null);

  // Editable fields during refine
  const [editData, setEditData] = useState({});

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showToast('File exceeds 50MB limit', 'error');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      showToast('Unsupported file format. Please upload PDF, DOCX, or TXT.', 'error');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisTitle.trim() || !analysisDomain.trim()) {
      showToast('Please provide both Title and Technology Domain.', 'error');
      return;
    }

    const formData = new FormData();
    
    if (activeTab === 'paste') {
      if (!inventionText.trim() || inventionText.trim().length < 50) {
        showToast('Please paste a sufficient description (min 50 characters)', 'error');
        return;
      }
      formData.append('text', inventionText.trim());
    } else {
      if (!selectedFile) {
        showToast('Please upload a document or switch to Paste Invention Text mode.', 'error');
        return;
      }
      formData.append('file', selectedFile);
    }

    setStep('analyzing');
    
    try {
      const response = await fetch('http://localhost:8000/analyze-invention', {
        method: 'POST',
        body: formData
      });
      
      // Fallback if the backend still expects /analyze
      let res = response;
      if (res.status === 404) {
        res = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          body: formData
        });
      }

      if (!res.ok) {
        if (res.status === 413) throw new Error("File too large");
        if (res.status === 415) throw new Error("Unsupported file format");
        if (res.status === 422) throw new Error("Validation error");
        if (res.status === 429) throw new Error("AI analysis quota is temporarily unavailable. Please try again after the quota resets.");
        
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Backend/internal error');
      }
      
      const data = await res.json();
      
      if (data.success && data.analysis) {
        setAnalysisData(data.analysis);
        setEditData(data.analysis); // Clone to edit state
        setStep('understanding');
        showToast('AI Extraction Complete', 'success');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || '';
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted')) {
        showToast('AI analysis quota is temporarily unavailable. Please try again after the quota resets.', 'error');
      } else {
        showToast(errMsg, 'error');
      }
      setStep('input');
    }
  };

  const handleProceedToRisk = () => {
    const finalData = step === 'refine' ? editData : analysisData;
    
    const meta = {
      title: analysisTitle.trim(),
      domain: analysisDomain.trim(),
      inventor: analysisInventor.trim(),
      keywords: analysisKeywords.split(',').map(k => k.trim()).filter(k => k),
      sourceType: activeTab,
      sourceFileName: activeTab === 'upload' && selectedFile ? selectedFile.name : null,
      sourceText: activeTab === 'paste' ? inventionText : null
    };

    const analysisId = createAnalysis(meta, finalData);
    navigate('/intelligence/risk', { state: { analysisId, analysisData: finalData } });
  };

  const handleEditChange = (key, value) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const handleEditArrayChange = (key, index, value) => {
    setEditData(prev => {
      const arr = [...(prev[key] || [])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  };

  const handleArrayAdd = (key) => {
    setEditData(prev => ({ ...prev, [key]: [...(prev[key] || []), ''] }));
  };

  const handleArrayRemove = (key, index) => {
    setEditData(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  // UI mapping for the 10 sections exactly as requested
  const sections = [
    { key: 'invention_summary', title: 'A. Invention Summary', icon: <BrainCircuit size={20} style={{color: 'var(--accent-purple)'}} />, type: 'text' },
    { key: 'problem_statement', title: 'B. Problem Statement', icon: <AlertTriangle size={20} style={{color: 'var(--warning)'}} />, type: 'text' },
    { key: 'proposed_solution', title: 'C. Proposed Solution', icon: <CheckCircle2 size={20} style={{color: 'var(--success)'}} />, type: 'text' },
    { key: 'technical_features', title: 'D. Technical Features', icon: <Cpu size={20} style={{color: 'var(--accent-cyan)'}} />, type: 'array' },
    { key: 'components', title: 'E. Components / System Elements', icon: <Layers size={20} style={{color: '#3b82f6'}} />, type: 'array' },
    { key: 'working_methodology', title: 'F. Working / Methodology', icon: <Settings size={20} style={{color: '#9ca3af'}} />, type: 'text' },
    { key: 'key_concepts', title: 'G. Key Concepts', icon: <Tag size={20} style={{color: 'var(--success)'}} />, type: 'tags' },
    { key: 'potential_novelty_points', title: 'H. Potential Novelty Points', icon: <Lightbulb size={20} style={{color: 'var(--warning)'}} />, type: 'array' },
    { key: 'potential_claims', title: 'I. Potential Claims', icon: <Network size={20} style={{color: '#8b5cf6'}} />, type: 'array', desc: 'AI-generated preliminary drafting suggestions. Not a guarantee of patentability.' },
    { key: 'limitations_or_missing_information', title: 'J. Limitations / Missing Information', icon: <Wrench size={20} style={{color: 'var(--danger)'}} />, type: 'array' }
  ];

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Analysis Engine</span>
          <h1 className="dashboard-title">New Patent Analysis</h1>
          <p className="dashboard-subtitle">
            Submit your invention details to evaluate novelty, identify risks, and map the competitive landscape.
          </p>
        </div>
      </div>

      <div className="dashboard-lower" style={{ gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {step === 'input' && (
          <>
            <Card>
              <CardHeader title="1. Invention Source" />
              <CardBody>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Provide your invention details by uploading a document or entering the invention text directly.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div 
                    onClick={() => setActiveTab('upload')}
                    style={{ 
                      border: `2px solid ${activeTab === 'upload' ? 'var(--accent-cyan)' : 'transparent'}`, 
                      backgroundColor: activeTab === 'upload' ? 'rgba(34, 211, 238, 0.05)' : 'var(--bg-surface-hover)',
                      borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px'
                    }}
                  >
                    <UploadCloud size={40} color={activeTab === 'upload' ? 'var(--accent-cyan)' : 'var(--text-tertiary)'} />
                    <div>
                      <h3 style={{ color: activeTab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)', margin: '0 0 8px 0' }}>Upload Document</h3>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: 0 }}>PDF, DOCX, TXT</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setActiveTab('paste')}
                    style={{ 
                      border: `2px solid ${activeTab === 'paste' ? 'var(--accent-purple)' : 'transparent'}`, 
                      backgroundColor: activeTab === 'paste' ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-surface-hover)',
                      borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px'
                    }}
                  >
                    <FileText size={40} color={activeTab === 'paste' ? 'var(--accent-purple)' : 'var(--text-tertiary)'} />
                    <div>
                      <h3 style={{ color: activeTab === 'paste' ? 'var(--text-primary)' : 'var(--text-secondary)', margin: '0 0 8px 0' }}>Paste Invention Text</h3>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: 0 }}>Enter invention description, claims, or technical details</p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '32px' }}>
                  {activeTab === 'upload' ? (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      style={{
                        border: `2px dashed ${isDragging ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        borderRadius: '12px', padding: '48px', textAlign: 'center',
                        backgroundColor: isDragging ? 'rgba(34, 211, 238, 0.02)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".pdf,.docx,.txt" 
                        style={{ display: 'none' }} 
                      />
                      
                      {!selectedFile ? (
                        <>
                          <UploadCloud size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
                          <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Drag & drop your file here</h4>
                          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                            Supports PDF, DOCX, TXT up to 50MB
                          </p>
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg-surface-hover)', padding: '16px 24px', borderRadius: '8px', maxWidth: '400px', margin: '0 auto' }}>
                          <FileText size={24} color="var(--accent-cyan)" />
                          <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedFile.name}</div>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                          <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }} title="Remove file">
                            <X size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea 
                        placeholder="Paste your invention description, patent claims, technical specification, or other relevant invention details here..."
                        value={inventionText}
                        onChange={(e) => setInventionText(e.target.value)}
                        style={{ 
                          width: '100%', height: '300px', padding: '20px', borderRadius: '8px', 
                          border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', 
                          color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'var(--font-mono)', 
                          fontSize: '0.95rem', lineHeight: 1.6
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: inventionText.trim().length < 50 && inventionText.trim().length > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                          {inventionText.trim().length < 50 && inventionText.trim().length > 0 ? 'Please enter at least 50 characters for meaningful analysis.' : ''}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{inventionText.length} characters</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="2. Invention Details" />
              <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>A. Patent / Invention Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Smart Irrigation Optimization System" 
                      value={analysisTitle}
                      onChange={(e) => setAnalysisTitle(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>B. Technology Domain *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. IoT, Smart Agriculture, Artificial Intelligence" 
                      value={analysisDomain}
                      onChange={(e) => setAnalysisDomain(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>C. Primary Inventor</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ayesha Topiwala" 
                      value={analysisInventor}
                      onChange={(e) => setAnalysisInventor(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>D. Keywords (Comma-separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. smart irrigation, IoT agriculture, water optimization" 
                      value={analysisKeywords}
                      onChange={(e) => setAnalysisKeywords(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <Button 
                    variant="primary" 
                    onClick={handleAnalyze} 
                    disabled={!analysisTitle.trim() || !analysisDomain.trim() || (activeTab === 'paste' ? inventionText.trim().length < 50 : !selectedFile)}
                    style={{ padding: '12px 32px', fontSize: '1rem', width: 'auto' }}
                  >
                    Analyze Invention →
                  </Button>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {step === 'analyzing' && (
          <Card>
            <CardBody style={{ padding: '64px 24px', textAlign: 'center' }}>
              <Loader2 size={48} className="lucide-spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 24px' }} />
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Analyzing invention...</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--success)" /> Reading invention content</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--success)" /> Extracting technical information</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}><Loader2 size={14} className="lucide-spin" /> Structuring patent analysis...</span>
              </div>
            </CardBody>
          </Card>
        )}

        {(step === 'understanding' || step === 'refine') && analysisData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>3. AI Understanding & Extraction</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review the structured facts extracted from your source document.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {step === 'understanding' ? (
                  <Button variant="outline" onClick={() => setStep('refine')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Edit3 size={16}/> Edit Analysis</span>
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setStep('understanding')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={16}/> Save Changes</span>
                  </Button>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(34, 211, 238, 0.05)', border: '1px solid rgba(34, 211, 238, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
               <Info size={20} style={{ color: 'var(--accent-cyan)', marginTop: '2px' }} />
               <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                 <strong>Disclaimer:</strong> AI-generated analysis is informational and does not constitute legal advice, a patentability opinion, or an infringement determination. Review results with a qualified patent professional before making legal or filing decisions.
               </p>
            </div>

            {/* Render 10 Sections dynamically */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              {sections.map((sec, idx) => {
                const isEdit = step === 'refine';
                const dataObj = isEdit ? editData : analysisData;
                let val = dataObj[sec.key];

                return (
                  <Card key={idx}>
                    <CardHeader 
                      title={<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{sec.icon} {sec.title}</div>} 
                    />
                    <CardBody>
                      {sec.desc && <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '16px', marginTop: '-8px' }}>{sec.desc}</p>}
                      
                      {sec.type === 'text' && (
                        isEdit ? (
                          <textarea 
                            value={val || ''} 
                            onChange={(e) => handleEditChange(sec.key, e.target.value)}
                            style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', resize: 'vertical' }}
                          />
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{val || 'Not specified in the provided invention information.'}</p>
                        )
                      )}

                      {sec.type === 'array' && (
                        isEdit ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(val || []).map((item, i) => (
                              <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                <textarea 
                                  value={item} 
                                  onChange={(e) => handleEditArrayChange(sec.key, i, e.target.value)}
                                  style={{ flex: 1, height: '60px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', resize: 'vertical' }}
                                />
                                <button onClick={() => handleArrayRemove(sec.key, i)} style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={16}/></button>
                              </div>
                            ))}
                            <Button variant="outline" onClick={() => handleArrayAdd(sec.key)} style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '0.85rem' }}>+ Add Item</Button>
                          </div>
                        ) : (
                          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0, listStyle: 'none' }}>
                            {(!val || val.length === 0) && <li style={{ color: 'var(--text-tertiary)' }}>Not specified in the provided invention information.</li>}
                            {(val || []).map((item, i) => (
                              <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--bg-surface-hover)', padding: '12px 16px', borderRadius: '8px' }}>
                                <span style={{ color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 'bold' }}>{sec.key === 'potential_novelty_points' || sec.key === 'potential_claims' ? `${i+1}.` : '•'}</span> 
                                <span style={{ flex: 1, lineHeight: 1.5 }}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )
                      )}

                      {sec.type === 'tags' && (
                        isEdit ? (
                          <div>
                            <textarea 
                              value={(val || []).join(', ')} 
                              onChange={(e) => handleEditChange(sec.key, e.target.value.split(',').map(s => s.trim()).filter(s=>s))}
                              placeholder="Comma separated concepts"
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {(!val || val.length === 0) && <span style={{ color: 'var(--text-tertiary)' }}>Not specified in the provided invention information.</span>}
                            {(val || []).map((concept, i) => (
                              <span key={i} style={{ padding: '6px 12px', background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent-cyan)', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                {concept}
                              </span>
                            ))}
                          </div>
                        )
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px', paddingBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>Does this accurately represent your invention?</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Button variant="outline" onClick={() => setStep('input')} style={{ padding: '12px 24px' }}>← Refine Input</Button>
                <Button variant="primary" onClick={handleProceedToRisk} style={{ padding: '12px 24px' }}>Confirm & View Risk Analysis →</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAnalysis;
