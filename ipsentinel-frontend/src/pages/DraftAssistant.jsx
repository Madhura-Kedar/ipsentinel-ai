import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  FileText, Download, Loader2, ChevronDown, ChevronUp,
  Wand2, ShieldAlert, Info, CheckCircle, AlertTriangle, Radar
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { updateAnalysis } from '../utils/analysisStore';
import '../components/dashboard/Dashboard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible section for each patent draft part
// ─────────────────────────────────────────────────────────────────────────────
const DraftSection = ({ title, badge, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--bg-surface)', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border-color)' : 'none',
          transition: 'background 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{title}</span>
          {badge && <Badge variant="default">{badge}</Badge>}
        </div>
        {open ? <ChevronUp size={16} color="var(--text-tertiary)" /> : <ChevronDown size={16} color="var(--text-tertiary)" />}
      </div>
      {open && <div style={{ padding: '16px', background: 'var(--bg-app)' }}>{children}</div>}
    </div>
  );
};

// Editable text area inside a section
const EditableText = ({ value, onChange, rows = 4 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    rows={rows}
    style={{
      width: '100%', background: 'transparent', border: '1px solid var(--border-color)',
      borderRadius: '6px', color: 'var(--text-primary)', padding: '10px 12px',
      fontSize: '0.88rem', lineHeight: 1.7, resize: 'vertical', outline: 'none',
      fontFamily: 'var(--font-mono)', boxSizing: 'border-box'
    }}
    onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const DraftAssistant = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { showToast } = useToast();

  // Unpack navigation state (same pattern as WhatIfSimulator / InnovationMentor)
  const state        = location.state || {};
  const analysisData = state.analysisData  || null;
  const riskData     = state.riskData      || null;
  const mitigations  = state.mitigations   || null;
  const whatIfResult = state.whatIfResult  || null;   // contains after_analysis.heatmap_data features

  // Derive final features: prefer What-If modified features if they exist
  const finalFeatures = whatIfResult
    ? whatIfResult.after_analysis.heatmap_data.map(f => f.feature)
    : analysisData?.technical_features || [];

  // Draft state — editable fields
  const [draft, setDraft] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const draftRef = useRef(null);

  // Auto-generate if context is available on mount
  useEffect(() => {
    if (analysisData && finalFeatures.length > 0) {
      // Don't auto-generate — user must click; but scroll hint is shown
    }
  }, []);

  const updateField = (field) => (value) =>
    setDraft(prev => ({ ...prev, [field]: value }));

  const updateListItem = (field, index) => (value) =>
    setDraft(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!analysisData || finalFeatures.length === 0 || isGenerating) return;
    setIsGenerating(true);
    setDraft(null);
    try {
      const payload = {
        summary:  analysisData.summary,
        features: finalFeatures,
        risk_data: riskData ? {
          overall_risk: riskData.overall_risk,
          overall_score: riskData.overall_score,
          heatmap_data: riskData.heatmap_data?.map(h => ({
            feature: h.feature, risk: h.risk, explanation: h.explanation
          }))
        } : null,
        mitigations: mitigations ? mitigations.map(m => ({
          feature: m.feature, priority: m.priority,
          suggested_design_around: m.suggested_design_around
        })) : null
      };

      const response = await fetch('http://localhost:8000/draft-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        let errMsg = `Server error ${response.status}`;
        if (err.detail) {
           errMsg = Array.isArray(err.detail) ? err.detail.map(e => e.msg).join(', ') : err.detail;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setDraft(data);
      if (location.state?.analysisId) {
         updateAnalysis(location.state.analysisId, 'draftData', data);
      }
      showToast('Preliminary patent draft generated', 'success');
      setTimeout(() => draftRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);

    } catch (err) {
      console.error(err);
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        showToast('AI quota temporarily exceeded. Please wait a moment before generating.', 'error');
      } else {
        showToast(msg || 'Draft generation failed', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMonitor = async () => {
    if (!analysisData) return;
    try {
      const response = await fetch('http://localhost:8000/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft ? draft.title : "Draft Invention",
          summary: analysisData.summary,
          features: finalFeatures,
          keywords: analysisData.keywords || [],
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

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!draft) return;
    const claimsText = [
      `Claim 1 (Independent):\n${draft.independent_claim}`,
      ...draft.dependent_claims.map((c, i) => `Claim ${i + 2} (Dependent):\n${c}`)
    ].join('\n\n');

    const fullText = `
PRELIMINARY PATENT APPLICATION DRAFT
Generated by IPSentinel AI — FOR REVIEW PURPOSES ONLY. NOT LEGAL ADVICE.

TITLE: ${draft.title}

TECHNICAL FIELD:
${draft.technical_field}

BACKGROUND:
${draft.background}

PROBLEM STATEMENT:
${draft.problem_statement}

SUMMARY OF INVENTION:
${draft.summary_of_invention}

DETAILED DESCRIPTION:
${draft.detailed_description}

KEY FEATURES:
${draft.key_features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

CLAIMS:
${claimsText}

ABSTRACT:
${draft.abstract}

POTENTIAL NOVELTY POINTS:
${draft.novelty_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---
DISCLAIMER: This is an AI-assisted PRELIMINARY DRAFT only. It does not constitute legal advice,
a guarantee of patentability, novelty, or freedom-to-operate. Professional patent attorney
review is required before filing any application.
`.trim();

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patent_draft_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Draft exported successfully', 'success');
  };

  // ── Empty State ────────────────────────────────────────────────────────────
  if (!analysisData) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-label">Protection</span>
            <h1 className="dashboard-title">Draft Assistant</h1>
            <p className="dashboard-subtitle">AI-assisted preliminary patent drafting.</p>
          </div>
        </div>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '64px' }}>
            <FileText size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Invention Analysis Available</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Please complete an invention analysis first so the Draft Assistant has the technical context it needs.
            </p>
            <Button variant="primary" onClick={() => navigate('/analysis/new')}>Start New Analysis</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Protection</span>
          <h1 className="dashboard-title">Draft Assistant</h1>
          <p className="dashboard-subtitle">AI-assisted preliminary patent drafting and claim structuring.</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="outline" onClick={handleMonitor} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Radar size={16} /> Monitor This Invention
          </Button>
          <Button variant="secondary" disabled={!draft} onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Export Draft
          </Button>
          <Button variant="primary" disabled={isGenerating} onClick={handleGenerate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isGenerating
              ? <><Loader2 size={16} className="lucide-spin" /> Generating…</>
              : <><Wand2 size={16} /> Generate Patent Draft</>}
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT: Source Invention ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
          <Card>
            <CardHeader title="Source Invention" />
            <CardBody>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Summary</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                  {analysisData.summary}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                  {whatIfResult ? 'Final (What-If Modified) Features' : 'Technical Features'}
                  {whatIfResult && <Badge variant="primary" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>Modified</Badge>}
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {finalFeatures.map((f, i) => <li key={i} style={{ marginBottom: '4px' }}>{f}</li>)}
                </ul>
              </div>

              {riskData && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Overall Risk Score</div>
                  <div style={{ fontWeight: 700, color: riskData.overall_risk === 'High' ? 'var(--danger)' : riskData.overall_risk === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                    {riskData.overall_risk} ({riskData.overall_score}/100)
                  </div>
                </div>
              )}

              {mitigations && mitigations.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Key Mitigations Applied</div>
                  {mitigations.slice(0, 3).map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', fontSize: '0.82rem' }}>
                      <CheckCircle size={13} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{m.feature}: {m.suggested_design_around?.slice(0, 80)}…</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Legal disclaimer card */}
          <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.07)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={15} color="var(--warning)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              This is an <strong>AI-assisted preliminary draft only</strong>. It does not constitute legal advice, guarantee patentability, or confirm freedom-to-operate. Professional patent attorney review is required before filing.
            </p>
          </div>

          {!draft && !isGenerating && (
            <Button variant="primary" onClick={handleGenerate} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Wand2 size={16} /> Generate Patent Draft
            </Button>
          )}
        </div>

        {/* ── RIGHT: Patent Draft ───────────────────────────────────────── */}
        <div ref={draftRef}>
          {isGenerating && (
            <Card>
              <CardBody style={{ textAlign: 'center', padding: '64px' }}>
                <Loader2 size={48} className="lucide-spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 24px' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>AI is preparing your preliminary patent draft…</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Analyzing invention context, structuring claims, and generating draft sections.
                </p>
              </CardBody>
            </Card>
          )}

          {!isGenerating && !draft && (
            <Card>
              <CardBody style={{ textAlign: 'center', padding: '64px' }}>
                <FileText size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Draft Not Yet Generated</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                  Click <strong>"Generate Patent Draft"</strong> to create your AI-assisted preliminary patent application.
                </p>
                <Button variant="primary" onClick={handleGenerate} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Wand2 size={16} /> Generate Patent Draft
                </Button>
              </CardBody>
            </Card>
          )}

          {!isGenerating && draft && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Patent Draft</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 14px' }}>
                    <Download size={14} /> Export .txt
                  </Button>
                  <Button variant="outline" onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 14px' }}>
                    <Wand2 size={14} /> Regenerate
                  </Button>
                </div>
              </div>

              {/* Title */}
              <DraftSection title="Title" defaultOpen={true}>
                <EditableText value={draft.title} onChange={updateField('title')} rows={2} />
              </DraftSection>

              {/* Technical Field */}
              <DraftSection title="Technical Field" defaultOpen={true}>
                <EditableText value={draft.technical_field} onChange={updateField('technical_field')} rows={3} />
              </DraftSection>

              {/* Background */}
              <DraftSection title="Background" defaultOpen={false}>
                <EditableText value={draft.background} onChange={updateField('background')} rows={5} />
              </DraftSection>

              {/* Problem Statement */}
              <DraftSection title="Problem Statement" defaultOpen={true}>
                <EditableText value={draft.problem_statement} onChange={updateField('problem_statement')} rows={4} />
              </DraftSection>

              {/* Summary of Invention */}
              <DraftSection title="Summary of Invention" defaultOpen={true}>
                <EditableText value={draft.summary_of_invention} onChange={updateField('summary_of_invention')} rows={5} />
              </DraftSection>

              {/* Detailed Description */}
              <DraftSection title="Detailed Description" defaultOpen={false}>
                <EditableText value={draft.detailed_description} onChange={updateField('detailed_description')} rows={8} />
              </DraftSection>

              {/* Key Features */}
              <DraftSection title="Key Features" badge={`${draft.key_features.length} features`} defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {draft.key_features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.85rem', paddingTop: '8px', minWidth: '20px' }}>{i + 1}.</span>
                      <EditableText value={f} onChange={updateListItem('key_features', i)} rows={1} />
                    </div>
                  ))}
                </div>
              </DraftSection>

              {/* Claims */}
              <DraftSection title="Claims" badge="Patent Claims" defaultOpen={true}>
                <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <Info size={12} style={{ display: 'inline', marginRight: '6px' }} />
                  Claims are AI-generated in a preliminary format. These require professional patent attorney review and refinement before filing. They do not constitute legally sufficient claims.
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Badge variant="primary">Claim 1</Badge>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Independent Claim</span>
                  </div>
                  <EditableText value={draft.independent_claim} onChange={updateField('independent_claim')} rows={5} />
                </div>

                {draft.dependent_claims.map((claim, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Badge variant="default">Claim {i + 2}</Badge>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Dependent Claim</span>
                    </div>
                    <EditableText value={claim} onChange={updateListItem('dependent_claims', i)} rows={3} />
                  </div>
                ))}
              </DraftSection>

              {/* Abstract */}
              <DraftSection title="Abstract" defaultOpen={true}>
                <EditableText value={draft.abstract} onChange={updateField('abstract')} rows={5} />
              </DraftSection>

              {/* Novelty Points */}
              <DraftSection title="Potential Novelty Points" badge="For Review" defaultOpen={true}>
                <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  These are potential distinguishing considerations only — not a determination of novelty or patentability.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {draft.novelty_points.map((point, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle size={14} color="var(--success)" style={{ marginTop: '9px', flexShrink: 0 }} />
                      <EditableText value={point} onChange={updateListItem('novelty_points', i)} rows={2} />
                    </div>
                  ))}
                </div>
              </DraftSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftAssistant;
