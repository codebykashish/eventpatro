const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cloudinary = require('cloudinary').v2
const { protect } = require('../middleware/auth')

const router = express.Router()

const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed.'), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
})

const cloudinaryReady = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'eventpatro', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(file.buffer)
  })

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' })
    }

    if (cloudinaryReady()) {
      const result = await uploadToCloudinary(req.file)
      return res.status(200).json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      })
    }

    const ext = path.extname(req.file.originalname || '') || '.jpg'
    const filename = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer)

    // Return relative URL so it works seamlessly in both local and production
    return res.status(200).json({
      success: true,
      url: `/uploads/${filename}`,
      filename,
    })
  } catch (err) {
    console.error('[Upload Error]', err.message)
    return res.status(500).json({
      success: false,
      message: err.message || 'Image upload failed',
    })
  }
})

module.exports = router
