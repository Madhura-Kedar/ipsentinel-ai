export const recentAnalyses = [
  { id: 1, title: 'Smart Grid Predictive Node', reference: 'US 2024/018925', novelty: 87, risk: 'Low', status: 'Completed', updated: '2h ago' },
  { id: 2, title: 'Bio-polymer Packaging Film', reference: 'EP 4 382 891', novelty: 74, risk: 'Medium', status: 'Completed', updated: 'Yesterday' },
  { id: 3, title: 'Adaptive Battery Thermal Control', reference: 'WO 2024/115692', novelty: 91, risk: 'Low', status: 'Completed', updated: 'Jun 18' },
  { id: 4, title: 'Quantum Sensor Array', reference: 'Pending', novelty: 95, risk: 'Low', status: 'Draft', updated: 'Jun 15' },
];

export const noveltyTrendData = [
  { name: 'Feb', novelty: 65, avg: 50 },
  { name: 'Mar', novelty: 68, avg: 52 },
  { name: 'Apr', novelty: 80, avg: 51 },
  { name: 'May', novelty: 75, avg: 55 },
  { name: 'Jun', novelty: 85, avg: 54 },
  { name: 'Jul', novelty: 87, avg: 58 },
];

export const riskDistributionData = [
  { name: 'Low Risk', value: 57, color: '#22d3ee' },
  { name: 'Moderate Risk', value: 31, color: '#f59e0b' },
  { name: 'High Risk', value: 12, color: '#ef4444' },
];

export const aiInsights = [
  { id: 1, title: 'Strengthen your battery claim scope', description: 'Broaden the thermal control language to improve differentiation from 3 high-similarity filings.', actionText: 'Explore suggestion →' }
];

export const patentAlerts = [
  { id: 1, type: 'new-filing', title: 'New competitor filing', description: 'Tesla - EV thermal management', color: '#8b5cf6' },
  { id: 2, type: 'citation', title: 'Possible citation match', description: 'US 11,284,227 - 89% relevance', color: '#22d3ee' },
  { id: 3, type: 'monitoring', title: 'Monitoring update', description: '2 portfolio changes detected', color: '#f59e0b' },
];

export const searchResults = [
  { id: 'US11234567B2', title: 'Method for dynamic thermal allocation in multi-cell battery packs', assignee: 'Tesla Motors, Inc.', similarity: 89, risk: 'High', published: '2023-11-14' },
  { id: 'US20240182934A1', title: 'Adaptive cooling control system for electric vehicles', assignee: 'Rivian Automotive', similarity: 76, risk: 'Medium', published: '2024-02-08' },
  { id: 'EP3842193A1', title: 'Battery thermal management using predictive algorithms', assignee: 'Volkswagen AG', similarity: 62, risk: 'Low', published: '2022-09-22' },
  { id: 'WO2023098234A1', title: 'Solid-state battery architecture with integrated sensors', assignee: 'QuantumScape', similarity: 45, risk: 'Low', published: '2023-05-18' }
];

export const semanticMatches = [
  { id: 1, title: 'Predictive thermal conditioning for distributed energy storage', publication: 'US 11,489,122', similarity: 92, technology: 'Battery Management', risk: 'High', explanation: 'Matches your concept of using predictive models to pre-condition battery cells before high-load events.' },
  { id: 2, title: 'Machine learning based battery cell balancing', publication: 'EP 3 945 221', similarity: 78, technology: 'Control Systems', risk: 'Medium', explanation: 'Conceptually similar approach to using neural networks, but applied to cell balancing rather than thermal control.' }
];

export const potentialConflicts = [
  { id: 1, patent: 'US 11,489,122', similarity: 92, risk: 'High', reason: 'Independent Claim 1 directly overlaps with your proposed thermal prediction methodology.' },
  { id: 2, patent: 'WO 2024/018293', similarity: 76, risk: 'Medium', reason: 'Dependent claims 4-7 describe a similar sensor arrangement, though the control logic differs.' },
];

export const landscapeClusters = [
  { x: 20, y: 80, z: 200, name: 'Thermal Management', fill: '#22d3ee' },
  { x: 50, y: 60, z: 120, name: 'Solid State', fill: '#8b5cf6' },
  { x: 80, y: 30, z: 300, name: 'Cell Balancing', fill: '#10b981' },
  { x: 30, y: 40, z: 80, name: 'Anode Materials', fill: '#f59e0b' },
];

export const topAssignees = [
  { name: 'Toyota', patents: 420 },
  { name: 'Tesla', patents: 380 },
  { name: 'LG Chem', patents: 310 },
  { name: 'Panasonic', patents: 290 },
  { name: 'Samsung SDI', patents: 250 },
];

export const filingTrends = [
  { year: '2015', filings: 420 },
  { year: '2016', filings: 510 },
  { year: '2017', filings: 590 },
  { year: '2018', filings: 850 },
  { year: '2019', filings: 1200 },
  { year: '2020', filings: 1800 },
  { year: '2021', filings: 2400 },
  { year: '2022', filings: 3100 },
  { year: '2023', filings: 4200 },
  { year: '2024', filings: 5100 }
];

export const riskHeatmapData = [
  { id: 1, feature: 'Thermal prediction model', novelty: 'High', similarity: 'Medium', conflict: 'Low', risk: 'Low' },
  { id: 2, feature: 'Temperature sensor array', novelty: 'Medium', similarity: 'High', conflict: 'High', risk: 'High' },
  { id: 3, feature: 'Predictive controller unit', novelty: 'High', similarity: 'Medium', conflict: 'Low', risk: 'Low' },
  { id: 4, feature: 'Historical load analysis', novelty: 'Medium', similarity: 'High', conflict: 'Medium', risk: 'Medium' },
  { id: 5, feature: 'Dynamic cooling adjustment', novelty: 'Low', similarity: 'High', conflict: 'High', risk: 'High' }
];

export const innovationMentorData = [
  {
    id: 1,
    issue: 'Temperature sensor array is too generic',
    explanation: 'Your thermal control mechanism uses standard grid-based sensor placement which is highly similar to US-1029384-B2.',
    action: 'Differentiate the mechanism by introducing adaptive load prediction based on non-linear thermal distribution models.',
    noveltyImpact: '+12%',
    riskImpact: '-18%'
  },
  {
    id: 2,
    issue: 'Dynamic cooling adjustment overlaps with prior art',
    explanation: 'The cooling adjustment loop matches standard PID controller implementations found in 42 active patents.',
    action: 'Replace standard PID with a machine-learning based predictive loop that adjusts before thermal thresholds are reached.',
    noveltyImpact: '+24%',
    riskImpact: '-35%'
  }
];

export const whatIfData = {
  original: {
    text: "A system for managing server temperatures comprising: a plurality of temperature sensors arranged in a grid; a controller configured to read said sensors; and a cooling unit configured to adjust fan speed based on said readings.",
    novelty: 42,
    similarity: 88,
    risk: "High"
  },
  modified: {
    text: "A system for anticipating server thermal events comprising: a plurality of temperature sensors; an AI-driven predictive controller configured to analyze historical load data and non-linear thermal distribution; and a proactive cooling unit configured to adjust cooling vectors before temperature thresholds are reached.",
    novelty: 89,
    similarity: 31,
    risk: "Low"
  }
};

export const ipMonitoringData = [
  { id: 1, asset: 'US-11234901-B2 (Predictive Cooling)', type: 'Patent', status: 'Active', lastChecked: '10 mins ago', matches: 3, risk: 'High', alert: 'High Risk Conflict' },
  { id: 2, asset: 'SmartTherm™', type: 'Trademark', status: 'Active', lastChecked: '1 hour ago', matches: 1, risk: 'Medium', alert: 'Similar Filing' },
  { id: 3, asset: 'LoadBalancer v2.0 Source', type: 'Copyright', status: 'Active', lastChecked: '4 hours ago', matches: 0, risk: 'Low', alert: 'Monitoring Update' },
  { id: 4, asset: 'US-20230491A1 (Grid Sensor)', type: 'Patent Application', status: 'Paused', lastChecked: '2 days ago', matches: 12, risk: 'High', alert: 'Citation Match' }
];

export const trademarkData = [
  { id: 'TM1', mark: 'THERMOPREDICT', owner: 'Acme Corp', class: 'Class 9 (Software)', jurisdiction: 'USPTO', status: 'Registered', risk: 'High' },
  { id: 'TM2', mark: 'ThermoAI', owner: 'TechFlow Inc', class: 'Class 9 (Software)', jurisdiction: 'EUIPO', status: 'Pending', risk: 'Medium' },
  { id: 'TM3', mark: 'CoolPredict', owner: 'Cooling Systems LLC', class: 'Class 11 (Hardware)', jurisdiction: 'USPTO', status: 'Registered', risk: 'Low' }
];

export const copyrightData = [
  { id: 'CR1', title: 'Predictive Cooling Algorithm v1.0', owner: 'Acme Corp', category: 'Computer Software', jurisdiction: 'US Copyright Office', status: 'Registered', risk: 'High' },
  { id: 'CR2', title: 'Thermal Management Source Code', owner: 'TechFlow Inc', category: 'Computer Software', jurisdiction: 'US Copyright Office', status: 'Pending', risk: 'Medium' }
];
