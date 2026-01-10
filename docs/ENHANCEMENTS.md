# Disco Survivors - Future Enhancements

This document outlines potential future improvements for the game. These are ideas for consideration, not a committed roadmap.

## Code Quality & Architecture

### Module System
Split the monolithic game.js into ES6 modules for better maintainability:
- Separate classes (Player, Enemy, Weapon, Animation, etc.)
- Config files for constants
- Utility functions in dedicated files

**Benefits**: Easier navigation, better code reusability, clearer dependencies

### Configuration System
Centralize game configuration in JSON files:
```json
{
  "world": { "width": 2000, "height": 2000 },
  "spawning": { "enemiesPerWave": 50, "timeBetweenWaves": 5000 },
  "player": { "startHealth": 50, "speed": 3 }
}
```

**Benefits**: Easy to tune game balance without code changes

### JSDoc Comments
Add comprehensive documentation to functions and classes:
```javascript
/**
 * Spawns a wave of enemies around the player
 * @param {number} count - Number of enemies to spawn
 * @returns {Enemy[]} Array of spawned enemies
 */
```

**Benefits**: Better IDE support, clearer API, easier onboarding

## Gameplay Features

### Character System Enhancements

**Spawn Weights**: Different spawn probabilities per enemy type
```json
{
  "skeleton": { "stats": {...}, "spawnWeight": 50 },
  "boss": { "stats": {...}, "spawnWeight": 5 }
}
```

**Wave Progression**: Enemies unlock at different game times
```json
{
  "skeleton": { "spawnsAfter": 0 },
  "boss": { "spawnsAfter": 300000 }
}
```

**Enemy Behaviors**: Add AI patterns beyond "chase player"
- Wander then charge
- Circle around player
- Flee when low health
- Group coordination

### Power-Up System
- Additional weapon types
- Temporary buffs (speed boost, invincibility)
- Passive upgrades (health regen, damage boost)
- Weapon evolution/upgrades

### Boss Battles
- Special enemies with unique mechanics
- Phase transitions
- Unique attack patterns
- Special rewards

### Audio
- Background music
- Sound effects per enemy type
- Weapon sound effects
- Hit/damage sounds

## Developer Tools

### Debug Mode
Toggle-able debug information (press D key):
- FPS counter
- Enemy count
- Collision boxes
- Spawn zones
- Entity IDs

### Asset Manifest & Loading Screen
Replace individual image loads with manifest system:
- Loading progress bar
- Better error handling
- Preload all assets before game starts

### Build & Development Tools
- Build script for minification
- Dev server with hot reload
- Linting configuration (ESLint)
- Test framework setup

## Performance Optimizations

### Object Pooling
Reuse enemy/candy objects instead of creating/destroying:
```javascript
class ObjectPool {
    acquire() { /* return inactive object */ }
    release(obj) { /* mark as inactive */ }
}
```

### Spatial Partitioning
Use quadtree or grid for collision detection to avoid checking all enemies against all objects.

### Canvas Layers
Separate rendering layers:
- Static background (drawn once)
- Dynamic entities (drawn every frame)
- UI overlay (updated on changes)

## Documentation

### CONTRIBUTING.md
Guide for contributors:
- How to add new enemies
- Code style guide
- How to run locally
- How to submit changes

### API Documentation
Document the game's public API:
- Class interfaces
- Event system
- Extension points

## Quality of Life

### Game Features
- Pause menu
- Settings screen (volume, difficulty)
- High score tracking
- Multiple save slots
- Achievements system

### Character Editor Enhancements
- Sprite preview/upload
- Duplicate character function
- Undo/redo support
- Balance validation warnings
- Character templates for common types

---

## Priority Suggestions

If you're looking for quick wins that add the most value:

1. **Debug Mode** - Helps with development and troubleshooting
2. **Spawn Weights** - Adds variety to gameplay without much code
3. **JSDoc Comments** - Makes codebase easier to maintain
4. **Sound Effects** - Big impact on game feel

---

**Note**: This is a living document. Ideas can be added, removed, or reprioritized as the project evolves. See [GitHub Issues](https://github.com/yourusername/disco-survivors/issues) for tracked work.
