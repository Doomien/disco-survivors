// Item Editor - API-Based Edition
// ------------------------------------------
// Handles weapons, projectiles, and collectibles editing

// API Configuration
const ITEMS_API_BASE_URL = '/api/v1/items';

// State
let items = { weapons: {}, projectiles: {}, collectibles: {} };
let itemSources = { weapons: {}, projectiles: {}, collectibles: {} };
let currentItemCategory = 'weapons';
let currentEditingItemId = null;
let itemSpriteInputs = [];
let isItemsApiConnected = false;

// ======================
// API Functions
// ======================

async function itemsApiRequest(endpoint, options = {}) {
    try {
        const url = `${ITEMS_API_BASE_URL}${endpoint}`;
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
        console.error('Items API Error:', error);
        throw error;
    }
}

async function checkItemsApiHealth() {
    try {
        await itemsApiRequest('/stats');
        isItemsApiConnected = true;
        return true;
    } catch (error) {
        isItemsApiConnected = false;
        return false;
    }
}

async function loadItems() {
    try {
        const response = await itemsApiRequest('');
        items = response.data || { weapons: {}, projectiles: {}, collectibles: {} };
        
        // Fetch source info for all items in all categories
        itemSources = { weapons: {}, projectiles: {}, collectibles: {} };
        
        for (const category of ['weapons', 'projectiles', 'collectibles']) {
            const sourcePromises = Object.keys(items[category] || {}).map(async (id) => {
                try {
                    const sourceResponse = await itemsApiRequest(`/${category}/${id}/source`);
                    if (sourceResponse.data) {
                        itemSources[category][id] = sourceResponse.data;
                    }
                } catch (e) {
                    console.warn(`Could not get source for ${category}/${id}`);
                }
            });
            await Promise.all(sourcePromises);
        }
        
        return items;
    } catch (error) {
        throw new Error(`Failed to load items: ${error.message}`);
    }
}

async function getItem(category, id) {
    try {
        const response = await itemsApiRequest(`/${category}/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to load item: ${error.message}`);
    }
}

async function createItem(category, id, data) {
    try {
        await itemsApiRequest(`/${category}`, {
            method: 'POST',
            body: JSON.stringify({ id, data })
        });
        return true;
    } catch (error) {
        throw new Error(`Failed to create item: ${error.message}`);
    }
}

async function updateItem(category, id, data) {
    try {
        await itemsApiRequest(`/${category}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        throw new Error(`Failed to update item: ${error.message}`);
    }
}

async function deleteItemAPI(category, id) {
    try {
        await itemsApiRequest(`/${category}/${id}`, {
            method: 'DELETE'
        });
        return { success: true };
    } catch (error) {
        if (error.message.includes('base')) {
            return { success: false, isBaseItem: true, error: error.message };
        }
        throw new Error(`Failed to delete item: ${error.message}`);
    }
}

// ======================
// UI Rendering Functions
// ======================

function renderItemSubTabs() {
    const container = document.getElementById('itemSubTabs');
    if (!container) return;
    
    const categories = [
        { id: 'weapons', label: '⚔️ Weapons', count: Object.keys(items.weapons || {}).length },
        { id: 'projectiles', label: '🎯 Projectiles', count: Object.keys(items.projectiles || {}).length },
        { id: 'collectibles', label: '🍬 Collectibles', count: Object.keys(items.collectibles || {}).length }
    ];
    
    container.innerHTML = categories.map(cat => `
        <button class="sub-tab ${currentItemCategory === cat.id ? 'active' : ''}" 
                onclick="switchItemCategory('${cat.id}')">
            ${cat.label} (${cat.count})
        </button>
    `).join('');
}

function switchItemCategory(category) {
    currentItemCategory = category;
    currentEditingItemId = null;
    renderItemSubTabs();
    renderItemList();
    renderItemEditorEmpty();
}

function renderItemList() {
    const container = document.getElementById('itemList');
    if (!container) return;
    
    const categoryItems = items[currentItemCategory] || {};
    const itemIds = Object.keys(categoryItems);
    
    if (itemIds.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #a0aec0;">
                No ${currentItemCategory} found. Create one to get started!
            </div>
        `;
        return;
    }
    
    container.innerHTML = itemIds.map(id => {
        const item = categoryItems[id];
        const source = itemSources[currentItemCategory]?.[id];
        const isSelected = currentEditingItemId === id;
        
        let badge = '';
        if (source?.isOverride) {
            badge = '<span class="badge badge-override">OVERRIDE</span>';
        } else if (source?.isCustom) {
            badge = '<span class="badge badge-custom">CUSTOM</span>';
        } else if (source?.isBase) {
            badge = '<span class="badge badge-base">BASE</span>';
        }
        
        const canDelete = source?.isCustom || source?.isOverride;
        
        return `
            <div class="item-item ${isSelected ? 'selected' : ''}" onclick="selectItem('${id}')">
                <div>
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    ${badge}
                </div>
                ${canDelete ? `
                    <button class="btn btn-danger btn-small delete-btn" onclick="deleteItem(event, '${id}')" title="Delete">×</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderItemEditorEmpty() {
    const content = document.getElementById('itemEditorContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="editor-empty">
            <h2>Select an Item</h2>
            <p>Choose a ${currentItemCategory.slice(0, -1)} from the list or create a new one.</p>
        </div>
    `;
}

async function selectItem(id) {
    currentEditingItemId = id;
    renderItemList();
    
    const item = items[currentItemCategory]?.[id];
    if (!item) return;
    
    renderItemEditorForm(id, item);
}

function renderItemEditorForm(itemId, item) {
    const content = document.getElementById('itemEditorContent');
    if (!content) return;
    
    const source = itemSources[currentItemCategory]?.[itemId];
    const isBase = source?.isBase && !source?.isCustom;
    
    // Different forms for different categories
    switch (currentItemCategory) {
        case 'weapons':
            renderWeaponForm(content, itemId, item, isBase);
            break;
        case 'projectiles':
            renderProjectileForm(content, itemId, item, isBase);
            break;
        case 'collectibles':
            renderCollectibleForm(content, itemId, item, isBase);
            break;
    }
}

function renderWeaponForm(content, itemId, weapon, isBase) {
    content.innerHTML = `
        <div class="editor-header">
            <h2>Edit Weapon: ${escapeHtml(weapon.name)}</h2>
            <button class="btn btn-primary" id="saveItemBtn" onclick="saveItem()">💾 Save Changes</button>
        </div>
        
        ${isBase ? '<div class="info-message">ℹ️ This is a base weapon. Saving will create a custom override.</div>' : ''}
        
        <form onsubmit="event.preventDefault(); saveItem();" id="itemForm">
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-group">
                    <label>Weapon ID (read-only)</label>
                    <input type="text" value="${escapeHtml(itemId)}" disabled>
                </div>
                <div class="form-group">
                    <label>Display Name *</label>
                    <input type="text" id="itemName" value="${escapeHtml(weapon.name)}" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Enabled</label>
                    <input type="checkbox" id="itemEnabled" ${weapon.enabled !== false ? 'checked' : ''}>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Combat Stats</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Attack Speed (ms) *</label>
                        <input type="number" id="itemAttackSpeed" value="${weapon.attackSpeed || 1000}" min="100" max="60000" required>
                        <div class="helper-text">Cooldown between attacks (100-60000ms)</div>
                    </div>
                    <div class="form-group">
                        <label>Attack Strength</label>
                        <input type="number" id="itemAttackStrength" value="${weapon.attackStrength || 1}" min="0" max="1000">
                        <div class="helper-text">Damage per hit (0-1000)</div>
                    </div>
                    <div class="form-group">
                        <label>Animation Frames</label>
                        <input type="number" id="itemAnimationFrames" value="${weapon.attackAnimationFrames || 5}" min="1" max="60">
                    </div>
                    <div class="form-group">
                        <label>Level</label>
                        <input type="number" id="itemLevel" value="${weapon.level || 1}" min="1" max="100">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Weapon-Specific</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Sprite Path</label>
                        <div class="sprite-input-group">
                            <input type="text" id="itemSprite" value="${escapeHtml(weapon.sprite || '')}" placeholder="assets/custom/items/weapon.png" oninput="updateSingleSpritePreview('itemSpritePreview', this.value)">
                            <div class="sprite-preview ${weapon.sprite ? 'has-image' : ''}" id="itemSpritePreview">
                                <img src="${escapeHtml(weapon.sprite || '')}" alt="Sprite preview">
                                <div class="sprite-placeholder">No preview</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Radius</label>
                        <input type="number" id="itemRadius" value="${weapon.radius || ''}" min="1" max="1000" placeholder="100">
                        <div class="helper-text">For melee/orbit weapons</div>
                    </div>
                    <div class="form-group">
                        <label>Projectile ID</label>
                        <input type="text" id="itemProjectile" value="${escapeHtml(weapon.projectile || '')}" placeholder="e.g., discoBall">
                        <div class="helper-text">Reference to a projectile type</div>
                    </div>
                    <div class="form-group">
                        <label>Directions</label>
                        <input type="number" id="itemDirections" value="${weapon.directions || ''}" min="1" max="36" placeholder="8">
                        <div class="helper-text">For radial weapons</div>
                    </div>
                </div>
            </div>
        </form>
    `;
}

function renderProjectileForm(content, itemId, projectile, isBase) {
    itemSpriteInputs = [...(projectile.sprites || [''])];
    
    content.innerHTML = `
        <div class="editor-header">
            <h2>Edit Projectile: ${escapeHtml(projectile.name)}</h2>
            <button class="btn btn-primary" id="saveItemBtn" onclick="saveItem()">💾 Save Changes</button>
        </div>
        
        ${isBase ? '<div class="info-message">ℹ️ This is a base projectile. Saving will create a custom override.</div>' : ''}
        
        <form onsubmit="event.preventDefault(); saveItem();" id="itemForm">
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-group">
                    <label>Projectile ID (read-only)</label>
                    <input type="text" value="${escapeHtml(itemId)}" disabled>
                </div>
                <div class="form-group">
                    <label>Display Name *</label>
                    <input type="text" id="itemName" value="${escapeHtml(projectile.name)}" required maxlength="100">
                </div>
            </div>
            
            <div class="form-section">
                <h3>Sprites</h3>
                <div class="form-group">
                    <label>Animation Frames *</label>
                    <div id="itemSpritesContainer"></div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="addItemSpriteInput()">+ Add Frame</button>
                </div>
                <div class="form-group">
                    <label>Frame Time *</label>
                    <input type="number" id="itemFrameTime" value="${projectile.animation?.frameTime || 8}" min="1" max="60" required>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Stats</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Speed *</label>
                        <input type="number" id="itemSpeed" value="${projectile.speed || 2}" min="0.1" max="50" step="0.1" required>
                    </div>
                    <div class="form-group">
                        <label>Attack Strength *</label>
                        <input type="number" id="itemAttackStrength" value="${projectile.attackStrength || 1}" min="0" max="1000" required>
                    </div>
                    <div class="form-group">
                        <label>Max Distance</label>
                        <input type="number" id="itemMaxDistance" value="${projectile.maxDistance || 800}" min="100" max="5000">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Size</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Width *</label>
                        <input type="number" id="itemWidth" value="${projectile.size?.width || 60}" min="1" max="500" required>
                    </div>
                    <div class="form-group">
                        <label>Height *</label>
                        <input type="number" id="itemHeight" value="${projectile.size?.height || 60}" min="1" max="500" required>
                    </div>
                </div>
            </div>
        </form>
    `;
    
    renderItemSpriteInputs();
}

function renderCollectibleForm(content, itemId, collectible, isBase) {
    content.innerHTML = `
        <div class="editor-header">
            <h2>Edit Collectible: ${escapeHtml(collectible.name)}</h2>
            <button class="btn btn-primary" id="saveItemBtn" onclick="saveItem()">💾 Save Changes</button>
        </div>
        
        ${isBase ? '<div class="info-message">ℹ️ This is a base collectible. Saving will create a custom override.</div>' : ''}
        
        <form onsubmit="event.preventDefault(); saveItem();" id="itemForm">
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-group">
                    <label>Collectible ID (read-only)</label>
                    <input type="text" value="${escapeHtml(itemId)}" disabled>
                </div>
                <div class="form-group">
                    <label>Display Name *</label>
                    <input type="text" id="itemName" value="${escapeHtml(collectible.name)}" required maxlength="100">
                </div>
            </div>
            
            <div class="form-section">
                <h3>Sprites</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Sprite Path *</label>
                        <div class="sprite-input-group">
                            <input type="text" id="itemSprite" value="${escapeHtml(collectible.sprite || '')}" required placeholder="assets/custom/items/collectible.png" oninput="updateSingleSpritePreview('itemCollectibleSpritePreview', this.value)">
                            <div class="sprite-preview ${collectible.sprite ? 'has-image' : ''}" id="itemCollectibleSpritePreview">
                                <img src="${escapeHtml(collectible.sprite || '')}" alt="Sprite preview">
                                <div class="sprite-placeholder">No preview</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dropped Sprite Path</label>
                        <div class="sprite-input-group">
                            <input type="text" id="itemDroppedSprite" value="${escapeHtml(collectible.droppedSprite || '')}" placeholder="assets/custom/items/collectible-dropped.png" oninput="updateSingleSpritePreview('itemCollectibleDroppedSpritePreview', this.value)">
                            <div class="sprite-preview ${collectible.droppedSprite ? 'has-image' : ''}" id="itemCollectibleDroppedSpritePreview">
                                <img src="${escapeHtml(collectible.droppedSprite || '')}" alt="Dropped sprite preview">
                                <div class="sprite-placeholder">No preview</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Behavior</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Attract Radius</label>
                        <input type="number" id="itemAttractRadius" value="${collectible.attractRadius || 200}" min="0" max="1000">
                        <div class="helper-text">Distance at which player attracts item</div>
                    </div>
                    <div class="form-group">
                        <label>Pickup Radius</label>
                        <input type="number" id="itemPickupRadius" value="${collectible.pickupRadius || 50}" min="1" max="500">
                        <div class="helper-text">Distance at which item is collected</div>
                    </div>
                    <div class="form-group">
                        <label>XP Value</label>
                        <input type="number" id="itemXpValue" value="${collectible.xpValue || 1}" min="0" max="10000">
                    </div>
                    <div class="form-group">
                        <label>Effect</label>
                        <select id="itemEffect">
                            <option value="" ${!collectible.effect ? 'selected' : ''}>None</option>
                            <option value="speedBoost" ${collectible.effect === 'speedBoost' ? 'selected' : ''}>Speed Boost</option>
                            <option value="heal" ${collectible.effect === 'heal' ? 'selected' : ''}>Heal</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Heal Amount</label>
                        <input type="number" id="itemHealAmount" value="${collectible.healAmount || ''}" min="1" max="1000" placeholder="10">
                        <div class="helper-text">Used when Effect = Heal</div>
                    </div>
                    <div class="form-group">
                        <label>Drop Weight</label>
                        <input type="number" id="itemDropWeight" value="${collectible.dropWeight ?? 0}" min="0" max="1000">
                        <div class="helper-text">Higher = more common (0 disables drops)</div>
                    </div>
                    <div class="form-group">
                        <label>Grants Weapon</label>
                        <input type="text" id="itemGrantsWeapon" value="${escapeHtml(collectible.grantsWeapon || '')}" placeholder="e.g., electrifiedSwordWeapon">
                        <div class="helper-text">Adds a weapon to the player on pickup</div>
                    </div>
                </div>
            </div>
        </form>
    `;
}

function renderItemSpriteInputs() {
    const container = document.getElementById('itemSpritesContainer');
    if (!container) return;
    
    container.innerHTML = itemSpriteInputs.map((sprite, index) => `
        <div class="sprite-input-group">
            <input type="text"
                   id="itemSpriteInput${index}"
                   value="${escapeHtml(sprite)}"
                   oninput="updateItemSpriteInput(${index}, this.value); updateSingleSpritePreview('itemSpritePreview${index}', this.value)"
                   placeholder="assets/custom/items/projectile-${index + 1}.png"
                   maxlength="200">
            <div class="sprite-preview ${sprite ? 'has-image' : ''}" id="itemSpritePreview${index}">
                <img src="${escapeHtml(sprite)}" alt="Sprite preview ${index + 1}">
                <div class="sprite-placeholder">No preview</div>
            </div>
            ${itemSpriteInputs.length > 1 ? `<button type="button" class="btn btn-danger btn-small" onclick="removeItemSpriteInput(${index})">×</button>` : ''}
        </div>
    `).join('');
}

function addItemSpriteInput() {
    if (itemSpriteInputs.length >= 20) {
        showItemMessage('Maximum 20 sprites allowed', 'error');
        return;
    }
    itemSpriteInputs.push('');
    renderItemSpriteInputs();
}

function removeItemSpriteInput(index) {
    itemSpriteInputs.splice(index, 1);
    renderItemSpriteInputs();
}

function updateItemSpriteInput(index, value) {
    itemSpriteInputs[index] = value;
}

function updateSingleSpritePreview(previewId, value) {
    const container = document.getElementById(previewId);
    if (!container) return;

    const img = container.querySelector('img');
    const trimmedValue = value ? value.trim() : '';
    if (trimmedValue) {
        img.src = trimmedValue;
        container.classList.add('has-image');
    } else {
        img.removeAttribute('src');
        container.classList.remove('has-image');
    }
}

// ======================
// Item Operations
// ======================

function gatherItemFormData() {
    const getName = id => document.getElementById(id);
    if (!getName('itemName')) return null;
    
    let data = {
        name: getName('itemName').value.trim()
    };
    
    switch (currentItemCategory) {
        case 'weapons':
            data = {
                ...data,
                enabled: getName('itemEnabled')?.checked ?? true,
                type: 'weapon',
                attackSpeed: parseInt(getName('itemAttackSpeed').value),
                attackAnimationFrames: parseInt(getName('itemAnimationFrames')?.value) || 5,
                attackStrength: parseInt(getName('itemAttackStrength')?.value) || 1,
                level: parseInt(getName('itemLevel')?.value) || 1
            };
            
            // Optional fields
            const sprite = getName('itemSprite')?.value?.trim();
            if (sprite) data.sprite = sprite;
            
            const radius = getName('itemRadius')?.value;
            if (radius) data.radius = parseInt(radius);
            
            const projectile = getName('itemProjectile')?.value?.trim();
            if (projectile) data.projectile = projectile;
            
            const directions = getName('itemDirections')?.value;
            if (directions) data.directions = parseInt(directions);
            break;
            
        case 'projectiles':
            data = {
                ...data,
                sprites: itemSpriteInputs.filter(s => s.trim() !== ''),
                animation: {
                    frameTime: parseInt(getName('itemFrameTime').value)
                },
                speed: parseFloat(getName('itemSpeed').value),
                attackStrength: parseInt(getName('itemAttackStrength').value),
                size: {
                    width: parseInt(getName('itemWidth').value),
                    height: parseInt(getName('itemHeight').value)
                }
            };
            
            const maxDistance = getName('itemMaxDistance')?.value;
            if (maxDistance) data.maxDistance = parseInt(maxDistance);
            break;
            
        case 'collectibles':
            data = {
                ...data,
                sprite: getName('itemSprite').value.trim(),
                attractRadius: parseInt(getName('itemAttractRadius')?.value) || 200,
                pickupRadius: parseInt(getName('itemPickupRadius')?.value) || 50,
                xpValue: parseInt(getName('itemXpValue')?.value) || 1
            };
            
            const droppedSprite = getName('itemDroppedSprite')?.value?.trim();
            if (droppedSprite) data.droppedSprite = droppedSprite;

            const effect = getName('itemEffect')?.value?.trim();
            if (effect) data.effect = effect;

            const healAmount = getName('itemHealAmount')?.value;
            if (healAmount) data.healAmount = parseInt(healAmount) || 0;

            const dropWeight = getName('itemDropWeight')?.value;
            if (dropWeight !== undefined && dropWeight !== '') data.dropWeight = parseInt(dropWeight) || 0;

            const grantsWeapon = getName('itemGrantsWeapon')?.value?.trim();
            if (grantsWeapon) data.grantsWeapon = grantsWeapon;
            break;
    }
    
    return data;
}

async function saveItem() {
    const saveBtn = document.getElementById('saveItemBtn');
    if (!saveBtn) return;
    
    const itemData = gatherItemFormData();
    if (!itemData) return;
    
    // Validation for projectiles
    if (currentItemCategory === 'projectiles' && itemData.sprites?.length === 0) {
        showItemMessage('Please add at least one sprite', 'error');
        return;
    }
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading"></span> Saving...';
    
    try {
        await updateItem(currentItemCategory, currentEditingItemId, itemData);
        items[currentItemCategory][currentEditingItemId] = itemData;
        
        // Refresh source info
        try {
            const sourceResponse = await itemsApiRequest(`/${currentItemCategory}/${currentEditingItemId}/source`);
            if (sourceResponse.data) {
                itemSources[currentItemCategory][currentEditingItemId] = sourceResponse.data;
            }
        } catch (e) { /* ignore */ }
        
        showItemMessage('✓ Item saved successfully!', 'success');
        renderItemSubTabs();
        renderItemList();
        renderItemEditorForm(currentEditingItemId, itemData);
    } catch (error) {
        showItemMessage(`Failed to save: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes';
    }
}

function createNewItem() {
    const categoryLabel = currentItemCategory.slice(0, -1);
    const id = prompt(`Enter a unique ID for the new ${categoryLabel}:\n(lowercase letters, numbers, underscores only)`);
    
    if (!id) return;
    
    // Validate ID
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        showItemMessage('ID can only contain letters, numbers, and underscores', 'error');
        return;
    }
    
    if (items[currentItemCategory]?.[id]) {
        showItemMessage('An item with this ID already exists', 'error');
        return;
    }
    
    const name = prompt(`Enter a display name for "${id}":`);
    if (!name) return;
    
    // Create default item based on category
    let newItem;
    switch (currentItemCategory) {
        case 'weapons':
            newItem = {
                name: name,
                enabled: true,
                type: 'weapon',
                attackSpeed: 1000,
                attackAnimationFrames: 5,
                attackStrength: 1,
                level: 1
            };
            break;
        case 'projectiles':
            newItem = {
                name: name,
                sprites: ['assets/custom/items/projectile.png'],
                animation: { frameTime: 8 },
                speed: 2,
                attackStrength: 1,
                size: { width: 30, height: 30 }
            };
            break;
        case 'collectibles':
            newItem = {
                name: name,
                sprite: 'assets/custom/items/collectible.png',
                attractRadius: 200,
                pickupRadius: 50,
                xpValue: 1,
                dropWeight: 0
            };
            break;
    }
    
    // Save via API
    createItem(currentItemCategory, id, newItem)
        .then(() => {
            items[currentItemCategory][id] = newItem;
            itemSources[currentItemCategory][id] = { source: 'custom', isBase: false, isCustom: true, isOverride: false };
            renderItemSubTabs();
            renderItemList();
            selectItem(id);
            showItemMessage(`✓ ${categoryLabel} "${name}" created!`, 'success');
        })
        .catch(error => {
            showItemMessage(`Failed to create: ${error.message}`, 'error');
        });
}

async function deleteItem(event, itemId) {
    event.stopPropagation();
    
    const item = items[currentItemCategory]?.[itemId];
    const source = itemSources[currentItemCategory]?.[itemId];
    
    if (source?.isBase && !source?.isCustom) {
        showItemMessage('❌ Cannot delete base items.', 'error');
        return;
    }
    
    const categoryLabel = currentItemCategory.slice(0, -1);
    if (!confirm(`Delete ${categoryLabel} "${item.name}"?`)) return;
    
    try {
        const result = await deleteItemAPI(currentItemCategory, itemId);
        
        if (!result.success && result.isBaseItem) {
            showItemMessage('❌ Cannot delete base items.', 'error');
            return;
        }
        
        delete items[currentItemCategory][itemId];
        delete itemSources[currentItemCategory][itemId];
        
        if (currentEditingItemId === itemId) {
            currentEditingItemId = null;
            renderItemEditorEmpty();
        }
        
        renderItemSubTabs();
        renderItemList();
        showItemMessage('✓ Item deleted!', 'success');
    } catch (error) {
        showItemMessage(`Failed to delete: ${error.message}`, 'error');
    }
}

async function refreshItems() {
    try {
        await loadItems();
        renderItemSubTabs();
        renderItemList();
        
        if (currentEditingItemId && items[currentItemCategory]?.[currentEditingItemId]) {
            renderItemEditorForm(currentEditingItemId, items[currentItemCategory][currentEditingItemId]);
        } else {
            renderItemEditorEmpty();
        }
        
        showItemMessage('✓ Items refreshed!', 'success');
    } catch (error) {
        showItemMessage(`Failed to refresh: ${error.message}`, 'error');
    }
}

function showItemMessage(message, type) {
    // Use the shared showMessage function if available
    if (typeof showMessage === 'function') {
        showMessage(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

// Initialize items when switching to Items tab
async function initItemsEditor() {
    try {
        await loadItems();
        renderItemSubTabs();
        renderItemList();
        renderItemEditorEmpty();
    } catch (error) {
        console.error('Failed to initialize items editor:', error);
        showItemMessage(`Failed to load items: ${error.message}`, 'error');
    }
}
