// Character Editor 2 - API-Based Edition
// ------------------------------------------
// This editor is built from the ground up to work with the REST API
// For file-based editing, use character-editor.html instead

// API Configuration
const API_BASE_URL = '/api/v1';

// State
let characters = {};
let characterSources = {}; // Phase 2: Track which characters are base vs custom
let currentEditingCharacterId = null;
let spriteInputs = [];
let isApiConnected = false;

// ======================
// API Functions
// ======================

async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const errorMessage = data.error?.message || data.message || 'API request failed';
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function checkApiHealth() {
    try {
        await apiRequest('/health');
        isApiConnected = true;
        updateApiStatus(true);
        return true;
    } catch (error) {
        isApiConnected = false;
        updateApiStatus(false);
        return false;
    }
}

function updateApiStatus(connected) {
    const statusEl = document.getElementById('apiStatus');
    if (connected) {
        statusEl.textContent = 'API Connected';
        statusEl.className = 'api-status connected';
    } else {
        statusEl.textContent = 'API Disconnected';
        statusEl.className = 'api-status disconnected';
    }
}

async function loadCharacters() {
    try {
        const response = await apiRequest('/characters');
        characters = response.data || {};
        
        // Phase 2: Fetch source info for all characters
        characterSources = {};
        const sourcePromises = Object.keys(characters).map(async (id) => {
            const source = await getCharacterSource(id);
            if (source) {
                characterSources[id] = source;
            }
        });
        await Promise.all(sourcePromises);
        
        return characters;
    } catch (error) {
        throw new Error(`Failed to load characters: ${error.message}`);
    }
}

async function getCharacter(id) {
    try {
        const response = await apiRequest(`/characters/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to load character: ${error.message}`);
    }
}

async function createCharacter(id, data) {
    try {
        await apiRequest('/characters', {
            method: 'POST',
            body: JSON.stringify({ id, data })
        });
        return true;
    } catch (error) {
        throw new Error(`Failed to create character: ${error.message}`);
    }
}

async function updateCharacter(id, data) {
    try {
        await apiRequest(`/characters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        throw new Error(`Failed to update character: ${error.message}`);
    }
}

async function deleteCharacterAPI(id) {
    try {
        const response = await apiRequest(`/characters/${id}`, {
            method: 'DELETE'
        });
        return { success: true };
    } catch (error) {
        // Check if it's a base character deletion error
        if (error.message.includes('base character')) {
            return { success: false, isBaseCharacter: true, error: error.message };
        }
        throw new Error(`Failed to delete character: ${error.message}`);
    }
}

// Phase 2: Get character source (base vs custom)
async function getCharacterSource(id) {
    try {
        const response = await apiRequest(`/characters/${id}/source`);
        return response.data;
    } catch (error) {
        console.warn(`Could not get source for ${id}:`, error.message);
        return null;
    }
}

// Phase 2: Get character stats (counts)
async function getCharacterStats() {
    try {
        const response = await apiRequest('/characters/stats');
        return response.data;
    } catch (error) {
        console.warn('Could not get character stats:', error.message);
        return null;
    }
}

// ======================
// Initialization
// ======================

async function init() {
    try {
        // Check API health
        const apiOk = await checkApiHealth();
        if (!apiOk) {
            showMessage('Cannot connect to API. Make sure the API server is running (docker compose up).', 'error');
            disableButtons();
            return;
        }

        // Load characters
        await loadCharacters();
        renderCharacterList();
        showMessage('Characters loaded from API successfully!', 'success');
    } catch (error) {
        console.error('Initialization error:', error);
        showMessage(`Failed to initialize: ${error.message}`, 'error');
        disableButtons();
    }
}

function disableButtons() {
    document.getElementById('newCharBtn').disabled = true;
    document.getElementById('refreshBtn').disabled = true;
}

function enableButtons() {
    document.getElementById('newCharBtn').disabled = false;
    document.getElementById('refreshBtn').disabled = false;
}

// ======================
// UI Rendering
// ======================

function renderCharacterList() {
    const listEl = document.getElementById('characterList');

    if (!isApiConnected) {
        listEl.innerHTML = '<p style="color: #fc8181; text-align: center; padding: 20px;">API Not Connected</p>';
        return;
    }

    if (Object.keys(characters).length === 0) {
        listEl.innerHTML = '<p style="color: #a0aec0; text-align: center; padding: 20px;">No characters yet<br><small>Click "+ New Character" to create one</small></p>';
        return;
    }

    let html = '';
    for (const [id, character] of Object.entries(characters)) {
        const isActive = id === currentEditingCharacterId ? 'active' : '';
        const source = characterSources[id];
        const isBase = source?.isBase && !source?.isCustom;
        const isOverride = source?.isOverride;
        const badgeClass = isBase ? 'badge-base' : (isOverride ? 'badge-override' : 'badge-custom');
        const badgeText = isBase ? 'BASE' : (isOverride ? 'OVERRIDE' : 'CUSTOM');
        const canDelete = !isBase; // Can only delete custom characters or overrides
        
        html += `
            <div class="character-item ${isActive}" onclick="selectCharacter('${id}')">
                <div>
                    <div class="char-name">${escapeHtml(character.name)} <span class="char-badge ${badgeClass}">${badgeText}</span></div>
                    <div class="char-id">${escapeHtml(id)}</div>
                </div>
                ${canDelete ? `<button class="btn btn-danger btn-small delete-btn" onclick="deleteCharacter(event, '${id}')">×</button>` : ''}
            </div>
        `;
    }

    listEl.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function selectCharacter(characterId) {
    currentEditingCharacterId = characterId;
    renderCharacterList();

    // Show loading state
    const editorContent = document.getElementById('editorContent');
    editorContent.innerHTML = `
        <div class="editor-empty">
            <div class="loading"></div>
            <p style="margin-top: 10px;">Loading character...</p>
        </div>
    `;

    try {
        // Reload character from API to get fresh data
        const character = await getCharacter(characterId);
        characters[characterId] = character;
        renderEditorForm(characterId, character);
    } catch (error) {
        showMessage(`Error loading character: ${error.message}`, 'error');
        editorContent.innerHTML = `
            <div class="editor-empty">
                <h2>Error Loading Character</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderEditorForm(characterId, character) {
    // Initialize sprite inputs
    if (character.sprites && Array.isArray(character.sprites)) {
        spriteInputs = character.sprites.length > 0 ? [...character.sprites] : [''];
    } else {
        spriteInputs = [''];
    }

    // Phase 2: Get source info for display
    const source = characterSources[characterId];
    const isBase = source?.isBase && !source?.isCustom;
    const isOverride = source?.isOverride;
    const sourceLabel = isBase ? 'Base Character (read-only)' : 
                        isOverride ? 'Custom Override (editable)' : 
                        'Custom Character (editable)';
    const sourceClass = isBase ? 'badge-base' : (isOverride ? 'badge-override' : 'badge-custom');

    const editorContent = document.getElementById('editorContent');
    editorContent.className = '';
    editorContent.innerHTML = `
        <div id="messageContainer"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div>
                <h2 style="color: #e2e8f0; margin-bottom: 5px;">Edit Character: ${escapeHtml(character.name)}</h2>
                <span class="char-badge ${sourceClass}" style="font-size: 0.8em;">${sourceLabel}</span>
            </div>
            <button class="btn btn-success" onclick="saveCharacter()" id="saveBtn">💾 Save Changes</button>
        </div>
        ${isBase ? '<div class="info-message" style="margin-bottom: 20px;">ℹ️ This is a base character. Saving will create a custom override.</div>' : ''}

        <form onsubmit="event.preventDefault(); saveCharacter();" id="characterForm">
            <!-- Basic Info -->
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-group">
                    <label>Character ID (read-only)</label>
                    <input type="text" value="${escapeHtml(characterId)}" disabled>
                </div>
                <div class="form-group">
                    <label>Display Name *</label>
                    <input type="text" id="characterName" value="${escapeHtml(character.name)}" required maxlength="100">
                    <div class="helper-text">The name shown in documentation and logs (1-100 characters)</div>
                </div>
            </div>

            <!-- Sprites -->
            <div class="form-section">
                <h3>Sprites</h3>
                <div class="form-group">
                    <label>Sprite Animation Frames *</label>
                    <div id="spritesContainer"></div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="addSpriteInput()">+ Add Frame</button>
                    <div class="helper-text">PNG/JPG/GIF files for animation frames (1-20 sprites, right-facing only)</div>
                </div>
                <div class="form-group" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #4a5568;">
                    <label>Upload New Sprite Images</label>
                    <input type="file" id="spriteUpload" accept="image/png,image/jpeg,image/gif" multiple style="display: none;" onchange="handleSpriteUpload(event)">
                    <button type="button" class="btn btn-primary btn-small" onclick="document.getElementById('spriteUpload').click()">📁 Upload Images</button>
                    <div class="helper-text">Select one or more image files to upload (max 5MB each)</div>
                    <div id="uploadProgress" style="margin-top: 10px;"></div>
                </div>
            </div>

            <!-- Animation -->
            <div class="form-section">
                <h3>Animation</h3>
                <div class="form-group">
                    <label>Frame Time *</label>
                    <input type="number" id="frameTime" value="${character.animation.frameTime}" min="1" max="60" required>
                    <div class="helper-text">Game frames per sprite frame (1-60, 60 frames = 1 second)</div>
                </div>
            </div>

            <!-- Stats -->
            <div class="form-section">
                <h3>Stats</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Health *</label>
                        <input type="number" id="health" value="${character.stats.health}" min="1" max="1000" step="1" required>
                        <div class="helper-text">HP (1-1000)</div>
                    </div>
                    <div class="form-group">
                        <label>Speed *</label>
                        <input type="number" id="speed" value="${character.stats.speed}" min="0" max="10" step="0.1" required>
                        <div class="helper-text">Pixels/frame (0-10)</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Strength *</label>
                        <input type="number" id="attackStrength" value="${character.stats.attackStrength}" min="0" max="1000" step="1" required>
                        <div class="helper-text">Damage (0-1000)</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Speed *</label>
                        <input type="number" id="attackSpeed" value="${character.stats.attackSpeed}" min="1" max="10000" step="1" required>
                        <div class="helper-text">Cooldown ms (1-10000)</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Range *</label>
                        <input type="number" id="attackRange" value="${character.stats.attackRange}" min="1" max="1000" step="1" required>
                        <div class="helper-text">Range px (1-1000)</div>
                    </div>
                </div>
            </div>

            <!-- Size -->
            <div class="form-section">
                <h3>Size</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Width *</label>
                        <input type="number" id="width" value="${character.size.width}" min="1" max="500" step="1" required>
                        <div class="helper-text">Pixels (1-500)</div>
                    </div>
                    <div class="form-group">
                        <label>Height *</label>
                        <input type="number" id="height" value="${character.size.height}" min="1" max="500" step="1" required>
                        <div class="helper-text">Pixels (1-500)</div>
                    </div>
                </div>
            </div>

            <!-- XP Value -->
            <div class="form-section">
                <h3>Rewards</h3>
                <div class="form-group">
                    <label>XP Value *</label>
                    <input type="number" id="xpValue" value="${character.xpValue}" min="0" max="10000" step="1" required>
                    <div class="helper-text">Experience points dropped when defeated (0-10000)</div>
                </div>
            </div>

            <!-- Spawn Settings -->
            <div class="form-section">
                <h3>Spawn Settings</h3>
                <div class="form-group">
                    <label>Spawn Weight</label>
                    <input type="number" id="spawnWeight" value="${character.spawnWeight || 1}" min="0" max="100" step="0.1">
                    <div class="helper-text">Higher = spawns more often. 0 = never spawns. Default is 1. (e.g., weight 2 spawns twice as often as weight 1)</div>
                </div>
            </div>
        </form>
    `;

    renderSpriteInputs();
}

function renderSpriteInputs() {
    const container = document.getElementById('spritesContainer');
    if (!container) return;

    container.innerHTML = spriteInputs.map((sprite, index) => `
        <div class="sprite-input-group">
            <input type="text"
                   value="${escapeHtml(sprite)}"
                   onchange="updateSpriteInput(${index}, this.value)"
                   placeholder="assets/custom/characters/enemies/sprite-${index + 1}.png"
                   maxlength="200">
            ${spriteInputs.length > 1 ? `<button type="button" class="btn btn-danger btn-small" onclick="removeSpriteInput(${index})">×</button>` : ''}
        </div>
    `).join('');
}

function addSpriteInput() {
    if (spriteInputs.length >= 20) {
        showMessage('Maximum 20 sprites allowed', 'error');
        return;
    }
    spriteInputs.push('');
    renderSpriteInputs();
}

function removeSpriteInput(index) {
    spriteInputs.splice(index, 1);
    renderSpriteInputs();
}

function updateSpriteInput(index, value) {
    spriteInputs[index] = value;
}

// ======================
// Character Operations
// ======================

function gatherFormData() {
    const getName = id => document.getElementById(id);

    if (!getName('characterName')) return null;

    const data = {
        name: getName('characterName').value.trim(),
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
        xpValue: parseInt(getName('xpValue').value),
        spawnWeight: parseFloat(getName('spawnWeight').value) || 1
    };

    return data;
}

async function saveCharacter() {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;

    const character = gatherFormData();
    if (!character) return;

    // Validate sprites
    if (character.sprites.length === 0) {
        showMessage('Please add at least one sprite', 'error');
        return;
    }

    if (character.sprites.length > 20) {
        showMessage('Maximum 20 sprites allowed', 'error');
        return;
    }

    // Validate all sprites have proper extensions
    const validExtensions = /\.(png|jpg|jpeg|gif)$/i;
    const invalidSprites = character.sprites.filter(s => !validExtensions.test(s));
    if (invalidSprites.length > 0) {
        showMessage('All sprites must end with .png, .jpg, .jpeg, or .gif', 'error');
        return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading"></span> Saving...';

    try {
        await updateCharacter(currentEditingCharacterId, character);
        characters[currentEditingCharacterId] = character;
        
        // Phase 2: Refresh source info and show appropriate message
        const wasBase = characterSources[currentEditingCharacterId]?.isBase && !characterSources[currentEditingCharacterId]?.isCustom;
        const newSource = await getCharacterSource(currentEditingCharacterId);
        if (newSource) {
            characterSources[currentEditingCharacterId] = newSource;
            
            if (wasBase && newSource.isOverride) {
                showMessage('✓ Character saved! A custom override has been created.', 'success');
            } else {
                showMessage('✓ Character saved successfully! Changes are live.', 'success');
            }
        } else {
            showMessage('✓ Character saved successfully! Changes are live.', 'success');
        }
        
        renderCharacterList();
        renderEditorForm(currentEditingCharacterId, character);
    } catch (error) {
        showMessage(`Failed to save: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes';
    }
}

function createNewCharacter() {
    document.getElementById('newCharacterId').value = '';
    document.getElementById('newCharacterName').value = '';
    document.getElementById('idValidationError').textContent = '';
    document.getElementById('newCharacterModal').classList.add('active');

    // Focus on ID input
    setTimeout(() => document.getElementById('newCharacterId').focus(), 100);
}

function closeNewCharacterModal() {
    document.getElementById('newCharacterModal').classList.remove('active');
}

async function confirmNewCharacter() {
    const id = document.getElementById('newCharacterId').value.trim();
    const name = document.getElementById('newCharacterName').value.trim();
    const errorEl = document.getElementById('idValidationError');
    const createBtn = document.getElementById('createCharBtn');

    // Clear previous errors
    errorEl.textContent = '';

    // Validate ID
    if (!id) {
        errorEl.textContent = 'Character ID is required';
        return;
    }

    if (id.length < 1 || id.length > 50) {
        errorEl.textContent = 'ID must be 1-50 characters';
        return;
    }

    if (!/^[a-z0-9_]+$/.test(id)) {
        errorEl.textContent = 'ID can only contain lowercase letters, numbers, and underscores';
        return;
    }

    // Check reserved IDs
    const reserved = ['health', 'status', 'api', 'v1', 'characters', 'new', 'edit', 'delete'];
    if (reserved.includes(id.toLowerCase())) {
        errorEl.textContent = `'${id}' is a reserved ID`;
        return;
    }

    if (characters[id]) {
        errorEl.textContent = 'A character with this ID already exists';
        return;
    }

    if (!name) {
        errorEl.textContent = 'Character name is required';
        return;
    }

    if (name.length > 100) {
        errorEl.textContent = 'Name must not exceed 100 characters';
        return;
    }

    // Create new character with default values
    // Phase 2: New characters save to custom directory
    const newCharacter = {
        name: name,
        sprites: ['assets/custom/characters/enemies/sprite.png'],
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
        xpValue: 1,
        spawnWeight: 1
    };

    // Show loading state
    createBtn.disabled = true;
    createBtn.innerHTML = '<span class="loading"></span> Creating...';

    try {
        await createCharacter(id, newCharacter);
        characters[id] = newCharacter;

        closeNewCharacterModal();
        renderCharacterList();
        selectCharacter(id);
        showMessage(`✓ Character "${name}" created successfully!`, 'success');
    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = 'Create';
    }
}

async function deleteCharacter(event, characterId) {
    event.stopPropagation();

    const character = characters[characterId];
    const source = characterSources[characterId];
    
    // Phase 2: Check if this is a base character
    if (source?.isBase && !source?.isCustom) {
        showMessage('❌ Cannot delete base characters. Only custom characters can be deleted.', 'error');
        return;
    }
    
    const deleteType = source?.isOverride ? 'override (base character will be restored)' : 'character';
    if (!confirm(`Are you sure you want to delete "${character.name}"?\n\nThis will permanently delete the ${deleteType} from the server.`)) {
        return;
    }

    try {
        const result = await deleteCharacterAPI(characterId);
        
        // Handle base character protection from API
        if (!result.success && result.isBaseCharacter) {
            showMessage('❌ Cannot delete base characters. Only custom characters can be deleted.', 'error');
            return;
        }
        
        delete characters[characterId];
        delete characterSources[characterId];

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
        showMessage('✓ Character deleted successfully!', 'success');
    } catch (error) {
        showMessage(`Failed to delete: ${error.message}`, 'error');
    }
}

async function refreshCharacters() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⟳ Refreshing...';

    try {
        await loadCharacters();
        renderCharacterList();

        // Reload current character if one is selected
        if (currentEditingCharacterId && characters[currentEditingCharacterId]) {
            const character = await getCharacter(currentEditingCharacterId);
            characters[currentEditingCharacterId] = character;
            renderEditorForm(currentEditingCharacterId, character);
        }

        showMessage('✓ Characters refreshed!', 'success');
    } catch (error) {
        showMessage(`Failed to refresh: ${error.message}`, 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Refresh';
    }
}

// ======================
// Image Upload Functions
// ======================

async function handleSpriteUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const progressEl = document.getElementById('uploadProgress');
    if (!progressEl) return;

    // Validate file sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversized = Array.from(files).filter(f => f.size > maxSize);
    if (oversized.length > 0) {
        progressEl.innerHTML = '<div class="error-message">Some files are too large (max 5MB)</div>';
        event.target.value = ''; // Clear the input
        return;
    }

    // Show uploading state
    progressEl.innerHTML = '<div class="info-message">⏳ Uploading ' + files.length + ' file(s)...</div>';

    try {
        const formData = new FormData();

        // Add all files to form data
        if (files.length === 1) {
            formData.append('sprite', files[0]);
            const response = await fetch('/api/v1/uploads/character-sprite', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error?.message || 'Upload failed');
            }

            // Add the uploaded sprite path to the sprite inputs
            spriteInputs.push(result.data.path);
            renderSpriteInputs();

            progressEl.innerHTML = `<div class="success-message">✓ Uploaded: ${result.data.originalName}</div>`;
        } else {
            // Multiple files
            for (const file of files) {
                formData.append('sprites', file);
            }

            const response = await fetch('/api/v1/uploads/character-sprites', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error?.message || 'Upload failed');
            }

            // Add all uploaded sprite paths
            result.data.files.forEach(file => {
                spriteInputs.push(file.path);
            });
            renderSpriteInputs();

            progressEl.innerHTML = `<div class="success-message">✓ Uploaded ${result.data.count} file(s)</div>`;
        }

        showMessage('Images uploaded successfully! Remember to save your character.', 'success');

        // Clear the progress message after 5 seconds
        setTimeout(() => {
            if (progressEl.innerHTML.includes('Uploaded')) {
                progressEl.innerHTML = '';
            }
        }, 5000);
    } catch (error) {
        progressEl.innerHTML = `<div class="error-message">Upload failed: ${error.message}</div>`;
    } finally {
        // Clear the file input
        event.target.value = '';
    }
}

// ======================
// Utility Functions
// ======================

function showMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer');
    if (!container) {
        // Show in top-level if no container
        console.log(`[${type}] ${message}`);
        return;
    }

    const className = type === 'success' ? 'success-message' :
                      type === 'error' ? 'error-message' : 'info-message';
    container.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;

    setTimeout(() => {
        if (container.innerHTML.includes(message)) {
            container.innerHTML = '';
        }
    }, 5000);
}

// ======================
// Initialize Application
// ======================

init();
