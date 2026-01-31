# Agent Handoff Document - Disco Survivors

**Last Updated**: 2026-01-31
**Project Status**: Phase 1 Complete, Phase 2 Pending
**Repository**: https://github.com/Doomien/disco-survivors

---

## Quick Summary

**What is this?** A web-based survival game with an over-engineered backend for easy character creation. The project is mid-refactor to separate the game engine from content (base vs custom content packs).

**Current State**:
- ✅ **Phase 0 & 1 Complete** - Engine is data-driven, loads from config files
- ❌ **Phase 2 Incomplete** - API and character editor still use old structure
- ❌ **No Pack Selection** - System only supports base + custom merge (no UI to select packs)

---

## Architecture Overview

### Current Structure (Post Phase 1)

```
disco-survivors/
├── game.js                    # Engine - loads from configs
├── index.html                 # Entry point
├── config/
│   ├── game.config.json       # Main settings
│   ├── base/                  # Base content (committed)
│   │   ├── enemies.json
│   │   ├── players.json
│   │   └── items.json
│   └── custom/                # Custom content (GITIGNORED)
│       ├── enemies.json
│       ├── players.json
│       └── items.json
├── assets/
│   ├── base/                  # Base assets (committed)
│   │   ├── characters/
│   │   ├── items/
│   │   └── environment/
│   └── custom/                # Custom assets (GITIGNORED)
│       └── characters/
├── api/                       # REST API (still uses old paths)
│   └── src/routes/
│       ├── characters.js      # Needs update to use new configs
│       └── uploads.js         # Image upload endpoint
├── tools/
│   └── character-editor2.html # Web character editor (still uses old paths)
└── characters.json            # OLD - kept for backward compat, will be removed
```

### How It Works Now

1. **Game loads** → reads `config/game.config.json`
2. **Loads configs** → merges base + custom for enemies, players, items
3. **Renders game** → uses merged config data
4. **Character editor** → still saves to old `characters.json` ❌

---

## Key Documents

### Phase Summaries
- **[PHASE0_SUMMARY.md](PHASE0_SUMMARY.md)** - Directory restructure completed
- **[PHASE1_SUMMARY.md](PHASE1_SUMMARY.md)** - Data-driven system implementation
- **[PHASE0_CLEANUP_LIST.md](PHASE0_CLEANUP_LIST.md)** - Files to delete after Phase 2

### Planning Docs
- **[docs/ProjectPlan_Restructure.md](docs/ProjectPlan_Restructure.md)** - Full project plan (Phases 0-3)
- **[docs/SETUP-IMPROVEMENTS.md](docs/SETUP-IMPROVEMENTS.md)** - Docker/workflow improvements

### Technical Docs
- **[docs/README2.md](docs/README2.md)** - Project overview
- **[docs/archive/ProjectPlan/README.md](docs/archive/ProjectPlan/README.md)** - Original project plan

---

## What Works

### ✅ Game Engine (game.js)
- Fully data-driven - loads all entities from JSON configs
- Auto-merges base + custom configs at startup
- No hardcoded asset paths (except floor tile)
- Config functions: `loadGameConfig()`, `loadPlayerConfig()`, `loadItemConfig()`, `loadCharacterData()`

### ✅ Content Separation
- Base content in `config/base/` and `assets/base/` (committed to git)
- Custom content in `config/custom/` and `assets/custom/` (gitignored)
- `.gitignore` properly excludes custom folders

### ✅ Docker Setup
- Volume mounts for live file updates (no rebuild needed)
- Disabled nginx caching for development
- Image upload API endpoint at `/api/v1/uploads/character-sprite`

---

## What Doesn't Work / Needs Completion

### ❌ Phase 2 - Content Overlay System

**API Service (Priority: HIGH)**
- [ ] Update API to read from `config/base/enemies.json` + `config/custom/enemies.json`
- [ ] Merge configs on read, save to appropriate location (base vs custom)
- [ ] Update environment variables (CHARACTERS_FILE → ENEMIES_CONFIG)
- [ ] Add PLAYERS_CONFIG, ITEMS_CONFIG support
- [ ] Update docker-compose.yml volume mounts

**Files to Update:**
- `api/src/index.js` - config paths
- `api/src/routes/characters.js` - load/save logic
- `api/src/services/fileService.js` - file operations
- `docker-compose.yml` - env vars and volumes

**Character Editor (Priority: HIGH)**
- [ ] Update editor to save to `config/custom/enemies.json` (not old `characters.json`)
- [ ] Add toggle: "Save to base" vs "Save to custom"
- [ ] Show which content pack each character belongs to
- [ ] Update upload endpoint to use `assets/custom/` path

**Files to Update:**
- `tools/character-editor2.js` - API endpoints
- `tools/character-editor2.html` - UI for base/custom toggle

**Asset Resolution System (Priority: MEDIUM)**
- [ ] Implement fallback: try custom path first, fall back to base
- [ ] Add logging for missing assets
- [ ] Create helper function for asset loading

**Content Pack Selection (Priority: LOW - Not in original plan)**
- [ ] Add UI to select different content packs
- [ ] Support multiple pack folders (not just base + custom)
- [ ] Pack switcher in game menu

---

## Important Files NOT to Delete Yet

These old files are kept for backward compatibility until Phase 2 completes:

- `characters.json` - API and editor still use this
- `assets/characters/` - Duplicated in new structure
- `assets/items/` - Duplicated in new structure
- `assets/environment/` - Duplicated in new structure

**See [PHASE0_CLEANUP_LIST.md](PHASE0_CLEANUP_LIST.md) for full deletion list after Phase 2.**

---

## Docker Commands

```bash
# Start containers
docker compose up -d

# Restart after config changes
docker compose down && docker compose up -d

# View logs
docker compose logs -f

# Rebuild (if Dockerfile changes)
docker compose build && docker compose up -d
```

**Ports:**
- Game: http://localhost:3333
- API: http://localhost:3334
- Character Editor: http://localhost:3333/tools/character-editor2.html

---

## Common Tasks

### Add a New Enemy

**Current Workflow (Phase 1):**
1. Edit `config/custom/enemies.json`
2. Add sprite images to `assets/custom/characters/enemies/`
3. Refresh browser

**Future Workflow (Post Phase 2):**
1. Open character editor at http://localhost:3333/tools/character-editor2.html
2. Click "+ New Character"
3. Upload sprite images via UI
4. Fill in stats
5. Click "Save" → auto-saves to `config/custom/enemies.json`

### Git Workflow

```bash
# What's tracked
git status  # Should NOT show assets/custom/ or config/custom/

# Commit base content only
git add config/base/ assets/base/
git commit -m "feat: add new base enemy"

# Custom content stays local (gitignored)
```

---

## Known Issues / Limitations

1. **API Still Uses Old Structure** - Character editor saves to `characters.json`, not new configs
2. **No Asset Fallback** - If custom asset path is wrong, game breaks (no fallback to base)
3. **No Pack Selection UI** - System hardcoded to base + custom merge only
4. **No Config Validation** - Malformed JSON will crash game
5. **Hardcoded Floor Tile** - Environment assets not fully config-driven

---

## Testing Checklist

Before considering Phase 2 complete:

- [ ] Game loads without console errors
- [ ] All sprites display correctly (base + custom)
- [ ] Character editor can create new enemies
- [ ] Character editor saves to `config/custom/enemies.json` (not old file)
- [ ] Uploaded images go to `assets/custom/`
- [ ] API returns merged base + custom enemies
- [ ] Docker restart not needed for config changes
- [ ] `git status` shows no custom content

---

## Next Steps (Phase 2 Tasks)

**Recommended Order:**

1. **Update API Service** (Most critical)
   - Load from new config structure
   - Merge base + custom configs
   - Save to correct location

2. **Update Character Editor**
   - Point to new API endpoints
   - Add base/custom toggle
   - Update upload paths

3. **Asset Resolution System**
   - Implement custom → base fallback
   - Add error logging

4. **Cleanup**
   - Remove old `characters.json`
   - Delete duplicate assets
   - Update documentation

5. **Optional: Pack Selection**
   - Design UI for pack switcher
   - Support multiple pack folders
   - Implement pack loading system

---

## Code References

### Config Loading (game.js)

```javascript
// Load and merge configs
const gameConfig = loadGameConfig();
const playerConfig = loadPlayerConfig();
const itemConfig = loadItemConfig();
const characterData = loadCharacterData();

// Merge function
function mergeConfigs(base, custom) {
  return { ...base, ...custom };
}
```

### Config Paths (game.config.json)

```json
{
  "paths": {
    "enemies": "config/base/enemies.json",
    "customEnemies": "config/custom/enemies.json",
    "players": "config/base/players.json",
    "customPlayers": "config/custom/players.json"
  }
}
```

### API Upload Endpoint

```javascript
POST /api/v1/uploads/character-sprite
Content-Type: multipart/form-data
Body: sprite=[file]

Response: {
  "success": true,
  "data": {
    "path": "assets/characters/enemies/sprite_1234567890.png"
  }
}
```

---

## User's Intent

The user wants:
1. ✅ Clean separation between engine and content
2. ✅ Base content (committed) vs custom content (gitignored)
3. ✅ Easy character creation for kids via web editor
4. ❌ **Ability to select different content packs** (not yet implemented)
5. ❌ Frictionless workflow (still requires manual config editing)

**Original Vision:**
```
packs/
├── disco-family/      # Custom family characters
├── space-theme/       # Space-themed pack
└── medieval/          # Medieval pack
```

**Current Reality:**
```
config/
├── base/              # Committed base content
└── custom/            # Gitignored custom overlay
```

Only supports ONE custom overlay, not multiple selectable packs.

---

## Quick Start for New Agent

1. **Read this file** (you are here)
2. **Read [PHASE1_SUMMARY.md](PHASE1_SUMMARY.md)** - understand what's done
3. **Read [docs/ProjectPlan_Restructure.md](docs/ProjectPlan_Restructure.md)** - see full plan
4. **Check Phase 2 tasks** - see what needs doing
5. **Ask user** which task to prioritize (API update, editor update, or pack selection)

**Most Likely Next Task:** Update API service to use new config structure

---

## Questions to Ask User

If the user wants to continue:

1. **Priority**: API update, character editor update, or pack selection UI?
2. **Pack Selection**: Do you want multiple selectable packs, or is base + custom overlay enough?
3. **Cleanup**: Ready to delete old files after Phase 2, or keep for safety?
4. **Testing**: Should we test the game works before moving to Phase 2?

---

**End of Handoff Document**
