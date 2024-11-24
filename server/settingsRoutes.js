const express = require('express');
const db = require('./db');
const { verifyToken } = require('./middlewares');
const router = express.Router();
const bcrypt = require('bcrypt');

// Fetch user info (logged-in user only)
router.get('/users/me', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = 'SELECT id, username, email FROM users WHERE id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user info' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]);
  });
});

// Edit user info (logged-in user only)
router.put('/users/me', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { username, email, password, userType } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check if email is already in use by another user
  const checkEmailSql = 'SELECT * FROM users WHERE email = ? AND id != ?';
  db.query(checkEmailSql, [email, userId], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking email' });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashErr) {
        return res.status(500).json({ message: 'Error hashing password' });
      }
    }

    // Update user details
    const sql = 'UPDATE users SET username = ?, email = ?, user_type = ?' + (hashedPassword ? ', password = ?' : '') + ' WHERE id = ?';
    const params = hashedPassword
      ? [username, email, userType, hashedPassword, userId]
      : [username, email, userType, userId];

    db.query(sql, params, (updateErr, result) => {
      if (updateErr) {
        return res.status(500).json({ message: 'Error updating user' });
      }
      res.status(200).json({ message: 'User updated successfully' });
    });
  });
});

module.exports = router;
