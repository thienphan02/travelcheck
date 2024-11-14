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

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://gray-moss-0fcb3ef1e.5.azurestaticapps.net',
}));
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

// Function to start the server
const startServer = () => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
