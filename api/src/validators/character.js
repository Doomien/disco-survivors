const Joi = require('joi');

// Character ID validation schema
const characterIdSchema = Joi.string()
  .pattern(/^[a-z0-9_]+$/)
  .min(1)
  .max(50)
  .required()
  .messages({
    'string.pattern.base': 'Character ID must contain only lowercase letters, numbers, and underscores',
    'string.min': 'Character ID must be at least 1 character long',
    'string.max': 'Character ID must not exceed 50 characters'
  });

// Character data validation schema
const characterDataSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Character name must be at least 1 character long',
      'string.max': 'Character name must not exceed 100 characters',
      'any.required': 'Character name is required'
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
        'number.base': 'Frame time must be a number',
        'number.integer': 'Frame time must be an integer',
        'number.min': 'Frame time must be at least 1',
        'number.max': 'Frame time must not exceed 60',
        'any.required': 'Frame time is required'
      })
  }).required(),

  stats: Joi.object({
    health: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'number.min': 'Health must be at least 1',
        'number.max': 'Health must not exceed 1000'
      }),

    speed: Joi.number()
      .min(0)
      .max(10)
      .required()
      .messages({
        'number.min': 'Speed must be at least 0',
        'number.max': 'Speed must not exceed 10'
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

    attackSpeed: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'number.min': 'Attack speed must be at least 1',
        'number.max': 'Attack speed must not exceed 10000'
      }),

    attackRange: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'number.min': 'Attack range must be at least 1',
        'number.max': 'Attack range must not exceed 1000'
      })
  }).required(),

  size: Joi.object({
    width: Joi.number()
      .integer()
      .min(1)
      .max(500)
      .required()
      .messages({
        'number.min': 'Width must be at least 1',
        'number.max': 'Width must not exceed 500'
      }),

    height: Joi.number()
      .integer()
      .min(1)
      .max(500)
      .required()
      .messages({
        'number.min': 'Height must be at least 1',
        'number.max': 'Height must not exceed 500'
      })
  }).required(),

  xpValue: Joi.number()
    .integer()
    .min(0)
    .max(10000)
    .required()
    .messages({
      'number.min': 'XP value must be at least 0',
      'number.max': 'XP value must not exceed 10000',
      'any.required': 'XP value is required'
    }),

  spawnWeight: Joi.number()
    .min(0)
    .max(100)
    .default(1)
    .messages({
      'number.min': 'Spawn weight must be at least 0',
      'number.max': 'Spawn weight must not exceed 100'
    })
});

// Reserved character IDs that cannot be used
const RESERVED_IDS = ['health', 'status', 'api', 'v1', 'characters', 'new', 'edit', 'delete'];

function validateCharacterId(id) {
  const { error } = characterIdSchema.validate(id);

  if (error) {
    return { valid: false, error: error.details[0].message };
  }

  if (RESERVED_IDS.includes(id.toLowerCase())) {
    return { valid: false, error: `'${id}' is a reserved ID and cannot be used` };
  }

  return { valid: true };
}

function validateCharacterData(data) {
  const { error, value } = characterDataSchema.validate(data, {
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
  characterIdSchema,
  characterDataSchema,
  validateCharacterId,
  validateCharacterData,
  RESERVED_IDS
};
