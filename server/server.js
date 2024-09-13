const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

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

// Example endpoint to get reviews
app.get('/reviews', (req, res) => {
  const sql = 'SELECT * FROM reviews';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


// app.post('/api/reviews', (req, res) => {
//   const { user_id, place_id, rating, review_text } = req.body;
//   const sql = 'INSERT INTO reviews (user_id, place_id, rating, review_text) VALUES (?, ?, ?, ?)';
//   db.query(sql, [user_id, place_id, rating, review_text], (err, result) => {
//     if (err) throw err;
//     res.json({ id: result.insertId, user_id, place_id, rating, review_text });
//   });
// });

// Example endpoint to post a review (without user_id and place_id for now)
app.post('/reviews', (req, res) => {
    const { rating, review_text } = req.body;
  
    // If user_id and place_id are not available, insert only rating and review_text
    const sql = 'INSERT INTO reviews (rating, review_text) VALUES (?, ?)';
    
    db.query(sql, [rating, review_text], (err, result) => {
      if (err) {
        console.error('Error inserting review:', err);
        res.status(500).json({ message: 'Error submitting review' });
      } else {
        res.json({ id: result.insertId, rating, review_text });
      }
    });
  });


  //Sign-up
  app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
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
      const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
      db.query(sql, [username, hashedPassword, email], (err, result) => {
        if (err) {
          res.status(500).json({ message: 'Error creating user' });
        } else {
          res.status(201).json({ message: 'User created successfully' });
        }
      });
    });
  });
  
  //Log-in
  // Assuming you have already set up your server as described
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      // Assuming successful login - you might want to return a token here
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
