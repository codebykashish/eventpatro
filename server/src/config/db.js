// db.js
// Handles the connection between our Express server and MongoDB.
// We call this once when the server starts.
// Mongoose is the library that lets us use JavaScript to talk to MongoDB.

const mongoose = require('mongoose');

const connectDB = async () => {
  // MONGODB_URI comes from the .env file — never hard-coded here.
  // Example value: mongodb://127.0.0.1:27017/campuspulse
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // If the .env file is missing or the variable is not set, stop immediately.
    console.error('ERROR: MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Exit the process so we do not run a server with no database.
    process.exit(1);
  }
};

module.exports = connectDB;
