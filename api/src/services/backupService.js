const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class BackupService {
  constructor(backupDir, maxBackups = 10) {
    this.backupDir = backupDir;
    this.maxBackups = maxBackups;
  }

  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Backup directory initialized: ${this.backupDir}`);
    } catch (error) {
      logger.error(`Failed to initialize backup directory: ${error.message}`);
      throw error;
    }
  }

  async createBackup(sourceFile) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `characters.json.${timestamp}.backup`;
      const backupPath = path.join(this.backupDir, backupFileName);

      await fs.copyFile(sourceFile, backupPath);
      logger.info(`Backup created: ${backupFileName}`);

      // Cleanup old backups
      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      logger.error(`Failed to create backup: ${error.message}`);
      // Don't throw - backup failure shouldn't stop the operation
      return null;
    }
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('characters.json.') && f.endsWith('.backup'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f)
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort by timestamp (newest first)

      // Remove backups beyond maxBackups limit
      if (backupFiles.length > this.maxBackups) {
        const filesToDelete = backupFiles.slice(this.maxBackups);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          logger.info(`Deleted old backup: ${file.name}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to cleanup old backups: ${error.message}`);
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('characters.json.') && f.endsWith('.backup'))
        .sort((a, b) => b.localeCompare(a)); // Newest first

      return backupFiles;
    } catch (error) {
      logger.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  async restoreFromBackup(backupFileName, targetFile) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      await fs.copyFile(backupPath, targetFile);
      logger.info(`Restored from backup: ${backupFileName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to restore from backup: ${error.message}`);
      return false;
    }
  }
}

module.exports = BackupService;
