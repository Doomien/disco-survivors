// Character Editor Application
// ------------------------------------------

// API Configuration
const API_BASE_URL = '/api/v1';

let characterData = { enemies: {} };
let currentEditingCharacterId = null;
let spriteInputs = [];

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Initialize the editor
async function init() {
    try {
        const response = await apiRequest('/characters');
        characterData.enemies = response.data;
        renderCharacterList();
        showMessage('Characters loaded from API', 'success');
    } catch (error) {
        console.error('Failed to load characters:', error);
        showMessage(`Could not load characters: ${error.message}. Using local data.`, 'error');

        // Fallback to loading from file
        try {
            const fileResponse = await fetch('../characters.json');
            const fileData = await fileResponse.json();
            characterData = fileData;
            renderCharacterList();
        } catch (fileError) {
            characterData = { enemies: {} };
        }
    }
}

// Character List Rendering
function renderCharacterList() {
    const listEl = document.getElementById('characterList');
    const enemies = characterData.enemies;

    if (Object.keys(enemies).length === 0) {
        listEl.innerHTML = '<p style="color: #a0aec0; text-align: center; padding: 20px;">No characters yet</p>';
        return;
    }

    let html = '';
    for (const [id, character] of Object.entries(enemies)) {
        const isActive = id === currentEditingCharacterId ? 'active' : '';
        html += `
            <div class="character-item ${isActive}" onclick="selectCharacter('${id}')">
                <div>
                    <div class="char-name">${character.name}</div>
                    <div class="char-id">${id}</div>
                </div>
                <button class="btn btn-danger btn-small delete-btn" onclick="deleteCharacter(event, '${id}')">×</button>
            </div>
        `;
    }

    listEl.innerHTML = html;
}

// Select a character to edit
function selectCharacter(characterId) {
    currentEditingCharacterId = characterId;
    renderCharacterList();
    renderEditorForm();
}

// Render the editor form
function renderEditorForm() {
    const character = characterData.enemies[currentEditingCharacterId];
    if (!character) return;

    // Support both old format (left/right) and new format (single array)
    if (character.sprites && Array.isArray(character.sprites)) {
        spriteInputs = character.sprites.length > 0 ? [...character.sprites] : [''];
    } else if (character.sprites && character.sprites.right) {
        // Old format - just use right sprites as the base
        spriteInputs = character.sprites.right.length > 0 ? [...character.sprites.right] : [''];
    } else {
        spriteInputs = [''];
    }

    const editorContent = document.getElementById('editorContent');
    editorContent.className = '';
    editorContent.innerHTML = `
        <div id="messageContainer"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2>Edit Character: ${character.name}</h2>
            <button class="btn btn-success" onclick="saveCharacter()">Save Changes</button>
        </div>

        <form onsubmit="event.preventDefault(); saveCharacter();">
            <!-- Basic Info -->
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-group">
                    <label>Character ID (read-only)</label>
                    <input type="text" value="${currentEditingCharacterId}" disabled>
                </div>
                <div class="form-group">
                    <label>Display Name</label>
                    <input type="text" id="characterName" value="${character.name}" required>
                    <div class="helper-text">The name shown in documentation and logs</div>
                </div>
            </div>

            <!-- Sprites -->
            <div class="form-section">
                <h3>Sprites</h3>
                <div class="form-group">
                    <label>Sprite Animation Frames</label>
                    <div id="spritesContainer"></div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="addSpriteInput()">+ Add Frame</button>
                    <div class="helper-text">PNG files for animation frames (will be flipped automatically for left-facing)</div>
                </div>
            </div>

            <!-- Animation -->
            <div class="form-section">
                <h3>Animation</h3>
                <div class="form-group">
                    <label>Frame Time</label>
                    <input type="number" id="frameTime" value="${character.animation.frameTime}" min="1" required>
                    <div class="helper-text">Number of game frames each sprite frame displays (60 frames = 1 second)</div>
                </div>
            </div>

            <!-- Stats -->
            <div class="form-section">
                <h3>Stats</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Health</label>
                        <input type="number" id="health" value="${character.stats.health}" min="1" step="1" required>
                        <div class="helper-text">Hit points</div>
                    </div>
                    <div class="form-group">
                        <label>Speed</label>
                        <input type="number" id="speed" value="${character.stats.speed}" min="0" step="0.1" required>
                        <div class="helper-text">Pixels per frame</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Strength</label>
                        <input type="number" id="attackStrength" value="${character.stats.attackStrength}" min="0" step="1" required>
                        <div class="helper-text">Damage per hit</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Speed</label>
                        <input type="number" id="attackSpeed" value="${character.stats.attackSpeed}" min="1" step="1" required>
                        <div class="helper-text">Cooldown (ms)</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Range</label>
                        <input type="number" id="attackRange" value="${character.stats.attackRange}" min="1" step="1" required>
                        <div class="helper-text">Range (pixels)</div>
                    </div>
                </div>
            </div>

            <!-- Size -->
            <div class="form-section">
                <h3>Size</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Width</label>
                        <input type="number" id="width" value="${character.size.width}" min="1" step="1" required>
                        <div class="helper-text">Pixels</div>
                    </div>
                    <div class="form-group">
                        <label>Height</label>
                        <input type="number" id="height" value="${character.size.height}" min="1" step="1" required>
                        <div class="helper-text">Pixels</div>
                    </div>
                </div>
            </div>

            <!-- XP Value -->
            <div class="form-section">
                <h3>Rewards</h3>
                <div class="form-group">
                    <label>XP Value</label>
                    <input type="number" id="xpValue" value="${character.xpValue}" min="1" step="1" required>
                    <div class="helper-text">Experience points dropped when defeated</div>
                </div>
            </div>
        </form>

        <!-- JSON Preview -->
        <div class="form-section">
            <h3>JSON Preview</h3>
            <div class="json-viewer" id="jsonPreview"></div>
        </div>
    `;

    renderSpriteInputs();
    updateJSONPreview();
}

// Render sprite input fields
function renderSpriteInputs() {
    const container = document.getElementById('spritesContainer');

    container.innerHTML = spriteInputs.map((sprite, index) => `
        <div class="sprite-input-group">
            <input type="text" value="${sprite}" onchange="updateSpriteInput(${index}, this.value)" placeholder="sprite-${index + 1}.png">
            ${spriteInputs.length > 1 ? `<button type="button" class="btn btn-danger btn-small" onclick="removeSpriteInput(${index})">×</button>` : ''}
        </div>
    `).join('');
}

// Add sprite input
function addSpriteInput() {
    spriteInputs.push('');
    renderSpriteInputs();
}

// Remove sprite input
function removeSpriteInput(index) {
    spriteInputs.splice(index, 1);
    renderSpriteInputs();
}

// Update sprite input value
function updateSpriteInput(index, value) {
    spriteInputs[index] = value;
    updateJSONPreview();
}

// Update JSON preview
function updateJSONPreview() {
    const character = gatherFormData();
    if (!character) return;

    const preview = document.getElementById('jsonPreview');
    if (preview) {
        preview.textContent = JSON.stringify({ [currentEditingCharacterId]: character }, null, 2);
    }
}

// Gather form data into character object
function gatherFormData() {
    const getName = id => document.getElementById(id);

    if (!getName('characterName')) return null;

    return {
        name: getName('characterName').value,
        sprites: spriteInputs.filter(s => s.trim() !== ''),
        animation: {
            frameTime: parseInt(getName('frameTime').value)
        },
        stats: {
            health: parseInt(getName('health').value),
            speed: parseFloat(getName('speed').value),
            attackStrength: parseInt(getName('attackStrength').value),
            attackSpeed: parseInt(getName('attackSpeed').value),
            attackRange: parseInt(getName('attackRange').value)
        },
        size: {
            width: parseInt(getName('width').value),
            height: parseInt(getName('height').value)
        },
        xpValue: parseInt(getName('xpValue').value)
    };
}

// Save character changes
async function saveCharacter() {
    const character = gatherFormData();
    if (!character) return;

    // Validate sprites
    if (character.sprites.length === 0) {
        showMessage('Please add at least one sprite', 'error');
        return;
    }

    try {
        // Update via API
        await apiRequest(`/characters/${currentEditingCharacterId}`, {
            method: 'PUT',
            body: JSON.stringify(character)
        });

        // Update local data
        characterData.enemies[currentEditingCharacterId] = character;
        showMessage('Character saved successfully via API!', 'success');
        renderCharacterList();
    } catch (error) {
        showMessage(`Failed to save character: ${error.message}`, 'error');
        console.error('Save error:', error);
    }
}

// Create new character modal
function createNewCharacter() {
    document.getElementById('newCharacterId').value = '';
    document.getElementById('newCharacterName').value = '';
    document.getElementById('newCharacterModal').classList.add('active');
}

function closeNewCharacterModal() {
    document.getElementById('newCharacterModal').classList.remove('active');
}

async function confirmNewCharacter() {
    const id = document.getElementById('newCharacterId').value.trim();
    const name = document.getElementById('newCharacterName').value.trim();

    // Validate ID
    if (!id) {
        alert('Please enter a character ID');
        return;
    }
    if (!/^[a-z0-9_]+$/.test(id)) {
        alert('Character ID must contain only lowercase letters, numbers, and underscores');
        return;
    }
    if (characterData.enemies[id]) {
        alert('A character with this ID already exists');
        return;
    }
    if (!name) {
        alert('Please enter a character name');
        return;
    }

    // Create new character with default values
    const newCharacter = {
        name: name,
        sprites: ['sprite.png'],
        animation: {
            frameTime: 12
        },
        stats: {
            health: 3,
            speed: 0.4,
            attackStrength: 1,
            attackSpeed: 500,
            attackRange: 40
        },
        size: {
            width: 60,
            height: 66
        },
        xpValue: 1
    };

    try {
        // Create via API
        await apiRequest('/characters', {
            method: 'POST',
            body: JSON.stringify({
                id: id,
                data: newCharacter
            })
        });

        // Update local data
        characterData.enemies[id] = newCharacter;

        closeNewCharacterModal();
        renderCharacterList();
        selectCharacter(id);
        showMessage(`Character "${name}" created successfully via API!`, 'success');
    } catch (error) {
        showMessage(`Failed to create character: ${error.message}`, 'error');
        console.error('Create error:', error);
    }
}

// Delete character
async function deleteCharacter(event, characterId) {
    event.stopPropagation();

    const character = characterData.enemies[characterId];
    if (!confirm(`Are you sure you want to delete "${character.name}"?`)) {
        return;
    }

    try {
        // Delete via API
        await apiRequest(`/characters/${characterId}`, {
            method: 'DELETE'
        });

        // Update local data
        delete characterData.enemies[characterId];

        if (currentEditingCharacterId === characterId) {
            currentEditingCharacterId = null;
            document.getElementById('editorContent').innerHTML = `
                <div class="editor-empty">
                    <h2>Character Deleted</h2>
                    <p>Select another character or create a new one.</p>
                </div>
            `;
        }

        renderCharacterList();
        showMessage('Character deleted successfully via API!', 'success');
    } catch (error) {
        showMessage(`Failed to delete character: ${error.message}`, 'error');
        console.error('Delete error:', error);
    }
}

// Download JSON file
function downloadJSON() {
    const jsonString = JSON.stringify(characterData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'characters.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('JSON file downloaded!', 'success');
}

// Load from file
function loadFromFile() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.enemies || typeof data.enemies !== 'object') {
                throw new Error('Invalid JSON format: missing "enemies" object');
            }
            characterData = data;
            currentEditingCharacterId = null;
            renderCharacterList();
            document.getElementById('editorContent').innerHTML = `
                <div class="editor-empty">
                    <h2>JSON Loaded Successfully</h2>
                    <p>Select a character from the list to edit.</p>
                </div>
            `;
            showMessage('JSON file loaded successfully!', 'success');
        } catch (error) {
            showMessage('Error loading JSON file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Show message
function showMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const className = type === 'success' ? 'success-message' : 'error-message';
    container.innerHTML = `<div class="${className}">${message}</div>`;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Add event listeners for live preview updates
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'file') {
        updateJSONPreview();
    }
});

// Initialize the application
init();
