const express = require('express');
const router = express.Router();
const {
  validateCharacterIdParam,
  validateCharacterBody,
  validateCreateCharacterBody
} = require('../middleware/validation');
const { NotFoundError, ConflictError } = require('../utils/errors');

// This will be injected by the main app
let fileService;

function setFileService(service) {
  fileService = service;
}

// GET /api/v1/characters - Get all characters
router.get('/', async (req, res, next) => {
  try {
    const characters = await fileService.getAllCharacters();

    res.json({
      success: true,
      data: characters
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/characters/:id - Get character by ID
router.get('/:id', validateCharacterIdParam, async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await fileService.getCharacter(id);

    if (!character) {
      throw new NotFoundError('Character', id);
    }

    res.json({
      success: true,
      data: character
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/characters - Create new character
router.post('/', validateCreateCharacterBody, async (req, res, next) => {
  try {
    const { validatedId, validatedData } = req;

    const result = await fileService.createCharacter(validatedId, validatedData);

    if (result.exists) {
      throw new ConflictError('Character', validatedId);
    }

    res.status(201).json({
      success: true,
      data: {
        id: validatedId,
        character: result.data
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/characters/:id - Update character
router.put('/:id', validateCharacterIdParam, validateCharacterBody, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { validatedData } = req;

    const result = await fileService.updateCharacter(id, validatedData);

    if (result.notFound) {
      throw new NotFoundError('Character', id);
    }

    res.json({
      success: true,
      data: {
        id,
        character: result.data
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/characters/:id - Delete character
router.delete('/:id', validateCharacterIdParam, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await fileService.deleteCharacter(id);

    if (result.notFound) {
      throw new NotFoundError('Character', id);
    }

    res.json({
      success: true,
      data: {
        id,
        deleted: true
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, setFileService };
