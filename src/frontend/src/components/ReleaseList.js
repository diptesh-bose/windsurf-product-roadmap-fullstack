import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/ReleaseList.css';

const ReleaseList = () => {
  const [releases, setReleases] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
      
      {releases.length > 0 ? (
        <div className="card">
          <table className="table">
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
              {releases.map(release => (
                <tr key={release.id}>
                  <td>
                    <Link to={`/releases/edit/${release.id}`} className="release-name">
                      {release.name}
                    </Link>
                    {release.description && (
                      <div className="release-description">
                        {release.description.length > 50
                          ? `${release.description.substring(0, 50)}...`
                          : release.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${release.status}`}>
                      {release.status}
                    </span>
                  </td>
                  <td>{new Date(release.start_date).toLocaleDateString()}</td>
                  <td>{new Date(release.end_date).toLocaleDateString()}</td>
                  <td>{getFeatureCount(release.id)}</td>
                  <td>
                    {deleteConfirm === release.id ? (
                      <div className="delete-confirm">
                        <span>Are you sure?</span>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => deleteRelease(release.id)}
                        >
                          Yes
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={cancelDelete}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <Link 
                          to={`/releases/edit/${release.id}`} 
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => confirmDelete(release.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state card">
          <p>No releases found.</p>
          <p>Create your first release to start planning your product roadmap.</p>
          <Link to="/releases/new" className="btn btn-primary">
            Create Release
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReleaseList;
