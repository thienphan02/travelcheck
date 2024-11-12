const express = require('express');
const db = require('./db');
const router = express.Router();

// Fetch reviews for a specific location by name
router.get('/map/reviews', (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: 'Location name is required' });
  }

  const sql = `
    SELECT reviews.*, users.username 
    FROM reviews
    JOIN locations ON reviews.location_id = locations.id
    JOIN users ON reviews.writer_id = users.id
    WHERE locations.name = ?
  `;

  db.query(sql, [name], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ message: 'Error fetching reviews' });
    }
    res.json(results);
  });
});

module.exports = router;
