const express = require('express');
const router = express.Router();
const { Board } = require('../database/models');

// Get all boards
router.get('/', (req, res) => {
  Board.getAll((err, boards) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Parse columns JSON for each board
    const parsedBoards = boards.map(board => ({
      ...board,
      columns: JSON.parse(board.columns)
    }));
    
    res.json(parsedBoards);
  });
});

// Get a single board by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  Board.getById(id, (err, board) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Parse columns JSON
    board.columns = JSON.parse(board.columns);
    
    res.json(board);
  });
});

// Create a new board
router.post('/', (req, res) => {
  const { name, description, columns } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  if (!columns || !Array.isArray(columns)) {
    return res.status(400).json({ error: 'Columns must be an array' });
  }
  
  const newBoard = {
    name,
    description: description || '',
    columns
  };
  
  Board.create(newBoard, (err, board) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json(board);
  });
});

// Update a board
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, columns } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  if (!columns || !Array.isArray(columns)) {
    return res.status(400).json({ error: 'Columns must be an array' });
  }
  
  const updatedBoard = {
    name,
    description: description || '',
    columns
  };
  
  Board.update(id, updatedBoard, (err, board) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(board);
  });
});

// Delete a board
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  
  Board.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Board deleted successfully' });
  });
});

module.exports = router;
