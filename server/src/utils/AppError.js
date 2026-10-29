// AppError.js
// A custom error class that extends the built-in JavaScript Error.
// We add a 'statusCode' property so we can set the correct HTTP status
// (e.g. 400 Bad Request, 404 Not Found, 401 Unauthorized) when we send
// an error response to the client.

class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent Error constructor with the message
    super(message);

    this.statusCode = statusCode;

    // 4xx errors are "operational" (expected problems like wrong password).
    // 5xx errors are unexpected server bugs.
    this.isOperational = statusCode < 500;

    // Captures a clean stack trace that excludes this constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
