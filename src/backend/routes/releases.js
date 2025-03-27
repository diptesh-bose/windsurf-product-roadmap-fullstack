const express = require('express');
const router = express.Router();
const { Release, Feature } = require('../database/models');

// Get all releases
router.get('/', (req, res) => {
  Release.getAll((err, releases) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(releases);
  });
});

// Get a single release by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  Release.getById(id, (err, release) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }
    res.json(release);
  });
});

// Get features for a specific release
router.get('/:id/features', (req, res) => {
  const releaseId = req.params.id;
  Feature.getByRelease(releaseId, (err, features) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(features);
  });
});

// Create a new release
router.post('/', (req, res) => {
  const { name, description, status, start_date, end_date } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }
  
  const newRelease = {
    name,
    description: description || '',
    status: status || 'planned',
    start_date,
    end_date
  };
  
  Release.create(newRelease, (err, release) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json(release);
  });
});

// Update a release
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, status, start_date, end_date } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }
  
  const updatedRelease = {
    name,
    description: description || '',
    status: status || 'planned',
    start_date,
    end_date
  };
  
  Release.update(id, updatedRelease, (err, release) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }
    res.json(release);
  });
});

// Delete a release
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  
  Release.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Release deleted successfully' });
  });
});

module.exports = router;
