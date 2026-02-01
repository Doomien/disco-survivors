const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile');
const logger = require('../utils/logger');
const BackupService = require('./backupService');
const { FileOperationError } = require('../utils/errors');

/**
 * FileService - Manages reading/writing character configs
 * 
 * Phase 2 Update: Now supports base + custom config overlay system
 * - Reads from both base and custom config files
 * - Merges them (custom overrides base)
 * - Saves changes to custom config only (base is read-only)
 */
class FileService {
  constructor(options = {}) {
    // New config paths (Phase 2)
    this.baseConfigPath = options.baseConfigPath;
    this.customConfigPath = options.customConfigPath;
    
    // Legacy support - if only filePath provided, use old behavior
    this.legacyFilePath = options.filePath;
    
    this.backupService = new BackupService(options.backupDir);
    this.cache = null;
    this.cacheTimestamp = null;
    
    // Track which characters are from base vs custom
    this.baseCharacters = {};
    this.customCharacters = {};
  }

  async initialize() {
    await this.backupService.initialize();

    // Ensure custom config directory exists
    if (this.customConfigPath) {
      const customDir = path.dirname(this.customConfigPath);
      try {
        await fs.mkdir(customDir, { recursive: true });
      } catch (error) {
        // Directory may already exist
      }
    }

    // Verify configs exist and are valid
    try {
      await this.readCharacters();
      logger.info('Character configs loaded successfully');
      logger.info(`Base config: ${this.baseConfigPath || 'not configured'}`);
      logger.info(`Custom config: ${this.customConfigPath || 'not configured'}`);
    } catch (error) {
      logger.error(`Failed to load character configs: ${error.message}`);
      throw new FileOperationError('read', `Failed to load character configs: ${error.message}`);
    }
  }

  /**
   * Read and parse a JSON config file
   * Returns null if file doesn't exist (for optional custom config)
   */
  async readConfigFile(filePath, required = true) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        if (required) {
          throw new FileOperationError('read', `Config file not found: ${filePath}`);
        }
        return null; // Optional file doesn't exist
      }
      if (error instanceof SyntaxError) {
        throw new FileOperationError('read', `Invalid JSON in config file: ${filePath}`);
      }
      throw new FileOperationError('read', error.message);
    }
  }

  /**
   * Read characters from base + custom configs and merge them
   * Custom characters override base characters with the same ID
   */
  async readCharacters() {
    try {
      let mergedData = { enemies: {} };

      // If using legacy single-file mode
      if (this.legacyFilePath && !this.baseConfigPath) {
        const data = await this.readConfigFile(this.legacyFilePath, true);
        if (!data.enemies || typeof data.enemies !== 'object') {
          throw new Error('Invalid config structure: missing "enemies" object');
        }
        this.cache = data;
        this.cacheTimestamp = Date.now();
        return data;
      }

      // Phase 2: Read base config (required)
      if (this.baseConfigPath) {
        const baseData = await this.readConfigFile(this.baseConfigPath, true);
        if (!baseData.enemies || typeof baseData.enemies !== 'object') {
          throw new Error('Invalid base config structure: missing "enemies" object');
        }
        this.baseCharacters = { ...baseData.enemies };
        mergedData.enemies = { ...baseData.enemies };
        logger.debug(`Loaded ${Object.keys(baseData.enemies).length} base characters`);
      }

      // Phase 2: Read custom config (optional - may not exist yet)
      if (this.customConfigPath) {
        const customData = await this.readConfigFile(this.customConfigPath, false);
        if (customData) {
          if (customData.enemies && typeof customData.enemies === 'object') {
            this.customCharacters = { ...customData.enemies };
            // Merge: custom overrides base
            mergedData.enemies = { ...mergedData.enemies, ...customData.enemies };
            logger.debug(`Loaded ${Object.keys(customData.enemies).length} custom characters`);
          }
        } else {
          this.customCharacters = {};
          logger.debug('No custom config found, using base only');
        }
      }

      // Update cache
      this.cache = mergedData;
      this.cacheTimestamp = Date.now();

      logger.debug(`Total merged characters: ${Object.keys(mergedData.enemies).length}`);
      return mergedData;
    } catch (error) {
      throw new FileOperationError('read', error.message);
    }
  }

  /**
   * Write characters to the custom config file only
   * Base config is treated as read-only
   */
  async writeCharacters(data) {
    // Determine which file to write to
    const targetPath = this.customConfigPath || this.legacyFilePath;
    
    if (!targetPath) {
      throw new FileOperationError('write', 'No writable config path configured');
    }

    let release;

    try {
      // Ensure directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Check if file exists for locking (create empty if not)
      try {
        await fs.access(targetPath);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(targetPath, '{"enemies":{}}', 'utf8');
      }

      // Acquire file lock
      release = await lockfile.lock(targetPath, {
        retries: {
          retries: 5,
          minTimeout: 100,
          maxTimeout: 500
        }
      });

      // Create backup before writing
      try {
        await this.backupService.createBackup(targetPath);
      } catch (backupError) {
        logger.warn(`Backup failed (continuing anyway): ${backupError.message}`);
      }

      // Write to temporary file
      const tmpFile = `${targetPath}.tmp.${Date.now()}.${process.pid}`;
      const jsonContent = JSON.stringify(data, null, 2);

      await fs.writeFile(tmpFile, jsonContent, 'utf8');

      // Verify the written file is valid JSON
      const verifyContent = await fs.readFile(tmpFile, 'utf8');
      JSON.parse(verifyContent);

      // Copy temp file to target (works better with Docker bind mounts)
      await fs.copyFile(tmpFile, targetPath);

      // Clean up temp file
      try {
        await fs.unlink(tmpFile);
      } catch (unlinkError) {
        logger.warn(`Failed to delete temp file: ${unlinkError.message}`);
      }

      // Update custom characters cache
      if (data.enemies) {
        this.customCharacters = { ...data.enemies };
      }
      
      // Refresh the merged cache
      await this.readCharacters();

      logger.info(`Characters written to: ${targetPath}`);
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

  /**
   * Get all characters (merged base + custom)
   */
  async getAllCharacters() {
    const data = await this.readCharacters();
    return data.enemies;
  }

  /**
   * Get a single character by ID
   */
  async getCharacter(id) {
    const data = await this.readCharacters();
    return data.enemies[id] || null;
  }

  /**
   * Check if a character is from base or custom config
   */
  isBaseCharacter(id) {
    return id in this.baseCharacters;
  }

  isCustomCharacter(id) {
    return id in this.customCharacters;
  }

  /**
   * Get character source info (useful for UI)
   */
  getCharacterSource(id) {
    if (id in this.customCharacters) {
      return 'custom';
    }
    if (id in this.baseCharacters) {
      return 'base';
    }
    return null;
  }

  /**
   * Create a new character (always saves to custom config)
   */
  async createCharacter(id, characterData) {
    const data = await this.readCharacters();

    // Check if character already exists in either base or custom
    if (data.enemies[id]) {
      return { success: false, exists: true };
    }

    // Add new character to custom config only
    const customData = { enemies: { ...this.customCharacters } };
    customData.enemies[id] = characterData;

    // Write to custom config
    await this.writeCharacters(customData);

    return { success: true, data: characterData };
  }

  /**
   * Update a character
   * - If it's a custom character, update in custom config
   * - If it's a base character, create an override in custom config
   */
  async updateCharacter(id, characterData) {
    const data = await this.readCharacters();

    // Check if character exists
    if (!data.enemies[id]) {
      return { success: false, notFound: true };
    }

    // Always save to custom config (creates override for base characters)
    const customData = { enemies: { ...this.customCharacters } };
    customData.enemies[id] = characterData;

    await this.writeCharacters(customData);

    const isOverride = this.isBaseCharacter(id);
    return { 
      success: true, 
      data: characterData,
      isOverride: isOverride  // Indicates this is overriding a base character
    };
  }

  /**
   * Delete a character
   * - Custom characters: remove from custom config
   * - Base characters: cannot be deleted (return error)
   */
  async deleteCharacter(id) {
    const data = await this.readCharacters();

    // Check if character exists
    if (!data.enemies[id]) {
      return { success: false, notFound: true };
    }

    // Cannot delete base characters
    if (this.isBaseCharacter(id) && !this.isCustomCharacter(id)) {
      return { 
        success: false, 
        error: 'Cannot delete base characters. You can only delete custom characters or custom overrides.'
      };
    }

    // Remove from custom config
    const customData = { enemies: { ...this.customCharacters } };
    delete customData.enemies[id];

    await this.writeCharacters(customData);

    return { success: true };
  }

  /**
   * Check if a character exists
   */
  async characterExists(id) {
    const data = await this.readCharacters();
    return !!data.enemies[id];
  }

  /**
   * Get summary of character counts
   */
  async getCharacterStats() {
    await this.readCharacters();
    
    const baseCount = Object.keys(this.baseCharacters).length;
    const customCount = Object.keys(this.customCharacters).length;
    const overrideCount = Object.keys(this.customCharacters).filter(
      id => id in this.baseCharacters
    ).length;
    
    return {
      base: baseCount,
      custom: customCount,
      overrides: overrideCount,
      total: baseCount + customCount - overrideCount
    };
  }
}

module.exports = FileService;
