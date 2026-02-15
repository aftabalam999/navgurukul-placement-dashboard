const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/resumes', 'uploads/avatars', 'uploads/documents', 'uploads/hero_images'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Resolve absolute path to uploads directory (backend/uploads)
    const uploadsRoot = path.join(__dirname, '../uploads');
    let uploadPath = path.join(uploadsRoot, 'documents');

    if (file.fieldname === 'resume') {
      uploadPath = path.join(uploadsRoot, 'resumes');
    } else if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadsRoot, 'avatars');
    } else if (file.fieldname === 'heroImage') {
      uploadPath = path.join(uploadsRoot, 'hero_images');
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Allow PDF, DOC, DOCX for resumes
    if (file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Resume must be PDF, DOC, or DOCX'), false);
    }
  } else if (file.fieldname === 'avatar') {
    // Allow images for avatars
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Avatar must be an image'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
