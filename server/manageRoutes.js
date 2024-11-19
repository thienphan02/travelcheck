const express = require('express');
const db = require('./db');
const { verifyToken, upload, multerMiddleware } = require('./middlewares');
const router = express.Router();

// Fetch all reviews by the logged-in user
router.get('/manage/reviews', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = `
    SELECT reviews.*, 
           locations.name AS location_name, 
           locations.address AS location_address
    FROM reviews
    LEFT JOIN locations ON reviews.location_id = locations.id
    WHERE reviews.writer_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching reviews' });
    res.json(results);
  });
});

// Fetch all comments by the logged-in user with their associated review post
router.get('/manage/comments', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = `
    SELECT review_comments.*, 
           reviews.review_text AS review_post 
    FROM review_comments
    LEFT JOIN reviews ON review_comments.review_id = reviews.id
    WHERE review_comments.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching comments' });
    res.json(results);
  });
});

// Update a review
router.put('/reviews/:id', verifyToken, multerMiddleware.single('image'), async (req, res) => {
  const reviewId = req.params.id;
  const { review_text, rating, location_id, delete_image } = req.body;
  const imageUrl = req.file ? await upload(req.file) : null;

  if (!location_id) {
    return res.status(400).json({ message: 'Location ID is required.' });
  }

  let sql;
  const queryParams = [review_text, rating, location_id, reviewId, req.userId];

  if (delete_image === 'true') {
    sql = `
      UPDATE reviews 
      SET review_text = ?, rating = ?, location_id = ?, image_url = NULL 
      WHERE id = ? AND writer_id = ?
    `;
  } else if (imageUrl) {
    sql = `
      UPDATE reviews 
      SET review_text = ?, rating = ?, location_id = ?, image_url = ? 
      WHERE id = ? AND writer_id = ?
    `;
    queryParams.splice(3, 0, imageUrl); // Insert the new image URL into parameters.
  } else {
    sql = `
      UPDATE reviews 
      SET review_text = ?, rating = ?, location_id = ? 
      WHERE id = ? AND writer_id = ?
    `;
  }

  db.query(sql, queryParams, (err) => {
    if (err) return res.status(500).json({ message: 'Error updating review' });
    res.json({ message: 'Review updated successfully' });
  });
});

// Delete a review
router.delete('/reviews/:id', verifyToken, (req, res) => {
  const reviewId = req.params.id;
  db.query('DELETE FROM reviews WHERE id = ? AND writer_id = ?', [reviewId, req.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting review' });
    res.json({ message: 'Review deleted successfully' });
  });
});

// Update a comment
router.put('/comments/:id', verifyToken, (req, res) => {
  const commentId = req.params.id;
  const { comment } = req.body;
  db.query('UPDATE review_comments SET comment = ? WHERE id = ? AND user_id = ?', 
    [comment, commentId, req.userId], (err) => {
      if (err) return res.status(500).json({ message: 'Error updating comment' });
      res.json({ message: 'Comment updated successfully' });
    });
});

// Delete a comment
router.delete('/comments/:id', verifyToken, (req, res) => {
  const commentId = req.params.id;
  db.query('DELETE FROM review_comments WHERE id = ? AND user_id = ?', [commentId, req.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting comment' });
    res.json({ message: 'Comment deleted successfully' });
  });
});

// Fetch all blogs by the logged-in user
router.get('/manage/blogs', verifyToken, (req, res) => {
  const userId = req.userId;
  db.query('SELECT * FROM blog_posts WHERE author_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching blogs' });
    res.json(results);
  });
});

// Fetch all comments by the logged-in user for blogs, including blog titles
router.get('/manage/blog-comments', verifyToken, (req, res) => {
  const userId = req.userId;
  const query = `
    SELECT comments.id, comments.comment, comments.post_id, blog_posts.title AS blog_title 
    FROM comments 
    JOIN blog_posts ON comments.post_id = blog_posts.id 
    WHERE comments.user_id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching blog comments' });
    res.json(results);
  });
});

// Update a blog
router.put('/blogs/:id', verifyToken, multerMiddleware.single('image'), async (req, res) => {
  const blogId = req.params.id;
  const { content, title, delete_image } = req.body;
  const imageUrl = req.file ? await upload(req.file) : null;

  let sql;
  const queryParams = [content, title, blogId, req.userId];

  if (delete_image === 'true') {
    sql = `
      UPDATE blog_posts 
      SET content = ?, title = ?, image_url = NULL 
      WHERE id = ? AND author_id = ?
    `;
  } else if (imageUrl) {
    sql = `
      UPDATE blog_posts 
      SET content = ?, title = ?, image_url = ? 
      WHERE id = ? AND author_id = ?
    `;
    queryParams.splice(2, 0, imageUrl);
  } else {
    sql = `
      UPDATE blog_posts 
      SET content = ?, title = ? 
      WHERE id = ? AND author_id = ?
    `;
  }

  db.query(sql, queryParams, (err) => {
    if (err) return res.status(500).json({ message: 'Error updating blog' });
    res.json({ message: 'Blog updated successfully' });
  });
});

// Delete a blog
router.delete('/blogs/:id', verifyToken, (req, res) => {
  const blogID = req.params.id;
  db.query('DELETE FROM blog_posts WHERE id = ? AND author_id = ?', [blogID, req.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting blog' });
    res.json({ message: 'Blog deleted successfully' });
  });
});

// Update a blog comment
router.put('/blog-comments/:id', verifyToken, (req, res) => {
  const blogcommentId = req.params.id;
  const { comment } = req.body;
  db.query('UPDATE comments SET comment = ? WHERE id = ? AND user_id = ?',
    [comment, blogcommentId, req.userId], (err) => {
      if (err) return res.status(500).json({ message: 'Error updating blog comment' });
      res.json({ message: 'Blog comment updated successfully' });
    });
});

// Delete a blog comment
router.delete('/blog-comments/:id', verifyToken, (req, res) => {
  const blogcommentId = req.params.id;
  db.query('DELETE FROM comments WHERE id = ? AND user_id = ?', [blogcommentId, req.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting blog comment' });
    res.json({ message: 'Blog comment deleted successfully' });
  });
});

module.exports = router;
