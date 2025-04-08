import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navigation.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="nav-container">
      <div className="nav-menu">
        <button className="nav-button" onClick={toggleSidebar}>
          <span className="menu-icon">☰</span>
        </button>
        <Link to="/" className="nav-logo">
          Product Roadmap Tool
        </Link>
        <div className="nav-menu">
          <Link to="/enhanced-gantt" className="nav-link">
            Gantt Chart
          </Link>
          <Link to="/kanban" className="nav-link">
            Kanban Board
          </Link>
          <Link to="/releases" className="nav-link">
            Releases
          </Link>
          <Link to="/features/new" className="nav-button">
            + New Feature
          </Link>
          <Link to="/releases/new" className="nav-button secondary">
            + New Release
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
