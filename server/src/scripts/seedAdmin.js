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

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (existingAdmin) {
      console.log(`Admin account (${adminEmail}) already exists. No action taken.`)
      process.exit(0)
    }

    // Create the administrator
    await User.create({
      firstName: 'College',
      lastName: 'Administrator',
      studentId: 'ADMIN-001',
      email: adminEmail,
      password: adminPassword, // Will be hashed by User model pre-save hook
      role: 'admin',
    })

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
