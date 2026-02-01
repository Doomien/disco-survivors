// Globals
// ------------------------------------------
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;

const FACE_LEFT = 0;
const FACE_RIGHT = 1;

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const MAX_OBJECTS = 25000;
const ENEMY_SPAWN_COUNT_PER_WAVE = 50;
const ENEMY_SPAWN_TIME_BETWEEN_WAVES = 5000; // ms

// Game Configuration - Toggle features on/off
const GAME_CONFIG = {
    weapons: {
        micWeapon: true,        // Microphone weapon
        discoBallWeapon: false, // Disco ball weapon (disabled)
        radialProjectileWeapon: false  // Radial projectile weapon (dropped by enemies)
    }
};

// Drop table configuration - weights determine relative drop chance
// Higher weight = more common drop
const DROP_TABLE = [
    { type: 'candy', weight: 80 },           // XP drop - most common
    { type: 'regularFlower', weight: 10 },   // Speed boost
    { type: 'electrifiedSword', weight: 5 }, // Sword weapon pickup
    { type: 'radialProjectile', weight: 5 }  // Radial projectile weapon pickup
];

// Player character images
// Sean character (Character 1)
const seanImage1 = makeImage('assets/characters/player/sean.png');
const seanImage2 = makeImage('assets/characters/player/sean.png');
const seanImage3 = makeImage('assets/characters/player/sean.png');
const seanImage4 = makeImage('assets/characters/player/sean.png');

// MicrowaveMan character (Character 2)
const microwaveManImage1 = makeImage('assets/characters/player/Microwave Man_Pixel.png');
const microwaveManImage2 = makeImage('assets/characters/player/Microwave Man_Pixel.png');
const microwaveManImage3 = makeImage('assets/characters/player/Microwave Man_Pixel.png');
const microwaveManImage4 = makeImage('assets/characters/player/Microwave Man_Pixel.png');
const skeletonImageLeft = makeImage('assets/characters/enemies/skeleton-1.png');
const skeletonImageLeft2 = makeImage('assets/characters/enemies/skeleton-2.png');
const skeletonImageRight = makeImage('assets/characters/enemies/skeleton-1.png');
const skeletonImageRight2 = makeImage('assets/characters/enemies/skeleton-2.png');
const ballImage1 = makeImage('assets/items/ball-1.png');
const ballImage2 = makeImage('assets/items/ball-2.png');
const candyDroppedImage = makeImage('assets/items/candy-dropped.png');
const candyImage = makeImage('assets/items/candy.png');
const micImage = makeImage('assets/items/mic.png');
const regularFlowerImage = makeImage('assets/items/RegularFlower.png');
const electrifiedSwordImage1 = makeImage('assets/characters/enemies/006_ElectrifiedSword.png');
const electrifiedSwordImage2 = makeImage('assets/characters/enemies/006_ElectrifiedSword2.png');
const electrifiedSwordImage3 = makeImage('assets/characters/enemies/006_ElectrifiedSword3.png');
const multitoolImage = makeImage('assets/custom/items/Multitool-small.png');
const floorImage = makeImage('assets/environment/Zelda-Style-Test.png');

const gameRunning = true;
const targetFps = 60;
let player;
let canvas;
let canvasContainer;
let context;
let gameIntervalId;
let levelRunStart;
let input = {
    right: false,
    left: false,
    up: false,
    down: false,
};
let objects = [];
let enemiesDestroyed = 0;
let nextEnemyId = 0;
let timeSinceLastEnemySpawn = Date.now(); // ms
let characterData = null; // Will hold loaded character definitions
let characterImages = {}; // Cache for character sprite images
let gameConfig = null; // Game configuration
let playerConfig = null; // Player configuration
let itemConfig = null; // Item configuration

// Helper Functions
// ------------------------------------------

/**
 * Load a JSON config file with fallback
 */
async function loadConfig(path, fallback = null) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            console.warn(`Config not found: ${path}, using fallback`);
            return fallback;
        }
        return await response.json();
    } catch (error) {
        console.warn(`Failed to load ${path}:`, error);
        return fallback;
    }
}

/**
 * Merge two config objects (custom overrides base)
 */
function mergeConfigs(base, custom) {
    if (!custom) return base;
    const merged = { ...base };
    for (const [key, value] of Object.entries(custom)) {
        if (typeof value === 'object' && !Array.isArray(value)) {
            merged[key] = { ...(merged[key] || {}), ...value };
        } else {
            merged[key] = value;
        }
    }
    return merged;
}

/**
 * Load all game configuration files
 */
async function loadGameConfig() {
    try {
        gameConfig = await loadConfig('config/game.config.json');
        console.log('Game config loaded:', gameConfig);
    } catch (error) {
        console.error('Failed to load game config:', error);
        gameConfig = {
            world: { width: 3000, height: 3000 },
            assets: { basePath: 'assets/base', customPath: 'assets/custom' },
            gameplay: { maxObjects: 25000, spawnWaveSize: 50 },
            defaultPlayer: 'sean'
        };
    }
}

/**
 * Load character definitions from JSON files (enemies)
 */
async function loadCharacterData() {
    try {
        // Load base enemies
        const baseEnemies = await loadConfig('config/base/enemies.json', { enemies: {} });

        // Load custom enemies (may not exist, that's okay)
        const customEnemies = await loadConfig('config/custom/enemies.json', { enemies: {} });

        // Merge configs
        characterData = {
            enemies: { ...baseEnemies.enemies, ...customEnemies.enemies }
        };

        console.log('Character data loaded:', characterData);

        // Pre-load all character images
        for (const [enemyType, data] of Object.entries(characterData.enemies)) {
            if (data.sprites.left && data.sprites.right) {
                // Old format: separate left/right sprites
                characterImages[enemyType] = {
                    left: data.sprites.left.map(src => makeImage(src)),
                    right: data.sprites.right.map(src => makeImage(src))
                };
            } else if (data.sprites) {
                // New format: single sprites array
                characterImages[enemyType] = data.sprites.map(src => makeImage(src));
            }
        }
    } catch (error) {
        console.error('Failed to load character data:', error);
        // Fallback to default skeleton if loading fails
        characterData = {
            enemies: {
                skeleton: {
                    name: "Skeleton",
                    sprites: ["assets/base/characters/enemies/skeleton-1.png", "assets/base/characters/enemies/skeleton-2.png"],
                    animation: { frameTime: 12 },
                    stats: {
                        health: 3,
                        speed: 0.4,
                        attackStrength: 1,
                        attackSpeed: 500,
                        attackRange: 40
                    },
                    size: { width: 60, height: 66 },
                    xpValue: 1
                }
            }
        };
        // Load fallback images
        characterImages.skeleton = characterData.enemies.skeleton.sprites.map(src => makeImage(src));
    }
}

/**
 * Load player configuration
 */
async function loadPlayerConfig() {
    try {
        const basePlayers = await loadConfig('config/base/players.json', { players: {} });
        const customPlayers = await loadConfig('config/custom/players.json', { players: {} });

        playerConfig = {
            players: { ...basePlayers.players, ...customPlayers.players }
        };

        console.log('Player config loaded:', playerConfig);
    } catch (error) {
        console.error('Failed to load player config:', error);
        playerConfig = { players: {} };
    }
}

/**
 * Load item configuration
 */
async function loadItemConfig() {
    try {
        const baseItems = await loadConfig('config/base/items.json', { weapons: {}, projectiles: {}, collectibles: {} });
        const customItems = await loadConfig('config/custom/items.json', { weapons: {}, projectiles: {}, collectibles: {} });

        itemConfig = {
            weapons: { ...(baseItems.weapons || {}), ...(customItems.weapons || {}) },
            projectiles: { ...(baseItems.projectiles || {}), ...(customItems.projectiles || {}) },
            collectibles: { ...(baseItems.collectibles || {}), ...(customItems.collectibles || {}) }
        };

        console.log('Item config loaded:', itemConfig);
    } catch (error) {
        console.error('Failed to load item config:', error);
        itemConfig = { weapons: {}, projectiles: {}, collectibles: {} };
    }
}

/**
 * Get a random enemy type from available character definitions
 * Uses weighted selection based on spawnWeight (default: 1)
 */
function getRandomEnemyType() {
    const enemies = characterData.enemies;
    const enemyTypes = Object.keys(enemies);
    
    // Build weighted array
    const weights = enemyTypes.map(type => enemies[type].spawnWeight || 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    // Select random enemy based on weight
    let random = Math.random() * totalWeight;
    for (let i = 0; i < enemyTypes.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return enemyTypes[i];
        }
    }
    
    // Fallback (shouldn't reach here)
    return enemyTypes[enemyTypes.length - 1];
}

/**
 * Get a random drop type based on weighted drop table
 * Returns the type string (e.g., 'candy', 'electrifiedSword')
 */
function getRandomDropType() {
    const totalWeight = DROP_TABLE.reduce((sum, item) => sum + item.weight, 0);
    
    let random = Math.random() * totalWeight;
    for (const drop of DROP_TABLE) {
        random -= drop.weight;
        if (random <= 0) {
            return drop.type;
        }
    }
    
    // Fallback to candy
    return 'candy';
}

/**
 * Spawn a drop item at the given position based on type
 */
function spawnDrop(x, y, type) {
    switch (type) {
        case 'candy':
            objects.push(new Candy(x, y));
            break;
        case 'regularFlower':
            objects.push(new RegularFlower(x, y));
            break;
        case 'electrifiedSword':
            objects.push(new ElectrifiedSword(x, y));
            break;
        case 'radialProjectile':
            objects.push(new RadialProjectilePickup(x, y));
            break;
        default:
            objects.push(new Candy(x, y));
    }
}

/**
 * Clears the canvas background and sets it back
 * to its default color.
 */
function resetCanvas() {
    // clear background
    context.clearRect(
        0, 0, canvas.width, canvas.height
    );
    context.beginPath();

    // render background
    context.fillStyle = 'black';
    context.fillRect(
        0, 0, canvas.width, canvas.height
    );
}

/**
 * Generates waves of enemies off screen every
 * so often.
 */
function spawnEnemies() {
    if (Date.now() - timeSinceLastEnemySpawn < ENEMY_SPAWN_TIME_BETWEEN_WAVES) return;

    if (objects.length > MAX_OBJECTS) return;

    for (var i = 0; i <= ENEMY_SPAWN_COUNT_PER_WAVE; i++) {
        const radius = randomRange(900, 1200);
        const angle = randomRange(0, 360);
        const randX = player.x + Math.sin(angle) * radius;
        const randY = player.y + Math.cos(angle) * radius;

        // Randomly select an enemy type from loaded character data
        const enemyType = getRandomEnemyType();
        objects.push(new Enemy(randX, randY, enemyType));
    }
    timeSinceLastEnemySpawn = Date.now();
}

// World Object Classes
// ------------------------------------------

class Player {
    constructor(x, y) {
        // Load character definitions from config
        this.characters = {};
        if (playerConfig && playerConfig.players) {
            for (const [id, data] of Object.entries(playerConfig.players)) {
                this.characters[id] = {
                    name: data.name,
                    images: data.sprites.map(src => makeImage(src)),
                    width: data.size.width,
                    height: data.size.height
                };
            }
        }

        // Fallback to default if no player config loaded
        if (Object.keys(this.characters).length === 0) {
            this.characters.default = {
                name: 'Player',
                images: [
                    makeImage('assets/base/characters/player/player-1.png'),
                    makeImage('assets/base/characters/player/player-2.png'),
                    makeImage('assets/base/characters/player/player-1.png'),
                    makeImage('assets/base/characters/player/player-2.png')
                ],
                width: 60,
                height: 60
            };
        }

        // Select default character
        const defaultPlayer = (gameConfig && gameConfig.defaultPlayer) || 'sean';
        this.currentCharacter = this.characters[defaultPlayer] ? defaultPlayer : Object.keys(this.characters)[0];
        this.loadCharacterAnimations();

        this.idle = true;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.width = this.characters[this.currentCharacter].width;
        this.height = this.characters[this.currentCharacter].height;
        this.health = 50;
        this.baseSpeed = 3;
        this.speed = 3;
        this.speedBoostActive = false;
        this.speedBoostEndTime = 0;

        // Initialize weapons based on config
        this.items = [];
        const weaponConfig = (gameConfig && gameConfig.weapons) || GAME_CONFIG.weapons;
        if (weaponConfig.micWeapon) {
            this.items.push(new MicWeapon());
        }
        if (weaponConfig.discoBallWeapon) {
            this.items.push(new DiscoBallWeapon());
        }
        if (weaponConfig.radialProjectileWeapon) {
            this.items.push(new RadialProjectileWeapon());
        }

        this.xp = 0;
        this.nextLevelXp = 10;
        this.prevLevelXp = 0;
        this.setDirection(FACE_LEFT);
    }

    update() {
        // check if speed boost expired...
        if (this.speedBoostActive && Date.now() >= this.speedBoostEndTime) {
            this.speedBoostActive = false;
            this.speed = this.baseSpeed;
        }

        // handle player movement...
        if (input.right) this.x += this.speed;
        if (input.left) this.x -= this.speed;
        if (input.up) this.y -= this.speed;
        if (input.down) this.y += this.speed;
        this.idle = !input.right && !input.left && !input.up && !input.down;
        focusCameraOn(this.x, this.y);

        // update current animation...
        this.animation.update(this.idle);

        // set the attack state...
        this.items.forEach(item => item.update());
    }

    draw() {
        // draw weapons...
        this.items.forEach(item => item.draw());

        // draw the player sprite...
        const image = this.animation.image();
        image.width = this.width;
        image.height = this.height;
        context.drawImage(
            image,
            this.x - (this.width / 2.0),
            this.y - (this.height / 2.0),
            this.width, this.height
        );
    }

    loadCharacterAnimations() {
        const char = this.characters[this.currentCharacter];
        this.leftAnimation = new Animation([
            { time: 8, image: char.images[0] },
            { time: 8, image: char.images[1] },
            { time: 8, image: char.images[2] },
            { time: 8, image: char.images[3] },
        ]);
        this.rightAnimation = new Animation([
            { time: 8, image: char.images[0] },
            { time: 8, image: char.images[1] },
            { time: 8, image: char.images[2] },
            { time: 8, image: char.images[3] },
        ]);
        this.animation = this.leftAnimation; // Set default
    }

    switchCharacter(characterKey) {
        if (!this.characters[characterKey]) return;
        this.currentCharacter = characterKey;
        const char = this.characters[this.currentCharacter];
        this.width = char.width;
        this.height = char.height;
        this.loadCharacterAnimations();
        this.setDirection(this.direction || FACE_LEFT);
    }

    setDirection(direction) {
        if (this.direction === direction) return;
        this.direction = direction;
        this.animation = this.direction === FACE_LEFT ? this.leftAnimation : this.rightAnimation;
        this.animation.reset();
    }

    gainXp(xp) {
        this.xp += xp;
        if (this.xp >= this.nextLevelXp) this.levelUp();
    }

    levelUp() {
        this.level += 1;
        this.prevLevelXp = this.nextLevelXp;
        this.nextLevelXp = this.nextLevelXp * 2.5;
    }

    activateSpeedBoost() {
        this.speedBoostActive = true;
        this.speed = this.baseSpeed * 4;  // 4x speed boost
        this.speedBoostEndTime = Date.now() + 10000;  // 10 seconds duration
    }
}

class Enemy {
    constructor(x, y, characterType = 'skeleton') {
        this.id = getNextEnemyId();
        this.characterType = characterType;

        // Get character definition from loaded data
        const charData = characterData.enemies[characterType];
        if (!charData) {
            console.warn(`Unknown character type: ${characterType}, using skeleton`);
            charData = characterData.enemies.skeleton;
            this.characterType = 'skeleton';
        }

        // Create animation from character data
        // Support both old format (left/right) and new format (single sprites array)
        const spriteImages = characterImages[this.characterType];
        const frameTime = charData.animation.frameTime || 12;

        if (spriteImages.left && spriteImages.right) {
            // Old format: separate left/right sprites
            this.leftAnimation = new Animation(
                spriteImages.left.map(img => ({ time: frameTime, image: img }))
            );
            this.rightAnimation = new Animation(
                spriteImages.right.map(img => ({ time: frameTime, image: img }))
            );
            this.useSingleSprite = false;
        } else {
            // New format: single sprite array (will be flipped for left direction)
            this.animation = new Animation(
                spriteImages.map(img => ({ time: frameTime, image: img }))
            );
            this.useSingleSprite = true;
        }

        this.idle = false;
        this.x = x;
        this.prevX = x;
        this.y = y;
        this.prevY = y;

        // Apply stats from character data
        this.width = charData.size.width;
        this.height = charData.size.height;
        this.speed = charData.stats.speed;
        this.health = charData.stats.health;
        this.maxHealth = charData.stats.health;
        this.attackStrength = charData.stats.attackStrength;
        this.attackSpeed = charData.stats.attackSpeed;
        this.attackRange = charData.stats.attackRange;
        this.xpValue = charData.xpValue || 1;

        this.lastAttackTime = Date.now();
        this.destroyed = false;
        this.setDirection(FACE_LEFT);
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;

        // handle death state, mark to be destroyed
        // and don't do anything once health is at
        // 0
        if (this.health <= 0) {
            this.destroy();
            return;
        }

        // move towards the player...
        var dx = player.x - this.x;
        var dy = player.y - this.y;
        var angle = Math.atan2(dy, dx);
        this.x += this.speed * Math.cos(angle);
        this.y += this.speed * Math.sin(angle);

        // handle setting attack state...
        let attacking = false;
        const msSinceLastAttack =
            Date.now() - this.lastAttackTime;
        if (msSinceLastAttack > this.attackSpeed) {
            attacking = true;
            this.lastAttackTime = Date.now();
        }

        // handle direction...
        this.setDirection(this.x > this.prevX ? FACE_RIGHT : FACE_LEFT);

        // update current animation...
        this.animation.update(this.idle);

        const nearPlayer = pointInCircle(
            this.x, this.y, player.x, player.y, 150
        );
        if (nearPlayer) {
            // enemy is close enough to player to
            // attack them
            if (
                attacking &&
                Math.abs(dx) < this.attackRange &&
                Math.abs(dy) < this.attackRange
            ) {
                player.health = Math.max(
                    player.health - this.attackStrength,
                    0
                );
            }
        }
    }

    draw() {
        const image = this.animation.image();
        image.width = this.width;
        image.height = this.height;

        if (this.useSingleSprite && this.direction === FACE_LEFT) {
            // Flip the image horizontally for left-facing direction
            context.save();
            context.scale(-1, 1);
            context.drawImage(
                image,
                -(this.x + this.width), this.y,
                this.width, this.height
            );
            context.restore();
        } else {
            // Normal rendering (no flip or old format with separate sprites)
            context.drawImage(
                image, this.x, this.y, this.width, this.height
            );
        }
    }

    setDirection(direction, reset = true) {
        if (this.direction === direction) return;
        this.direction = direction;

        if (!this.useSingleSprite) {
            // Old format: switch between left/right animations
            this.animation = this.direction === FACE_LEFT ? this.leftAnimation : this.rightAnimation;
            if (reset) this.animation.reset();
        }
        // New format: direction is handled in draw() via flipping
    }

    hit(strength) {
        this.health -= strength;
        objects.push(
            new DamageTakenText(
                strength, this.x, this.y
            )
        );
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        enemiesDestroyed += 1;

        // Drop item using weighted drop table
        const dropType = getRandomDropType();
        spawnDrop(this.x, this.y, dropType);
    }
}

class Candy {
    constructor(x, y) {
        this.image = candyDroppedImage;
        this.x = x;
        this.y = y;
        this.attractRadius = 200;
        this.pickupRadius = 50;
        this.xp = 1;
    }

    update() {
        if (this.destroyed) return;

        if (pointInCircle(this.x, this.y, player.x, player.y, this.pickupRadius)) {
            this.pickup();
            return;
        }

        if (pointInCircle(this.x, this.y, player.x, player.y, this.attractRadius)) {
            this.x = lerp(this.x, player.x, 0.1);
            this.y = lerp(this.y, player.y, 0.1);
        }
    }

    draw() {
        context.drawImage(
            this.image,
            this.x,
            this.y,
            this.image.width, this.image.height
        );
    }

    pickup() {
        if (this.destroyed) return;
        this.destroy();
        player.gainXp(this.xp);
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
    }
}

class RegularFlower {
    constructor(x, y) {
        this.image = regularFlowerImage;
        this.x = x;
        this.y = y;
        this.attractRadius = 200;
        this.pickupRadius = 50;
    }

    update() {
        if (this.destroyed) return;

        if (pointInCircle(this.x, this.y, player.x, player.y, this.pickupRadius)) {
            this.pickup();
            return;
        }

        if (pointInCircle(this.x, this.y, player.x, player.y, this.attractRadius)) {
            this.x = lerp(this.x, player.x, 0.1);
            this.y = lerp(this.y, player.y, 0.1);
        }
    }

    draw() {
        context.drawImage(
            this.image,
            this.x,
            this.y,
            this.image.width, this.image.height
        );
    }

    pickup() {
        if (this.destroyed) return;
        this.destroy();
        player.activateSpeedBoost();
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
    }
}

class ElectrifiedSword {
    constructor(x, y) {
        this.animation = new Animation([
            { time: 10, image: electrifiedSwordImage1 },
            { time: 10, image: electrifiedSwordImage2 },
            { time: 10, image: electrifiedSwordImage3 },
            { time: 10, image: electrifiedSwordImage2 },
        ]);
        this.x = x;
        this.y = y;
        this.width = 65;
        this.height = 70;
        this.attractRadius = 200;
        this.pickupRadius = 50;
    }

    update() {
        if (this.destroyed) return;

        this.animation.update(false);

        if (pointInCircle(this.x, this.y, player.x, player.y, this.pickupRadius)) {
            this.pickup();
            return;
        }

        if (pointInCircle(this.x, this.y, player.x, player.y, this.attractRadius)) {
            this.x = lerp(this.x, player.x, 0.1);
            this.y = lerp(this.y, player.y, 0.1);
        }
    }

    draw() {
        const image = this.animation.image();
        context.drawImage(
            image,
            this.x,
            this.y,
            this.width, this.height
        );
    }

    pickup() {
        if (this.destroyed) return;
        this.destroy();
        // Add the Electrified Sword weapon to the player
        player.items.push(new ElectrifiedSwordWeapon());
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
    }
}

/**
 * RadialProjectilePickup - Dropped item that gives player the radial projectile weapon
 */
class RadialProjectilePickup {
    constructor(x, y) {
        // Use multitool sprite for the radial projectile pickup
        this.image = multitoolImage;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.attractRadius = 200;
        this.pickupRadius = 50;
    }

    update() {
        if (this.destroyed) return;

        if (pointInCircle(this.x, this.y, player.x, player.y, this.pickupRadius)) {
            this.pickup();
            return;
        }

        if (pointInCircle(this.x, this.y, player.x, player.y, this.attractRadius)) {
            this.x = lerp(this.x, player.x, 0.1);
            this.y = lerp(this.y, player.y, 0.1);
        }
    }

    draw() {
        context.drawImage(
            this.image,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width, this.height
        );
    }

    pickup() {
        if (this.destroyed) return;
        this.destroy();
        // Add the Radial Projectile weapon to the player
        player.items.push(new RadialProjectileWeapon());
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
    }
}

class DamageTakenText {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.framesCount = 0;
        this.growAnimationFrames = 40;
        this.fadeAnimationFrames = 60;
        this.fontSize = 10;
        this.fontOpacity = 1;
        this.growToSize = 32;
        this.fillStyle = 'white';
        this.strokeColor = 'black';
    }

    update() {
        this.y -= 0.5;
        if (this.framesCount < this.growAnimationFrames) {
            this.fontSize = lerp(this.fontSize, this.growToSize, 0.4);
        } else if (this.framesCount < this.growAnimationFrames + this.fadeAnimationFrames) {
            this.fontOpacity = lerp(this.fontOpacity, 0, 0.25);
        } else {
            this.destroyed = true;
        }
        this.framesCount += 1;
    }

    draw() {
        drawContext(
            () => {
                context.font = `${this.fontSize}px monospace`;
                context.fillStyle = this.fillStyle;
                context.strokeColor = this.strokeColor;
                context.globalAlpha = this.fontOpacity;
            },
            () => context.fillText(this.text, this.x, this.y)
        );
    }
}

class Weapon {
    constructor(speed, animationFrames, strength) {
        this.attackSpeed = speed; // ms
        this.attackAnimationFrames = animationFrames;
        this.attackStrength = strength;
        this.lastAttackTime = Date.now();
        this.attacking = false;
        this.attackFramesPassed = 0;
        this.updateFramesPassed = 0;
    }

    update() {
        const msSinceLastAttack =
            Date.now() - this.lastAttackTime;
        if (msSinceLastAttack > this.attackSpeed) {
            this.attacking = true;
            this.lastAttackTime = Date.now();
        }
        if (this.attacking) {
            this.attackFramesPassed += 1;
            if (this.attackFramesPassed >= this.attackAnimationFrames) {
                this.attacking = false;
                this.attackFramesPassed = 0;
            }
        }
        this.updateFramesPassed += 1;
    }

    draw() {}

    firstAttackFrame() {
        return this.attacking && this.attackFramesPassed === 1;
    }
}

class DiscoPool extends Weapon {
    constructor() {
        const speed = 2000;
        const animationFrames = 5;
        const strength = 1;
        super(speed, animationFrames, strength);
        this.updateFrames = 60 * 10;
        this.animation = new Animation([
            { time: 12, image: ballImage1 },
            { time: 12, image: ballImage2 },
        ]);
        this.x = player.x + randomRange(-300, 300);
        this.y = player.y + randomRange(-300, 300);
        this.fillStyle = 'rgb(225, 180, 255)';
        this.opacity = 0.7;
        this.radius = 80;
    }

    update() {
        super.update();
        this.animation.update();
        if (this.updateFramesPassed > this.updateFrames) {
            this.destroyed = true;
        }
        this.opacity = lerp(this.opacity, 0, 0.002);

        if (this.firstAttackFrame()) {
            // horribly inefficient, iterate over all the objects to find
            // enemies that we are hitting
            for (const object of objects) {
                if (object instanceof Enemy) {
                    if (!pointInCircle(object.x, object.y, this.x, this.y, this.radius)) continue;
                    object.hit(this.attackStrength);
                }
            }
        }
    }

    draw() {
        drawContext(
            () => {
                context.fillStyle = this.fillStyle;
                context.globalAlpha = this.opacity;
            }, () => {
                context.beginPath();
                context.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, 360);
                context.fill();
            },
        );

        // draw the enemy sprite...
        const image = this.animation.image();
        context.drawImage(
            image,
            this.x - (image.width / 3.2),
            this.y - 140,
            image.width / 2.0, image.height / 2.0
        );
    }
}

class DiscoBallWeapon extends Weapon {
    constructor() {
        const attackSpeed = 14000; // ms
        const attackAnimationFrames = 5;
        super(attackSpeed, attackAnimationFrames);
        this.level = 4;
    }

    spawnCount() {
        return this.level;
    }

    update() {
        super.update();
        if (this.firstAttackFrame()) {
            const spawnCount = this.spawnCount();
            for (var i = 0; i < spawnCount; i++) {
                setTimeout(() => {
                    objects.push(
                        new DiscoPool()
                    );
                }, i * (700 + randomRange(0, 100)));
            }
        }
    }

    draw() {}
}

class MicWeapon extends Weapon {
    constructor() {
        const attackSpeed = 1000; // ms
        const attackAnimationFrames = 5;
        const attackStrength = 1;
        super(attackSpeed, attackAnimationFrames, attackStrength);
        this.level = 8;
        this.radius = 100;
        this.image = micImage;
        this.angle = 0;
        this.enemiesHit = {};
    }

    update() {
        this.angle = (this.angle + (0.05 * this.level)) % 360;
        this.x = player.x + Math.sin(this.angle) * this.radius;
        this.y = player.y + Math.cos(this.angle) * this.radius;
        for (const object of objects) {
            if (object instanceof Enemy) {
                if (
                    object.id in this.enemiesHit &&
                    ((new Date()) - this.enemiesHit[object.id]) < this.attackSpeed
                ) {
                    continue;
                }

                if (
                    this.x > object.x - 50 &&
                    this.x < object.x + 50 &&
                    this.y > object.y - 50 &&
                    this.y < object.y + 50
                ) {
                    object.hit(this.attackStrength);
                    this.enemiesHit[object.id] = new Date();
                }
            }
        }
    }

    draw() {
        context.save();
        context.translate(10, 0);
        context.setTransform(-1, 0, 0, -1, this.x, this.y);
        context.rotate(-this.angle);
        context.drawImage(
            this.image,
            -this.image.width / 2, -this.image.height / 2
        );
        context.restore();

        context.beginPath();
        context.moveTo(player.x, player.y);
        context.lineTo(this.x, this.y);
        context.closePath();
        context.stroke();
    }
}

class ElectrifiedSwordWeapon extends Weapon {
    constructor() {
        const attackSpeed = 1600; // ms
        const attackAnimationFrames = 5;
        const attackStrength = 4;
        super(attackSpeed, attackAnimationFrames, attackStrength);
        this.level = 1;
        this.radius = 240;
        this.animation = new Animation([
            { time: 10, image: electrifiedSwordImage1 },
            { time: 10, image: electrifiedSwordImage2 },
            { time: 10, image: electrifiedSwordImage3 },
            { time: 10, image: electrifiedSwordImage2 },
        ]);
        this.angle = Math.PI; // Start at opposite side from mic
        this.width = 65;
        this.height = 70;
        this.enemiesHit = {};
    }

    update() {
        this.animation.update(false);
        this.angle = (this.angle + (0.04 * this.level)) % (2 * Math.PI);
        this.x = player.x + Math.sin(this.angle) * this.radius;
        this.y = player.y + Math.cos(this.angle) * this.radius;

        for (const object of objects) {
            if (object instanceof Enemy) {
                if (
                    object.id in this.enemiesHit &&
                    ((new Date()) - this.enemiesHit[object.id]) < this.attackSpeed
                ) {
                    continue;
                }

                if (
                    this.x > object.x - 50 &&
                    this.x < object.x + 50 &&
                    this.y > object.y - 50 &&
                    this.y < object.y + 50
                ) {
                    object.hit(this.attackStrength);
                    this.enemiesHit[object.id] = new Date();
                }
            }
        }
    }

    draw() {
        const image = this.animation.image();
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.angle + Math.PI / 2);
        context.drawImage(
            image,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        context.restore();
    }
}

/**
 * RadialProjectile - A single projectile that travels in one direction
 * Destroys itself when hitting an enemy
 */
class RadialProjectile {
    constructor(x, y, angle, speed, attackStrength, size) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.attackStrength = attackStrength;
        this.width = size.width;
        this.height = size.height;
        this.destroyed = false;
        this.maxDistance = 800; // Max travel distance before despawning
        this.distanceTraveled = 0;
        
        // Calculate velocity components
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Use multitool sprite for projectiles
        this.image = multitoolImage;
        this.rotation = 0; // For spinning effect
    }

    update() {
        // Move projectile
        this.x += this.vx;
        this.y += this.vy;
        this.distanceTraveled += this.speed;
        
        // Spin the sprite
        this.rotation += 0.15;
        
        // Check if traveled too far
        if (this.distanceTraveled > this.maxDistance) {
            this.destroyed = true;
            return;
        }
        
        // Check collision with enemies
        for (const object of objects) {
            if (object instanceof Enemy) {
                const dx = this.x - object.x;
                const dy = this.y - object.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 40) { // Hit radius
                    object.hit(this.attackStrength);
                    this.destroyed = true;
                    return;
                }
            }
        }
    }

    draw() {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation);
        context.drawImage(
            this.image,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        context.restore();
    }
}

/**
 * RadialProjectileWeapon - Fires 8 projectiles outward from player in all directions
 */
class RadialProjectileWeapon extends Weapon {
    constructor() {
        const attackSpeed = 5000; // ms between attacks
        const attackAnimationFrames = 5;
        const attackStrength = 1;
        super(attackSpeed, attackAnimationFrames, attackStrength);
        this.projectileSpeed = 2;
        this.projectileSize = { width: 30, height: 30 };
        this.directions = 8; // Number of projectiles (8 = cardinal + diagonal)
    }

    update() {
        super.update();
        
        if (this.firstAttackFrame()) {
            // Spawn 8 projectiles in radial pattern
            for (let i = 0; i < this.directions; i++) {
                const angle = (i / this.directions) * (2 * Math.PI);
                const projectile = new RadialProjectile(
                    player.x,
                    player.y,
                    angle,
                    this.projectileSpeed,
                    this.attackStrength,
                    this.projectileSize
                );
                objects.push(projectile);
            }
        }
    }

    draw() {
        // Weapon itself has no visual, only its projectiles do
    }
}

// Game Loop
// ------------------------------------------

function playGame() {
    if (!gameRunning) {
        clearInterval(gameIntervalId);
        return;
    }

    // Update world state
    // handle end game state
    if (player.health <= 0) {
        resetCanvas();
        guiTopMiddle(function(x, y) {
            context.font = '24px monospace';
            context.fillStyle = 'white';
            context.fillText(
                `Game Over`,
                x, y
            );
        });
        return;
    }
    // update individual entities
    for (const [index, object] of objects.entries()) {
        object?.update();
        if (object?.destroyed) {
            objects.splice(index, 1); // not efficient
        }
    }
    // spawner
    spawnEnemies();

    // draw
    resetCanvas();

    // draw background
    const bgPattern = context.createPattern(floorImage, 'repeat');
    context.fillStyle = bgPattern;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // draw world objects
    for (const object of objects) {
        object?.draw();
    }

    // draw the gui
    const timer = timeSince(levelRunStart);
    const texts = [
        `❤️: ${player.health}` +
        ` 💀: ${enemiesDestroyed}` +
        ` LV${player.level}` +
        ` ${leftPad(timer.minutes, 2, 0)}:${leftPad(timer.seconds, 2, 0)}`,
        `🎮 ${player.characters[player.currentCharacter].name}`
    ];
    const measures = texts.map(text => measureTextDimensions(text));
    guiTopMiddle(function(x, y) {
        const width = Math.max(...measures.map(measure => measure.width));
        const height = measures.reduce((acc, measure) => acc + measure.height, 0);
        context.fillStyle = 'white';
        context.fillRect(
            x - (width / 2) - 10, y - height + 10,
            width + 20, height * 2 - 20
        );
        context.font = `24px monospace`;
        context.fillStyle = 'black';
        for (const [index, text] of texts.entries()) {
            context.fillText(
                text,
                x - (width / 2),
                y + (index * 30) + 10,
            );
        }
    });

    // draw xp bar...
    guiPosition(0, 0, function(x, y) {
        const currentXp = player.xp - player.prevLevelXp;
        const nextLevelXp = player.nextLevelXp - player.prevLevelXp;
        const percentage = !currentXp ? 0 : currentXp / nextLevelXp;
        context.fillStyle = 'black';
        context.fillRect(x, y, window.innerWidth, 26);

        context.fillStyle = 'blue';
        context.fillRect(
            x + 2, y + 2,
            (window.innerWidth - 4) * percentage,
            22
        );
    });

    // draw speed boost indicator...
    if (player.speedBoostActive) {
        const timeRemaining = Math.ceil((player.speedBoostEndTime - Date.now()) / 1000);
        guiTopMiddle(function(x, y) {
            context.font = `20px monospace`;
            context.fillStyle = 'yellow';
            context.strokeStyle = 'black';
            context.lineWidth = 3;
            const text = `⚡ SPEED BOOST: ${timeRemaining}s ⚡`;
            context.strokeText(text, x - 120, y + 60);
            context.fillText(text, x - 120, y + 60);
        });
    }
}

// Helper Functions
// ------------------------------------------

function getNextEnemyId() {
    const id = nextEnemyId;
    nextEnemyId += 1;
    return id;
}

function boundXToCanvas(x) {
    const leftBound = 0;
    const rightBound = canvas.width - window.innerWidth;
    return Math.max(-rightBound, Math.min(leftBound, x));
}

function boundYToCanvas(y) {
    const topBound = 0;
    const bottomBound = canvas.height - window.innerHeight;
    return Math.max(-bottomBound, Math.min(topBound, y));
}

function focusCameraOn(targetX, targetY) {
    const freeZoneMargin = 90;
    const xOffset = pxStrToNumber(canvasContainer.style.left);
    const xCenter = window.innerWidth / 2;
    const yOffset = pxStrToNumber(canvasContainer.style.top);
    const yCenter = window.innerHeight / 2;

    canvasContainer.style.left = lerp(
        xOffset,
        boundXToCanvas(-(targetX - xCenter)),
        0.1
    );

    canvasContainer.style.top = lerp(
        yOffset,
        boundYToCanvas(-(targetY - yCenter)),
        0.1
    );
}

function lerp(from, to, degree = 1) {
    return from + degree * (to - from);
}

function pxStrToNumber(value) {
    return Number(value.replace('px', ''));
};

function guiPosition(x, y, cb) {
    const xOffset = pxStrToNumber(canvasContainer.style.left);
    const yOffset = pxStrToNumber(canvasContainer.style.top);

    cb(x - xOffset, y - yOffset);
}

function guiTopMiddle(cb) {
    const xCenter = window.innerWidth / 2;
    guiPosition(xCenter, 50, cb);
}

function guiTopRight(cb) {
    guiPosition(window.innerWidth - 100, 50, cb);
}

function drawContext(setContextCb, drawCb) {
    const props = ['font', 'fillStyle', 'strokeColor', 'globalAlpha'];
    const originalValues = props.reduce(
        (acc, propName) => (acc[propName] = context[propName], acc), {}
    );
    setContextCb();
    drawCb();
    props.forEach(propName => context[propName] = originalValues[propName]);
}

function measureTextDimensions(text) {
    const measure = context.measureText(text);
    return {
        width: measure.width,
        height: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent
    };
}

function makeImage(src) {
    const image = new Image();
    image.src = src;
    return image;
}

function timeSince(startDate) {
    const epochStart = epoch(startDate);
    const currentEpoch = epoch(new Date());
    return {
        minutes: Math.floor((currentEpoch - epochStart) / 60),
        seconds: (currentEpoch - epochStart) % 60,
    };
}

function epoch(date) {
    return Math.floor(date / 1000);
}

function leftPad(toPad, length, padChar) {
    const toPadLength = String(toPad).length;
    if (toPadLength >= length) return toPad;
    return `${(String(padChar) * (toPadLength - length))}${toPad}`;
}

function randomRange(from, to) {
    return Math.random() * (to - from) + from;
}

function randomNegate(value) {
    const multipler = Math.random() > 0.5 ? -1 : 1;
    return value * multipler;
}

/**
 * Checks if (pointX, pointY) collides with the circle
 * at (circleX, circleY) with circleRadius.
 *
 * @return bool
 */
function pointInCircle(
    pointX, pointY, circleX, circleY, circleRadius
) {
    let distance =
        Math.pow(circleX - pointX, 2) +
        Math.pow(circleY - pointY, 2);

    return distance < Math.pow(circleRadius, 2);
}

class Animation {
    frames = [ /*{time: ..., image: ...}*/ ];
    currentIndex = 0;
    framesPassed = 0;

    constructor(frames) {
        this.frames = frames;
    }

    image() {
        return this.frames[this.currentIndex].image;
    }

    reset() {
        this.currentIndex = 0;
        this.currentFrameStart = new Date();
    }

    update(isIdle) {
        if (isIdle) {
            this.reset();
            return;
        }

        const currentFrame = this.frames[this.currentIndex];
        if (this.framesPassed >= currentFrame.time) {
            this.next();
        }
        this.framesPassed += 1;
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.frames.length;
        this.framesPassed = 0;
    }
}

// Game Initial Setup
// ------------------------------------------
// One time setup activities for event handlers
// and setting initial global values.

window.addEventListener('keydown', (e) => {
    if (e.keyCode === KEY_LEFT) {
        input.left = true;
        player.setDirection(FACE_LEFT);
    } else if (e.keyCode === KEY_RIGHT) {
        input.right = true;
        player.setDirection(FACE_RIGHT);
    } else if (e.keyCode === KEY_UP) input.up = true;
    else if (e.keyCode === KEY_DOWN) input.down = true;
    else if (e.keyCode === 49) { // Key "1" - Switch to Sean
        player.switchCharacter('sean');
    } else if (e.keyCode === 50) { // Key "2" - Switch to MicrowaveMan
        player.switchCharacter('microwaveMan');
    }
});

window.addEventListener('keyup', (e) => {
    if (e.keyCode === KEY_LEFT) input.left = false;
    if (e.keyCode === KEY_RIGHT) input.right = false;
    if (e.keyCode === KEY_UP) input.up = false;
    if (e.keyCode === KEY_DOWN) input.down = false;
    if (e.keyCode === 48) {
        for (const object of objects) {
            if (object instanceof Enemy) {
                object.destroy();
            }
        }
    }
});

window.addEventListener('load', async () => {
    canvas = document.getElementById('canvas');
    canvasContainer = document.getElementById('canvas-container');
    context = canvas.getContext('2d');

    // Load all config files before starting the game
    await loadGameConfig();
    await loadPlayerConfig();
    await loadItemConfig();
    await loadCharacterData();

    player = new Player(
        WORLD_WIDTH / 2, WORLD_HEIGHT / 2
    );
    objects.push(player);
    levelRunStart = new Date();
    gameIntervalId = setInterval(
        playGame, 1000 / targetFps
    );
});
