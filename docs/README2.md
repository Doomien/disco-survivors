# Disco Survivors - Enhanced Edition

A Vampire Survivors-style arcade game with disco aesthetics. Survive waves of enemies while your weapons automatically attack!

🎮 **[Play the Original](https://youtu.be/B6DTBqDC7Eo)**

## About This Fork

This is an enhanced version of the original [disco-survivors](https://github.com/holdenrehg/disco-survivors) by [@holdenrehg](https://github.com/holdenrehg). This fork adds:

- 🎨 **7 Enemy Types** (up from 1)
- ⚙️ **JSON-Based Character System** - Easy to add/edit enemies
- 🖼️ **Automatic Sprite Flipping** - No more duplicate left-facing sprites needed
- 🛠️ **Visual Character Editor** - Edit enemies without touching code
- 📁 **Organized Project Structure** - Clean asset organization
- 📚 **Comprehensive Documentation**

## Features

### Gameplay
- **7 Unique Enemies**: Skeleton, Danger Disc, Trangle, Tomato, Sharp Spiral, 13-Legged Monster, Electrified Sword
- **2 Starting Weapons**: Orbiting Mic and Disco Ball AOE
- **XP System**: Level up by collecting candy dropped by enemies
- **Wave-Based Spawning**: 50 enemies every 5 seconds
- **Progressive Difficulty**: Different enemy types with varying stats

### Technical
- Vanilla JavaScript (no dependencies)
- HTML5 Canvas rendering
- JSON-based character configuration
- Visual character editor tool
- Automatic left-facing sprite generation
- Clean, organized codebase

## How to Play

### Docker (Recommended)
The easiest way to run the game is with Docker:

```bash
# Build and run with docker-compose
docker compose up -d

# Then visit: http://localhost:3333
```

To stop the container:
```bash
docker compose down
```

### Online
Open `index.html` in your web browser.

### Local Development
For best results, use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server

# Then visit: http://localhost:8000
```

### Controls
- **Arrow Keys** - Move player
- **0 Key** - Destroy all enemies (debug)

## Project Structure

```
disco-survivors/
├── assets/              # All game sprites
│   ├── characters/      # Player & enemy sprites
│   ├── items/          # Weapons & collectibles
│   └── environment/    # Background tiles
├── docs/               # Documentation
├── tools/              # Character editor
├── game.js            # Main game code
├── index.html         # Game entry point
└── characters.json    # Enemy definitions
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed information.

## Character Editor

This fork includes a visual character editor for creating and editing enemies without coding!

1. Open `tools/character-editor.html`
2. Edit existing characters or create new ones
3. Download the updated `characters.json`
4. Replace the file in the root directory
5. Reload the game!

See [docs/CHARACTER_EDITOR_README.md](docs/CHARACTER_EDITOR_README.md) for the full guide.

## Adding New Enemies

### Method 1: Use the Character Editor (Recommended)
1. Open `tools/character-editor.html`
2. Click "New Character"
3. Fill in stats, sprites, etc.
4. Download JSON
5. Replace `characters.json`

### Method 2: Edit JSON Manually
1. Add sprites to `assets/characters/enemies/`
2. Add entry to `characters.json`:
   ```json
   {
     "my_enemy": {
       "name": "My Enemy",
       "sprites": ["assets/characters/enemies/my-sprite.png"],
       "stats": { "health": 5, "speed": 0.5, ... }
     }
   }
   ```
3. Reload game - enemy spawns automatically!

See [docs/CHARACTER_SYSTEM.md](docs/CHARACTER_SYSTEM.md) for details.

## API Service

This fork includes a REST API for programmatic character management!

📖 **[Complete API Documentation](docs/API_REFERENCE.md)** - Full API reference with examples, validation rules, and troubleshooting

### Starting the API

The API runs automatically when you start Docker:

```bash
docker compose up -d
```

- **Game**: http://localhost:3333
- **API**: http://localhost:3333/api/v1 (proxied through nginx)
- **Direct API Access**: http://localhost:3334 (if needed)

### API Endpoints

**Base URL**: `/api/v1`

#### Health Check
```bash
GET /api/v1/health
```

#### List All Characters
```bash
GET /api/v1/characters
```

**Response**:
```json
{
  "success": true,
  "data": {
    "skeleton": { /* character data */ },
    "danger_disc": { /* character data */ }
  }
}
```

#### Get Single Character
```bash
GET /api/v1/characters/:id
```

**Example**:
```bash
curl http://localhost:3333/api/v1/characters/skeleton
```

#### Create Character
```bash
POST /api/v1/characters
Content-Type: application/json

{
  "id": "zombie",
  "data": {
    "name": "Zombie",
    "sprites": ["assets/characters/enemies/zombie.png"],
    "animation": { "frameTime": 12 },
    "stats": {
      "health": 4,
      "speed": 0.3,
      "attackStrength": 2,
      "attackSpeed": 600,
      "attackRange": 40
    },
    "size": { "width": 64, "height": 70 },
    "xpValue": 2
  }
}
```

#### Update Character
```bash
PUT /api/v1/characters/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "sprites": [...],
  "animation": {...},
  "stats": {...},
  "size": {...},
  "xpValue": 3
}
```

#### Delete Character
```bash
DELETE /api/v1/characters/:id
```

### Features

- **Automatic Backups**: Every write creates a timestamped backup in `backups/`
- **File Locking**: Prevents concurrent write conflicts
- **Validation**: Joi schema validation ensures data integrity
- **Error Handling**: Consistent error responses with codes
- **CORS Enabled**: Accessible from browsers and tools

### Response Format

**Success**:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  }
}
```

## Documentation

- **[CHARACTER_SYSTEM.md](docs/CHARACTER_SYSTEM.md)** - Character definition system
- **[CHARACTER_EDITOR_README.md](docs/CHARACTER_EDITOR_README.md)** - Editor guide (file-based & API-based)
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete REST API documentation
- **[ENHANCEMENTS.md](docs/ENHANCEMENTS.md)** - Future improvements
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - File organization
- **[REORGANIZATION_SUMMARY.md](REORGANIZATION_SUMMARY.md)** - Change log

## Credits

### Original
- **Created by**: [@holdenrehg](https://github.com/holdenrehg)
- **Original Repository**: [disco-survivors](https://github.com/holdenrehg/disco-survivors)
- **Tutorial Video**: [YouTube](https://youtu.be/B6DTBqDC7Eo)

### Enhanced Version
- JSON character system
- Visual character editor
- Project reorganization
- 6 additional enemy types
- Documentation

### Assets
Player and skeleton sprites from the original project.
Additional enemy sprites created for this fork.

## License

MIT License - See [LICENSE](LICENSE) file for details.

Original project by Holden Rehg. Enhanced version maintains the same license.

## Contributing

Contributions welcome! See [docs/ENHANCEMENTS.md](docs/ENHANCEMENTS.md) for ideas.

### Quick Start
1. Fork this repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Changelog

### Enhanced Version (v2.2)
- ✅ REST API for character management
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Automatic backups on every write
- ✅ File locking for concurrent access protection
- ✅ Joi validation for data integrity

### Enhanced Version (v2.1)
- ✅ Docker support with nginx for easy deployment
- ✅ Production-ready containerization

### Enhanced Version (v2.0)
- ✅ Added 6 new enemy types (7 total)
- ✅ JSON-based character definition system
- ✅ Visual character editor tool
- ✅ Automatic sprite flipping
- ✅ Organized asset structure (assets/, docs/, tools/)
- ✅ Comprehensive documentation
- ✅ Modular game.js (separated from HTML)
- ✅ Git workflow improvements

### Original Version (v1.0)
- Initial release by [@holdenrehg](https://github.com/holdenrehg)
- Core game mechanics
- Player movement and weapons
- Basic enemy (skeleton)
- XP and leveling system

## Future Enhancements

See [docs/ENHANCEMENTS.md](docs/ENHANCEMENTS.md) for planned improvements:
- ES6 module system
- Asset loading screen
- Debug mode
- Performance optimizations
- Additional weapons and power-ups
- Boss battles
- Sound effects

---

**Enjoy the game!** 🕺💀✨
