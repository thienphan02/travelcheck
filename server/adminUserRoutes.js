const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const { verifyToken, isAdmin } = require('./middlewares');
const router = express.Router();

// Fetch all users (admin only)
router.get('/users', verifyToken, isAdmin, (req, res) => {
  const sql = 'SELECT id, username, email, user_type, created_at FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching users' });
    }
    res.json(results);
  });
});

// Create new user (admin only)
router.post('/users', verifyToken, isAdmin, async (req, res) => {
  const { username, password, email, userType } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking email' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const sql = 'INSERT INTO users (username, password, email, user_type) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, hashedPassword, email, userType], (err) => {
      if (err) return res.status(500).json({ message: 'Error creating user' });
      res.status(201).json({ message: 'User created successfully' });
    });
  });
});

// Edit user (admin only)
router.put('/users/:id', verifyToken, isAdmin, (req, res) => {
  const { username, email, userType } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const checkEmailSql = 'SELECT * FROM users WHERE email = ? AND id != ?';
  db.query(checkEmailSql, [email, req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking email' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

    const sql = 'UPDATE users SET username = ?, password = ?, email = ?, user_type = ? WHERE id = ?';
    db.query(sql, [username, email, userType, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: 'Error updating user' });
      res.status(200).json({ message: 'User updated successfully' });
    });
  });
});

// Delete user and their posts (admin only)
router.delete('/users/:id', verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;
  const deleteReviews = 'DELETE FROM reviews WHERE writer_id = ?';
  const deleteBlogs = 'DELETE FROM blog_posts WHERE author_id = ?';
  const deleteUser = 'DELETE FROM users WHERE id = ?';

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error' });

    db.query(deleteReviews, [userId], (err) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ message: 'Error deleting user reviews' });
        });
      }

      db.query(deleteBlogs, [userId], (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Error deleting user blog posts' });
          });
        }

        db.query(deleteUser, [userId], (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ message: 'Error deleting user' });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ message: 'Transaction commit failed' });
              });
            }
            res.status(200).json({ message: 'User and their posts deleted successfully' });
          });
        });
      });
    });
  });
});

module.exports = router;
