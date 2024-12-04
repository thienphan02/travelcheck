const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const JWT_SECRET = process.env.JWT_SECRET;
const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Verifies the JWT token provided in the Authorization header. If valid, attaches `userId` and `userType` from the token payload to the `req` object.
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

//Checks if the user is a member or admin.
const isMember = (req, res, next) => {
  if (req.userType === 'member' || req.userType === 'admin') next();
  else res.status(403).json({ message: 'Access denied. Only members can post reviews.' });
};

const isAdmin = (req, res, next) => {
  if (req.userType === 'admin') next();
  else res.status(403).json({ message: 'Admin access required' });
};

// The directory path where uploaded files will be stored
const uploadsDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const multerMiddleware = multer({ storage });

const upload = async (file) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('uploads');
    
    // Ensure the container exists
    await containerClient.createIfNotExists({ access: 'container' });
    const blobName = Date.now() + path.extname(file.originalname);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file to Azure Blob Storage
    await blockBlobClient.uploadFile(file.path);

    // Delete the file from the server after uploading to Azure
    await fs.unlink(file.path);

    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading file to Azure Blob Storage:', error);
    throw new Error('File upload failed');
  }
};

module.exports = { verifyToken, isMember, isAdmin, upload, multerMiddleware  };
