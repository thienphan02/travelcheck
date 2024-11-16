const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');


// Import routes
const authRoutes = require('./authRoutes');
const reviewRoutes = require('./reviewRoutes');
const blogRoutes = require('./blogRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const mapRoutes = require('./mapRoutes');
const settingsRoutes = require('./settingsRoutes');
const manageRoutes = require('./manageRoutes');
const adminUserRoutes = require('./adminUserRoutes');
const corsOptions = {
  origin: [
    'https://gray-moss-0fcb3ef1e.5.azurestaticapps.net',
    'https://travelcheck-hzdwesazbcead2bm.canadaeast-01.azurewebsites.net'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  credentials: true,
};


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Register routes
app.use(authRoutes);
app.use(reviewRoutes);
app.use(blogRoutes);
app.use(favoriteRoutes);
app.use(mapRoutes);
app.use(settingsRoutes);
app.use(manageRoutes);
app.use(adminUserRoutes);

app.use(express.static(path.join(__dirname, '../build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});



// start the server
const startServer = () => {
  const PORT = process.env.PORT || 80;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
