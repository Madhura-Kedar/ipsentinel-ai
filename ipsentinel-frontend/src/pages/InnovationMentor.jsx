import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Lightbulb, Send, Loader2, MessageSquare, ChevronRight, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { updateAnalysis } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

const PREDEFINED_QUESTIONS = [
  "How can I make my invention more novel?",
  "Which feature should I improve first?",
  "Suggest alternative technical approaches.",
  "How can I reduce patent overlap?",
  "What new features could differentiate my invention?",
  "What should I explore next?"
];

const InnovationMentor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [analysisData, setAnalysisData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Initialize context
  useEffect(() => {
    if (location.state && location.state.analysisData) {
      setAnalysisData(location.state.analysisData);
      if (location.state.riskData) {
        setRiskData(location.state.riskData);
      }
      
      // Add initial greeting
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I've analyzed your invention context. I can help you explore technical improvements, novelty opportunities, and ways to differentiate your design. What would you like to explore first?",
          isGreeting: true
        }
      ]);
    }
  }, [location.state]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim() || !analysisData || isLoading) return;
    
    const userMessage = { role: 'user', content: text };
    
    // Prepare history for API (excluding the initial greeting to save tokens if preferred, but we can send it. We'll send actual history)
    const history = messages
      .filter(m => !m.isGreeting)
      .map(m => ({
        role: m.role,
        content: m.role === 'assistant' ? JSON.stringify(m.structuredData) : m.content
      }));
      
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/innovation-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: analysisData.summary,
          features: analysisData.technical_features,
          question: text,
          risk_analysis: riskData,
          history: history
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Mentor request failed';
        if (errorData.detail) {
          errMsg = Array.isArray(errorData.detail) ? errorData.detail.map(e => e.msg).join(', ') : errorData.detail;
        }
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        structuredData: data
      }]);
      
      if (location.state?.analysisId) {
         updateAnalysis(location.state.analysisId, 'mentorData', data);
      }
      
    } catch (err) {
      console.error("Mentor Error:", err);
      const errMsg = err.message || "";
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        showToast('AI quota temporarily exceeded. Please wait a moment before asking another question.', 'error');
      } else {
        showToast(errMsg, 'error');
      }
      // Remove the user message if it failed, or let it stay? Better to let it stay but show error toast.
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!analysisData) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">AI Innovation Mentor</span>
            <h1 className="dashboard-title">Innovation Mentor</h1>
          </div>
        </div>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <Lightbulb size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Invention Context</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              No invention analysis is currently loaded. Please start a new analysis to use the mentor.
            </p>
            <Button variant="primary" onClick={() => navigate('/analysis/new')}>Start New Analysis</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-header" style={{ marginBottom: '16px' }}>
        <div className="dashboard-title-area">
          <span className="dashboard-label">AI Innovation Mentor</span>
          <h1 className="dashboard-title">Innovation Mentor</h1>
          <p className="dashboard-subtitle">AI-powered guidance for refining your invention.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Context Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <Card>
            <CardHeader title="Current Context" />
            <CardBody>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Invention Summary</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {analysisData.summary}
                </p>
              </div>
              
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Technical Features</div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {analysisData.technical_features.map((f, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{f}</li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>

          {riskData && (
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{riskData.overall_score}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Risk Score Loaded</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Risk Context Active</div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Chat Area */}
        <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {msg.role === 'user' ? <MessageSquare size={14} color="#fff" /> : <Lightbulb size={14} color="#000" />}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {msg.role === 'user' ? 'You' : 'AI Mentor'}
                  </span>
                </div>
                
                <div style={{ 
                  maxWidth: '85%', 
                  background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--bg-app)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                  borderTopRightRadius: msg.role === 'user' ? 0 : '12px',
                  borderTopLeftRadius: msg.role === 'assistant' ? 0 : '12px',
                }}>
                  <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>{msg.content}</p>
                  
                  {/* Structured Response Rendering */}
                  {msg.structuredData && (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {msg.structuredData.key_points && msg.structuredData.key_points.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '8px' }}>Key Insights</div>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                            {msg.structuredData.key_points.map((kp, i) => (
                              <li key={i} style={{ marginBottom: '6px' }}>{kp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {msg.structuredData.suggested_improvements && msg.structuredData.suggested_improvements.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '12px' }}>Suggested Improvements</div>
                          <div style={{ display: 'grid', gap: '12px' }}>
                            {msg.structuredData.suggested_improvements.map((imp, i) => (
                              <div key={i} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <CheckCircle size={14} color="var(--accent-cyan)" /> {imp.title}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                                  {imp.description}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', borderLeft: '2px solid var(--border-color)', paddingLeft: '12px' }}>
                                  Why: {imp.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {msg.structuredData.next_questions && msg.structuredData.next_questions.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Explore Further</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {msg.structuredData.next_questions.map((nq, i) => (
                              <button 
                                key={i}
                                onClick={() => handleSendMessage(nq)}
                                disabled={isLoading}
                                style={{ 
                                  background: 'var(--bg-surface)', 
                                  border: '1px solid var(--border-color)', 
                                  color: 'var(--accent-cyan)',
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  fontSize: '0.8rem',
                                  cursor: isLoading ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                              >
                                {nq}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        Disclaimer: AI-generated guidance is for technical innovation exploration only and does not constitute legal advice, patentability determination, or legal clearance.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lightbulb size={14} color="#000" />
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '12px', borderTopLeftRadius: 0, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="lucide-spin" color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Mentor is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            
            {/* Quick Questions */}
            {messages.length === 1 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Suggested Questions:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PREDEFINED_QUESTIONS.map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      style={{ 
                        background: 'var(--bg-app)', 
                        border: '1px solid var(--border-color)', 
                        color: 'var(--text-primary)',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.85rem',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask your Innovation Mentor..."
                disabled={isLoading}
                style={{ 
                  flex: 1, 
                  background: 'var(--bg-app)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <Button 
                variant="primary" 
                onClick={() => handleSendMessage()} 
                disabled={isLoading || !inputValue.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}
              >
                Send <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InnovationMentor;
