import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
          <span className="menu-icon">☰</span>
        </button>
        <Link to="/" className="logo">
          <h1>Product Roadmap Tool</h1>
        </Link>
      </div>
      <div className="header-right">
        <div className="header-actions">
          <Link to="/features/new" className="btn btn-primary">
            <span className="btn-icon">+</span> New Feature
          </Link>
          <Link to="/releases/new" className="btn btn-success">
            <span className="btn-icon">+</span> New Release
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
