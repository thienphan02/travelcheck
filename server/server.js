const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const bcrypt = require('bcrypt');

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
      if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
  
      req.userId = decoded.id;
      req.userType = decoded.userType;
      next();
    });
  };
  
  // Middleware to check if user is a 'member'
  const isMember = (req, res, next) => {
    if (req.userType === 'member' || req.userType === 'admin') {
      next(); // Proceed if user is a member or admin
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  };

// Example endpoint to get reviews
app.get('/reviews', (req, res) => {
  const sql = 'SELECT * FROM reviews';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Example endpoint to post a review (without user_id and place_id for now)
app.post('/reviews', verifyToken, isMember, (req, res) => {
  const { rating, review_text } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const sql = 'INSERT INTO reviews (rating, review_text, user_id) VALUES (?, ?, ?)';

  // Assuming req.userId is available from verifyToken middleware
  db.query(sql, [rating, review_text, req.userId], (err, result) => {
    if (err) {
      console.error('Error inserting review:', err);
      res.status(500).json({ message: 'Error submitting review' });
    } else {
      res.json({ id: result.insertId, rating, review_text });
    }
  });
});


  // Updated Sign-up Endpoint
app.post('/signup', async (req, res) => {
  const { username, password, email, userType = 'member' } = req.body; // Default to 'member'
  const hashedPassword = await bcrypt.hash(password, 10);

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
    const sql = 'INSERT INTO users (username, password, email, user_type) VALUES (?, ?, ?, "member")';
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




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
