const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { FileOperationError } = require('../utils/errors');

/**
 * Service for loading and merging base + custom configs
 */
class ConfigService {
  constructor(baseConfigPath, customConfigPath) {
    this.baseConfigPath = baseConfigPath;
    this.customConfigPath = customConfigPath;
    this.cache = { base: null, custom: null, merged: null };
    this.cacheTimestamp = null;
  }

  /**
   * Load a config file, returning empty structure if it doesn't exist
   */
  async loadConfig(filePath, required = false) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        if (required) {
          throw new FileOperationError('read', `Required config file not found: ${filePath}`);
        }
        // Return empty structure for optional config
        logger.info(`Config file not found (using empty): ${filePath}`);
        return { enemies: {} };
      }
      if (error instanceof SyntaxError) {
        throw new FileOperationError('read', `Config file contains invalid JSON: ${filePath}`);
      }
      throw new FileOperationError('read', `Failed to load ${filePath}: ${error.message}`);
    }
  }

  /**
   * Load and merge base + custom configs
   */
  async loadMergedConfig() {
    try {
      // Load base config (required)
      const baseConfig = await this.loadConfig(this.baseConfigPath, true);

      // Load custom config (optional)
      const customConfig = await this.loadConfig(this.customConfigPath, false);

      // Merge configs (custom overrides/extends base)
      const merged = {
        enemies: {
          ...(baseConfig.enemies || {}),
          ...(customConfig.enemies || {})
        }
      };

      // Update cache
      this.cache = { base: baseConfig, custom: customConfig, merged };
      this.cacheTimestamp = Date.now();

      logger.info(`Loaded ${Object.keys(baseConfig.enemies || {}).length} base enemies`);
      logger.info(`Loaded ${Object.keys(customConfig.enemies || {}).length} custom enemies`);
      logger.info(`Total enemies after merge: ${Object.keys(merged.enemies).length}`);

      return merged;
    } catch (error) {
      logger.error(`Failed to load merged config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all enemies (merged base + custom)
   */
  async getAllEnemies() {
    const config = await this.loadMergedConfig();
    return config.enemies;
  }

  /**
   * Get a specific enemy by ID (checks custom first, then base)
   */
  async getEnemy(id) {
    const config = await this.loadMergedConfig();
    return config.enemies[id] || null;
  }

  /**
   * Check if enemy exists in custom config
   */
  async isCustomEnemy(id) {
    if (!this.cache.custom) {
      await this.loadMergedConfig();
    }
    return !!(this.cache.custom.enemies && this.cache.custom.enemies[id]);
  }

  /**
   * Check if enemy exists in base config
   */
  async isBaseEnemy(id) {
    if (!this.cache.base) {
      await this.loadMergedConfig();
    }
    return !!(this.cache.base.enemies && this.cache.base.enemies[id]);
  }

  /**
   * Get source of an enemy ('base', 'custom', or null)
   */
  async getEnemySource(id) {
    if (await this.isCustomEnemy(id)) return 'custom';
    if (await this.isBaseEnemy(id)) return 'base';
    return null;
  }
}

module.exports = ConfigService;
