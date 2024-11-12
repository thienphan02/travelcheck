const express = require('express');
const db = require('./db');
const { verifyToken } = require('./middlewares');
const router = express.Router();

// Add a favorite location
router.post('/favorites', verifyToken, (req, res) => {
  const userId = req.userId;
  const { name, address } = req.body;

  const findLocationSQL = 'SELECT id FROM locations WHERE name = ? AND address = ?';
  db.query(findLocationSQL, [name, address], (err, results) => {
    if (err) {
      console.error('Error finding location:', err);
      return res.status(500).json({ message: 'Error finding location' });
    }

    if (results.length > 0) {
      // Location exists, use its ID
      const locationId = results[0].id;
      addFavorite(userId, locationId, res);
    } else {
      // Location does not exist, insert it
      const insertLocationSQL = 'INSERT INTO locations (name, address) VALUES (?, ?)';
      db.query(insertLocationSQL, [name, address], (err, result) => {
        if (err) {
          console.error('Error inserting location:', err);
          return res.status(500).json({ message: 'Error inserting location' });
        }
        const locationId = result.insertId;
        addFavorite(userId, locationId, res);
      });
    }
  });
});

// Helper function to insert favorite
const addFavorite = (userId, locationId, res) => {
  const sql = 'INSERT INTO favorites (user_id, location_id) VALUES (?, ?)';
  db.query(sql, [userId, locationId], (err, result) => {
    if (err) {
      console.error('Error adding favorite:', err);
      return res.status(500).json({ message: 'Error adding favorite' });
    }
    res.status(201).json({ id: result.insertId, locationId });
  });
};

// Fetch all favorite locations for a user
router.get('/favorites', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = `
    SELECT f.id, l.name, l.address
    FROM favorites f
    JOIN locations l ON f.location_id = l.id
    WHERE f.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      return res.status(500).json({ message: 'Error fetching favorites' });
    }
    res.json(results);
  });
});

// Delete a favorite location
router.delete('/favorites/:id', verifyToken, (req, res) => {
  const userId = req.userId;
  const favoriteId = req.params.id;

  const sql = 'DELETE FROM favorites WHERE id = ? AND user_id = ?';
  db.query(sql, [favoriteId, userId], (err, result) => {
    if (err) {
      console.error('Error deleting favorite:', err);
      return res.status(500).json({ message: 'Error deleting favorite' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    res.status(204).send();
  });
});

module.exports = router;
