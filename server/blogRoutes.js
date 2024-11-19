const express = require('express');
const db = require('./db');
const { verifyToken, isMember, upload, multerMiddleware } = require('./middlewares');
const router = express.Router();

// Fetch all blogs with like counts
router.get('/blogs', (req, res) => {
  const sql = `
    SELECT blog_posts.*, users.username, 
           COALESCE(likes_data.likes_count, 0) AS likes_count
    FROM blog_posts
    LEFT JOIN users ON blog_posts.author_id = users.id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS likes_count
      FROM likes_dislikes
      WHERE liked = true
      GROUP BY post_id
    ) AS likes_data ON blog_posts.id = likes_data.post_id
    ORDER BY likes_count DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching blogs' });
    res.json(results);
  });
});

// Create a new blog post
router.post('/blogs', verifyToken, isMember, multerMiddleware.single('image'), async (req, res) => {
  const { title, content } = req.body;
  const authorId = req.userId;
  const imageUrl = req.file ? await upload(req.file) : null;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const sql = 'INSERT INTO blog_posts (title, content, author_id, image_url) VALUES (?, ?, ?, ?)';
  db.query(sql, [title, content, authorId, imageUrl], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting blog post' });

    res.json({
      id: result.insertId,
      title,
      content,
      author_id: authorId,
      image_url: imageUrl
    });
  });
});

// Toggle like on a blog post
router.post('/blogs/:id/like', verifyToken, isMember, (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;

  const sql = `
    INSERT INTO likes_dislikes (post_id, user_id, liked)
    VALUES (?, ?, true)
    ON DUPLICATE KEY UPDATE liked = NOT liked;
  `;

  db.query(sql, [postId, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error updating like status' });

    const getLikesQuery = `
      SELECT COUNT(*) AS likes_count
      FROM likes_dislikes
      WHERE post_id = ? AND liked = true;
    `;

    db.query(getLikesQuery, [postId], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error fetching likes' });
      res.json({ likes_count: result[0].likes_count });
    });
  });
});

// Fetch comments for a specific blog post with pagination
router.get('/blogs/:id/comments', (req, res) => {
  const postId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sqlFetchComments = `
    SELECT comments.comment, users.username
    FROM comments
    LEFT JOIN users ON comments.user_id = users.id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at DESC
    LIMIT ? OFFSET ?;
  `;

  db.query(sqlFetchComments, [postId, limit, offset], (err, comments) => {
    if (err) return res.status(500).json({ message: 'Error fetching comments' });
    res.json(comments);
  });
});

// Submit a comment on a blog post
router.post('/blogs/:id/comments', verifyToken, (req, res) => {
  const postId = req.params.id;
  const comment = req.body.comment;
  const userId = req.userId;

  if (!comment) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  const sql = 'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)';
  db.query(sql, [postId, userId, comment], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting comment' });

    res.status(201).json({ message: 'Comment submitted successfully' });
  });
});

// Fetch total likes for a specific blog post
router.get('/blogs/:id/likes', (req, res) => {
  const postId = req.params.id;

  const sqlFetchLikes = `
    SELECT COUNT(*) AS like_count
    FROM likes_dislikes
    WHERE post_id = ? AND liked = true
  `;
  db.query(sqlFetchLikes, [postId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error fetching likes count' });
    res.json(result[0]);
  });
});

module.exports = router;
