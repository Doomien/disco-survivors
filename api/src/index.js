require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
const FileService = require('./services/fileService');
const ItemService = require('./services/itemService');
const { router: charactersRouter, setFileService } = require('./routes/characters');
const { router: itemsRouter, setItemService } = require('./routes/items');
const healthRouter = require('./routes/health');
const uploadsRouter = require('./routes/uploads');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Configuration
const PORT = process.env.PORT || 3334;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Phase 2: New config paths (base + custom overlay)
const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, '../../config');
const ENEMIES_CONFIG = process.env.ENEMIES_CONFIG || path.join(CONFIG_DIR, 'base/enemies.json');
const CUSTOM_ENEMIES_CONFIG = process.env.CUSTOM_ENEMIES_CONFIG || path.join(CONFIG_DIR, 'custom/enemies.json');
const ITEMS_CONFIG = process.env.ITEMS_CONFIG || path.join(CONFIG_DIR, 'base/items.json');
const CUSTOM_ITEMS_CONFIG = process.env.CUSTOM_ITEMS_CONFIG || path.join(CONFIG_DIR, 'custom/items.json');

// Legacy fallback (will be removed after Phase 2 complete)
const CHARACTERS_FILE = process.env.CHARACTERS_FILE || path.join(__dirname, '../../characters.json');

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

// Initialize file service with Phase 2 config overlay support
const fileService = new FileService({
  baseConfigPath: ENEMIES_CONFIG,
  customConfigPath: CUSTOM_ENEMIES_CONFIG,
  filePath: CHARACTERS_FILE,  // Legacy fallback
  backupDir: BACKUP_DIR
});

// Initialize item service
const itemService = new ItemService({
  baseConfigPath: ITEMS_CONFIG,
  customConfigPath: CUSTOM_ITEMS_CONFIG,
  backupDir: BACKUP_DIR
});

// Inject services into routes
setFileService(fileService);
setItemService(itemService);

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/characters', charactersRouter);
app.use('/api/v1/items', itemsRouter);
app.use('/api/v1/uploads', uploadsRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Initialize services
    await fileService.initialize();
    await itemService.initialize();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 API server started`);
      logger.info(`📍 Environment: ${NODE_ENV}`);
      logger.info(`📡 Port: ${PORT}`);
      logger.info(`📂 Base enemies config: ${ENEMIES_CONFIG}`);
      logger.info(`📂 Custom enemies config: ${CUSTOM_ENEMIES_CONFIG}`);
      logger.info(`📂 Base items config: ${ITEMS_CONFIG}`);
      logger.info(`📂 Custom items config: ${CUSTOM_ITEMS_CONFIG}`);
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
