const STORAGE_KEY = 'ipsentinel_analyses';

const getAnalyses = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveAnalyses = (analyses) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
};

export const createAnalysis = (meta, analysisData) => {
  const analyses = getAnalyses();
  const id = 'analysis_' + Date.now();
  const newAnalysis = {
    id,
    title: meta.title || "Untitled Invention",
    domain: meta.domain || "",
    inventor: meta.inventor || "",
    keywords: meta.keywords || "",
    sourceType: meta.sourceType || "paste",
    sourceFileName: meta.sourceFileName || "",
    sourceText: meta.sourceText || "",
    summary: analysisData.invention_summary || analysisData.summary || "",
    features: analysisData.technical_features || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analysisData, // Feature 1 AI Understanding
    riskData: null,
    mitigationData: null,
    whatIfData: null,
    mentorData: null,
    landscapeData: null,
    draftData: null,
    monitoringData: null
  };
  analyses.push(newAnalysis);
  saveAnalyses(analyses);
  return id;
};

export const getAnalysisById = (id) => {
  if (!id) return null;
  const analyses = getAnalyses();
  return analyses.find(a => a.id === id) || null;
};

export const getAllAnalyses = () => {
  return getAnalyses().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
};

export const updateAnalysis = (id, sectionKey, sectionData) => {
  if (!id) return;
  const analyses = getAnalyses();
  const idx = analyses.findIndex(a => a.id === id);
  if (idx !== -1) {
    analyses[idx][sectionKey] = sectionData;
    saveAnalyses(analyses);
  }
};

export const deleteAnalysis = (id) => {
  const analyses = getAnalyses();
  saveAnalyses(analyses.filter(a => a.id !== id));
};
