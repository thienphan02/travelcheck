const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
dotenv.config();

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const bcrypt = require('bcrypt');


// const password = 'admin1';
// const saltRounds = 10;

// bcrypt.hash(password, saltRounds, (err, hash) => {
//   if (err) {
//     console.error('Error hashing password:', err);
//   } else {
//     console.log('Hashed password:', hash);
//   }
// });

const jwt = require('jsonwebtoken');

// JWT Secret Key - node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
const JWT_SECRET = process.env.JWT_SECRET;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: process.env.DB_PASSWORD,
  database: 'travel_reviews'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

  // JWT Token Verification Middleware
  const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.status(403).json({ message: 'No token provided' });
  
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(500).json({ message: 'Failed to authenticate token' });
      }
  
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      // Set user info from the decoded token
      req.userId = decoded.id;
      req.userType = decoded.userType;
      next();
    });
  };
  
  // Middleware to check if user is a 'member'
  const isMember = (req, res, next) => {
    if (req.userType === 'member' || req.userType === 'admin') {
      next(); // Proceed if user is a member
    } else {
      res.status(403).json({ message: 'Access denied. Only members can post reviews.' });
    }
  };
  

  // Middleware to check if user is an 'admin'
const isAdmin = (req, res, next) => {
  if (req.userType === 'admin') {
    next(); // Proceed if user is an admin
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const uploadsDir = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use the uploadsDir defined above
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit image size to 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Example endpoint to get reviews filtered by location
app.get('/reviews', (req, res) => {
  const { location } = req.query;
  
  let sql = 'SELECT reviews.*, users.username FROM reviews LEFT JOIN users ON reviews.writer_id = users.id';
  const params = [];

  if (location) {
    sql += ' WHERE location = ?';
    params.push(location);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ message: 'Error fetching reviews' });
    }
    res.json(results);
  });
});

// Post a review
app.post('/reviews', verifyToken, isMember, upload.single('image'), (req, res) => {
  const { rating, review_text, location, type } = req.body;
  const writerId = req.userId;
  const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  // Check if the user is authenticated
  if (!writerId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Validate required fields
  if (!location || !type || !review_text) {
    return res.status(400).json({ message: 'Location, type, and review text are required' });
  }

  // SQL statement for inserting review
  const sql = 'INSERT INTO reviews (rating, review_text, writer_id, location, type, image_url) VALUES (?, ?, ?, ?, ?, ?)';

  // Execute the SQL query
  db.query(sql, [rating, review_text, writerId, location, type, imageUrl], (err, result) => {
    if (err) {
      console.error('Error inserting review:', err);
      return res.status(500).json({ message: 'Error submitting review' });
    }
    
    // Respond with the newly created review details
    res.json({
      id: result.insertId,
      rating,
      review_text,
      location,
      type,
      image_url: imageUrl,
      writer_id: writerId,
    });
  });
});

// Like a review
app.post('/reviews/:id/like', verifyToken, isMember, (req, res) => {
  const reviewId = req.params.id;
  const userId = req.userId;

  // Check if the user has already liked or disliked this review
  const checkSql = 'SELECT liked FROM review_likes_dislikes WHERE review_id = ? AND user_id = ?';
  db.query(checkSql, [reviewId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error checking like status' });

    if (result.length > 0) {
      if (result[0].liked === true) {
        // User already liked the review, remove like
        const deleteSql = 'DELETE FROM review_likes_dislikes WHERE review_id = ? AND user_id = ?';
        db.query(deleteSql, [reviewId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error removing like' });
          return res.json({ message: 'Like removed' });
        });
      } else {
        // User had disliked, change to like
        const updateSql = 'UPDATE review_likes_dislikes SET liked = true WHERE review_id = ? AND user_id = ?';
        db.query(updateSql, [reviewId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error updating like' });
          return res.json({ message: 'Review liked' });
        });
      }
    } else {
      // Add a new like
      const insertSql = 'INSERT INTO review_likes_dislikes (review_id, user_id, liked) VALUES (?, ?, true)';
      db.query(insertSql, [reviewId, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Error liking review' });
        return res.json({ message: 'Review liked' });
      });
    }
  });
});

// Dislike a review
app.post('/reviews/:id/dislike', verifyToken, isMember, (req, res) => {
  const reviewId = req.params.id;
  const userId = req.userId;

  // Check if the user has already liked or disliked this review
  const checkSql = 'SELECT liked FROM review_likes_dislikes WHERE review_id = ? AND user_id = ?';
  db.query(checkSql, [reviewId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error checking dislike status' });

    if (result.length > 0) {
      if (result[0].liked === false) {
        // User already disliked the review, remove dislike
        const deleteSql = 'DELETE FROM review_likes_dislikes WHERE review_id = ? AND user_id = ?';
        db.query(deleteSql, [reviewId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error removing dislike' });
          return res.json({ message: 'Dislike removed' });
        });
      } else {
        // User had liked, change to dislike
        const updateSql = 'UPDATE review_likes_dislikes SET liked = false WHERE review_id = ? AND user_id = ?';
        db.query(updateSql, [reviewId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error updating dislike' });
          return res.json({ message: 'Review disliked' });
        });
      }
    } else {
      // Add a new dislike
      const insertSql = 'INSERT INTO review_likes_dislikes (review_id, user_id, liked) VALUES (?, ?, false)';
      db.query(insertSql, [reviewId, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Error disliking review' });
        return res.json({ message: 'Review disliked' });
      });
    }
  });
});

// Fetch comments for a specific review
app.get('/reviews/:id/comments', (req, res) => {
  const reviewId = req.params.id;

  const sqlFetchComments = `
    SELECT review_comments.comment, users.username
    FROM review_comments 
    LEFT JOIN users ON review_comments.user_id = users.id
    WHERE review_comments.review_id = ?
  `;
  db.query(sqlFetchComments, [reviewId], (err, comments) => {
    if (err) return res.status(500).json({ message: 'Error fetching comments' });

    res.json(comments); // Return the list of comments
  });
});

// Post a comment on a review
app.post('/reviews/:id/comments', verifyToken, (req, res) => {
  const reviewId = req.params.id;
  const comment = req.body.comment;
  const userId = req.userId;

  // Check if the user is authenticated
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Validate the comment
  if (!comment) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  // SQL statement for inserting comment
  const sql = 'INSERT INTO review_comments (review_id, user_id, comment) VALUES (?, ?, ?)';
  db.query(sql, [reviewId, userId, comment], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting comment' });

    res.status(201).json({ message: 'Comment submitted successfully' }); // Respond with success message
  });
});

app.get('/blogs', (req, res) => {
  const sql = `
    SELECT blog_posts.*, users.username 
    FROM blog_posts 
    LEFT JOIN users ON blog_posts.author_id = users.id
  `;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/blogs', verifyToken, isMember, upload.single('image'), (req, res) => {
  console.log('Received a POST request for /blogs', req.file.filename); // Debug log
  
  const { title, content, location, location_type } = req.body;
    const authorId = req.userId;
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;



  // Check if the user is authenticated
  if (!authorId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Validate required fields
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  if (!location) {
    return res.status(400).json({ message: 'Location is required' });
  }

  if (!location_type) { // Check for location type
    return res.status(400).json({ message: 'Location type is required' });
  }

  // SQL statement for inserting blog post
  const sql = 'INSERT INTO blog_posts (title, content, author_id, location, location_type, image_url) VALUES (?, ?, ?, ?, ?, ?)';

  // Execute the SQL query
  db.query(sql, [title, content, authorId, location, location_type, imageUrl], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting blog post' });

    // Respond with the newly created blog post details
    res.json({
      id: result.insertId,
      title,
      content,
      location,
      location_type,
      author_id: authorId,
      image_url: imageUrl
    });
  });
});

app.post('/blogs/:id/like', verifyToken, isMember, (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;

  // Check if the user has already liked or disliked this post
  const checkSql = 'SELECT liked FROM likes_dislikes WHERE post_id = ? AND user_id = ?';
  db.query(checkSql, [postId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error checking like status' });

    if (result.length > 0) {
      if (result[0].liked === true) {
        // User already liked the post, remove like
        const deleteSql = 'DELETE FROM likes_dislikes WHERE post_id = ? AND user_id = ?';
        db.query(deleteSql, [postId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error removing like' });
          return res.json({ message: 'Like removed' });
        });
      } else {
        // User had disliked, change to like
        const updateSql = 'UPDATE likes_dislikes SET liked = true WHERE post_id = ? AND user_id = ?';
        db.query(updateSql, [postId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error updating like' });
          return res.json({ message: 'Post liked' });
        });
      }
    } else {
      // Add a new like
      const insertSql = 'INSERT INTO likes_dislikes (post_id, user_id, liked) VALUES (?, ?, true)';
      db.query(insertSql, [postId, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Error liking post' });
        return res.json({ message: 'Post liked' });
      });
    }
  });
});

app.post('/blogs/:id/dislike', verifyToken, isMember, (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;

  // Check if the user has already liked or disliked this post
  const checkSql = 'SELECT liked FROM likes_dislikes WHERE post_id = ? AND user_id = ?';
  db.query(checkSql, [postId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error checking dislike status' });

    if (result.length > 0) {
      if (result[0].liked === false) {
        // User already disliked the post, remove dislike
        const deleteSql = 'DELETE FROM likes_dislikes WHERE post_id = ? AND user_id = ?';
        db.query(deleteSql, [postId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error removing dislike' });
          return res.json({ message: 'Dislike removed' });
        });
      } else {
        // User had liked, change to dislike
        const updateSql = 'UPDATE likes_dislikes SET liked = false WHERE post_id = ? AND user_id = ?';
        db.query(updateSql, [postId, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Error updating dislike' });
          return res.json({ message: 'Post disliked' });
        });
      }
    } else {
      // Add a new dislike
      const insertSql = 'INSERT INTO likes_dislikes (post_id, user_id, liked) VALUES (?, ?, false)';
      db.query(insertSql, [postId, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Error disliking post' });
        return res.json({ message: 'Post disliked' });
      });
    }
  });
});

// Fetch comments for a specific blog post
app.get('/blogs/:id/comments', (req, res) => {
  const postId = req.params.id;

  const sqlFetchComments = `
    SELECT comments.comment, users.username
    FROM comments 
    LEFT JOIN users ON comments.user_id = users.id
    WHERE comments.post_id = ?
  `;
  db.query(sqlFetchComments, [postId], (err, comments) => {
    if (err) return res.status(500).json({ message: 'Error fetching comments' });

    res.json(comments); // Return the list of comments
  });
});


app.post('/blogs/:id/comments', verifyToken, (req, res) => {
  const postId = req.params.id;
  const comment = req.body.comment;
  const userId = req.userId;

  // Check if the user is authenticated
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Validate the comment
  if (!comment) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  // SQL statement for inserting comment
  const sql = 'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)';
  db.query(sql, [postId, userId, comment], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error submitting comment' });

    res.status(201).json({ message: 'Comment submitted successfully' }); // Respond with success message
  });
});



  // Updated Sign-up Endpoint
  app.post('/signup', async (req, res) => {
    const { username, password, email, userType = 'member' } = req.body; // Default to 'member'
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Restrict 'admin' role creation
    if (userType === 'admin') {
      return res.status(403).json({ message: 'Cannot create admin accounts via signup' });
    }
  
    // Check if email already exists
    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailSql, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking email' });
      }
      if (results.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
  
      // Proceed with creating the user
      const sql = 'INSERT INTO users (username, password, email, user_type) VALUES (?, ?, ?, ?)';
      db.query(sql, [username, hashedPassword, email, userType], (err, result) => {
        if (err) {
          res.status(500).json({ message: 'Error creating user' });
        } else {
          res.status(201).json({ message: 'User created successfully' });
        }
      });
    });
  });

  
// Updated Login with JWT
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Generate JWT Token
        const token = jwt.sign({ id: user.id, userType: user.user_type }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});


// Assuming you have a middleware to verify tokens
app.get('/users/me', verifyToken, (req, res) => {
  // Access the user ID from the token
  const userId = req.user.id; // Make sure your verifyToken middleware sets req.user
  
  // SQL query to fetch user details
  const sql = 'SELECT id, username, email FROM users WHERE id = ?';
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user info' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the first result (the user's information)
    res.json(results[0]);
  });
});


// Edit user info (logged-in user only)
app.put('/users/me', verifyToken, (req, res) => {
  const userId = req.user.id; // Get the user ID from the token
  const { username, email, userType } = req.body; // Get user details from the request body

  // Prepare the SQL query to update the user details
  const sql = 'UPDATE users SET username = ?, password = ?, email = ?, user_type = ? WHERE id = ?';

  // Execute the SQL query with the provided details and the authenticated user's ID
  db.query(sql, [username, email, userType, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error updating user' }); // Handle SQL error
    }
    res.status(200).json({ message: 'User updated successfully' }); // Respond with success message
  });
});

// This route will be accessible only by admin
app.get('/users', verifyToken, (req, res) => {
  const sql = 'SELECT id, username, email, user_type, created_at FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching users' });
    }
    res.json(results);
  });
});

// Create new user (admin only)
app.post('/users', verifyToken, async (req, res) => {
  const { username, password, email, userType } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = 'INSERT INTO users (username, password, email, user_type) VALUES (?, ?, ?, ?)';
  db.query(sql, [username, hashedPassword, email, userType], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating user' });
    }
    res.status(201).json({ message: 'User created successfully' });
  });
});

// Edit user (admin only)
app.put('/users/:id', verifyToken, (req, res) => {
  const { username, email, userType } = req.body;
  const sql = 'UPDATE users SET username = ?, password = ?, email = ?, user_type = ? WHERE id = ?';
  db.query(sql, [username, email, userType, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error updating user' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  });
});

// Delete user (admin only)
app.delete('/users/:id', verifyToken, (req, res) => {
  const userId = req.params.id;

  const deleteReviews = 'DELETE FROM reviews WHERE writer_id = ?';
  const deleteBlogs = 'DELETE FROM blog_posts WHERE author_id = ?';
  const deleteUser = 'DELETE FROM users WHERE id = ?';

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Transaction error' });

    // Delete reviews
    db.query(deleteReviews, [userId], (err) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ message: 'Error deleting user reviews' });
        });
      }

      // Delete blog posts
      db.query(deleteBlogs, [userId], (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Error deleting user blog posts' });
          });
        }

        // Finally, delete the user
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



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
