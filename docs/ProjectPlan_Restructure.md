# Disco Survivors - Engine/Content Separation Project Plan

> **Goal:** Separate the game engine from game content to enable multiple content packs and cleaner gitignore boundaries.

---

## 1. Goals & Guiding Principles

- **Primary Goal:** Separate engine code from game data/assets
- **Content Strategy:** Base content (skeleton, generic items) + custom overlay folder (gitignored)
- **Data-Driven:** Move all entity definitions (players, enemies, items) to JSON files
- **Minimal Disruption:** Start with minimal changes, restructure engine in future phase

### Key Decisions

| Decision | Choice | Status |
|----------|--------|--------|
| Base content | Skeleton enemy + generic items only | ✅ Implemented |
| Player system | Data-driven via `players.json` | ✅ Implemented |
| Pack structure | Overlay system (base + custom/) | ✅ Implemented |
| Engine refactor | Minimal now, full restructure later | Phase 3 |
| Character editor | Defer updates to later phase | Deferred |
| Backward compat | Keep `characters.json` during transition | Active |
| API scope | Enemies first, players/items later | Phased |
| Base character editing | Read-only (not editable via API) | Policy |

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

### Phase 0 – Directory Setup & Asset Migration ✅ COMPLETE

**Goal:** Create new folder structure and move existing assets to correct locations

**Status:** ✅ Complete (2026-01-18)

**Tasks:**

- [x] **0.1** Create new directory structure
  - Create `assets/base/` and `assets/custom/` folders
  - Create `config/` and `config/custom/` folders
  - Add README.md to custom folders explaining their purpose

- [x] **0.2** Categorize and move assets
  - Move skeleton sprites to `assets/base/characters/enemies/`
  - Move generic items (ball, candy, mic) to `assets/base/items/`
  - Move custom content (Sean, MicrowaveMan, Tomato, etc.) to `assets/custom/`
  - Keep floor tile in `assets/base/environment/`

- [x] **0.3** Update .gitignore
  - Add `assets/custom/` to gitignore
  - Add `config/custom/` to gitignore
  - Ensure base content remains tracked
  - Added exceptions for README.md and example files

**Deliverables:**
- [x] New folder structure in place
- [x] Assets categorized and moved (duplicated for backward compatibility)
- [x] .gitignore updated
- [x] Custom folders have README instructions
- [x] Created `PHASE0_CLEANUP_LIST.md` for old file removal after testing

**Note:** Assets duplicated to maintain backward compatibility during transition. Old files will be removed after Phase 2 completion.

---

### Phase 1 – Data-Driven Content System ✅ COMPLETE

**Goal:** Externalize all entity definitions to JSON files

**Status:** ✅ Complete (2026-01-18)

**Tasks:**

- [x] **1.1** Create `config/players.json`
  - Created `config/base/players.json` with default player
  - Created `config/custom/players.json` with Sean and MicrowaveMan

- [x] **1.2** Create `config/items.json`
  - Created `config/base/items.json` with weapons, projectiles, collectibles
  - Created `config/custom/items.json` with custom items

- [x] **1.3** Create `config/game.config.json`
  - Game settings, world size, paths
  - Feature toggles for weapons
  - Default player selection

- [x] **1.4** Split `characters.json` into base and custom configs
  - Created `config/base/enemies.json` (skeleton only)
  - Created `config/custom/enemies.json` (all custom enemies)
  - Updated docker-compose volume mounts
  - Kept `characters.json` for backward compatibility

- [x] **1.5** Update game.js to load from config files
  - Added `loadConfig()`, `loadGameConfig()`, `loadPlayerConfig()`, `loadItemConfig()`
  - Added config merge system (base + custom)
  - Player class now loads characters dynamically from config
  - All hardcoded player data removed

**Deliverables:**
- [x] `config/base/players.json` and `config/custom/players.json`
- [x] `config/base/items.json` and `config/custom/items.json`
- [x] `config/game.config.json` - game settings and paths
- [x] `config/base/enemies.json` and `config/custom/enemies.json`
- [x] game.js loads all entities from merged configs
- [x] docker-compose.yml updated with config mounts

**Note:** Created base/custom split for all configs. Game loads and merges both on startup.

---

### Phase 2 – Content Overlay System 🟡 PARTIAL

**Goal:** Implement custom content overlay that extends/overrides base content

**Status:** 🟡 ~40% Complete (2026-01-18) - Documentation done, API/editor deferred

**Tasks:**

- [x] **2.1** Create config merge system
  - Implemented in game.js (Phase 1)
  - Load base config files first
  - If custom config exists, merge with base
  - Custom entries override base entries with same ID

- [ ] **2.2** Create asset resolution system
  - ⏳ Deferred - not critical for current functionality
  - Check `assets/custom/` first for any asset path
  - Fall back to `assets/base/` if not found
  - Log warnings for missing assets

- [x] **2.3** Create custom content templates
  - Created `assets/custom/README.md` - comprehensive guide
  - Created `config/custom/README.md` - step-by-step instructions
  - Created `config/custom/enemies.example.json` - template
  - Created `config/custom/players.example.json` - template

- [ ] **2.4** Update character editor
  - ⏳ **DEFERRED** to later phase (user decision)
  - Will keep using legacy characters.json approach for now
  - Future: Add toggle for "Save to custom" vs "Save to base"
  - Future: Show which content pack each character belongs to

- [x] **2.5** Update API infrastructure
  - [x] Added ENEMIES_CONFIG, CUSTOM_ENEMIES_CONFIG env vars to docker-compose
  - [x] Created ConfigService for base+custom merging
  - [ ] ⏳ Integrate ConfigService into FileService (pending)
  - [ ] ⏳ Update API routes to use new config system (pending)
  - Keeping `characters.json` for backward compatibility

**Deliverables:**
- [x] Config merge system working (in game.js)
- [ ] Asset resolution with fallback (deferred)
- [x] Custom content examples/templates
- [ ] Character editor updated (deferred)
- [~] API updated for new structure (ConfigService created, integration pending)

**Decisions Made:**
- Character editor updates deferred to later phase
- API will maintain backward compatibility with characters.json
- Base characters will be read-only (not editable via API)
- API scope: Enemies first, players/items can be added later

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

### Phase 0 Complete When: ✅
- [x] New folder structure exists
- [x] Assets in correct locations
- [x] Custom folders gitignored
- [x] Game still runs with old paths (temporarily)

### Phase 1 Complete When: ✅
- [x] All config files created
- [x] game.js loads from config (no hardcoded entity paths)
- [x] Game works with new config system
- [~] Character editor works with new paths (deferred)
- [~] API works with new paths (partially - infrastructure ready)

### Phase 2 Complete When: 🟡 Partial
- [x] Custom content overlays base content (game.js merges configs)
- [x] Can add new enemies/players via custom config files
- [x] Clean separation: `git status` shows no custom content
- [ ] Character editor can save to custom folder (deferred)
- [ ] API fully supports new config structure (pending integration)
- [ ] Asset resolution system with fallback (deferred)

### Future Phases:
- **Phase 2 Completion:** API integration, asset fallback system
- **Phase 2.5 (New):** Character editor updates
- **Phase 3:** Engine restructure (modular architecture)

---

## 7. Project Status Summary

**Last Updated:** 2026-01-18

### Completed Work
- ✅ **Phase 0:** Directory structure and asset migration complete
- ✅ **Phase 1:** Data-driven config system fully implemented
- 🟡 **Phase 2:** ~40% complete (documentation and templates done)

### Current State
- Game loads from new config system with base + custom merging
- Documentation and templates created for users to add custom content
- ConfigService created and ready for API integration
- Old file structure preserved for backward compatibility

### Next Steps
1. Complete API integration when ready (FileService + routes)
2. Test thoroughly with both base and custom content
3. Update character editor (separate phase)
4. Clean up old duplicate files after testing
5. Consider asset resolution system if needed

### Files Created
- Config files: `game.config.json`, `base/enemies.json`, `base/players.json`, `base/items.json`
- Custom configs: `custom/enemies.json`, `custom/players.json`, `custom/items.json`
- Templates: `custom/*.example.json`
- Documentation: Enhanced READMEs, `PHASE0_SUMMARY.md`, `PHASE1_SUMMARY.md`, `PHASE2_PROGRESS.md`
- API: `ConfigService.js`

### Git Branch
All work committed to: `claude/review-phase-0-planning-SHPwE`

---

**Document Version:** 2.0
**Created:** 2026-01-18
**Last Updated:** 2026-01-18
**Status:** Active Development - Phase 2 Paused
