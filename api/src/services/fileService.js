const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile');
const logger = require('../utils/logger');
const BackupService = require('./backupService');
const { FileOperationError } = require('../utils/errors');

class FileService {
  constructor(filePath, backupDir) {
    this.filePath = filePath;
    this.backupService = new BackupService(backupDir);
    this.cache = null;
    this.cacheTimestamp = null;
  }

  async initialize() {
    await this.backupService.initialize();

    // Verify file exists and is valid JSON
    try {
      await this.readCharacters();
      logger.info('Characters file loaded successfully');
    } catch (error) {
      logger.error(`Failed to load characters file: ${error.message}`);
      throw new FileOperationError('read', `Failed to load characters file: ${error.message}`);
    }
  }

  async readCharacters() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      const data = JSON.parse(content);

      // Validate structure
      if (!data.enemies || typeof data.enemies !== 'object') {
        throw new Error('Invalid characters.json structure: missing "enemies" object');
      }

      // Update cache
      this.cache = data;
      this.cacheTimestamp = Date.now();

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new FileOperationError('read', 'Characters file not found');
      }
      if (error instanceof SyntaxError) {
        throw new FileOperationError('read', 'Characters file contains invalid JSON');
      }
      throw new FileOperationError('read', error.message);
    }
  }

  async writeCharacters(data) {
    let release;

    try {
      // Acquire file lock
      release = await lockfile.lock(this.filePath, {
        retries: {
          retries: 5,
          minTimeout: 100,
          maxTimeout: 500
        }
      });

      // Create backup before writing
      await this.backupService.createBackup(this.filePath);

      // Write to temporary file
      const tmpFile = `${this.filePath}.tmp.${Date.now()}.${process.pid}`;
      const jsonContent = JSON.stringify(data, null, 2);

      await fs.writeFile(tmpFile, jsonContent, 'utf8');

      // Verify the written file is valid JSON
      const verifyContent = await fs.readFile(tmpFile, 'utf8');
      JSON.parse(verifyContent);

      // Copy temp file to target (works better with Docker bind mounts)
      await fs.copyFile(tmpFile, this.filePath);

      // Clean up temp file
      try {
        await fs.unlink(tmpFile);
      } catch (unlinkError) {
        logger.warn(`Failed to delete temp file: ${unlinkError.message}`);
      }

      // Update cache
      this.cache = data;
      this.cacheTimestamp = Date.now();

      logger.info('Characters file written successfully');
    } catch (error) {
      logger.error(`Failed to write characters file: ${error.message}`);
      throw new FileOperationError('write', error.message);
    } finally {
      // Release lock
      if (release) {
        try {
          await release();
        } catch (error) {
          logger.error(`Failed to release file lock: ${error.message}`);
        }
      }
    }
  }

  async getAllCharacters() {
    const data = await this.readCharacters();
    return data.enemies;
  }

  async getCharacter(id) {
    const data = await this.readCharacters();
    return data.enemies[id] || null;
  }

  async createCharacter(id, characterData) {
    const data = await this.readCharacters();

    // Check if character already exists
    if (data.enemies[id]) {
      return { success: false, exists: true };
    }

    // Add new character
    data.enemies[id] = characterData;

    // Write back to file
    await this.writeCharacters(data);

    return { success: true, data: characterData };
  }

  async updateCharacter(id, characterData) {
    const data = await this.readCharacters();

    // Check if character exists
    if (!data.enemies[id]) {
      return { success: false, notFound: true };
    }

    // Update character
    data.enemies[id] = characterData;

    // Write back to file
    await this.writeCharacters(data);

    return { success: true, data: characterData };
  }

  async deleteCharacter(id) {
    const data = await this.readCharacters();

    // Check if character exists
    if (!data.enemies[id]) {
      return { success: false, notFound: true };
    }

    // Delete character
    delete data.enemies[id];

    // Write back to file
    await this.writeCharacters(data);

    return { success: true };
  }

  async characterExists(id) {
    const data = await this.readCharacters();
    return !!data.enemies[id];
  }
}

module.exports = FileService;
