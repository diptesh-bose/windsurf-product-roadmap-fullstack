import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Form.css';

const FeatureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    start_date: '',
    end_date: '',
    release_id: '',
    dependencies: []
  });
  
  const [releases, setReleases] = useState([]);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch releases and features for dropdowns
        const [releasesRes, featuresRes] = await Promise.all([
          axios.get('http://localhost:5001/api/releases'),
          axios.get('http://localhost:5001/api/features')
        ]);
        
        setReleases(releasesRes.data);
        setAvailableFeatures(featuresRes.data.filter(f => f.id !== Number(id)));
        
        // If in edit mode, fetch feature data
        if (isEditMode) {
          const featureRes = await axios.get(`http://localhost:5001/api/features/${id}`);
          
          // Format dates for input fields
          const feature = featureRes.data;
          if (feature.start_date) {
            feature.start_date = feature.start_date.split('T')[0];
          }
          if (feature.end_date) {
            feature.end_date = feature.end_date.split('T')[0];
          }
          
          setFormData(feature);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
        console.error('Feature form fetch error:', err);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDependencyChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setFormData(prev => ({
      ...prev,
      dependencies: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5001/api/features/${id}`, formData);
        setSuccessMessage('Feature updated successfully!');
      } else {
        await axios.post('http://localhost:5001/api/features', formData);
        setSuccessMessage('Feature created successfully!');
        
        // Reset form in create mode
        if (!isEditMode) {
          setFormData({
            title: '',
            description: '',
            status: 'backlog',
            priority: 'medium',
            start_date: '',
            end_date: '',
            release_id: '',
            dependencies: []
          });
        }
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/kanban');
      }, 1500);
    } catch (err) {
      setError('Failed to save feature. Please try again.');
      console.error('Feature form submit error:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading feature data...</div>;
  }

  return (
    <div className="form-container">
      <h1 className="page-title">{isEditMode ? 'Edit Feature' : 'Create Feature'}</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description || ''}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="priority" className="form-label">Priority</label>
              <select
                id="priority"
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-control"
                value={formData.start_date || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-control"
                value={formData.end_date || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="release_id" className="form-label">Release</label>
            <select
              id="release_id"
              name="release_id"
              className="form-control"
              value={formData.release_id || ''}
              onChange={handleChange}
            >
              <option value="">-- No Release --</option>
              {releases.map(release => (
                <option key={release.id} value={release.id}>
                  {release.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dependencies" className="form-label">Dependencies</label>
            <select
              id="dependencies"
              name="dependencies"
              multiple
              value={formData.dependencies}
              onChange={handleDependencyChange}
              size="5"
              className="form-control"
            >
              {availableFeatures.map(feature => (
                <option key={feature.id} value={feature.id}>
                  {feature.title}
                </option>
              ))}
            </select>
            <small className="form-help">Hold Ctrl/Cmd to select multiple features</small>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? 'Update Feature' : 'Create Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeatureForm;
