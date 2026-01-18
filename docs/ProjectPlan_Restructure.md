# Disco Survivors - Engine/Content Separation Project Plan

> **Goal:** Separate the game engine from game content to enable multiple content packs and cleaner gitignore boundaries.

---

## 1. Goals & Guiding Principles

- **Primary Goal:** Separate engine code from game data/assets
- **Content Strategy:** Base content (skeleton, generic items) + custom overlay folder (gitignored)
- **Data-Driven:** Move all entity definitions (players, enemies, items) to JSON files
- **Minimal Disruption:** Start with minimal changes, restructure engine in future phase

### Key Decisions

| Decision | Choice |
|----------|--------|
| Base content | Skeleton enemy + generic items only |
| Player system | Data-driven via `players.json` |
| Pack structure | Overlay system (base + custom/) |
| Engine refactor | Minimal now, full restructure later |

---

## 2. Current vs Target Structure

### Current Structure
```
disco-survivors/
├── game.js                    # Monolithic, hardcoded paths
├── characters.json            # Enemies only
├── assets/                    # All content mixed
│   ├── characters/enemies/    # Base + custom mixed
│   ├── characters/player/     # Hardcoded in game.js
│   ├── environment/
│   └── items/
└── ...
```

### Target Structure
```
disco-survivors/
├── engine/
│   └── game.js                # Core engine (loads from config)
├── config/
│   ├── game.config.json       # Game settings, world size, etc.
│   ├── enemies.json           # Base enemy definitions
│   ├── players.json           # Base player definitions
│   └── items.json             # Base item definitions
├── assets/
│   ├── base/                  # Base game assets (committed)
│   │   ├── characters/
│   │   │   ├── enemies/       # skeleton-1.png, skeleton-2.png
│   │   │   └── players/       # placeholder player sprites
│   │   ├── environment/
│   │   └── items/             # ball, candy, mic
│   └── custom/              # Custom/family assets (GITIGNORED)
│       ├── characters/
│       │   ├── enemies/       # SkaryTeeth, Tomato, etc.
│       │   └── players/       # Sean, MicrowaveMan
│       └── README.md          # Instructions for custom content
├── config/
│   └── custom/              # Custom config overrides (GITIGNORED)
│       ├── enemies.json       # Additional/override enemies
│       └── players.json       # Additional/override players
├── api/                       # Unchanged
├── tools/                     # Character editor (update paths)
└── docs/
```

---

## 3. Project Phases

### Phase 0 – Directory Setup & Asset Migration

**Goal:** Create new folder structure and move existing assets to correct locations

**Tasks:**

- [ ] **0.1** Create new directory structure
  - Create `assets/base/` and `assets/custom/` folders
  - Create `config/` and `config/custom/` folders
  - Add README.md to custom folders explaining their purpose

- [ ] **0.2** Categorize and move assets
  - Move skeleton sprites to `assets/base/characters/enemies/`
  - Move generic items (ball, candy, mic) to `assets/base/items/`
  - Move custom content (Sean, MicrowaveMan, Tomato, etc.) to `assets/custom/`
  - Keep floor tile in `assets/base/environment/`

- [ ] **0.3** Update .gitignore
  - Add `assets/custom/` to gitignore
  - Add `config/custom/` to gitignore
  - Ensure base content remains tracked

**Deliverables:**
- [ ] New folder structure in place
- [ ] Assets categorized and moved
- [ ] .gitignore updated
- [ ] Custom folders have README instructions

---

### Phase 1 – Data-Driven Content System

**Goal:** Externalize all entity definitions to JSON files

**Tasks:**

- [ ] **1.1** Create `config/players.json`
  ```json
  {
    "players": {
      "default": {
        "name": "Player",
        "sprites": ["assets/base/characters/players/player-1.png", ...],
        "stats": { "health": 100, "speed": 2.5, ... }
      }
    }
  }
  ```

- [ ] **1.2** Create `config/items.json`
  ```json
  {
    "items": {
      "ball": { "sprites": [...], "type": "projectile" },
      "candy": { "sprites": [...], "type": "collectible" },
      "mic": { "sprites": [...], "type": "weapon" }
    }
  }
  ```

- [ ] **1.3** Create `config/game.config.json`
  ```json
  {
    "world": { "width": 3000, "height": 3000 },
    "assets": {
      "basePath": "assets/base",
      "customPath": "assets/custom",
      "environment": { "floor": "environment/Zelda-Style-Test.png" }
    },
    "gameplay": { "maxEnemies": 25000, "spawnWaveSize": 50 }
  }
  ```

- [ ] **1.4** Rename `characters.json` → `config/enemies.json`
  - Update all references in API and character editor
  - Update docker-compose volume mounts

- [ ] **1.5** Update game.js to load from config files
  - Replace hardcoded `makeImage()` calls with config-driven loading
  - Add config loading at startup
  - Implement asset path resolution (base vs custom)

**Deliverables:**
- [ ] `config/players.json` - player definitions
- [ ] `config/items.json` - item definitions
- [ ] `config/game.config.json` - game settings
- [ ] `config/enemies.json` - moved from root
- [ ] game.js loads all entities from config

---

### Phase 2 – Content Overlay System

**Goal:** Implement custom content overlay that extends/overrides base content

**Tasks:**

- [ ] **2.1** Create config merge system
  - Load base config files first
  - If custom config exists, deep-merge with base
  - Custom entries override base entries with same ID

- [ ] **2.2** Create asset resolution system
  - Check `assets/custom/` first for any asset path
  - Fall back to `assets/base/` if not found
  - Log warnings for missing assets

- [ ] **2.3** Create custom content templates
  - `assets/custom/README.md` - instructions
  - `config/custom/enemies.example.json` - example format
  - `config/custom/players.example.json` - example format

- [ ] **2.4** Update character editor
  - Add toggle for "Save to custom" vs "Save to base"
  - Update upload paths to use custom folder by default
  - Show which content pack each character belongs to

- [ ] **2.5** Update API for new paths
  - Update CHARACTERS_FILE env var → ENEMIES_CONFIG
  - Add PLAYERS_CONFIG, ITEMS_CONFIG env vars
  - Update volume mounts in docker-compose.yml

**Deliverables:**
- [ ] Config merge system working
- [ ] Asset resolution with fallback
- [ ] Custom content examples/templates
- [ ] Character editor updated
- [ ] API updated for new structure

---

### Phase 3 – Engine Restructure (Future)

**Goal:** Break monolithic game.js into proper modules

**Status:** Roadmap / Future

**Tasks (outline):**

- [ ] **3.1** Create module structure
  ```
  engine/
  ├── core/
  │   ├── game.js          # Main game loop
  │   ├── renderer.js      # Canvas rendering
  │   └── input.js         # Input handling
  ├── entities/
  │   ├── player.js        # Player class
  │   ├── enemy.js         # Enemy class
  │   └── projectile.js    # Projectile class
  ├── systems/
  │   ├── collision.js     # Collision detection
  │   ├── spawner.js       # Enemy spawning
  │   └── combat.js        # Combat/damage
  └── utils/
      ├── loader.js        # Asset/config loading
      └── math.js          # Math utilities
  ```

- [ ] **3.2** Implement ES modules or bundler
- [ ] **3.3** Add TypeScript (optional)
- [ ] **3.4** Add unit tests for engine components

**Note:** This phase is lower priority. The game works well as-is; this is for long-term maintainability.

---

## 4. Migration Checklist

### Files to Create
- [ ] `config/game.config.json`
- [ ] `config/players.json`
- [ ] `config/items.json`
- [ ] `assets/custom/README.md`
- [ ] `config/custom/README.md`

### Files to Move
- [ ] `characters.json` → `config/enemies.json`
- [ ] `assets/characters/enemies/skeleton-*` → `assets/base/characters/enemies/`
- [ ] `assets/items/*` → `assets/base/items/`
- [ ] `assets/environment/*` → `assets/base/environment/`
- [ ] Custom assets → `assets/custom/`

### Files to Update
- [ ] `game.js` - config loading, asset resolution
- [ ] `docker-compose.yml` - volume mounts
- [ ] `api/src/index.js` - config paths
- [ ] `tools/character-editor2.js` - save locations
- [ ] `.gitignore` - custom folders

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing game | High | Test each phase before committing; keep backups |
| Docker volume complexity | Medium | Update docker-compose incrementally; test mounts |
| Path resolution bugs | Medium | Add logging; test with both base and custom content |
| Character editor confusion | Low | Clear UI indicators for base vs custom |

---

## 6. Success Criteria

### Phase 0 Complete When:
- [ ] New folder structure exists
- [ ] Assets in correct locations
- [ ] Custom folders gitignored
- [ ] Game still runs with old paths (temporarily)

### Phase 1 Complete When:
- [ ] All config files created
- [ ] game.js loads from config (no hardcoded entity paths)
- [ ] Character editor works with new paths
- [ ] API works with new paths

### Phase 2 Complete When:
- [ ] Custom content overlays base content
- [ ] Can add new enemies/players via custom config only
- [ ] Character editor can save to custom folder
- [ ] Clean separation: `git status` shows no custom content

---

**Document Version:** 1.0
**Created:** 2026-01-18
**Status:** Ready for Review
