import { world, system, ItemStack, EquipmentSlot } from '@minecraft/server';

// Configuration
const config = {
    armorUpdateFrequency: 4,
    maxDamageReduction: 0.8, // 80% cap (corresponds to 20 defense points)
    minDamageReduction: 0.0, // Minimum can be 0 if armor is fully broken or stats are too low
    durabilityDamageMultiplier: 2,
    formulaNerf: 3, // Changed from 1 to 4 for better balance (deviation from strict Beta)
    // Scaling factor to map effective armor points to a reduction percentage.
    // In Beta, 20 defense points ~ 80% reduction. 20 / 0.8 = 25.
    protectionToReductionScale: 25
};

// Store players and their last calculated armor bar string
const playerArmorBars = new Map();
const lastDamageEvents = new Map();

// Armor protection values (Beta 1.7.3)
const armorProtectionValues = {
    'minecraft:leather_helmet': 3,
    'minecraft:golden_helmet': 3,
    'minecraft:chainmail_helmet': 3,
    'minecraft:iron_helmet': 3,
    'minecraft:diamond_helmet': 3,
    'minecraft:leather_chestplate': 8,
    'minecraft:golden_chestplate': 8,
    'minecraft:chainmail_chestplate': 8,
    'minecraft:iron_chestplate': 8,
    'minecraft:diamond_chestplate': 8,
    'minecraft:leather_leggings': 6,
    'minecraft:golden_leggings': 6,
    'minecraft:chainmail_leggings': 6,
    'minecraft:iron_leggings': 6,
    'minecraft:diamond_leggings': 6,
    'minecraft:leather_boots': 3,
    'minecraft:golden_boots': 3,
    'minecraft:chainmail_boots': 3,
    'minecraft:iron_boots': 3,
    'minecraft:diamond_boots': 3
};

// Non-physical damage types (armor does not protect against these)
const nonPhysicalDamageTypes = [
    'fall', 'fire', 'burning', 'drowning', 'suffocation',
    'starvation', 'void', 'magic', 'wither', 'lightning',
    'anvil', 'cactus', 'contact', 'dragon-breath', 'dripstone',
    'fly-into-wall', 'hot-floor', 'lava', 'melting', 'override',
    'ram-attack', 'sonic-explosion', 'soul-sand', 'stalactite',
    'starve', 'suffocation', 'suicide', 'temperature', 'thorn', 'tumble'
]; // Added more non-physical types for modern Bedrock context

// Damage Calculation
world.afterEvents.entityHurt.subscribe((event) => {
    const { hurtEntity, damage, damageSource } = event;
    if (!hurtEntity || hurtEntity.typeId !== 'minecraft:player') return;

    const player = hurtEntity;
    const currentTime = Date.now();

    // Debounce check - prevent processing the same damage event multiple times in quick succession
    const lastEvent = lastDamageEvents.get(player.id);
    if (lastEvent && lastEvent.time > currentTime - 100) return; // 100ms debounce
    lastDamageEvents.set(player.id, { time: currentTime });

    // Ignore non-physical damage types
    if (nonPhysicalDamageTypes.includes(damageSource.cause)) return;

    const equippable = player.getComponent('minecraft:equippable');
    if (!equippable) return;

    // Calculate combined armor stats
    let protection = 0; // Sum of armor defense points
    let maxDurability = 0; // Sum of armor max durabilities
    let currentDamage = 0; // Sum of armor current damage (durability used)
    const armorSlots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];

    for (const slot of armorSlots) {
        const armorItem = equippable.getEquipment(slot);
        if (armorItem && armorProtectionValues[armorItem.typeId]) {
            const durability = armorItem.getComponent('minecraft:durability');
            protection += armorProtectionValues[armorItem.typeId];
            if (durability) {
                maxDurability += durability.maxDurability;
                currentDamage += durability.damage;
            }
        }
    }

    // If no armor with durability is worn, exit. Avoids division by zero later.
    if (maxDurability <= 0) return;

    // === BALANCED BETA FORMULA Application ===
    // Calculate the raw effectiveness score based on defense points and durability.
    // This score represents effective protection points.
    // Formula: ((P - Nerf) * (MD - CD)) / (MD + 1)
    const effectiveProtectionPoints = ((protection - config.formulaNerf) * (maxDurability - currentDamage)) / (maxDurability + 1);

    // Map the effective protection points to a damage reduction percentage.
    // In Beta, 20 points roughly corresponds to 80% reduction.
    // We scale effective points by a factor (e.g., 25) to get a percentage (e.g., 20/25 = 0.8).
    // Ensure the effective points are not negative due to Nerf or broken armor.
    const rawReductionPercentage = Math.max(0, effectiveProtectionPoints) / config.protectionToReductionScale;

    // Apply configured min/max caps to the reduction percentage.
    const effectiveReductionPercentage = Math.min(config.maxDamageReduction, Math.max(config.minDamageReduction, rawReductionPercentage));

    // Calculate damage absorbed and final damage based on the initial incoming damage
    const damageAbsorbed = damage * effectiveReductionPercentage;
    const finalDamage = damage - damageAbsorbed;

    console.log(`[ARMOR] Initial: ${damage.toFixed(2)} | Effective %: ${(effectiveReductionPercentage*100).toFixed(1)}% | Absorbed: ${damageAbsorbed.toFixed(2)} | Final: ${finalDamage.toFixed(2)}`);

    // Apply durability damage based on the initial incoming damage
    // Beta durability loss was often 1 point per 1 point of damage taken before reduction.
    // Your multiplier approach is a reasonable alternative.
    const durabilityDamage = Math.max(1, Math.floor(damage * config.durabilityDamageMultiplier));
    for (const slot of armorSlots) {
        const armorItem = equippable.getEquipment(slot);
        if (armorItem && armorProtectionValues[armorItem.typeId]) {
            const durabilityComponent = armorItem.getComponent('minecraft:durability');
            if (durabilityComponent) {
                const maxDurability = durabilityComponent.maxDurability;
                const currentDamage = durabilityComponent.damage;
                const newDamage = currentDamage + 1;
    
                if (newDamage >= maxDurability) {
                    equippable.setEquipment(slot, null); // Break armor
                    console.log(`[DEBUG] Slot ${slot}: ${armorItem.typeId} broken`);
                } else {
                    const newItem = new ItemStack(armorItem.typeId, armorItem.amount);
                    const newDurability = newItem.getComponent('minecraft:durability');
                    if (newDurability) {
                        newDurability.damage = newDamage;
                        equippable.setEquipment(slot, newItem);
                        console.log(`[DEBUG] Slot ${slot}: ${armorItem.typeId} durability reduced to ${maxDurability - newDurability.damage}`);
                    }
                }
            }
        }
    }

    // Proper health adjustment:
    // The default game event has already applied the full 'damage'.
    // We need to heal the player back the amount that was absorbed.
    // Using a small timeout ensures this happens *after* the default damage is applied
    // and gives the health component time to update.
    system.runTimeout(() => {
        const health = player.getComponent('minecraft:health');
        if (health) {
            // Re-read the current health value within the timeout context
            const currentHealthAfterDefaultDamage = health.currentValue;

            // New health should be currentHealth + damageAbsorbed, capped at max health.
            const newHealthValue = Math.min(health.effectiveMax, currentHealthAfterDefaultDamage + damageAbsorbed);

            // Only set health if it's actually changing to avoid unnecessary calls
            // and potential issues if health somehow equals the target already.
            if (newHealthValue !== currentHealthAfterDefaultDamage) {
                 health.setCurrentValue(newHealthValue);
                 // Improved log message to show before and after setting
                 console.log(`[ARMOR] Health Adjusted. Original: ${currentHealthAfterDefaultDamage.toFixed(2)} | Added: ${damageAbsorbed.toFixed(2)} | New: ${newHealthValue.toFixed(2)}`);
            } else {
                 // Log if no change occurred, which is unexpected if damageAbsorbed > 0
                 console.log(`[ARMOR] Health Adjustment Skipped. No change from ${currentHealthAfterDefaultDamage.toFixed(2)} with ${damageAbsorbed.toFixed(2)} absorbed.`);
            }
        }
    // --- INCREASED DELAY ---
    }, 2); // Increased timeout delay from 1 to 2 ticks. Try 3 if 2 doesn't work.
});


// --- Armor Bar UI ---
// This section visually represents the armor's *current effectiveness* based on durability.
// The calculation here is for display purposes and isn't identical to the damage formula's internal score.
function generateArmorBar(player) {
    try {
        const equippable = player.getComponent('minecraft:equippable');
        if (!equippable) return '_a00'; // No armor, show empty icon

        let protection = 0; // Sum of armor defense points
        let maxDurability = 0; // Sum of armor max durabilities
        let currentDamage = 0; // Sum of armor current damage (durability used)
        const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
        let hasArmorWithDurability = false; // Flag to check if any item with durability is worn

        for (const slot of slots) {
            const item = equippable.getEquipment(slot);
            if (item && armorProtectionValues[item.typeId]) {
                const durability = item.getComponent('minecraft:durability');
                protection += armorProtectionValues[item.typeId];
                if (durability) {
                    hasArmorWithDurability = true;
                    maxDurability += durability.maxDurability;
                    currentDamage += durability.damage;
                }
            }
        }

        // If no armor with durability, maxDurability remains 0. Set to 1 for division safety.
        if (!hasArmorWithDurability || maxDurability <= 0) {
            maxDurability = 1;
            currentDamage = 0; // Ensure currentDamage is 0 if no durability items
        }

        // Scale total protection points by remaining combined durability percentage
        // Use Math.max(0, ...) to prevent negative durability ratio
        const durabilityRatio = Math.max(0, (maxDurability - currentDamage) / maxDurability);
        const effectiveProtectionVisual = protection * durabilityRatio;

        // Map the effective visual points to 0-20 range for _a00 to _a20
        const points = Math.min(20, Math.max(0, Math.round(effectiveProtectionVisual)));

        // Format as _aXX (e.g., _a05 for 5 points, _a20 for 20 points)
        return `_a${points.toString().padStart(2, '0')}`;

    } catch (e) {
        console.error(`[ARMOR] Bar error:`, e);
        return '_a00'; // Show empty icon on error
    }
}

// Update armor icons periodically
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        // Use setTitle to display the _aXX string, which the UI will replace with icons
        player.onScreenDisplay.setTitle({ rawtext: [{ text: generateArmorBar(player) }] });
    }
}, config.armorUpdateFrequency);

// Cleanup last damage events map
system.runInterval(() => {
    const now = Date.now();
    // Remove old entries from the debounce map
    for (const [id, event] of lastDamageEvents) {
        if (event.time < now - 1000) { // Remove entries older than 1 second
            lastDamageEvents.delete(id);
        }
    }
}, 200);