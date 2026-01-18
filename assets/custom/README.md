# Custom Assets

This folder contains custom game assets that are not part of the base game.

**This directory is gitignored** - your custom content will not be committed to the repository.

## Directory Structure

```
assets/custom/
├── characters/
│   ├── enemies/     # Custom enemy sprites
│   └── player/      # Custom player sprites
├── environment/     # Custom environment/background tiles
└── items/          # Custom item sprites
```

## Adding Custom Assets

### Enemy Sprites
1. Place your sprite images in `characters/enemies/`
2. Add the enemy definition to `config/custom/enemies.json`
3. Reference the sprite paths in the config

Example path: `assets/custom/characters/enemies/my-enemy-1.png`

### Player Sprites
1. Place your sprite images in `characters/player/`
2. Add the player definition to `config/custom/players.json`
3. Provide 4 sprites for animation (or reuse the same sprite)

Example path: `assets/custom/characters/player/my-character-1.png`

### Items
1. Place item sprites in `items/`
2. Add item definition to `config/custom/items.json`

## Sprite Guidelines

- **Format**: PNG with transparency recommended
- **Enemy size**: 60x66 pixels typical (configurable in JSON)
- **Player size**: Variable (set in player config)
- **Naming**: Use descriptive names with numbers for animation frames
  - `my-enemy-1.png`, `my-enemy-2.png`, etc.

## See Also

- Example configs in `config/custom/*.example.json`
- Base assets in `assets/base/` for reference
