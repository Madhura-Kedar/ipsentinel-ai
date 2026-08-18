import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSearch, 
  Search, 
  BrainCircuit, 
  ShieldAlert, 
  FileText, 
  Map as MapIcon, 
  PieChart, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Lightbulb,
  GitBranch,
  Radar
} from 'lucide-react';
import './Layout.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navGroups = [
    {
      title: null,
      items: [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' }
      ]
    },
    {
      title: 'Analysis',
      items: [
        { path: '/analysis/new', icon: <FileSearch size={20} />, label: 'New Analysis' }
      ]
    },
    {
      title: 'Search',
      items: [
        { path: '/search/ip', icon: <Search size={20} />, label: 'IP Search' },
        { path: '/search/semantic', icon: <BrainCircuit size={20} />, label: 'Semantic Search' }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { path: '/intelligence/risk', icon: <ShieldAlert size={20} />, label: 'Risk Analysis' },
        { path: '/intelligence/mentor', icon: <Lightbulb size={20} />, label: 'Innovation Mentor' },
        { path: '/intelligence/what-if', icon: <GitBranch size={20} />, label: 'What-If Simulator' },
        { path: '/intelligence/landscape', icon: <MapIcon size={20} />, label: 'Patent Landscape' }
      ]
    },
    {
      title: 'Protection',
      items: [
        { path: '/protection/draft', icon: <FileText size={20} />, label: 'Draft Assistant' },
        { path: '/protection/monitoring', icon: <Radar size={20} />, label: 'IP Monitoring' }
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/reports', icon: <PieChart size={20} />, label: 'Reports' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' }
      ]
    }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <div className="sidebar-logo">IPSentinel AI</div>}
        {collapsed && <div className="sidebar-logo-small">IP</div>}
        <button 
          className="collapse-btn" 
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map((group, index) => (
          <div key={index} className="nav-group">
            {!collapsed && group.title && <div className="nav-group-title">{group.title}</div>}
            {group.items.map(item => (
              <NavLink 
                key={item.path}
                to={item.path} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <div className="nav-icon">{item.icon}</div>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">JD</div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">Jane Doe</div>
              <div className="user-role">Patent Analyst</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
