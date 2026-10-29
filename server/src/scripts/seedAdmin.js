// One-time script to create the initial administrator account
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB for admin seeding...')

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sunway.edu.np'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Sunway2026'

    // Create or update the administrator with verified status and no studentId
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        firstName: 'College',
        lastName: 'Administrator',
        $unset: { studentId: 1 }, // Removes studentId if previously assigned
        role: 'admin',
        isVerified: true,
      },
      { upsert: false }
    )

    console.log('--- Admin Account Created Successfully ---')
    console.log(`Email:    ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
    console.log('------------------------------------------')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin user:', error.message)
    process.exit(1)
  }
}

seedAdmin()
