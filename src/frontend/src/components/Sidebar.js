import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/gantt" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-chart-bar"></i>
              <span>Gantt View</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/enhanced-gantt" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-project-diagram"></i>
              <span>Enhanced Gantt</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/kanban" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">📋</span>
              <span className="nav-text">Kanban Board</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/releases" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">🚀</span>
              <span className="nav-text">Releases</span>
            </NavLink>
          </li>
          <li className="nav-section">
            <div className="nav-section-title">Management</div>
          </li>
          <li className="nav-item">
            <NavLink to="/features/new" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">➕</span>
              <span className="nav-text">Add Feature</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/releases/new" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">➕</span>
              <span className="nav-text">Add Release</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
