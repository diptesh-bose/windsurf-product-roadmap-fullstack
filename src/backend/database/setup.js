const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a database connection
const dbPath = path.join(__dirname, 'roadmap.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = () => {
  // Features table
  db.run(`CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'backlog',
    priority TEXT DEFAULT 'medium',
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    release_id INTEGER,
    FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE SET NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating features table:', err.message);
    } else {
      console.log('Features table created or already exists.');
    }
  });

  // Releases table
  db.run(`CREATE TABLE IF NOT EXISTS releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planned',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating releases table:', err.message);
    } else {
      console.log('Releases table created or already exists.');
    }
  });

  // Boards table (for Kanban view configuration)
  db.run(`CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    columns TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating boards table:', err.message);
    } else {
      console.log('Boards table created or already exists.');
      
      // Insert default board if none exists
      db.get('SELECT COUNT(*) as count FROM boards', (err, row) => {
        if (err) {
          console.error('Error checking boards count:', err.message);
          return;
        }
        
        if (row.count === 0) {
          const defaultColumns = JSON.stringify([
            { id: 'backlog', name: 'Backlog', order: 0 },
            { id: 'todo', name: 'To Do', order: 1 },
            { id: 'in-progress', name: 'In Progress', order: 2 },
            { id: 'review', name: 'Review', order: 3 },
            { id: 'done', name: 'Done', order: 4 }
          ]);
          
          db.run(`INSERT INTO boards (name, description, columns) 
                  VALUES ('Default Board', 'Default Kanban board', ?)`, 
                  [defaultColumns], (err) => {
            if (err) {
              console.error('Error inserting default board:', err.message);
            } else {
              console.log('Default board created.');
            }
          });
        }
      });
    }
  });
};

// Initialize database
createTables();

// Export database connection
module.exports = db;
