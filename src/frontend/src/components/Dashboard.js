import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [features, setFeatures] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuresRes, releasesRes] = await Promise.all([
          axios.get('http://localhost:5001/api/features'),
          axios.get('http://localhost:5001/api/releases')
        ]);
        
        setFeatures(featuresRes.data);
        setReleases(releasesRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        setLoading(false);
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const stats = {
    totalFeatures: features.length,
    totalReleases: releases.length,
    inProgressFeatures: features.filter(f => f.status === 'in-progress').length,
    upcomingReleases: releases.filter(r => new Date(r.end_date) > new Date()).length
  };

  // Get upcoming releases (next 3)
  const upcomingReleases = releases
    .filter(release => new Date(release.end_date) > new Date())
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .slice(0, 3);

  // Get recent features (latest 5)
  const recentFeatures = [...features]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value">{stats.totalFeatures}</div>
          <div className="stat-label">Total Features</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalReleases}</div>
          <div className="stat-label">Total Releases</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inProgressFeatures}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.upcomingReleases}</div>
          <div className="stat-label">Upcoming Releases</div>
        </div>
      </div>
      
      {/* Upcoming Releases */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Releases</h2>
          <Link to="/releases" className="view-all-link">View All</Link>
        </div>
        <div className="card">
          {upcomingReleases.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {upcomingReleases.map(release => (
                  <tr key={release.id}>
                    <td>
                      <Link to={`/releases/edit/${release.id}`}>{release.name}</Link>
                    </td>
                    <td>
                      <span className={`status-badge status-${release.status}`}>
                        {release.status}
                      </span>
                    </td>
                    <td>{new Date(release.start_date).toLocaleDateString()}</td>
                    <td>{new Date(release.end_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No upcoming releases found.</p>
              <Link to="/releases/new" className="btn btn-primary">Create Release</Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Features */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Features</h2>
          <Link to="/gantt" className="view-all-link">View All</Link>
        </div>
        <div className="card">
          {recentFeatures.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Release</th>
                </tr>
              </thead>
              <tbody>
                {recentFeatures.map(feature => {
                  const release = releases.find(r => r.id === feature.release_id);
                  return (
                    <tr key={feature.id}>
                      <td>
                        <Link to={`/features/edit/${feature.id}`}>{feature.title}</Link>
                      </td>
                      <td>
                        <span className={`status-badge status-${feature.status}`}>
                          {feature.status}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${feature.priority}`}>
                          {feature.priority}
                        </span>
                      </td>
                      <td>{release ? release.name : 'Unassigned'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No features found.</p>
              <Link to="/features/new" className="btn btn-primary">Create Feature</Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/features/new" className="quick-action-btn">
          <span className="action-icon">➕</span>
          <span>New Feature</span>
        </Link>
        <Link to="/releases/new" className="quick-action-btn">
          <span className="action-icon">🚀</span>
          <span>New Release</span>
        </Link>
        <Link to="/gantt" className="quick-action-btn">
          <span className="action-icon">📅</span>
          <span>Gantt Chart</span>
        </Link>
        <Link to="/kanban" className="quick-action-btn">
          <span className="action-icon">📋</span>
          <span>Kanban Board</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
