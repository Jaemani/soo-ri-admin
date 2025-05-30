import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { logout, getCurrentAdmin } from '../../services/auth';
import './Layout.css';

// SVG Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const NotificationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Layout: React.FC = () => {
  const currentAdmin = getCurrentAdmin();

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-area">
        <header className="top-header">
          <div className="header-search">
            <input type="text" placeholder="Search..." />
            <button type="button">
              <SearchIcon />
            </button>
          </div>
          <div className="header-actions">
            <button className="notification-button">
              <NotificationIcon />
            </button>
            <div className="user-profile">
              <img src="https://cdn0.iconfinder.com/data/icons/remoji-soft-1/512/emoji-thumbs-up-smile.png" alt="User" />
              <span>{currentAdmin.label || '관리자'}</span>
            </div>
            <button className="logout-button" onClick={handleLogout} title="로그아웃">
              <LogoutIcon />
            </button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 