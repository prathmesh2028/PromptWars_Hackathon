/**
 * @file errorMiddleware.js
 * @description Global error handling and 404 fallback for the Express application.
 *
 * Error flow:
 *   1. Any unmatched route hits `notFound`, which creates a 404 error and calls next(err).
 *   2. Any thrown/passed error reaches `errorHandler`, which formats and sends the response.
 *
 * Controllers set `res.statusCode` before calling `next(err)` to control HTTP status.
 * If no code has been set, defaults to 500 (Internal Server Error).
 */

/**
 * 404 handler — catches requests that didn't match any route.
 *
 * @type {import('express').RequestHandler}
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler — must have 4 parameters so Express treats it as an error handler.
 *
 * Strips stack traces in production to avoid leaking implementation details.
 * Normalises Mongoose validation/cast errors into friendly messages.
 *
 * @type {import('express').ErrorRequestHandler}
 */
const errorHandler = (err, req, res, _next) => {
  // Resolve HTTP status — prefer the one already set on res, fallback to 500
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    err.message = `Invalid value for field '${err.path}'.`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    err.message = `Duplicate value for ${field}. Please use a different value.`;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    err.message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  res.status(statusCode).json({
    success:   false,
    message:   err.message || 'An unexpected error occurred.',
    // Only expose stack in development — never in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
