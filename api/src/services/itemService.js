const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile');
const logger = require('../utils/logger');
const BackupService = require('./backupService');
const { FileOperationError } = require('../utils/errors');

/**
 * ItemService - Manages reading/writing item configs (weapons, projectiles, collectibles)
 * 
 * Supports base + custom config overlay system:
 * - Reads from both base and custom config files
 * - Merges them (custom overrides base)
 * - Saves changes to custom config only (base is read-only)
 */
class ItemService {
  constructor(options = {}) {
    this.baseConfigPath = options.baseConfigPath;
    this.customConfigPath = options.customConfigPath;
    this.backupService = new BackupService(options.backupDir);
    
    this.cache = null;
    this.cacheTimestamp = null;
    
    // Track which items are from base vs custom for each category
    this.baseItems = { weapons: {}, projectiles: {}, collectibles: {} };
    this.customItems = { weapons: {}, projectiles: {}, collectibles: {} };
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

    try {
      await this.readItems();
      logger.info('Item configs loaded successfully');
      logger.info(`Base items config: ${this.baseConfigPath || 'not configured'}`);
      logger.info(`Custom items config: ${this.customConfigPath || 'not configured'}`);
    } catch (error) {
      logger.error(`Failed to load item configs: ${error.message}`);
      throw new FileOperationError('read', `Failed to load item configs: ${error.message}`);
    }
  }

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
        return null;
      }
      if (error instanceof SyntaxError) {
        throw new FileOperationError('read', `Invalid JSON in config file: ${filePath}`);
      }
      throw new FileOperationError('read', error.message);
    }
  }

  async readItems() {
    try {
      let mergedData = { weapons: {}, projectiles: {}, collectibles: {} };

      // Read base config (required)
      if (this.baseConfigPath) {
        const baseData = await this.readConfigFile(this.baseConfigPath, true);
        
        this.baseItems = {
          weapons: { ...(baseData.weapons || {}) },
          projectiles: { ...(baseData.projectiles || {}) },
          collectibles: { ...(baseData.collectibles || {}) }
        };
        
        mergedData = {
          weapons: { ...this.baseItems.weapons },
          projectiles: { ...this.baseItems.projectiles },
          collectibles: { ...this.baseItems.collectibles }
        };
        
        logger.debug(`Loaded ${Object.keys(this.baseItems.weapons).length} base weapons`);
        logger.debug(`Loaded ${Object.keys(this.baseItems.projectiles).length} base projectiles`);
        logger.debug(`Loaded ${Object.keys(this.baseItems.collectibles).length} base collectibles`);
      }

      // Read custom config (optional)
      if (this.customConfigPath) {
        const customData = await this.readConfigFile(this.customConfigPath, false);
        if (customData) {
          this.customItems = {
            weapons: { ...(customData.weapons || {}) },
            projectiles: { ...(customData.projectiles || {}) },
            collectibles: { ...(customData.collectibles || {}) }
          };
          
          // Merge: custom overrides base
          mergedData = {
            weapons: { ...mergedData.weapons, ...this.customItems.weapons },
            projectiles: { ...mergedData.projectiles, ...this.customItems.projectiles },
            collectibles: { ...mergedData.collectibles, ...this.customItems.collectibles }
          };
          
          logger.debug(`Loaded ${Object.keys(this.customItems.weapons).length} custom weapons`);
        } else {
          this.customItems = { weapons: {}, projectiles: {}, collectibles: {} };
          logger.debug('No custom items config found, using base only');
        }
      }

      this.cache = mergedData;
      this.cacheTimestamp = Date.now();
      return mergedData;
    } catch (error) {
      throw new FileOperationError('read', error.message);
    }
  }

  async writeItems(customData) {
    const targetPath = this.customConfigPath;
    
    if (!targetPath) {
      throw new FileOperationError('write', 'No writable config path configured');
    }

    let release;

    try {
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      try {
        await fs.access(targetPath);
      } catch {
        await fs.writeFile(targetPath, '{"weapons":{},"projectiles":{},"collectibles":{}}', 'utf8');
      }

      release = await lockfile.lock(targetPath, {
        retries: {
          retries: 5,
          minTimeout: 100,
          maxTimeout: 500
        }
      });

      try {
        await this.backupService.createBackup(targetPath);
      } catch (backupError) {
        logger.warn(`Backup failed (continuing anyway): ${backupError.message}`);
      }

      const tmpFile = `${targetPath}.tmp.${Date.now()}.${process.pid}`;
      const jsonContent = JSON.stringify(customData, null, 2);

      await fs.writeFile(tmpFile, jsonContent, 'utf8');

      const verifyContent = await fs.readFile(tmpFile, 'utf8');
      JSON.parse(verifyContent);

      await fs.copyFile(tmpFile, targetPath);

      try {
        await fs.unlink(tmpFile);
      } catch (unlinkError) {
        logger.warn(`Failed to delete temp file: ${unlinkError.message}`);
      }

      this.customItems = {
        weapons: { ...(customData.weapons || {}) },
        projectiles: { ...(customData.projectiles || {}) },
        collectibles: { ...(customData.collectibles || {}) }
      };

      await this.readItems();
      logger.info(`Items written to: ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to write items file: ${error.message}`);
      throw new FileOperationError('write', error.message);
    } finally {
      if (release) {
        try {
          await release();
        } catch (error) {
          logger.error(`Failed to release file lock: ${error.message}`);
        }
      }
    }
  }

  // =====================
  // Generic Item Methods
  // =====================

  async getAllItems() {
    const data = await this.readItems();
    return data;
  }

  async getItemsByCategory(category) {
    const data = await this.readItems();
    return data[category] || {};
  }

  async getItem(category, id) {
    const data = await this.readItems();
    return data[category]?.[id] || null;
  }

  isBaseItem(category, id) {
    return id in (this.baseItems[category] || {});
  }

  isCustomItem(category, id) {
    return id in (this.customItems[category] || {});
  }

  getItemSource(category, id) {
    const isBase = this.isBaseItem(category, id);
    const isCustom = this.isCustomItem(category, id);
    
    if (isCustom && isBase) {
      return { source: 'override', isBase: true, isCustom: true, isOverride: true };
    }
    if (isCustom) {
      return { source: 'custom', isBase: false, isCustom: true, isOverride: false };
    }
    if (isBase) {
      return { source: 'base', isBase: true, isCustom: false, isOverride: false };
    }
    return null;
  }

  async createItem(category, id, itemData) {
    const data = await this.readItems();

    if (data[category]?.[id]) {
      return { success: false, exists: true };
    }

    const customData = {
      weapons: { ...this.customItems.weapons },
      projectiles: { ...this.customItems.projectiles },
      collectibles: { ...this.customItems.collectibles }
    };
    customData[category][id] = itemData;

    await this.writeItems(customData);
    return { success: true, data: itemData };
  }

  async updateItem(category, id, itemData) {
    const data = await this.readItems();

    if (!data[category]?.[id]) {
      return { success: false, notFound: true };
    }

    const customData = {
      weapons: { ...this.customItems.weapons },
      projectiles: { ...this.customItems.projectiles },
      collectibles: { ...this.customItems.collectibles }
    };
    customData[category][id] = itemData;

    await this.writeItems(customData);

    const isOverride = this.isBaseItem(category, id);
    return { success: true, data: itemData, isOverride };
  }

  async deleteItem(category, id) {
    const data = await this.readItems();

    if (!data[category]?.[id]) {
      return { success: false, notFound: true };
    }

    if (this.isBaseItem(category, id) && !this.isCustomItem(category, id)) {
      return {
        success: false,
        error: 'Cannot delete base items. You can only delete custom items or custom overrides.'
      };
    }

    const customData = {
      weapons: { ...this.customItems.weapons },
      projectiles: { ...this.customItems.projectiles },
      collectibles: { ...this.customItems.collectibles }
    };
    delete customData[category][id];

    await this.writeItems(customData);
    return { success: true };
  }

  async getItemStats() {
    await this.readItems();

    const stats = {};
    for (const category of ['weapons', 'projectiles', 'collectibles']) {
      const baseCount = Object.keys(this.baseItems[category] || {}).length;
      const customCount = Object.keys(this.customItems[category] || {}).length;
      const overrideCount = Object.keys(this.customItems[category] || {}).filter(
        id => id in (this.baseItems[category] || {})
      ).length;

      stats[category] = {
        base: baseCount,
        custom: customCount,
        overrides: overrideCount,
        total: baseCount + customCount - overrideCount
      };
    }

    return stats;
  }
}

module.exports = ItemService;
