// Custom error classes for consistent error handling

class AppError extends Error {
  constructor(message, code, statusCode, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super('Validation failed', 'VALIDATION_ERROR', 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(
      `${resource} with ID '${id}' not found`,
      `${resource.toUpperCase()}_NOT_FOUND`,
      404
    );
  }
}

class ConflictError extends AppError {
  constructor(resource, id) {
    super(
      `${resource} with ID '${id}' already exists`,
      `${resource.toUpperCase()}_EXISTS`,
      409
    );
  }
}

class FileOperationError extends AppError {
  constructor(operation, message) {
    super(
      message || `File ${operation} failed`,
      `FILE_${operation.toUpperCase()}_ERROR`,
      500
    );
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  FileOperationError
};
