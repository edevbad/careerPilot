/**
 * middleware/errorHandler.js
 *
 * Central error-handling middleware — Express 4/5 compatible.
 * All unhandled errors funnel here via next(error) or asyncHandler.
 *
 * Response shape (always):
 *   { success: false, message: string, [errors]: array, [stack]: string }
 */


const AppError = require('../utils/appError');
const Logger = require('../utils/logger');

// Fields we never expose in error responses (prevent information leakage)
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey'];

const notFound = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`))
}

const errorHandler = (err, req, res, next) => {
  // Log full stack in all environments — use log shipper to filter in prod
  Logger.error({
    message: err.message,
    stack:   err.stack,
    method:  req.method,
    url:     req.originalUrl,
    ip:      req.ip,
  });

  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors;

  // ── Mongoose: invalid ObjectId ─────────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid value for field '${err.path}'`;
  }

  // ── Mongoose: unique key violation ─────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `${field} is already in use`;
  }

  // ── Mongoose: schema validation error ──────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors     = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    message    = 'Validation failed';
  }

  // ── Zod validation error ───────────────────────────────────────────────────
  if (err.name === 'ZodError') {
    statusCode = 422;
    errors     = err.errors.map((e) => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    message    = 'Input validation failed';
  }

  // ── Multer: file upload errors ─────────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    message    = err.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large'
      : err.message;
  }

  // ── JWT: tampered token ────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }

  // ── JWT: expired token ─────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token has expired';
  }

  // ── SyntaxError: malformed JSON body ──────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message    = 'Invalid JSON in request body';
  }

  // ── CORS error ────────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    statusCode = 403;
    message    = err.message;
  }

  // ── Generic 500 — scrub message in production to prevent info leakage ─────
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  
   // Gemini / external AI errors
  if (statusCode === 429) {
    message = message || 'Too many requests. Please wait and try again.'
  }

  if (statusCode === 503) {
    message = message || 'AI service is temporarily unavailable.'
  }

  if (statusCode === 502) {
    message = message || 'AI service returned an unexpected response.'
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;

  // Only expose stack trace in development
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  // If headers already sent (e.g. streaming), delegate to default handler
  if (res.headersSent) {
    return next(err);
  }


  res.status(statusCode).json(body);
};

module.exports = {errorHandler,notFound};