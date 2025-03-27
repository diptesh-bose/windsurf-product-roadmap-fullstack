const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const featuresRoutes = require('./routes/features');
const releasesRoutes = require('./routes/releases');
const boardsRoutes = require('./routes/boards');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// API Routes
app.use('/api/features', featuresRoutes);
app.use('/api/releases', releasesRoutes);
app.use('/api/boards', boardsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
