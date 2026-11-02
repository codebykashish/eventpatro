const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { protect, restrictTo } = require('../middleware/auth')

const router = express.Router()

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'event-' + uniqueSuffix + ext)
  },
})

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed.'), false)
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
})

// POST /api/upload - admin or authenticated user upload
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' })
  }

  // Generate URL for client to use
  const fileUrl = `/uploads/${req.file.filename}`
  res.status(200).json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
  })
})

module.exports = router
