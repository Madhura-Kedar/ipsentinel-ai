import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisOverview from './pages/AnalysisOverview';
import IPSearch from './pages/IPSearch';
import SemanticSearch from './pages/SemanticSearch';
import RiskAnalysis from './pages/RiskAnalysis';
import DraftAssistant from './pages/DraftAssistant';
import PatentLandscape from './pages/PatentLandscape';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import InnovationMentor from './pages/InnovationMentor';
import WhatIfSimulator from './pages/WhatIfSimulator';
import IPMonitoring from './pages/IPMonitoring';
import Alerts from './pages/Alerts';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analysis/new" element={<NewAnalysis />} />
          <Route path="analysis/:id" element={<AnalysisOverview />} />
          <Route path="search/ip" element={<IPSearch />} />
          <Route path="search/semantic" element={<SemanticSearch />} />
          <Route path="intelligence/risk" element={<RiskAnalysis />} />
          <Route path="intelligence/mentor" element={<InnovationMentor />} />
          <Route path="intelligence/what-if" element={<WhatIfSimulator />} />
          <Route path="intelligence/landscape" element={<PatentLandscape />} />
          <Route path="protection/draft" element={<DraftAssistant />} />
          <Route path="protection/monitoring" element={<IPMonitoring />} />
          <Route path="reports" element={<Reports />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;