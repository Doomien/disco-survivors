const Joi = require('joi');

// Item ID validation schema (shared across all item types)
const itemIdSchema = Joi.string()
  .pattern(/^[a-zA-Z0-9_]+$/)
  .min(1)
  .max(50)
  .required()
  .messages({
    'string.pattern.base': 'Item ID must contain only letters, numbers, and underscores',
    'string.min': 'Item ID must be at least 1 character long',
    'string.max': 'Item ID must not exceed 50 characters'
  });

// Weapon validation schema
const weaponDataSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Weapon name must be at least 1 character long',
      'string.max': 'Weapon name must not exceed 100 characters',
      'any.required': 'Weapon name is required'
    }),

  enabled: Joi.boolean()
    .default(true),

  type: Joi.string()
    .valid('weapon')
    .default('weapon'),

  sprite: Joi.string()
    .pattern(/\.(png|jpg|jpeg|gif)$/i)
    .allow('')
    .messages({
      'string.pattern.base': 'Sprite path must end with .png, .jpg, .jpeg, or .gif'
    }),

  attackSpeed: Joi.number()
    .integer()
    .min(100)
    .max(60000)
    .required()
    .messages({
      'number.min': 'Attack speed must be at least 100ms',
      'number.max': 'Attack speed must not exceed 60000ms'
    }),

  attackAnimationFrames: Joi.number()
    .integer()
    .min(1)
    .max(60)
    .default(5),

  attackStrength: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .default(1),

  level: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(1),

  radius: Joi.number()
    .integer()
    .min(1)
    .max(1000),

  projectile: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/),

  projectileSpeed: Joi.number()
    .min(0.1)
    .max(50)
    .default(2),

  directions: Joi.number()
    .integer()
    .min(1)
    .max(36)
    .default(8)
});

// Projectile validation schema
const projectileDataSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Projectile name must be at least 1 character long',
      'string.max': 'Projectile name must not exceed 100 characters',
      'any.required': 'Projectile name is required'
    }),

  sprites: Joi.array()
    .items(Joi.string().pattern(/\.(png|jpg|jpeg|gif)$/i).messages({
      'string.pattern.base': 'Sprite paths must end with .png, .jpg, .jpeg, or .gif'
    }))
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one sprite is required',
      'array.max': 'Maximum 20 sprites allowed',
      'any.required': 'Sprites array is required'
    }),

  animation: Joi.object({
    frameTime: Joi.number()
      .integer()
      .min(1)
      .max(60)
      .required()
      .messages({
        'number.min': 'Frame time must be at least 1',
        'number.max': 'Frame time must not exceed 60'
      })
  }).required(),

  speed: Joi.number()
    .min(0.1)
    .max(50)
    .required()
    .messages({
      'number.min': 'Speed must be at least 0.1',
      'number.max': 'Speed must not exceed 50'
    }),

  attackStrength: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .required()
    .messages({
      'number.min': 'Attack strength must be at least 0',
      'number.max': 'Attack strength must not exceed 1000'
    }),

  maxDistance: Joi.number()
    .integer()
    .min(100)
    .max(5000)
    .default(800),

  size: Joi.object({
    width: Joi.number()
      .integer()
      .min(1)
      .max(500)
      .required(),
    height: Joi.number()
      .integer()
      .min(1)
      .max(500)
      .required()
  }).required()
});

// Collectible validation schema
const collectibleDataSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Collectible name must be at least 1 character long',
      'string.max': 'Collectible name must not exceed 100 characters',
      'any.required': 'Collectible name is required'
    }),

  sprite: Joi.string()
    .pattern(/\.(png|jpg|jpeg|gif)$/i)
    .messages({
      'string.pattern.base': 'Sprite path must end with .png, .jpg, .jpeg, or .gif'
    }),

  sprites: Joi.array()
    .items(Joi.string().pattern(/\.(png|jpg|jpeg|gif)$/i).messages({
      'string.pattern.base': 'Sprite paths must end with .png, .jpg, .jpeg, or .gif'
    }))
    .min(1)
    .max(20),

  droppedSprite: Joi.string()
    .pattern(/\.(png|jpg|jpeg|gif)$/i)
    .messages({
      'string.pattern.base': 'Dropped sprite path must end with .png, .jpg, .jpeg, or .gif'
    }),

  attractRadius: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .default(200),

  pickupRadius: Joi.number()
    .integer()
    .min(1)
    .max(500)
    .default(50),

  xpValue: Joi.number()
    .integer()
    .min(0)
    .max(10000)
    .default(1),

  dropWeight: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .default(0),

  effect: Joi.string()
    .valid('speedBoost', 'heal')
    .allow(null, ''),

  healAmount: Joi.number()
    .integer()
    .min(1)
    .max(1000),

  grantsWeapon: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/),

  size: Joi.object({
    width: Joi.number()
      .integer()
      .min(1)
      .max(500),
    height: Joi.number()
      .integer()
      .min(1)
      .max(500)
  })
}).custom((value, helpers) => {
  if (!value.sprite && (!value.sprites || value.sprites.length === 0)) {
    return helpers.error('any.custom', { message: 'Collectible requires sprite or sprites' });
  }

  if (value.effect === 'heal' && !(value.healAmount > 0)) {
    return helpers.error('any.custom', { message: 'healAmount must be > 0 when effect is heal' });
  }

  return value;
}).messages({
  'any.custom': '{{#message}}'
});

// Reserved IDs that cannot be used
const RESERVED_IDS = ['health', 'status', 'api', 'v1', 'items', 'new', 'edit', 'delete', 'weapons', 'projectiles', 'collectibles'];

function validateItemId(id) {
  const { error } = itemIdSchema.validate(id);

  if (error) {
    return { valid: false, error: error.details[0].message };
  }

  if (RESERVED_IDS.includes(id.toLowerCase())) {
    return { valid: false, error: `'${id}' is a reserved ID and cannot be used` };
  }

  return { valid: true };
}

function validateWeaponData(data) {
  const { error, value } = weaponDataSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { valid: false, errors: details };
  }

  return { valid: true, data: value };
}

function validateProjectileData(data) {
  const { error, value } = projectileDataSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { valid: false, errors: details };
  }

  return { valid: true, data: value };
}

function validateCollectibleData(data) {
  const { error, value } = collectibleDataSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { valid: false, errors: details };
  }

  return { valid: true, data: value };
}

module.exports = {
  itemIdSchema,
  weaponDataSchema,
  projectileDataSchema,
  collectibleDataSchema,
  validateItemId,
  validateWeaponData,
  validateProjectileData,
  validateCollectibleData,
  RESERVED_IDS
};
