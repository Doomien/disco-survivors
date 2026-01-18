# Custom Configuration

This folder contains custom game configuration files that are not part of the base game.

**This directory is gitignored** - your custom configurations will not be committed to the repository.

## Available Config Files

### enemies.json
Define custom enemies that will be added to the game alongside base enemies.

See `enemies.example.json` for the format.

### players.json
Define custom player characters with their own sprites and stats.

See `players.example.json` for the format.

### items.json
Define custom weapons, projectiles, and collectibles.

## How Custom Configs Work

Custom configs **extend** base configs:
- Custom enemies are **added** to base enemies
- Custom players are **added** to base players
- If a custom config has the same ID as a base config, the custom version **overrides** the base

## Adding a New Enemy

1. Create or edit `config/custom/enemies.json`
2. Add your enemy definition (see example file)
3. Place sprite images in `assets/custom/characters/enemies/`
4. Reference the sprite paths in your config
5. Reload the game - your enemy will spawn alongside base enemies

## Adding a New Player

1. Create or edit `config/custom/players.json`
2. Add your player definition (see example file)
3. Place sprite images in `assets/custom/characters/player/`
4. Update `config/game.config.json` to set `defaultPlayer` to your player ID
5. Reload the game

## Example

Create `config/custom/enemies.json`:
```json
{
  "enemies": {
    "my_monster": {
      "name": "My Monster",
      "sprites": [
        "assets/custom/characters/enemies/monster-1.png",
        "assets/custom/characters/enemies/monster-2.png"
      ],
      "animation": { "frameTime": 12 },
      "stats": {
        "health": 5,
        "speed": 0.5,
        "attackStrength": 2,
        "attackSpeed": 600,
        "attackRange": 40
      },
      "size": { "width": 64, "height": 64 },
      "xpValue": 3
    }
  }
}
```

Then place `monster-1.png` and `monster-2.png` in `assets/custom/characters/enemies/`.

Reload the game and "My Monster" will now spawn!
