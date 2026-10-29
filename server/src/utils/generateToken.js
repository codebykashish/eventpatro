const jwt = require('jsonwebtoken')

// Generates a signed JWT containing user ID and role
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token valid for 7 days
  )
}

module.exports = generateToken
