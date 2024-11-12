const express = require('express');
const db = require('./db');
const { verifyToken, isMember, upload } = require('./middlewares');
const router = express.Router();

// Add a new location
router.post('/locations', (req, res) => {
  const { name, address } = req.body;
  const findLocationSQL = 'SELECT * FROM locations WHERE name = ? AND address = ?';

  db.query(findLocationSQL, [name, address], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching location' });

    if (results.length > 0) {
      // Location already exists
      return res.json(results[0]);
    } else {
      // Create new location
      const insertLocationSQL = 'INSERT INTO locations (name, address) VALUES (?, ?)';
      db.query(insertLocationSQL, [name, address], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error creating location' });
        res.json({ id: result.insertId, name, address });
      });
    }
  });
});

// Fetch reviews with average ratings for a location
router.get('/reviews', verifyToken, (req, res) => {
  const { location_id } = req.query;
  const userId = req.userId || null;

  const avgRatingQuery = `
    SELECT AVG(rating) AS average_rating
    FROM reviews
    WHERE location_id = ?
  `;
  db.query(avgRatingQuery, [location_id], (err, avgRatingResult) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch average rating' });

    const averageRating = avgRatingResult[0]?.average_rating || null;
    const reviewsQuery = `
      SELECT reviews.*, 
             users.username, 
             locations.name AS location_name, 
             locations.address AS location_address,
             IFNULL(SUM(review_likes_dislikes.liked), 0) AS like_count,
             MAX(CASE WHEN review_likes_dislikes.user_id = ? AND review_likes_dislikes.liked = true THEN 1 ELSE 0 END) AS user_liked
      FROM reviews
      LEFT JOIN users ON reviews.writer_id = users.id
      LEFT JOIN locations ON reviews.location_id = locations.id
      LEFT JOIN review_likes_dislikes 
        ON reviews.id = review_likes_dislikes.review_id
      WHERE reviews.location_id = ?
      GROUP BY reviews.id, users.username, locations.name, locations.address
      ORDER BY like_count DESC
    `;

    db.query(reviewsQuery, [userId, location_id], (err, reviewResults) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });

      res.json({
        average_rating: averageRating,
        reviews: reviewResults || []
      });
    });
  });
});

// Submit a new review
router.post('/reviews', verifyToken, isMember, upload.single('image'), (req, res) => {
  const { rating, review_text, location_id } = req.body;
  const writerId = req.userId;
  const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  if (!location_id || !review_text) {
    return res.status(400).json({ message: 'Location ID and review text are required' });
  }

  const sql = 'INSERT INTO reviews (rating, review_text, writer_id, location_id, image_url) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [rating, review_text, writerId, location_id, imageUrl], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting review' });

    res.json({
      id: result.insertId,
      rating,
      review_text,
      location_id,
      image_url: imageUrl,
      writer_id: writerId,
    });
  });
});

// Like a review (toggle like)
router.post('/reviews/:id/like', verifyToken, (req, res) => {
  const reviewId = req.params.id;
  const userId = req.userId;

  const sql = `
    INSERT INTO review_likes_dislikes (review_id, user_id, liked)
    VALUES (?, ?, true)
    ON DUPLICATE KEY UPDATE liked = NOT liked;
  `;

  db.query(sql, [reviewId, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error updating like status' });

    const getLikesQuery = `
      SELECT COUNT(*) AS likes_count
      FROM review_likes_dislikes
      WHERE review_id = ? AND liked = true;
    `;
    db.query(getLikesQuery, [reviewId], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error fetching likes' });

      res.json({ likes_count: result[0].likes_count });
    });
  });
});

// Fetch paginated comments for a specific review
router.get('/reviews/:id/comments', (req, res) => {
  const reviewId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sqlFetchComments = `
    SELECT review_comments.id, review_comments.comment, users.username
    FROM review_comments
    LEFT JOIN users ON review_comments.user_id = users.id
    WHERE review_comments.review_id = ?
    ORDER BY review_comments.created_at DESC
    LIMIT ? OFFSET ?;
  `;

  db.query(sqlFetchComments, [reviewId, limit, offset], (err, comments) => {
    if (err) return res.status(500).json({ message: 'Error fetching comments' });

    res.json(comments);
  });
});

// Post a new comment on a review
router.post('/reviews/:id/comments', verifyToken, (req, res) => {
  const reviewId = req.params.id;
  const { comment } = req.body;
  const userId = req.userId;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  const sql = 'INSERT INTO review_comments (review_id, user_id, comment) VALUES (?, ?, ?)';
  db.query(sql, [reviewId, userId, comment], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting comment' });

    const getUsernameSQL = 'SELECT username FROM users WHERE id = ?';
    db.query(getUsernameSQL, [userId], (error, userResult) => {
      if (error || !userResult.length) return res.status(500).json({ message: 'Error fetching username' });

      const newComment = {
        id: result.insertId,
        username: userResult[0].username,
        comment,
      };
      res.status(201).json(newComment);
    });
  });
});

module.exports = router;
