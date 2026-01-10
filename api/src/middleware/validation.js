const { validateCharacterId, validateCharacterData } = require('../validators/character');
const { ValidationError } = require('../utils/errors');

function validateCharacterIdParam(req, res, next) {
  const { id } = req.params;
  const result = validateCharacterId(id);

  if (!result.valid) {
    return next(new ValidationError([{ field: 'id', message: result.error }]));
  }

  next();
}

function validateCharacterBody(req, res, next) {
  const result = validateCharacterData(req.body.data || req.body);

  if (!result.valid) {
    return next(new ValidationError(result.errors));
  }

  // Attach validated data to request
  req.validatedData = result.data;
  next();
}

function validateCreateCharacterBody(req, res, next) {
  // Validate ID in body
  if (!req.body.id) {
    return next(new ValidationError([{ field: 'id', message: 'Character ID is required' }]));
  }

  const idResult = validateCharacterId(req.body.id);
  if (!idResult.valid) {
    return next(new ValidationError([{ field: 'id', message: idResult.error }]));
  }

  // Validate character data
  if (!req.body.data) {
    return next(new ValidationError([{ field: 'data', message: 'Character data is required' }]));
  }

  const dataResult = validateCharacterData(req.body.data);
  if (!dataResult.valid) {
    return next(new ValidationError(dataResult.errors));
  }

  // Attach validated data to request
  req.validatedId = req.body.id;
  req.validatedData = dataResult.data;
  next();
}

module.exports = {
  validateCharacterIdParam,
  validateCharacterBody,
  validateCreateCharacterBody
};
