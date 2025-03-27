const express = require('express');
const router = express.Router();
const { Feature } = require('../database/models');

// Get all features
router.get('/', (req, res) => {
  Feature.getAll((err, features) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(features);
  });
});

// Get features by release ID
router.get('/release/:releaseId', (req, res) => {
  const releaseId = req.params.releaseId;
  Feature.getByRelease(releaseId, (err, features) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(features);
  });
});

// Get features by status
router.get('/status/:status', (req, res) => {
  const status = req.params.status;
  Feature.getByStatus(status, (err, features) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(features);
  });
});

// Get a single feature by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  Feature.getById(id, (err, feature) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    res.json(feature);
  });
});

// Create a new feature
router.post('/', (req, res) => {
  const { title, description, status, priority, start_date, end_date, release_id } = req.body;
  
  // Validate required fields
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const newFeature = {
    title,
    description: description || '',
    status: status || 'backlog',
    priority: priority || 'medium',
    start_date,
    end_date,
    release_id: release_id || null
  };
  
  Feature.create(newFeature, (err, feature) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json(feature);
  });
});

// Update a feature
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { title, description, status, priority, start_date, end_date, release_id } = req.body;
  
  // Validate required fields
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const updatedFeature = {
    title,
    description: description || '',
    status: status || 'backlog',
    priority: priority || 'medium',
    start_date,
    end_date,
    release_id: release_id || null
  };
  
  Feature.update(id, updatedFeature, (err, feature) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    res.json(feature);
  });
});

// Update feature status (for drag and drop)
router.patch('/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  Feature.updateStatus(id, status, (err, feature) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    res.json(feature);
  });
});

// Delete a feature
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  
  Feature.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Feature deleted successfully' });
  });
});

module.exports = router;
