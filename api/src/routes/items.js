const express = require('express');
const router = express.Router();
const {
  validateItemId,
  validateWeaponData,
  validateProjectileData,
  validateCollectibleData
} = require('../validators/item');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

// This will be injected by the main app
let itemService;

function setItemService(service) {
  itemService = service;
}

// Validation middleware for item ID
function validateItemIdParam(req, res, next) {
  const { id } = req.params;
  const result = validateItemId(id);
  
  if (!result.valid) {
    return next(new ValidationError(result.error));
  }
  
  next();
}

// Validation middleware for category
function validateCategory(req, res, next) {
  const { category } = req.params;
  const validCategories = ['weapons', 'projectiles', 'collectibles'];
  
  if (!validCategories.includes(category)) {
    return next(new ValidationError(`Invalid category. Must be one of: ${validCategories.join(', ')}`));
  }
  
  next();
}

// Get validator for category
function getValidatorForCategory(category) {
  switch (category) {
    case 'weapons':
      return validateWeaponData;
    case 'projectiles':
      return validateProjectileData;
    case 'collectibles':
      return validateCollectibleData;
    default:
      return null;
  }
}

// GET /api/v1/items - Get all items (all categories)
router.get('/', async (req, res, next) => {
  try {
    const items = await itemService.getAllItems();
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/items/stats - Get item stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await itemService.getItemStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/items/:category - Get all items in a category
router.get('/:category', validateCategory, async (req, res, next) => {
  try {
    const { category } = req.params;
    const items = await itemService.getItemsByCategory(category);
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/items/:category/:id - Get single item
router.get('/:category/:id', validateCategory, validateItemIdParam, async (req, res, next) => {
  try {
    const { category, id } = req.params;
    const item = await itemService.getItem(category, id);

    if (!item) {
      throw new NotFoundError('Item', id);
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/items/:category/:id/source - Get item source info
router.get('/:category/:id/source', validateCategory, validateItemIdParam, async (req, res, next) => {
  try {
    const { category, id } = req.params;
    const source = itemService.getItemSource(category, id);

    if (!source) {
      throw new NotFoundError('Item', id);
    }

    res.json({
      success: true,
      data: source
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/items/:category - Create new item
router.post('/:category', validateCategory, async (req, res, next) => {
  try {
    const { category } = req.params;
    const { id, data } = req.body;

    // Validate ID
    const idResult = validateItemId(id);
    if (!idResult.valid) {
      throw new ValidationError(idResult.error);
    }

    // Validate data based on category
    const validator = getValidatorForCategory(category);
    const dataResult = validator(data);
    if (!dataResult.valid) {
      throw new ValidationError('Validation failed', dataResult.errors);
    }

    const result = await itemService.createItem(category, id, dataResult.data);

    if (result.exists) {
      throw new ConflictError('Item', id);
    }

    res.status(201).json({
      success: true,
      data: {
        id,
        item: result.data
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/items/:category/:id - Update item
router.put('/:category/:id', validateCategory, validateItemIdParam, async (req, res, next) => {
  try {
    const { category, id } = req.params;
    const data = req.body;

    // Validate data based on category
    const validator = getValidatorForCategory(category);
    const dataResult = validator(data);
    if (!dataResult.valid) {
      throw new ValidationError('Validation failed', dataResult.errors);
    }

    const result = await itemService.updateItem(category, id, dataResult.data);

    if (result.notFound) {
      throw new NotFoundError('Item', id);
    }

    res.json({
      success: true,
      data: {
        id,
        item: result.data,
        isOverride: result.isOverride
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/items/:category/:id - Delete item
router.delete('/:category/:id', validateCategory, validateItemIdParam, async (req, res, next) => {
  try {
    const { category, id } = req.params;
    const result = await itemService.deleteItem(category, id);

    if (result.notFound) {
      throw new NotFoundError('Item', id);
    }

    if (!result.success && result.error) {
      throw new ValidationError(result.error);
    }

    res.json({
      success: true,
      message: `Item '${id}' deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  router,
  setItemService
};
