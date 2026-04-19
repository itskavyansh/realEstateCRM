const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create sub-folders based on type
    let subDir = 'misc';
    if (file.fieldname === 'images') subDir = 'properties';
    else if (file.fieldname === 'documents') subDir = 'documents';
    else if (file.fieldname === 'logo') subDir = 'logos';
    else if (file.fieldname === 'csv') subDir = 'csv';
    else if (file.fieldname === 'avatar') subDir = 'avatars';

    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.fieldname === 'images' || file.fieldname === 'logo' || file.fieldname === 'avatar') {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'), false);
  }
  // Allow documents (PDFs, images)
  if (file.fieldname === 'documents') {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only PDF and image files are allowed for documents'), false);
  }
  // Allow CSV
  if (file.fieldname === 'csv') {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      return cb(null, true);
    }
    return cb(new Error('Only CSV files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
