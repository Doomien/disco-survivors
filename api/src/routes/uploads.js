const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

// Configure multer storage
const ASSETS_DIR = process.env.ASSETS_DIR || path.join(__dirname, '../../../assets');
const UPLOAD_SUBDIR = 'characters/enemies'; // Where character sprites go

// Ensure upload directory exists
async function ensureUploadDir() {
  const uploadPath = path.join(ASSETS_DIR, UPLOAD_SUBDIR);
  try {
    await fs.mkdir(uploadPath, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create upload directory: ${error.message}`);
  }
}

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(ASSETS_DIR, UPLOAD_SUBDIR);
    await ensureUploadDir();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces, special chars, convert to lowercase
    const originalName = file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const nameWithoutExt = path.basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    // Add timestamp to prevent collisions
    const timestamp = Date.now();
    const filename = `${nameWithoutExt}_${timestamp}${ext}`;

    cb(null, filename);
  }
});

// File filter - only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new ValidationError('Only image files (JPG, PNG, GIF) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// POST /api/v1/uploads/character-sprite - Upload a character sprite
router.post('/character-sprite', upload.single('sprite'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    // Return the relative path that can be used in characters.json
    const relativePath = `assets/${UPLOAD_SUBDIR}/${req.file.filename}`;

    logger.info(`Uploaded sprite: ${relativePath}`);

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: relativePath,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error(`Failed to delete uploaded file after error: ${unlinkError.message}`);
      }
    }
    next(error);
  }
});

// POST /api/v1/uploads/character-sprites - Upload multiple sprites at once
router.post('/character-sprites', upload.array('sprites', 20), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `assets/${UPLOAD_SUBDIR}/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype
    }));

    logger.info(`Uploaded ${uploadedFiles.length} sprites`);

    res.json({
      success: true,
      data: {
        count: uploadedFiles.length,
        files: uploadedFiles
      }
    });
  } catch (error) {
    // Clean up uploaded files if there was an error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.error(`Failed to delete uploaded file after error: ${unlinkError.message}`);
        }
      }
    }
    next(error);
  }
});

// GET /api/v1/uploads/list - List available sprite files
router.get('/list', async (req, res, next) => {
  try {
    const uploadPath = path.join(ASSETS_DIR, UPLOAD_SUBDIR);
    await ensureUploadDir();

    const files = await fs.readdir(uploadPath);
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => ({
        filename: file,
        path: `assets/${UPLOAD_SUBDIR}/${file}`
      }));

    res.json({
      success: true,
      data: {
        count: imageFiles.length,
        files: imageFiles
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
