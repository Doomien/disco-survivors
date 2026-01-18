# Character Management Improvements

## Problems Solved

### 1. Docker Caching Issue (FIXED)
**Problem**: The game container was baking files into the image at build time, so character updates via the API weren't visible without rebuilding.

**Solution**: Added volume mounts in [docker-compose.yml](docker-compose.yml) so files are served directly from your host machine.

### 2. Browser Caching Issue (FIXED)
**Problem**: Nginx was aggressively caching images (1 year) and JSON (1 hour), preventing updates from appearing.

**Solution**: Disabled caching in [nginx.conf](nginx.conf) for development.

### 3. Missing Image Upload (ADDED)
**Problem**: You had to manually place image files in the assets folder and type paths.

**Solution**: Added image upload API and UI to the character editor.

---

## How to Apply Changes

### Step 1: Rebuild and Restart Containers
```bash
cd /home/damien/code/disco-survivors

# Stop existing containers
docker compose down

# Install new API dependencies (multer for file uploads)
cd api && npm install && cd ..

# Rebuild containers
docker compose build

# Start containers
docker compose up -d

# View logs (optional)
docker compose logs -f
```

### Step 2: Clear Browser Cache
After restarting, **hard refresh** in your browser:
- Chrome/Edge: `Ctrl + Shift + R` (Linux/Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Linux/Windows) or `Cmd + Shift + R` (Mac)

---

## New Workflow (Frictionless!)

### Adding a New Character

1. **Open the Character Editor**
   - Navigate to `http://localhost:3333/tools/character-editor2.html`

2. **Create Character**
   - Click "+ New Character"
   - Enter ID (e.g., `zombie_warrior`) and Name (e.g., `Zombie Warrior`)
   - Click "Create"

3. **Upload Sprite Images**
   - Scroll to the "Sprites" section
   - Click "📁 Upload Images"
   - Select one or more PNG/JPG/GIF files (they'll be animated in sequence)
   - Files are automatically uploaded and added to sprite frames

4. **Configure Stats**
   - Set health, speed, attack strength, etc.
   - Adjust animation frame time (lower = faster animation)
   - Set size and XP value

5. **Save**
   - Click "💾 Save Changes"
   - Character is immediately available in the game!

6. **Test in Game**
   - Open `http://localhost:3333`
   - Refresh the page (`F5`)
   - Your new character should appear immediately

### Updating an Existing Character

1. Open character editor
2. Select character from list
3. Make changes (upload new sprites, adjust stats, etc.)
4. Click "💾 Save Changes"
5. Refresh game (`F5`) - changes appear immediately!

---

## What Changed

### Files Modified

1. **[docker-compose.yml](docker-compose.yml)**
   - Added volume mounts for live file updates
   - Mounted `assets` folder to API container

2. **[nginx.conf](nginx.conf)**
   - Disabled aggressive caching for development
   - Images, JS, CSS, and JSON no longer cached

3. **[api/package.json](api/package.json)**
   - Added `multer` dependency for file uploads

4. **New File: [api/src/routes/uploads.js](api/src/routes/uploads.js)**
   - Image upload API endpoints
   - File validation and sanitization
   - Automatic filename generation

5. **[api/src/index.js](api/src/index.js)**
   - Registered upload routes

6. **[tools/character-editor2.js](tools/character-editor2.js)**
   - Added image upload UI
   - Upload progress feedback
   - Automatic sprite path insertion

---

## API Endpoints Added

### Upload Single Sprite
```
POST /api/v1/uploads/character-sprite
Content-Type: multipart/form-data

Body: sprite=[file]

Response:
{
  "success": true,
  "data": {
    "filename": "zombie_1704067200000.png",
    "originalName": "zombie.png",
    "path": "assets/characters/enemies/zombie_1704067200000.png",
    "size": 12345,
    "mimeType": "image/png"
  }
}
```

### Upload Multiple Sprites
```
POST /api/v1/uploads/character-sprites
Content-Type: multipart/form-data

Body: sprites[]=[files]

Response:
{
  "success": true,
  "data": {
    "count": 3,
    "files": [...]
  }
}
```

### List Available Sprites
```
GET /api/v1/uploads/list

Response:
{
  "success": true,
  "data": {
    "count": 15,
    "files": [
      { "filename": "zombie.png", "path": "assets/characters/enemies/zombie.png" },
      ...
    ]
  }
}
```

---

## Benefits

### Before
1. Edit character in editor
2. Save changes
3. Manually upload images via file system
4. Type image paths manually
5. Restart Docker containers
6. Hard refresh browser multiple times
7. Hope caching issues are resolved

### After
1. Edit character in editor
2. Click upload button for images
3. Click save
4. Refresh browser once
5. Done!

---

## Important Notes

### For Production
The current setup is optimized for **development**. For production:

1. **Enable caching** in [nginx.conf](nginx.conf):
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **Secure uploads**: Add authentication/authorization to upload endpoints

3. **Consider CDN**: Serve assets from a CDN for better performance

### File Size Limits
- Max file size: 5MB per image
- Max sprites per character: 20
- Supported formats: PNG, JPG, JPEG, GIF

### Filename Sanitization
Uploaded files are automatically renamed:
- Spaces and special characters replaced with `_`
- Converted to lowercase
- Timestamp added to prevent collisions
- Example: `My Zombie.png` → `my_zombie_1704067200000.png`

---

## Troubleshooting

### Changes still not appearing?
1. Check containers are running: `docker compose ps`
2. View API logs: `docker compose logs api`
3. Hard refresh browser: `Ctrl + Shift + R`
4. Check file was actually uploaded: `ls assets/characters/enemies/`

### Upload failing?
1. Check file size (max 5MB)
2. Check file type (must be PNG, JPG, or GIF)
3. Check API container has write access: `docker compose logs api`

### Container won't start?
1. Check for port conflicts: `docker compose down`
2. Rebuild: `docker compose build --no-cache`
3. Check logs: `docker compose logs`

---

## For Your Kids

To help your kids add characters:

1. Draw/create character images (PNG files work best)
2. Open the character editor in the browser
3. Click "+ New Character"
4. Name their character
5. Click the upload button to add their drawings
6. Adjust the stats (make them super powerful if they want!)
7. Click Save
8. Play the game and fight their creation!

No terminal commands, no file paths, no Docker restarts needed!
