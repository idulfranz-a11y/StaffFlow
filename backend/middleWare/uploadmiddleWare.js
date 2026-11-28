const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// ============================================
// UPLOAD DIRECTORY
// ============================================

const uploadPath = path.resolve(__dirname, "../uploads/submissions");

// Automatically create the folder if it doesn't exist
fs.mkdirSync(uploadPath, { recursive: true });

console.log("Multer upload directory:", uploadPath);

// ============================================
// STORAGE CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadPath);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = `${crypto.randomUUID()}${extension}`;

    callback(null, uniqueName);
  },
});

// ============================================
// ALLOWED FILE TYPES
// ============================================

const allowedTypes = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],

  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],

  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
};

// ============================================
// FILE VALIDATION
// ============================================

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = allowedTypes[extension];

  if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
    return callback(new Error("Unsupported file type."));
  }

  callback(null, true);
};

// ============================================
// MULTER CONFIGURATION
// ============================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});

module.exports = upload;
