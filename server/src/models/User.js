const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// User schema for students and administrators
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    studentId: {
      type: String,
      // Student ID is only required for student accounts
      required: function () {
        return this.role === 'student'
      },
      // Sparse index ensures uniqueness among students without blocking admins without studentId
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Prevents password hash from showing in normal database queries
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student', // All public signups are assigned student role
    },
    profilePicture: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false, // Students must verify email via 6-digit OTP
    },
    verificationOtp: {
      type: String,
      select: false, // Hidden by default for security
    },
    verificationOtpExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
)

// Pre-save hook: Hash password with bcrypt before saving to MongoDB
userSchema.pre('save', async function () {
  // Only hash the password if it was modified (or is new)
  if (!this.isModified('password')) return

  // Hash password with a cost factor of 10
  this.password = await bcrypt.hash(this.password, 10)
})

// Instance method: Verify whether a plain password matches the hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
