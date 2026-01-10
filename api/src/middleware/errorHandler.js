const logger = require('../utils/logger');

// 404 handler
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`
    }
  });
}

// Global error handler
function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || undefined,
      stack: isDev ? err.stack : undefined
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
