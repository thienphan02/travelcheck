const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: 'travelcheck.mysql.database.azure.com',
  user: 'pxthien',
  password: process.env.DB_PASSWORD,
  database: 'travel_reviews', 
  port: 3306, 
  ssl: true, 
  sslOptions: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

module.exports = db;
