import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Form.css';

const ReleaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planned',
    start_date: '',
    end_date: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const releaseRes = await axios.get(`http://localhost:5001/api/releases/${id}`);
          
          // Format dates for input fields
          const release = releaseRes.data;
          if (release.start_date) {
            release.start_date = release.start_date.split('T')[0];
          }
          if (release.end_date) {
            release.end_date = release.end_date.split('T')[0];
          }
          
          setFormData(release);
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch release data. Please try again later.');
          setLoading(false);
          console.error('Release form fetch error:', err);
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (!formData.start_date || !formData.end_date) {
      setError('Start date and end date are required.');
      return;
    }
    
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5001/api/releases/${id}`, formData);
        setSuccessMessage('Release updated successfully!');
      } else {
        await axios.post('http://localhost:5001/api/releases', formData);
        setSuccessMessage('Release created successfully!');
        
        // Reset form in create mode
        if (!isEditMode) {
          setFormData({
            name: '',
            description: '',
            status: 'planned',
            start_date: '',
            end_date: ''
          });
        }
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/releases');
      }, 1500);
    } catch (err) {
      setError('Failed to save release. Please try again.');
      console.error('Release form submit error:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading release data...</div>;
  }

  return (
    <div className="form-container">
      <h1 className="page-title">{isEditMode ? 'Edit Release' : 'Create Release'}</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
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
          
          <div className="form-group">
            <label htmlFor="status" className="form-label">Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">Start Date *</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-control"
                value={formData.start_date || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">End Date *</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-control"
                value={formData.end_date || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? 'Update Release' : 'Create Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReleaseForm;
