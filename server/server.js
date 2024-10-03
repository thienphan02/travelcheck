const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
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
        req.user = {
            id: decoded.id,
            userType: decoded.userType,
        };
        next();
    });
};



  
  // Middleware to check if user is a 'member'
  const isMember = (req, res, next) => {
    if (req.userType === 'member') {
      next(); // Proceed if user is a member
    } else {
      res.status(403).json({ message: 'Access denied' });
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

// Example endpoint to get reviews
app.get('/reviews', (req, res) => {
  const sql = 'SELECT * FROM reviews';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ message: 'Error fetching reviews' });
    }
    res.json(results);
  });
});

// Endpoint to post a review
app.post('/reviews', verifyToken, isMember, (req, res) => {
  const { rating, review_text, location, type } = req.body; // Changed type_id to type

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Validate required fields
  if (!location) {
    return res.status(400).json({ message: 'Location is required' });
  }

  if (!type) { // Check for type if it's a required field
    return res.status(400).json({ message: 'Type is required' });
  }

  // Log incoming review data for debugging
  console.log('Incoming review data:', { rating, review_text, location, type, userId: req.userId });

  // SQL statement adjusted to use type instead of type_id
  const sql = 'INSERT INTO reviews (rating, review_text, writer_id, location, type) VALUES (?, ?, ?, ?, ?)';

  // Execute the SQL query
  db.query(sql, [rating, review_text, req.userId, location, type], (err, result) => {
    if (err) {
      console.error('Error inserting review:', err);
      return res.status(500).json({ message: 'Error submitting review' });
    }
    
    // Respond with the newly created review details
    res.json({ id: result.insertId, rating, review_text, location, type });
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

app.post('/blogs', verifyToken, isMember, (req, res) => {
  console.log('Received a POST request for /blogs', req.body); // Debug log
  const { title, content, location, location_type } = req.body;
  const authorId = req.userId;

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

  // SQL statement for inserting blog post with location and location_type
  const sql = 'INSERT INTO blog_posts (title, content, author_id, location, location_type) VALUES (?, ?, ?, ?, ?)';

  // Execute the SQL query
  db.query(sql, [title, content, authorId, location, location_type], (err, result) => {
    if (err) {
      console.error('Error inserting blog post:', err);
      return res.status(500).json({ message: 'Error submitting blog post' });
    }

    // Respond with the newly created blog post details
    res.json({
      id: result.insertId,
      title,
      content,
      location,
      location_type,
      author_id: authorId
    });
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
  const sql = 'UPDATE users SET username = ?, email = ?, user_type = ? WHERE id = ?';

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
  const sql = 'UPDATE users SET username = ?, email = ?, user_type = ? WHERE id = ?';
  db.query(sql, [username, email, userType, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error updating user' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  });
});

// Delete user (admin only)
app.delete('/users/:id', verifyToken, (req, res) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting user' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
