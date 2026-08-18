import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastProvider } from '../../contexts/ToastContext';
import './Layout.css';

const AppLayout = () => {
  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-wrapper">
          <Topbar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppLayout;
