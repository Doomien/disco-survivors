# Disco Survivors REST API Reference

Complete API reference for the Disco Survivors character management REST API.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Validation Rules](#validation-rules)
- [Error Handling](#error-handling)
- [Backup System](#backup-system)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Disco Survivors API provides programmatic access to character management. All operations (Create, Read, Update, Delete) are available via RESTful endpoints.

### Features

- ✅ Full CRUD operations
- ✅ Automatic backups on every write
- ✅ File locking to prevent concurrent write conflicts
- ✅ Joi schema validation for data integrity
- ✅ Consistent JSON response format
- ✅ CORS enabled for browser access
- ✅ Detailed error messages with validation details

### Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Validation**: Joi
- **File Operations**: fs/promises with locking
- **Deployment**: Docker (Alpine Linux)

---

## Getting Started

### Starting the API

Using Docker Compose (recommended):

```bash
docker compose up -d
```

This starts both the API server and nginx proxy.

### Verifying API is Running

```bash
# Check API health
curl http://localhost:3333/api/v1/health

# Expected response:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-10T12:00:00.000Z",
  "uptime": 123.456
}
```

### Stopping the API

```bash
docker compose down
```

---

## Base URL

When accessing through nginx (recommended):
```
http://localhost:3333/api/v1
```

Direct access to API container (if needed):
```
http://localhost:3334/api/v1
```

**Note**: All examples in this document use the nginx proxied URL.

---

## Authentication

Currently, the API does **not require authentication**. This is suitable for local development but should be secured before deploying to production.

### Future Considerations

For production deployment, consider adding:
- API key authentication
- JWT tokens
- Rate limiting
- IP whitelisting

---

## Endpoints

### Health Check

Check if the API is running and responsive.

**Endpoint**: `GET /api/v1/health`

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-10T12:00:00.000Z",
  "uptime": 123.456
}
```

**Status Codes**:
- `200 OK` - API is healthy

---

### List All Characters

Get all character definitions.

**Endpoint**: `GET /api/v1/characters`

**Response**:
```json
{
  "success": true,
  "data": {
    "skeleton": {
      "name": "Skeleton",
      "sprites": [
        "assets/characters/enemies/skeleton-1.png",
        "assets/characters/enemies/skeleton-2.png"
      ],
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
    },
    "danger_disc": {
      "name": "Danger Disc",
      "sprites": ["assets/characters/enemies/001_DangerDiscb.png"],
      "animation": { "frameTime": 10 },
      "stats": {
        "health": 2,
        "speed": 0.6,
        "attackStrength": 1,
        "attackSpeed": 400,
        "attackRange": 35
      },
      "size": { "width": 50, "height": 50 },
      "xpValue": 1
    }
  }
}
```

**Status Codes**:
- `200 OK` - Characters retrieved successfully
- `500 Internal Server Error` - Failed to read characters file

---

### Get Single Character

Get a specific character by ID.

**Endpoint**: `GET /api/v1/characters/:id`

**Parameters**:
- `id` (path, required) - Character ID (e.g., `skeleton`, `danger_disc`)

**Example Request**:
```bash
curl http://localhost:3333/api/v1/characters/skeleton
```

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "Skeleton",
    "sprites": [
      "assets/characters/enemies/skeleton-1.png",
      "assets/characters/enemies/skeleton-2.png"
    ],
    "animation": { "frameTime": 12 },
    "stats": {
      "health": 3,
      "speed": 0.4,
      "attackStrength": 1,
      "attackSpeed": 500,
      "attackRange": 40
    },
    "size": { "width": 60, "height": 66 },
    "xpValue": 1
  }
}
```

**Status Codes**:
- `200 OK` - Character found
- `404 Not Found` - Character ID does not exist
- `500 Internal Server Error` - Failed to read characters file

**Error Example** (404):
```json
{
  "success": false,
  "error": {
    "code": "CHARACTER_NOT_FOUND",
    "message": "Character with ID 'zombie' not found"
  }
}
```

---

### Create Character

Create a new character.

**Endpoint**: `POST /api/v1/characters`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "id": "zombie",
  "data": {
    "name": "Zombie",
    "sprites": ["assets/characters/enemies/zombie-1.png"],
    "animation": {
      "frameTime": 15
    },
    "stats": {
      "health": 5,
      "speed": 0.3,
      "attackStrength": 2,
      "attackSpeed": 700,
      "attackRange": 45
    },
    "size": {
      "width": 65,
      "height": 72
    },
    "xpValue": 2
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "zombie",
    "character": {
      "name": "Zombie",
      "sprites": ["assets/characters/enemies/zombie-1.png"],
      "animation": { "frameTime": 15 },
      "stats": {
        "health": 5,
        "speed": 0.3,
        "attackStrength": 2,
        "attackSpeed": 700,
        "attackRange": 45
      },
      "size": { "width": 65, "height": 72 },
      "xpValue": 2
    },
    "backup": "characters_1736519400000.json"
  }
}
```

**Status Codes**:
- `201 Created` - Character created successfully
- `400 Bad Request` - Validation error
- `409 Conflict` - Character ID already exists
- `500 Internal Server Error` - Failed to save

**Validation Error Example** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "id",
        "message": "Character ID must contain only lowercase letters, numbers, and underscores"
      },
      {
        "field": "stats.health",
        "message": "Health must be at least 1"
      }
    ]
  }
}
```

**Conflict Error Example** (409):
```json
{
  "success": false,
  "error": {
    "code": "CHARACTER_ALREADY_EXISTS",
    "message": "Character with ID 'zombie' already exists"
  }
}
```

---

### Update Character

Update an existing character.

**Endpoint**: `PUT /api/v1/characters/:id`

**Parameters**:
- `id` (path, required) - Character ID to update

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Updated Zombie",
  "sprites": [
    "assets/characters/enemies/zombie-1.png",
    "assets/characters/enemies/zombie-2.png"
  ],
  "animation": { "frameTime": 12 },
  "stats": {
    "health": 6,
    "speed": 0.35,
    "attackStrength": 2,
    "attackSpeed": 650,
    "attackRange": 45
  },
  "size": { "width": 65, "height": 72 },
  "xpValue": 3
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "zombie",
    "character": {
      "name": "Updated Zombie",
      "sprites": [
        "assets/characters/enemies/zombie-1.png",
        "assets/characters/enemies/zombie-2.png"
      ],
      "animation": { "frameTime": 12 },
      "stats": {
        "health": 6,
        "speed": 0.35,
        "attackStrength": 2,
        "attackSpeed": 650,
        "attackRange": 45
      },
      "size": { "width": 65, "height": 72 },
      "xpValue": 3
    },
    "backup": "characters_1736519500000.json"
  }
}
```

**Status Codes**:
- `200 OK` - Character updated successfully
- `400 Bad Request` - Validation error
- `404 Not Found` - Character ID does not exist
- `500 Internal Server Error` - Failed to save

---

### Delete Character

Delete a character.

**Endpoint**: `DELETE /api/v1/characters/:id`

**Parameters**:
- `id` (path, required) - Character ID to delete

**Example Request**:
```bash
curl -X DELETE http://localhost:3333/api/v1/characters/zombie
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "zombie",
    "backup": "characters_1736519600000.json"
  }
}
```

**Status Codes**:
- `200 OK` - Character deleted successfully
- `404 Not Found` - Character ID does not exist
- `500 Internal Server Error` - Failed to save

---

## Validation Rules

All character data is validated using Joi schemas. Here are the complete validation rules:

### Character ID

**Rules**:
- **Pattern**: Only lowercase letters (`a-z`), numbers (`0-9`), and underscores (`_`)
- **Length**: 1-50 characters
- **Reserved IDs**: Cannot use: `health`, `status`, `api`, `v1`, `characters`, `new`, `edit`, `delete`
- **Uniqueness**: Must not already exist (for CREATE operations)

**Valid Examples**:
- `skeleton`
- `danger_disc`
- `boss_1`
- `fast_enemy_type_2`

**Invalid Examples**:
- `Skeleton` (uppercase not allowed)
- `danger-disc` (hyphens not allowed)
- `api` (reserved ID)
- `a` (too short - minimum 1 character, but see note)
- `this_is_a_very_long_character_id_that_exceeds_fifty_chars` (too long)

### Character Data Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | 1-100 characters |
| `sprites` | array[string] | ✅ Yes | 1-20 items, each must end with .png, .jpg, .jpeg, or .gif |
| `animation.frameTime` | integer | ✅ Yes | 1-60 |
| `stats.health` | integer | ✅ Yes | 1-1000 |
| `stats.speed` | number | ✅ Yes | 0-10 (can be decimal) |
| `stats.attackStrength` | integer | ✅ Yes | 0-1000 |
| `stats.attackSpeed` | integer | ✅ Yes | 1-10000 (milliseconds) |
| `stats.attackRange` | integer | ✅ Yes | 1-1000 (pixels) |
| `size.width` | integer | ✅ Yes | 1-500 (pixels) |
| `size.height` | integer | ✅ Yes | 1-500 (pixels) |
| `xpValue` | integer | ✅ Yes | 0-10000 |

### Field Details

#### name
- **Type**: String
- **Min Length**: 1 character
- **Max Length**: 100 characters
- **Example**: `"Zombie Warrior"`

#### sprites
- **Type**: Array of strings
- **Min Items**: 1
- **Max Items**: 20
- **Pattern**: Must end with `.png`, `.jpg`, `.jpeg`, or `.gif` (case insensitive)
- **Example**: `["assets/characters/enemies/sprite-1.png", "assets/characters/enemies/sprite-2.png"]`

#### animation.frameTime
- **Type**: Integer
- **Min**: 1
- **Max**: 60
- **Description**: Number of game frames each sprite displays (at 60 FPS, 60 = 1 second)
- **Example**: `12` (sprite changes every 0.2 seconds)

#### stats.health
- **Type**: Integer
- **Min**: 1
- **Max**: 1000
- **Description**: Hit points
- **Example**: `5`

#### stats.speed
- **Type**: Number (can be decimal)
- **Min**: 0
- **Max**: 10
- **Description**: Pixels per frame of movement
- **Example**: `0.4` (slow), `1.5` (fast)

#### stats.attackStrength
- **Type**: Integer
- **Min**: 0
- **Max**: 1000
- **Description**: Damage dealt per attack
- **Example**: `2`

#### stats.attackSpeed
- **Type**: Integer
- **Min**: 1
- **Max**: 10000
- **Description**: Cooldown between attacks in milliseconds
- **Example**: `500` (attacks twice per second)

#### stats.attackRange
- **Type**: Integer
- **Min**: 1
- **Max**: 1000
- **Description**: Distance from player to deal damage (pixels)
- **Example**: `40` (melee range)

#### size.width & size.height
- **Type**: Integer
- **Min**: 1
- **Max**: 500
- **Description**: Character dimensions in pixels
- **Example**: `{ "width": 60, "height": 66 }`

#### xpValue
- **Type**: Integer
- **Min**: 0
- **Max**: 10000
- **Description**: Experience points dropped when defeated
- **Example**: `1`

---

## Error Handling

All API responses follow a consistent format.

### Success Response Format

```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [ /* optional array of validation errors */ ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data failed validation |
| `CHARACTER_NOT_FOUND` | 404 | Requested character ID doesn't exist |
| `CHARACTER_ALREADY_EXISTS` | 409 | Character ID already exists (CREATE only) |
| `FILE_READ_ERROR` | 500 | Failed to read characters.json |
| `FILE_WRITE_ERROR` | 500 | Failed to write characters.json |
| `BACKUP_ERROR` | 500 | Failed to create backup |
| `FILE_LOCK_ERROR` | 500 | Could not acquire file lock |

### Error Examples

#### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "stats.health",
        "message": "Health must be at least 1"
      },
      {
        "field": "sprites",
        "message": "Sprite paths must end with .png, .jpg, .jpeg, or .gif"
      }
    ]
  }
}
```

#### Character Not Found (404)

```json
{
  "success": false,
  "error": {
    "code": "CHARACTER_NOT_FOUND",
    "message": "Character with ID 'zombie' not found"
  }
}
```

#### Character Already Exists (409)

```json
{
  "success": false,
  "error": {
    "code": "CHARACTER_ALREADY_EXISTS",
    "message": "Character with ID 'skeleton' already exists"
  }
}
```

#### File Write Error (500)

```json
{
  "success": false,
  "error": {
    "code": "FILE_WRITE_ERROR",
    "message": "Failed to write characters file: EACCES: permission denied"
  }
}
```

---

## Backup System

The API automatically creates backups of `characters.json` before every write operation (CREATE, UPDATE, DELETE).

### How It Works

1. **Before Write**: Current `characters.json` is copied to `api/backups/`
2. **Naming**: `characters_TIMESTAMP.json` (e.g., `characters_1736519400000.json`)
3. **Write**: Changes are written to `characters.json`
4. **Response**: Backup filename is included in response

### Backup Location

```
api/
└── backups/
    ├── characters_1736519400000.json
    ├── characters_1736519500000.json
    └── characters_1736519600.json
```

### Backup Retention

- Backups are **never automatically deleted**
- Manage manually by deleting old backups from `api/backups/`
- Consider setting up a cron job to clean old backups in production

### Restoring from Backup

To restore from a backup:

```bash
# 1. Stop the API
docker compose down

# 2. Replace characters.json with backup
cp api/backups/characters_1736519400000.json characters.json

# 3. Restart the API
docker compose up -d
```

### Listing Backups

```bash
# List all backups (newest first)
ls -lt api/backups/

# Count backups
ls api/backups/ | wc -l
```

### Backup Best Practices

1. **Monitor disk space** - Backups can accumulate over time
2. **Implement retention policy** - Delete backups older than X days
3. **External backups** - Copy important backups outside the container
4. **Test restoration** - Periodically test backup restoration process

---

## Integration Examples

### JavaScript (Fetch API)

#### Create Character

```javascript
async function createCharacter(id, characterData) {
  const response = await fetch('http://localhost:3333/api/v1/characters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: id,
      data: characterData
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

// Usage
const newCharacter = {
  name: "Zombie",
  sprites: ["assets/characters/enemies/zombie.png"],
  animation: { frameTime: 12 },
  stats: {
    health: 5,
    speed: 0.3,
    attackStrength: 2,
    attackSpeed: 700,
    attackRange: 45
  },
  size: { width: 65, height: 72 },
  xpValue: 2
};

createCharacter('zombie', newCharacter)
  .then(data => console.log('Created:', data))
  .catch(error => console.error('Error:', error));
```

#### Update Character

```javascript
async function updateCharacter(id, characterData) {
  const response = await fetch(`http://localhost:3333/api/v1/characters/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(characterData)
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
```

#### Delete Character

```javascript
async function deleteCharacter(id) {
  const response = await fetch(`http://localhost:3333/api/v1/characters/${id}`, {
    method: 'DELETE'
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
```

### cURL Examples

#### List All Characters

```bash
curl http://localhost:3333/api/v1/characters
```

#### Get Single Character

```bash
curl http://localhost:3333/api/v1/characters/skeleton
```

#### Create Character

```bash
curl -X POST http://localhost:3333/api/v1/characters \
  -H "Content-Type: application/json" \
  -d '{
    "id": "zombie",
    "data": {
      "name": "Zombie",
      "sprites": ["assets/characters/enemies/zombie.png"],
      "animation": { "frameTime": 12 },
      "stats": {
        "health": 5,
        "speed": 0.3,
        "attackStrength": 2,
        "attackSpeed": 700,
        "attackRange": 45
      },
      "size": { "width": 65, "height": 72 },
      "xpValue": 2
    }
  }'
```

#### Update Character

```bash
curl -X PUT http://localhost:3333/api/v1/characters/zombie \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Zombie",
    "sprites": ["assets/characters/enemies/zombie.png"],
    "animation": { "frameTime": 10 },
    "stats": {
      "health": 6,
      "speed": 0.35,
      "attackStrength": 2,
      "attackSpeed": 650,
      "attackRange": 45
    },
    "size": { "width": 65, "height": 72 },
    "xpValue": 3
  }'
```

#### Delete Character

```bash
curl -X DELETE http://localhost:3333/api/v1/characters/zombie
```

### Python Example

```python
import requests

BASE_URL = 'http://localhost:3333/api/v1'

def create_character(character_id, data):
    response = requests.post(
        f'{BASE_URL}/characters',
        json={'id': character_id, 'data': data}
    )
    result = response.json()

    if not result['success']:
        raise Exception(result['error']['message'])

    return result['data']

# Usage
new_character = {
    'name': 'Zombie',
    'sprites': ['assets/characters/enemies/zombie.png'],
    'animation': {'frameTime': 12},
    'stats': {
        'health': 5,
        'speed': 0.3,
        'attackStrength': 2,
        'attackSpeed': 700,
        'attackRange': 45
    },
    'size': {'width': 65, 'height': 72},
    'xpValue': 2
}

try:
    result = create_character('zombie', new_character)
    print('Created:', result)
except Exception as e:
    print('Error:', e)
```

### Character Editor 2 Integration

The API-based character editor ([tools/character-editor2.html](../tools/character-editor2.html)) is a complete example of API integration:

- Real-time API health checking
- Full CRUD operations
- Error handling with user-friendly messages
- Loading states
- Automatic refresh capability

See [CHARACTER_EDITOR_README.md](CHARACTER_EDITOR_README.md) for usage details.

---

## Troubleshooting

### API Not Responding

**Symptom**: Cannot connect to API endpoints

**Solutions**:

1. **Check containers are running**:
   ```bash
   docker compose ps
   ```
   Both `disco-survivors-api` and `disco-survivors-game` should be "Up"

2. **Check API health endpoint**:
   ```bash
   curl http://localhost:3334/api/v1/health
   ```

3. **Check API logs**:
   ```bash
   docker compose logs api
   ```

4. **Restart containers**:
   ```bash
   docker compose restart api
   ```

### Validation Errors

**Symptom**: Getting 400 Bad Request with validation errors

**Solutions**:

1. **Check field types**: Ensure integers are not sent as strings
2. **Check value ranges**: Review [Validation Rules](#validation-rules)
3. **Check sprite extensions**: Must end with `.png`, `.jpg`, `.jpeg`, or `.gif`
4. **Check character ID format**: Only lowercase, numbers, underscores
5. **Review error details**: The `details` array shows exactly what failed

### Character Not Found (404)

**Symptom**: Getting 404 when trying to update/delete/get character

**Solutions**:

1. **Verify ID exists**:
   ```bash
   curl http://localhost:3333/api/v1/characters
   ```

2. **Check for typos**: Character IDs are case-sensitive (but must be lowercase)

3. **Use exact ID**: Don't add `.json` or other extensions

### File Lock Errors

**Symptom**: Getting FILE_LOCK_ERROR

**Solutions**:

1. **Check for hung processes**:
   ```bash
   docker compose logs api | grep "lock"
   ```

2. **Restart API**:
   ```bash
   docker compose restart api
   ```

3. **Remove stale lock files** (if exists):
   ```bash
   docker compose exec api rm -f /app/characters.json.lock
   ```

### CORS Errors (Browser)

**Symptom**: Browser shows CORS policy error

**Solutions**:

- The API has CORS enabled by default
- If accessing from different domain in production, update CORS settings in `api/src/index.js`

### Backup Directory Full

**Symptom**: Disk space issues or too many backup files

**Solutions**:

1. **List backups**:
   ```bash
   ls -lh api/backups/
   ```

2. **Delete old backups**:
   ```bash
   # Keep only last 10 backups
   cd api/backups
   ls -t | tail -n +11 | xargs rm --
   ```

3. **Implement retention policy**: Create cron job to clean old backups

---

## Production Considerations

### Security

Before deploying to production:

1. **Add Authentication**: Implement API key or JWT authentication
2. **Rate Limiting**: Prevent abuse with rate limits
3. **HTTPS**: Use TLS/SSL for encrypted communication
4. **Input Sanitization**: Already implemented via Joi, but review
5. **CORS Policy**: Restrict allowed origins
6. **Environment Variables**: Use for sensitive configuration

### Performance

1. **Caching**: Consider adding Redis for GET requests
2. **Database**: For high-volume usage, migrate from JSON file to database
3. **Load Balancing**: Use multiple API instances behind load balancer
4. **Monitoring**: Add logging and monitoring (Prometheus, Grafana)

### Backup Management

1. **Automated Cleanup**: Cron job to delete backups older than N days
2. **External Storage**: Copy backups to S3, external drive, etc.
3. **Backup Alerts**: Monitor backup creation and disk usage

### Scaling Considerations

Current implementation uses:
- File-based storage (single JSON file)
- File locking for concurrency control

For high-traffic production:
- Migrate to database (PostgreSQL, MongoDB)
- Use proper transaction management
- Implement caching layer
- Add CDN for static assets

---

## Additional Resources

- **Character Editor Guide**: [CHARACTER_EDITOR_README.md](CHARACTER_EDITOR_README.md)
- **Character System Documentation**: [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md)
- **Main README**: [README.md](../README.md)
- **API Source Code**: [api/src/](../api/src/)
- **Validation Schemas**: [api/src/validators/character.js](../api/src/validators/character.js)

---

**API Version**: 1.0
**Last Updated**: 2026-01-10
**Maintained By**: Disco Survivors Contributors
