# Character Editor - User Guide

A graphical web-based tool for editing character definitions in Disco Survivors with real-time API integration.

## Getting Started

### With Docker (Recommended)

1. Start the Docker services:
   ```bash
   docker compose up -d
   ```

2. Open the editor in your browser:
   ```
   http://localhost:3333/tools/character-editor.html
   ```

3. The editor will automatically load characters from the API
4. All changes are saved immediately to the server via API calls

### Without Docker (Standalone)

1. Open [character-editor.html](../tools/character-editor.html) directly in your web browser
2. The editor will load from the local [characters.json](../characters.json) file
3. Changes are saved locally and you'll need to download the updated JSON file

## Features

### Character Management

- **View All Characters** - Sidebar shows all defined characters loaded from the API
- **Create New Character** - Click "New Character" button to add a new enemy type (saved via API)
- **Edit Character** - Click any character in the list to edit its properties
- **Save Changes** - Click "Save Changes" to update the character via API
- **Delete Character** - Hover over a character and click the × button to delete it (deleted via API)

### API Integration

When running with Docker, the character editor uses the REST API for all operations:

- **Load**: Characters are fetched from `GET /api/v1/characters`
- **Create**: New characters are saved with `POST /api/v1/characters`
- **Update**: Changes are saved with `PUT /api/v1/characters/:id`
- **Delete**: Characters are removed with `DELETE /api/v1/characters/:id`

**Benefits:**
- ✅ Changes are saved immediately to the server
- ✅ Automatic backups are created on every save
- ✅ Multiple users can edit (with file locking protection)
- ✅ Data validation ensures integrity
- ✅ No manual file downloads/uploads needed

### Editing Properties

The editor provides fields for all character properties:

#### Basic Information
- **Character ID** - Unique identifier (cannot be changed after creation)
- **Display Name** - Human-readable name

#### Sprites
- **Sprite Animation Frames** - Animation frames (automatically flipped for left direction)
- Add/remove sprite frames with + and × buttons
- Supports multiple frames for animation
- **Note**: Only right-facing sprites needed - left is auto-generated!

#### Animation
- **Frame Time** - How long each sprite frame displays (in game frames, 60 = 1 second)

#### Stats
- **Health** - Hit points
- **Speed** - Movement speed (pixels per frame)
- **Attack Strength** - Damage dealt per attack
- **Attack Speed** - Cooldown between attacks (milliseconds)
- **Attack Range** - Distance from player to deal damage (pixels)

#### Size
- **Width** - Character width in pixels
- **Height** - Character height in pixels

#### Rewards
- **XP Value** - Experience points dropped when defeated

### JSON Operations

#### Load JSON File
1. Click "Load JSON File" button
2. Select a `characters.json` file from your computer
3. All characters will be loaded into the editor

#### Download JSON
1. Click "Download JSON" button
2. Your browser will download a `characters.json` file
3. **Replace the existing `characters.json` in your game directory** with this file
4. Reload the game to see your changes

#### Live Preview
- JSON preview updates in real-time as you edit
- Shows the exact JSON structure for the current character
- Useful for debugging and validation

### Workflow

**Recommended workflow for editing characters:**

1. Open [character-editor.html](character-editor.html)
2. Make your changes to existing characters or create new ones
3. Click "Save Changes" after editing each character
4. When finished, click "Download JSON"
5. Replace `characters.json` in your game directory
6. Test in the game by opening [index.html](index.html)
7. Repeat as needed

## Tips & Tricks

### Creating Balanced Characters

**Fast Enemy**
- Low health (1-2)
- High speed (0.8-1.2)
- Low attack damage
- Use for swarming gameplay

**Tank Enemy**
- High health (10-20)
- Low speed (0.2-0.3)
- High attack damage
- Slower animations (frameTime: 16-20)

**Boss Enemy**
- Very high health (50+)
- Medium speed (0.3-0.5)
- High attack damage (5-10)
- Larger size (100x100+)
- High XP value (10-50)

### Sprite Setup

If you don't have custom sprites yet:
- Use the existing skeleton sprites as placeholders (skeleton-1.png, skeleton-2.png)
- Different enemy types can share sprites initially
- Focus on stats and behavior first, visuals later
- **Important**: You only need right-facing sprites - the game flips them automatically!

### Validation

The editor validates:
- Required fields must be filled
- Numbers must be in valid ranges
- At least one sprite per direction
- Unique character IDs

## Keyboard Shortcuts

- **Ctrl/Cmd + S** - (Not implemented, but saves are instant anyway!)

## Troubleshooting

**"Could not load characters.json"**
- Make sure `characters.json` exists in the same folder
- Or start fresh - the editor will work with empty data

**Changes not appearing in game**
- Make sure you downloaded the JSON
- Replace the `characters.json` file in the game folder
- Hard refresh the game page (Ctrl+F5 or Cmd+Shift+R)

**Character ID validation error**
- Use only lowercase letters, numbers, and underscores
- Examples: `zombie`, `fast_ghost`, `boss_1`

**Sprites not showing in game**
- Ensure sprite file names match exactly (case-sensitive)
- Sprite files must be in the same folder as `index.html`
- Use PNG format with transparency
- **Remember**: Only right-facing sprites needed - no more .L.png files!

## Advanced Usage

### Bulk Editing

To edit multiple characters efficiently:
1. Load your current JSON
2. Edit characters one by one (changes save automatically)
3. Download when all changes are complete

### Backup Strategy

Before major changes:
1. Download your current JSON
2. Save it with a date/version number
3. Make changes
4. Download again
5. Compare if needed

### Sharing Characters

To share custom characters with others:
1. Download your JSON
2. Share the JSON file + sprite files
3. Others can load it in their editor

## Future Enhancements

Potential features for future versions:
- Sprite preview/upload
- Duplicate character
- Undo/redo
- Validation warnings for unbalanced stats
- Import individual characters
- Templates for common enemy types
