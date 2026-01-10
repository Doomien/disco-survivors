# Character Editor - User Guide

There are now **two character editors** available, each designed for a different workflow:

## Editor Comparison

| Feature | character-editor.html (File-Based) | character-editor2.html (API-Based) |
|---------|-----------------------------------|-----------------------------------|
| **Use Case** | Quick edits, offline work | Production workflow with Docker |
| **Saves To** | Downloaded JSON file | API server (auto-backup) |
| **Requires API** | No | Yes (Docker required) |
| **Auto-Save** | No (manual download) | Yes (instant) |
| **Backups** | Manual | Automatic |
| **Best For** | Testing, quick changes, offline | Team collaboration, production |

---

## Character Editor 1 (File-Based)

**Location**: [tools/character-editor.html](../tools/character-editor.html)

### Quick Start

1. Open `tools/character-editor.html` in your web browser
2. The editor loads from `characters.json` automatically
3. Make your changes
4. Click "Download JSON" when finished
5. Replace `characters.json` in the project root with the downloaded file

### Features

- ✓ Works offline (no API required)
- ✓ Load/save JSON files directly
- ✓ Simple file-based workflow
- ✓ All changes kept in browser memory until downloaded
- ✗ No auto-save
- ✗ No automatic backups
- ✗ Manual file management required

### When to Use

- Quick testing of character stats
- Offline editing
- Single-user development
- Don't want to run Docker
- Need direct control over JSON files

### Workflow

1. Open `tools/character-editor.html` in browser
2. Editor auto-loads from `../characters.json`
3. Select a character or create new one
4. Edit properties as needed
5. Click "Save Changes" (saves to memory only)
6. Click "Download JSON" when done with all edits
7. Replace `characters.json` in project root
8. Reload game to see changes

---

## Character Editor 2 (API-Based) **[Recommended for Docker]**

**Location**: [tools/character-editor2.html](../tools/character-editor2.html)

### Quick Start

1. Start Docker: `docker compose up -d`
2. Open http://localhost:3333/tools/character-editor2.html
3. Verify "API Connected" status in header
4. Make your changes
5. Click "Save Changes" (saves immediately to server)
6. Refresh game to see changes
7. Changes are automatically backed up

### Features

- ✓ Real-time API integration
- ✓ Automatic server-side backups
- ✓ Instant saves to production
- ✓ API health status indicator
- ✓ Comprehensive validation before save
- ✓ Multi-user safe (with coordination)
- ✓ Professional dark theme UI
- ✗ Requires Docker/API to be running
- ✗ Cannot work offline

### When to Use

- Production environment with Docker
- Team development
- Want automatic backups
- Need instant save to server
- API-first development workflow

### Workflow

1. Ensure Docker is running: `docker compose ps`
2. Open http://localhost:3333/tools/character-editor2.html
3. Check API status indicator (should show "API Connected")
4. Click "Refresh" to load latest characters from server
5. Select a character or create new one
6. Edit properties
7. Click "Save Changes" (saves to API immediately)
8. Automatic backup created in `api/backups/`
9. Refresh game to see changes instantly

---

## Common Features (Both Editors)

### Character Properties

#### Basic Information
- **Character ID** - Unique identifier (read-only after creation)
- **Display Name** - Human-readable name shown in logs

#### Sprites
- **Sprite Animation Frames** - PNG/JPG/GIF files for animation
- **Note**: Only right-facing sprites needed - left is auto-generated!
- Add multiple frames for smooth animation with + button
- Remove frames with × button
- Supports 1-20 sprites per character

#### Animation
- **Frame Time** - Game frames per sprite frame (1-60)
  - 60 frames = 1 second at 60 FPS
  - Lower value = faster animation
  - Typical values: 10-15 for fast enemies, 15-20 for slow enemies

#### Stats
- **Health** - Hit points (1-1000)
- **Speed** - Pixels per frame (0-10)
  - 0.4 = slow, 0.8 = medium, 1.5+ = fast
- **Attack Strength** - Damage per hit (0-1000)
- **Attack Speed** - Cooldown in milliseconds (1-10000)
  - 500ms = attacks twice per second
- **Attack Range** - Range in pixels (1-1000)
  - 40 = melee range, 100+ = ranged

#### Size
- **Width** - Character width in pixels (1-500)
- **Height** - Character height in pixels (1-500)

#### Rewards
- **XP Value** - Experience points dropped when defeated (0-10000)

### Validation Rules

Both editors enforce the same validation rules:

#### Character ID
- **Pattern**: Only lowercase letters, numbers, and underscores
- **Length**: 1-50 characters
- **Reserved IDs**: Cannot use `health`, `status`, `api`, `v1`, `characters`, `new`, `edit`, `delete`
- **Examples**: `skeleton`, `danger_disc`, `boss_1`

#### Field Limits
- **Name**: 1-100 characters
- **Sprites**: 1-20 sprite files (must end with .png, .jpg, .jpeg, or .gif)
- **Frame Time**: 1-60 frames
- **Health**: 1-1000
- **Speed**: 0-10 pixels per frame
- **Attack Strength**: 0-1000
- **Attack Speed**: 1-10000 milliseconds
- **Attack Range**: 1-1000 pixels
- **Width/Height**: 1-500 pixels each
- **XP Value**: 0-10000

---

## Tips & Tricks

### Creating Balanced Characters

**Fast Enemy** (e.g., "Speedster"):
- Low health (1-2)
- High speed (1.0-2.0)
- Low attack damage (1)
- Small size (40x40)
- Low XP value (1-2)

**Tank Enemy** (e.g., "Brute"):
- High health (8-10)
- Low speed (0.2-0.3)
- Medium attack damage (2-3)
- Large size (80x80)
- Medium XP value (3-5)

**Boss Enemy**:
- Very high health (20-50)
- Medium speed (0.5)
- High attack damage (5-10)
- Larger size (100x100+)
- High XP value (10-50)

### Sprite Setup

If you don't have custom sprites yet:
- Use existing sprites as placeholders (e.g., `assets/characters/enemies/skeleton-1.png`)
- Different enemy types can share sprites initially
- Focus on stats and behavior first, visuals later
- **Important**: You only need right-facing sprites - the game flips them automatically!
- All sprite paths should start with `assets/characters/enemies/`

---

## Troubleshooting

### File-Based Editor (character-editor.html)

**"Could not load characters.json"**
- Ensure `characters.json` exists in project root
- Try loading it manually with "Load JSON File" button
- Check browser console (F12) for errors
- Verify you're opening the file from the correct directory

**Changes not appearing in game**
- Make sure you clicked "Download JSON"
- Replace `characters.json` in the project root (not in tools/)
- Verify the file was actually replaced (check modification timestamp)
- Hard refresh the game page (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for errors loading the JSON

**Can't create new character**
- Character ID must be unique
- Use only lowercase letters, numbers, and underscores
- Avoid reserved IDs (health, status, api, etc.)

### API-Based Editor (character-editor2.html)

**"API Disconnected" error**
- Ensure Docker is running: `docker compose ps`
- Check API is accessible: `curl http://localhost:3334/api/v1/health`
- Restart Docker if needed: `docker compose restart api`
- Verify port 3334 is not blocked by firewall

**"Cannot connect to API" error**
- Docker containers must be running
- Check logs: `docker compose logs api`
- Verify API port 3334 is not in use by another service
- Try accessing http://localhost:3334/api/v1/health directly

**Changes not appearing in game**
- Hard refresh the game page (Ctrl+F5 or Cmd+Shift+R)
- Check that save was successful (look for ✓ success message)
- Try clicking "Refresh" button in editor to reload from server
- Check Docker logs for errors: `docker compose logs game`

**"Failed to save character" with validation errors**
- Read the error message carefully
- Ensure all required fields are filled
- Check that values are within valid ranges
- Sprite paths must end with .png, .jpg, .jpeg, or .gif
- At least one sprite is required

### Both Editors

**Character ID validation error**
- Use only lowercase letters, numbers, and underscores
- Length must be 1-50 characters
- Cannot use reserved IDs
- Examples: `zombie`, `fast_ghost`, `boss_1`

**Sprites not showing in game**
- Ensure sprite paths start with `assets/characters/enemies/`
- Sprite file names are case-sensitive
- Verify files actually exist in the assets folder
- Supported formats: .png, .jpg, .jpeg, .gif
- **Remember**: Only right-facing sprites needed - left is auto-flipped!

**Form fields not validating**
- Check browser console for JavaScript errors
- Try refreshing the page
- Ensure you're using a modern browser (Chrome, Firefox, Edge, Safari)

---

## Advanced Usage

### Backup Strategy

**File-Based Editor**:
1. Download your current JSON before major changes
2. Save with date/version (e.g., `characters_2026-01-10.json`)
3. Make changes
4. Download again
5. Keep multiple versions for easy rollback

**API-Based Editor**:
- Automatic backups created in `api/backups/characters_TIMESTAMP.json`
- No manual backup needed
- To restore: copy backup file to `characters.json` and restart Docker
- Backups are timestamped for easy identification

### Bulk Editing

**File-Based**:
1. Load current JSON
2. Edit characters one by one (changes stored in memory)
3. Download when all changes complete
4. All edits are included in one file

**API-Based**:
1. Edit characters one by one
2. Each save creates automatic backup
3. Use "Refresh" button to reload from server if needed
4. Can coordinate with team members

### Sharing Characters

To share custom characters:
1. **File-Based**: Share the downloaded JSON file
2. **API-Based**: Download backup from `api/backups/` folder
3. Recipients can load in either editor
4. **Don't forget**: Sprite files must be shared separately and placed in `assets/characters/enemies/`

---

## Which Editor Should I Use?

### Use File-Based Editor (character-editor.html) if you:
- ✓ Are not using Docker
- ✓ Need to work offline
- ✓ Are doing quick tests
- ✓ Are working alone
- ✓ Prefer manual control over files
- ✓ Want simplicity

### Use API-Based Editor (character-editor2.html) if you:
- ✓ Are using Docker for development
- ✓ Want automatic backups
- ✓ Need instant saves
- ✓ Are working with a team
- ✓ Want production-ready workflow
- ✓ Prefer modern tooling

**Recommendation**: If you have Docker running, use the API-based editor (character-editor2.html) for the best experience.

---

## Future Enhancements

Potential features for future versions (in either or both editors):
- Sprite preview/upload directly in editor
- Duplicate character function
- Undo/redo support
- Validation warnings for unbalanced stats
- Import/export individual characters
- Templates for common enemy types
- Sprite library browser
- Batch operations (edit multiple characters at once)

---

For technical details about the character system and JSON structure, see [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md).
