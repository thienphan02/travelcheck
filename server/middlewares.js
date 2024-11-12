const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const JWT_SECRET = process.env.JWT_SECRET;

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

const isMember = (req, res, next) => {
  if (req.userType === 'member' || req.userType === 'admin') next();
  else res.status(403).json({ message: 'Access denied. Only members can post reviews.' });
};

const isAdmin = (req, res, next) => {
  if (req.userType === 'admin') next();
  else res.status(403).json({ message: 'Admin access required' });
};

const uploadsDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    cb(mimetype && extname ? null : new Error('Only images are allowed'));
  }
});

module.exports = { verifyToken, isMember, isAdmin, upload };
