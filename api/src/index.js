require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
const FileService = require('./services/fileService');
const { router: charactersRouter, setFileService } = require('./routes/characters');
const healthRouter = require('./routes/health');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Configuration
const PORT = process.env.PORT || 3334;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CHARACTERS_FILE = process.env.CHARACTERS_FILE || path.join(__dirname, '../../characters.json');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Initialize file service
const fileService = new FileService(CHARACTERS_FILE, BACKUP_DIR);

// Inject file service into routes
setFileService(fileService);

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/characters', charactersRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Initialize file service
    await fileService.initialize();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 API server started`);
      logger.info(`📍 Environment: ${NODE_ENV}`);
      logger.info(`📡 Port: ${PORT}`);
      logger.info(`📂 Characters file: ${CHARACTERS_FILE}`);
      logger.info(`💾 Backup directory: ${BACKUP_DIR}`);
      logger.info(`🌐 CORS origin: ${CORS_ORIGIN}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
start();

module.exports = app;
