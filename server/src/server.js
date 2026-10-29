// server.js
// Entry point for the Eventpatro backend.
// This file:
//   1. Loads environment variables from the .env file.
//   2. Connects to MongoDB.
//   3. Starts Express listening on the configured port.

// dotenv reads the .env file and puts each variable into process.env.
// This MUST be the very first thing we do so every other file can read
// process.env.MONGODB_URI, process.env.JWT_SECRET, etc.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the server.
// We only start listening after the database is connected.
// If the database fails, connectDB() will exit the process.
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
