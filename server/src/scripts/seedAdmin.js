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

    let admin = await User.findOne({ email: adminEmail }).select('+password')
    if (admin) {
      admin.firstName = 'College'
      admin.lastName = 'Administrator'
      admin.role = 'admin'
      admin.isVerified = true
      admin.password = adminPassword
      admin.studentId = undefined
      await admin.save()
    } else {
      admin = await User.create({
        firstName: 'College',
        lastName: 'Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
      })
    }

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
