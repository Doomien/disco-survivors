# Character System Documentation

This game now uses a JSON-based character definition system that allows you to easily add and configure different enemy types without modifying the code.

## How It Works

### Character Definition File

All characters are defined in [characters.json](characters.json). The file contains an `enemies` object where each key is a unique enemy type identifier.

### JSON Schema

```json
{
  "enemies": {
    "enemy_type_id": {
      "name": "Display Name",
      "sprites": ["sprite-1.png", "sprite-2.png"],
      "animation": {
        "frameTime": 12
      },
      "stats": {
        "health": 3,
        "speed": 0.4,
        "attackStrength": 1,
        "attackSpeed": 500,
        "attackRange": 40
      },
      "size": {
        "width": 60,
        "height": 66
      },
      "xpValue": 1
    }
  }
}
```

### Property Definitions

#### Basic Info
- **name**: Display name for the character (currently not shown in-game but useful for documentation)

#### Sprites
- **sprites**: Array of sprite filenames for animation frames
- The game automatically flips these sprites horizontally for left-facing direction
- Place sprite files in the same directory as index.html
- **Note**: You only need right-facing sprites - no need for separate .L.png files!

#### Animation
- **animation.frameTime**: Number of game frames each animation frame should display (60 frames = 1 second at 60 FPS)
  - Lower = faster animation
  - Higher = slower animation

#### Stats
- **stats.health**: Hit points (how much damage the enemy can take)
- **stats.speed**: Movement speed in pixels per frame (0.1-2.0 typical range)
- **stats.attackStrength**: Damage dealt to player per attack
- **stats.attackSpeed**: Cooldown between attacks in milliseconds
- **stats.attackRange**: Attack range in pixels (distance from player to deal damage)

#### Size
- **size.width**: Enemy width in pixels
- **size.height**: Enemy height in pixels

#### Rewards
- **xpValue**: Amount of XP dropped when defeated (not currently used but stored for future implementation)

## Adding New Enemies

### Step 1: Create Sprite Images

Create sprite images for your enemy:
- Create right-facing sprites only (left will be auto-flipped)
- At minimum, you need 1 sprite frame
- For animation, create multiple frames (e.g., walk cycle)
- Use PNG format with transparency

### Step 2: Add to characters.json

Add a new entry to the `enemies` object:

```json
{
  "enemies": {
    "my_new_enemy": {
      "name": "My Cool Enemy",
      "sprites": ["enemy-walk-1.png", "enemy-walk-2.png"],
      "animation": {
        "frameTime": 10
      },
      "stats": {
        "health": 5,
        "speed": 0.6,
        "attackStrength": 2,
        "attackSpeed": 600,
        "attackRange": 50
      },
      "size": {
        "width": 80,
        "height": 80
      },
      "xpValue": 3
    }
  }
}
```

### Step 3: Test

Reload the game and your new enemy will automatically appear in the spawn rotation!

## Example Enemy Types

The default [characters.json](characters.json) includes three enemy types:

### Skeleton (Basic Enemy)
- Health: 3
- Speed: 0.4 (slow)
- Attack: 1 damage every 500ms
- Good for: Basic fodder enemies

### Fast Skeleton (Speed Variant)
- Health: 2 (weaker)
- Speed: 0.8 (fast)
- Attack: 1 damage every 400ms
- Good for: Aggressive rushers that close distance quickly

### Tank Skeleton (Tank Variant)
- Health: 10 (very tanky)
- Speed: 0.2 (very slow)
- Attack: 2 damage every 800ms
- Good for: Heavy hitters that are hard to kill

## Spawn System

The game automatically spawns enemies from all defined types in [characters.json](characters.json):
- Enemies spawn in waves every 5 seconds
- 50 enemies per wave
- Enemy types are randomly selected from available definitions
- Enemies spawn 900-1200 pixels away from the player

## Customization Tips

### Creating Enemy Variety

Mix and match these properties to create interesting enemy types:

**Glass Cannon**
```json
"health": 1,
"speed": 1.0,
"attackStrength": 3
```

**Swarm Enemy**
```json
"health": 1,
"speed": 0.5,
"attackSpeed": 200,
"size": { "width": 30, "height": 30 }
```

**Boss Enemy**
```json
"health": 50,
"speed": 0.3,
"attackStrength": 5,
"attackSpeed": 1000,
"size": { "width": 120, "height": 120 }
```

### Performance Considerations

- Keep total enemy count reasonable (game has 25,000 object limit)
- Very fast enemies (speed > 1.5) can be hard to balance
- Very large enemies (> 150px) may have collision issues

## Future Enhancements

Potential additions to the system:
- Weighted spawn rates (make some enemies rarer)
- Time-based spawn progression (harder enemies later)
- Special abilities/behaviors per enemy type
- Visual effects (color tinting, particle effects)
- Sound effects per enemy type
- Drop tables (different enemies drop different items)
