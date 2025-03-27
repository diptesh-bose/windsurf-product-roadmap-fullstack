const db = require('./setup');

// Create feature_dependencies table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS feature_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  depends_on_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_id) REFERENCES features(id) ON DELETE CASCADE
)`);

// Feature model
const Feature = {
  // Get all features with their dependencies
  getAll: (callback) => {
    const sql = `
      SELECT 
        f.*,
        GROUP_CONCAT(fd.depends_on_id) as dependencies
      FROM features f
      LEFT JOIN feature_dependencies fd ON f.id = fd.feature_id
      GROUP BY f.id
      ORDER BY f.start_date ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        callback(err, null);
        return;
      }
      // Convert dependencies string to array
      const features = rows.map(row => ({
        ...row,
        dependencies: row.dependencies ? row.dependencies.split(',').map(Number) : []
      }));
      callback(null, features);
    });
  },

  // Get features by release ID with dependencies
  getByRelease: (releaseId, callback) => {
    const sql = `
      SELECT 
        f.*,
        GROUP_CONCAT(fd.depends_on_id) as dependencies
      FROM features f
      LEFT JOIN feature_dependencies fd ON f.id = fd.feature_id
      WHERE f.release_id = ?
      GROUP BY f.id
      ORDER BY f.start_date ASC
    `;
    db.all(sql, [releaseId], (err, rows) => {
      if (err) {
        callback(err, null);
        return;
      }
      const features = rows.map(row => ({
        ...row,
        dependencies: row.dependencies ? row.dependencies.split(',').map(Number) : []
      }));
      callback(null, features);
    });
  },

  // Get features by status with dependencies
  getByStatus: (status, callback) => {
    const sql = `
      SELECT 
        f.*,
        GROUP_CONCAT(fd.depends_on_id) as dependencies
      FROM features f
      LEFT JOIN feature_dependencies fd ON f.id = fd.feature_id
      WHERE f.status = ?
      GROUP BY f.id
      ORDER BY f.start_date ASC
    `;
    db.all(sql, [status], (err, rows) => {
      if (err) {
        callback(err, null);
        return;
      }
      const features = rows.map(row => ({
        ...row,
        dependencies: row.dependencies ? row.dependencies.split(',').map(Number) : []
      }));
      callback(null, features);
    });
  },

  // Get a single feature by ID with dependencies
  getById: (id, callback) => {
    const sql = `
      SELECT 
        f.*,
        GROUP_CONCAT(fd.depends_on_id) as dependencies
      FROM features f
      LEFT JOIN feature_dependencies fd ON f.id = fd.feature_id
      WHERE f.id = ?
      GROUP BY f.id
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        callback(err, null);
        return;
      }
      if (row) {
        row.dependencies = row.dependencies ? row.dependencies.split(',').map(Number) : [];
      }
      callback(null, row);
    });
  },

  // Create a new feature with dependencies
  create: (feature, callback) => {
    const { title, description, status, priority, start_date, end_date, release_id, dependencies } = feature;
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const sql = `INSERT INTO features (title, description, status, priority, start_date, end_date, release_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [title, description, status, priority, start_date, end_date, release_id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          callback(err, null);
          return;
        }

        const featureId = this.lastID;

        // Add dependencies if any
        if (dependencies && dependencies.length > 0) {
          const depSql = `INSERT INTO feature_dependencies (feature_id, depends_on_id) VALUES (?, ?)`;
          const stmt = db.prepare(depSql);
          
          for (const depId of dependencies) {
            stmt.run([featureId, depId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                callback(err, null);
                return;
              }
            });
          }
          stmt.finalize();
        }

        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            callback(err, null);
            return;
          }
          callback(null, { id: featureId, ...feature });
        });
      });
    });
  },

  // Update a feature with dependencies
  update: (id, feature, callback) => {
    const { title, description, status, priority, start_date, end_date, release_id, dependencies } = feature;
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const sql = `UPDATE features 
                  SET title = ?, description = ?, status = ?, priority = ?, 
                      start_date = ?, end_date = ?, release_id = ?, updated_at = CURRENT_TIMESTAMP 
                  WHERE id = ?`;
      
      db.run(sql, [title, description, status, priority, start_date, end_date, release_id, id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          callback(err, null);
          return;
        }

        // Update dependencies
        if (dependencies) {
          // Remove existing dependencies
          db.run(`DELETE FROM feature_dependencies WHERE feature_id = ?`, [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              callback(err, null);
              return;
            }

            // Add new dependencies
            if (dependencies.length > 0) {
              const depSql = `INSERT INTO feature_dependencies (feature_id, depends_on_id) VALUES (?, ?)`;
              const stmt = db.prepare(depSql);
              
              for (const depId of dependencies) {
                stmt.run([id, depId], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    callback(err, null);
                    return;
                  }
                });
              }
              stmt.finalize();
            }
          });
        }

        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            callback(err, null);
            return;
          }
          callback(null, { id, ...feature });
        });
      });
    });
  },

  // Update feature status
  updateStatus: (id, status, callback) => {
    const sql = `UPDATE features SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [status, id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id, status });
    });
  },

  // Delete a feature
  delete: (id, callback) => {
    const sql = `DELETE FROM features WHERE id = ?`;
    db.run(sql, [id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id });
    });
  }
};

// Release model
const Release = {
  // Get all releases
  getAll: (callback) => {
    const sql = `SELECT * FROM releases ORDER BY start_date ASC`;
    db.all(sql, [], callback);
  },

  // Get a single release by ID
  getById: (id, callback) => {
    const sql = `SELECT * FROM releases WHERE id = ?`;
    db.get(sql, [id], callback);
  },

  // Create a new release
  create: (release, callback) => {
    const { name, description, status, start_date, end_date } = release;
    const sql = `INSERT INTO releases (name, description, status, start_date, end_date) 
                VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [name, description, status, start_date, end_date], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id: this.lastID, ...release });
    });
  },

  // Update a release
  update: (id, release, callback) => {
    const { name, description, status, start_date, end_date } = release;
    const sql = `UPDATE releases 
                SET name = ?, description = ?, status = ?, 
                    start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
    db.run(sql, [name, description, status, start_date, end_date, id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id, ...release });
    });
  },

  // Delete a release
  delete: (id, callback) => {
    const sql = `DELETE FROM releases WHERE id = ?`;
    db.run(sql, [id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id });
    });
  }
};

// Board model
const Board = {
  // Get all boards
  getAll: (callback) => {
    const sql = `SELECT * FROM boards`;
    db.all(sql, [], callback);
  },

  // Get a single board by ID
  getById: (id, callback) => {
    const sql = `SELECT * FROM boards WHERE id = ?`;
    db.get(sql, [id], callback);
  },

  // Create a new board
  create: (board, callback) => {
    const { name, description, columns } = board;
    const columnsJson = JSON.stringify(columns);
    const sql = `INSERT INTO boards (name, description, columns) VALUES (?, ?, ?)`;
    db.run(sql, [name, description, columnsJson], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id: this.lastID, ...board });
    });
  },

  // Update a board
  update: (id, board, callback) => {
    const { name, description, columns } = board;
    const columnsJson = JSON.stringify(columns);
    const sql = `UPDATE boards SET name = ?, description = ?, columns = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [name, description, columnsJson, id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id, ...board });
    });
  },

  // Delete a board
  delete: (id, callback) => {
    const sql = `DELETE FROM boards WHERE id = ?`;
    db.run(sql, [id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, { id });
    });
  }
};

module.exports = {
  Feature,
  Release,
  Board
};
