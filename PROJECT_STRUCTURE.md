# Disco Survivors - Project Structure

This document outlines the organization of the Disco Survivors project after reorganization.

## Directory Structure

```
disco-survivors/
├── assets/                      # All game assets
│   ├── characters/
│   │   ├── enemies/            # Enemy sprites
│   │   │   ├── 001_DangerDisc*.png
│   │   │   ├── 002_Trangle*.png
│   │   │   ├── 003_Tomato*.png
│   │   │   ├── 004_TheSharpSpiral*.png
│   │   │   ├── 005_13LeggedMonster*.png
│   │   │   ├── 006_ElectrifiedSword*.png
│   │   │   └── skeleton-*.png
│   │   └── player/             # Player sprites
│   │       ├── player-1.png
│   │       └── player-2.png
│   ├── items/                  # Item/weapon sprites
│   │   ├── ball-1.png
│   │   ├── ball-2.png
│   │   ├── candy.png
│   │   ├── candy-dropped.png
│   │   └── mic.png
│   ├── environment/            # Background/world sprites
│   │   └── floor.png
│   └── source/                 # Source files (e.g., .aseprite)
│       └── player-2.aseprite
├── docs/                        # Documentation
│   ├── CHARACTER_SYSTEM.md
│   ├── CHARACTER_EDITOR_README.md
│   └── ENHANCEMENTS.md
├── tools/                       # Development tools
│   ├── character-editor.html
│   └── character-editor.js
├── characters.json              # Enemy/character definitions
├── game.js                      # Main game code
├── index.html                   # Game entry point
├── README.md                    # Project README
├── LICENSE                      # License file
├── .gitignore                   # Git ignore rules
└── PROJECT_STRUCTURE.md         # This file
```

## File Descriptions

### Root Level Files

**index.html**
- Entry point for the game
- Minimal HTML structure
- Loads game.js

**game.js**
- Main game code (940 lines)
- Contains all classes: Player, Enemy, Weapon, Animation, etc.
- Game loop and rendering logic
- Event handlers

**characters.json**
- JSON data defining all enemy types
- Includes sprites, stats, animations, size
- Used by both game and character editor

### Assets Directory

**assets/characters/enemies/**
- All enemy sprite files
- Organized by numbered prefixes (001-006)
- Each enemy has 1-2 animation frames
- Auto-flipped for left-facing direction

**assets/characters/player/**
- Player character sprites
- Two animation frames
- Auto-flipped for directional movement

**assets/items/**
- Collectibles (candy)
- Weapons (mic, disco ball)
- Items dropped by enemies

**assets/environment/**
- Background tiles (floor.png)
- Repeating pattern for game world

**assets/source/**
- Original source files (.aseprite, .psd, etc.)
- Not loaded by game, kept for editing

### Documentation (docs/)

**CHARACTER_SYSTEM.md**
- How the character definition system works
- JSON schema documentation
- Adding/editing characters guide

**CHARACTER_EDITOR_README.md**
- User guide for the character editor tool
- How to use the visual editor
- Workflow recommendations

**ENHANCEMENTS.md**
- Recommended improvements for codebase
- Prioritized enhancement roadmap
- Implementation guides

### Tools (tools/)

**character-editor.html**
- Visual character editor interface
- Create/edit/delete characters
- Import/export JSON

**character-editor.js**
- Editor application logic
- Form handling and validation
- JSON manipulation

## Path References

### In game.js
All asset paths are relative to the root directory:
```javascript
makeImage('assets/characters/player/player-1.png')
makeImage('assets/items/candy.png')
makeImage('assets/environment/floor.png')
```

### In characters.json
All sprite paths are relative to the root directory:
```json
{
  "sprites": [
    "assets/characters/enemies/skeleton-1.png",
    "assets/characters/enemies/skeleton-2.png"
  ]
}
```

### In character-editor.js
Uses relative path from tools/ directory:
```javascript
fetch('../characters.json')
```

## File Counts

- **Total PNG files**: 20 (after cleanup)
  - Enemy sprites: 14
  - Player sprites: 2
  - Item sprites: 4
- **JavaScript files**: 2 (game.js, character-editor.js)
- **HTML files**: 2 (index.html, character-editor.html)
- **JSON files**: 1 (characters.json)
- **Documentation**: 4 markdown files

## Removed Files

The following files were removed during cleanup:
- `*copy.png` - Duplicate image files
- `*.L.png` - Left-facing sprites (now auto-generated)
- `player-1.L-export.png` - Temporary export file

## Git Configuration

**.gitignore** includes:
- OS files (.DS_Store, Thumbs.db)
- Editor files (.vscode/, *.swp)
- Temporary files (Temporary/, *.tmp)
- Build artifacts (dist/, *.min.js)
- Source files (*.aseprite, *.psd)
- Backup files (*copy.png, *.bak)

## Running the Game

1. **Play the game**: Open `index.html` in a web browser
2. **Edit characters**: Open `tools/character-editor.html` in a web browser
3. **Local server** (recommended for development):
   ```bash
   # Python 3
   python -m http.server 8000

   # Then visit: http://localhost:8000
   ```

## Adding New Assets

### New Enemy
1. Create sprite images (PNG)
2. Place in `assets/characters/enemies/`
3. Add entry to `characters.json` with full path
4. Game will automatically load and spawn it

### New Item/Weapon
1. Create sprite image
2. Place in `assets/items/`
3. Add to game.js constants
4. Implement weapon class if needed

### New Background
1. Create tileable image
2. Replace `assets/environment/floor.png`
3. Or add new file and update game.js reference

## Notes

- All sprite paths use forward slashes (/) for cross-platform compatibility
- Player sprites use auto-flipping for left direction
- Enemy sprites loaded dynamically from characters.json
- Character editor is standalone and doesn't require build process
- No ES6 modules yet - all code in single files for simplicity

## Next Steps

See [docs/ENHANCEMENTS.md](docs/ENHANCEMENTS.md) for recommended improvements:
- Code modularization (ES6 modules)
- Asset loading system
- Configuration management
- Performance optimizations
