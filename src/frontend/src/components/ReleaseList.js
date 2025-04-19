import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaChevronDown } from 'react-icons/fa';
import '../styles/ReleaseList.css';

const ReleaseList = () => {
  const [releases, setReleases] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedRelease, setExpandedRelease] = useState(null);

  // toggle accordion open/closed
  const toggleExpand = (releaseId) => {
    setExpandedRelease(expandedRelease === releaseId ? null : releaseId);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [releasesRes, featuresRes] = await Promise.all([
          axios.get('http://localhost:5001/api/releases'),
          axios.get('http://localhost:5001/api/features')
        ]);
        
        setReleases(releasesRes.data);
        setFeatures(featuresRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch releases. Please try again later.');
        setLoading(false);
        console.error('Release list fetch error:', err);
      }
    };

    fetchData();
  }, []);

  // Count features per release
  const getFeatureCount = (releaseId) => {
    return features.filter(feature => feature.release_id === releaseId).length;
  };

  // Handle delete confirmation
  const confirmDelete = (releaseId) => {
    setDeleteConfirm(releaseId);
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Delete release
  const deleteRelease = async (releaseId) => {
    try {
      await axios.delete(`http://localhost:5001/api/releases/${releaseId}`);
      
      // Update local state
      setReleases(releases.filter(release => release.id !== releaseId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete release. Please try again.');
      console.error('Release delete error:', err);
    }
  };

  // Get release features
  const getReleaseFeatures = (releaseId) => {
    return features.filter(f => f.release_id === releaseId);
  };

  if (loading) {
    return <div className="loading">Loading releases...</div>;
  }

  return (
    <div className="release-list">
      <div className="list-header">
        <h1 className="page-title">Releases</h1>
        <Link to="/releases/new" className="btn btn-primary">
          <span>+</span> New Release
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="release-table-container">
        <table className="release-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Features</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map(release => {
              const isExpanded = expandedRelease === release.id;
              const featureCount = getFeatureCount(release.id);
              
              return (
                <React.Fragment key={release.id}>
                  {/* Main release row */}
                  <tr className="release-row">
                    <td>
                      <Link to={`/releases/edit/${release.id}`}>
                        {release.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`status status-${release.status.toLowerCase()}`}>
                        {release.status}
                      </span>
                    </td>
                    <td>{new Date(release.start_date).toLocaleDateString()}</td>
                    <td>{new Date(release.end_date).toLocaleDateString()}</td>
                    <td className="feature-count">
                      {featureCount}
                      {featureCount > 0 && (
                        <button
                          onClick={() => toggleExpand(release.id)}
                          className="features-btn"
                          title="View features"
                        >
                          <FaChevronDown className={`chevron ${isExpanded ? 'rotate' : ''}`} />
                        </button>
                      )}
                    </td>
                    <td>
                      {deleteConfirm === release.id ? (
                        <div className="delete-confirm">
                          <span>Delete?</span>
                          <button onClick={() => deleteRelease(release.id)} className="btn btn-danger btn-sm">Yes</button>
                          <button onClick={cancelDelete} className="btn btn-secondary btn-sm">No</button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            onClick={() => toggleExpand(release.id)}
                            className="btn btn-info btn-sm features-btn"
                          >
                            Features
                            <FaChevronDown className={`chevron ${isExpanded ? 'rotate' : ''}`} />
                          </button>
                          <Link to={`/releases/edit/${release.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                          <button onClick={() => confirmDelete(release.id)} className="btn btn-danger btn-sm">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Features accordion row */}
                  {isExpanded && (
                    <tr className="feature-row">
                      <td colSpan="6">
                        <div className="feature-list">
                          {getReleaseFeatures(release.id).length > 0 ? (
                            <ul>
                              {getReleaseFeatures(release.id).map(feature => (
                                <li key={feature.id}>
                                  • {feature.name || feature.title}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-features">No features assigned to this release.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {releases.length === 0 && (
        <div className="empty-state">
          <p>No releases found.</p>
          <p>Create your first release to start planning your product roadmap.</p>
          <Link to="/releases/new" className="btn btn-primary">Create Release</Link>
        </div>
      )}
    </div>
  );
};

export default ReleaseList;
