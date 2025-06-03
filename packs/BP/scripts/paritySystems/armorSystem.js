/**
 * Beta 1.7.3 Armor System Emulator for Minecraft Bedrock
 * 
 * This script reimplements the classic armor mechanics from Minecraft Beta 1.7.3,
 * including damage reduction calculations, durability system, and armor display.
 * 
 * Compatible with Minecraft Bedrock Script API @minecraft/server v2.0.0-beta
 * Module target: ES2023
 */

import { world, system, ItemStack, EquipmentSlot } from '@minecraft/server';

/**
 * Configuration settings for the armor system
 */
const CONFIG = Object.freeze({
  // How often to update the armor bar UI (in ticks)
  ARMOR_UPDATE_FREQUENCY: 4,
  
  // Maximum damage reduction percentage from armor (0.8 = 80%)
  MAX_DAMAGE_REDUCTION: 0.8,
  
  // Minimum damage reduction percentage from armor
  MIN_DAMAGE_REDUCTION: 0,
  
  // Multiplier for calculating durability damage when hit
  DURABILITY_DAMAGE_MULTIPLIER: 2,
  
  // Nerf factor applied to armor protection calculation
  FORMULA_NERF: 3,
  
  // Scaling factor for converting protection points to damage reduction
  PROTECTION_TO_REDUCTION_SCALE: 25,
  
  // Time in milliseconds to debounce damage events
  DAMAGE_DEBOUNCE_TIME: 100,
  
  // Time in milliseconds before cleaning up cached damage events
  DAMAGE_CACHE_CLEANUP_TIME: 1000,
  
  // Cleanup interval in milliseconds
  CLEANUP_INTERVAL: 200,
  
  // Health adjustment delay in ticks
  HEALTH_ADJUSTMENT_DELAY: 3
});

/**
 * Armor protection values from Beta 1.7.3
 * Each value represents armor points provided by the item
 */
const ARMOR_PROTECTION = Object.freeze({
  // Helmets (all provide 3 armor points)
  'minecraft:leather_helmet': 3,
  'minecraft:golden_helmet': 3,
  'minecraft:chainmail_helmet': 3,
  'minecraft:iron_helmet': 3,
  'minecraft:diamond_helmet': 3,
  
  // Chestplates (all provide 8 armor points)
  'minecraft:leather_chestplate': 8,
  'minecraft:golden_chestplate': 8,
  'minecraft:chainmail_chestplate': 8,
  'minecraft:iron_chestplate': 8,
  'minecraft:diamond_chestplate': 8,
  
  // Leggings (all provide 6 armor points)
  'minecraft:leather_leggings': 6,
  'minecraft:golden_leggings': 6,
  'minecraft:chainmail_leggings': 6,
  'minecraft:iron_leggings': 6,
  'minecraft:diamond_leggings': 6,
  
  // Boots (all provide 3 armor points)
  'minecraft:leather_boots': 3,
  'minecraft:golden_boots': 3,
  'minecraft:chainmail_boots': 3,
  'minecraft:iron_boots': 3,
  'minecraft:diamond_boots': 3
});

/**
 * Damage types that should not be affected by armor
 * These damage types bypass armor protection
 */
const NON_PHYSICAL_DAMAGE_TYPES = Object.freeze([
  'fall', 'fire', 'burning', 'drowning', 'suffocation',
  'starvation', 'void', 'magic', 'wither', 'lightning',
  'anvil', 'cactus', 'contact', 'dragon-breath', 'dripstone',
  'fly-into-wall', 'hot-floor', 'lava', 'melting', 'override',
  'ram-attack', 'sonic-explosion', 'soul-sand', 'stalactite',
  'starve', 'suffocation', 'suicide', 'temperature', 'thorn', 'tumble'
]);

/**
 * ArmorSystem class to handle armor-related gameplay mechanics
 */
class ArmorSystem {
  constructor() {
    // Cache for last damage events to prevent duplicate processing
    this.lastDamageEvents = new Map();
    
    // Initialize the system
    this.initialize();
  }
  
  /**
   * Initialize the armor system and register event handlers
   */
  initialize() {
    // Register event handlers
    world.afterEvents.entityHurt.subscribe(this.handleEntityHurt.bind(this));
    
    // Schedule periodic tasks
    system.runInterval(this.updateArmorBar.bind(this), CONFIG.ARMOR_UPDATE_FREQUENCY);
    system.runInterval(this.cleanupDamageEvents.bind(this), CONFIG.CLEANUP_INTERVAL);
    
    console.log("[ARMOR] Beta 1.7.3 Armor System initialized");
  }
  
  /**
   * Calculate armor statistics for an entity
   * @param {EntityEquippableComponent} equippable - The entity's equippable component
   * @returns {Object} Armor statistics including protection, durability, and damage
   */
  calculateArmorStats(equippable) {
    const slots = [
      EquipmentSlot.Head,
      EquipmentSlot.Chest,
      EquipmentSlot.Legs,
      EquipmentSlot.Feet
    ];

    let protection = 0;
    let maxDurability = 0;
    let currentDamage = 0;

    for (const slot of slots) {
      try {
        const armorItem = equippable.getEquipment(slot);
        if (!armorItem || !ARMOR_PROTECTION[armorItem.typeId]) continue;
        
        // Add protection value from this armor piece
        protection += ARMOR_PROTECTION[armorItem.typeId];
        
        // Track durability if available
        const durability = armorItem.getComponent('minecraft:durability');
        if (durability) {
          maxDurability += durability.maxDurability;
          currentDamage += durability.damage;
        }
      } catch (error) {
        console.warn(`[ARMOR] Error processing armor in slot ${slot}: ${error.message}`);
      }
    }

    return { protection, maxDurability, currentDamage };
  }
  
  /**
   * Apply durability damage to all armor pieces
   * @param {EntityEquippableComponent} equippable - The entity's equippable component
   * @param {number} damage - The amount of damage being applied
   */
  applyDurabilityDamage(equippable, damage) {
    const slots = [
      EquipmentSlot.Head,
      EquipmentSlot.Chest,
      EquipmentSlot.Legs,
      EquipmentSlot.Feet
    ];
    
    // Calculate durability damage (minimum 1)
    const durabilityDamage = Math.max(1, Math.floor(damage * CONFIG.DURABILITY_DAMAGE_MULTIPLIER));

    for (const slot of slots) {
      try {
        const armorItem = equippable.getEquipment(slot);
        if (!armorItem || !ARMOR_PROTECTION[armorItem.typeId]) continue;
        
        const durability = armorItem.getComponent('minecraft:durability');
        if (!durability) continue;
        
        // Create a new item instance to modify the durability
        const newItem = new ItemStack(armorItem.typeId, armorItem.amount);
        Object.entries(armorItem.getLore()).forEach(lore => newItem.setLore(lore));
        
        // Apply durability damage
        const newDurability = newItem.getComponent('minecraft:durability');
        if (!newDurability) continue;
        
        newDurability.damage = durability.damage + durabilityDamage;
        
        // If durability is depleted, remove the item
        if (newDurability.damage >= newDurability.maxDurability) {
          equippable.setEquipment(slot, null);
        } else {
          equippable.setEquipment(slot, newItem);
        }
      } catch (error) {
        console.warn(`[ARMOR] Error applying durability damage to slot ${slot}: ${error.message}`);
      }
    }
  }
  
  /**
   * Handle entity hurt events to apply armor protection
   * @param {EntityHurtAfterEvent} event - The entity hurt event
   */
  handleEntityHurt(event) {
    const { hurtEntity, damage, damageSource } = event;
    
    // Only process player damage
    if (hurtEntity.typeId !== 'minecraft:player') return;
    
    const player = hurtEntity;
    const currentTime = Date.now();
    
    // Check for duplicated damage events (debounce)
    const lastEvent = this.lastDamageEvents.get(player.id);
    if (lastEvent && currentTime - lastEvent.time < CONFIG.DAMAGE_DEBOUNCE_TIME) return;
    
    // Record this damage event
    this.lastDamageEvents.set(player.id, { time: currentTime });
    
    // Skip non-physical damage types that bypass armor
    if (damageSource?.cause && NON_PHYSICAL_DAMAGE_TYPES.includes(damageSource.cause)) return;
    
    // Get player's armor
    const equippable = player.getComponent('minecraft:equippable');
    if (!equippable) return;
    
    // Calculate armor protection
    const { protection, maxDurability, currentDamage } = this.calculateArmorStats(equippable);
    if (maxDurability <= 0) return;
    
    // Calculate effective protection based on armor durability
    const durabilityFactor = (maxDurability - currentDamage) / (maxDurability + 1);
    const effectiveProtectionPoints = (protection - CONFIG.FORMULA_NERF) * durabilityFactor;
    
    // Convert protection points to damage reduction percentage
    const rawReductionPercentage = Math.max(0, effectiveProtectionPoints) / CONFIG.PROTECTION_TO_REDUCTION_SCALE;
    
    // Clamp damage reduction to configured limits
    const effectiveReductionPercentage = Math.min(
      CONFIG.MAX_DAMAGE_REDUCTION,
      Math.max(CONFIG.MIN_DAMAGE_REDUCTION, rawReductionPercentage)
    );
    
    // Calculate damage absorption
    const damageAbsorbed = damage * effectiveReductionPercentage;
    const finalDamage = damage - damageAbsorbed;
    
    // Log damage reduction details (for debugging)
    if (damageAbsorbed > 0) {
      console.log(
        `[ARMOR] Player: ${player.name} | Damage: ${damage.toFixed(2)} | ` +
        `Reduction: ${(effectiveReductionPercentage * 100).toFixed(1)}% | ` +
        `Absorbed: ${damageAbsorbed.toFixed(2)} | Final: ${finalDamage.toFixed(2)}`
      );
    }
    
    // Apply durability damage to armor
    this.applyDurabilityDamage(equippable, damage);
    
    // Adjust player health after a short delay
    // This gives time for vanilla damage to be applied first
    system.runTimeout(() => {
      try {
        const health = player.getComponent('minecraft:health');
        if (!health) return;
        
        const currentHealth = health.currentValue;
        const newHealthValue = Math.min(health.effectiveMax, currentHealth + damageAbsorbed);
        
        // Only update if there's a meaningful change
        if (Math.abs(newHealthValue - currentHealth) > 0.01) {
          health.setCurrentValue(newHealthValue);
          
          console.log(
            `[ARMOR] Health Adjusted for ${player.name} | ` +
            `From: ${currentHealth.toFixed(2)} | ` +
            `To: ${newHealthValue.toFixed(2)} | ` +
            `(+${damageAbsorbed.toFixed(2)})`
          );
        }
      } catch (error) {
        console.warn(`[ARMOR] Error adjusting player health: ${error.message}`);
      }
    }, CONFIG.HEALTH_ADJUSTMENT_DELAY);
  }
  
  /**
   * Update armor bar display for all players
   */
  updateArmorBar() {
    for (const player of world.getPlayers()) {
      try {
        const equippable = player.getComponent('minecraft:equippable');
        
        // Default to empty armor bar
        let armorDisplay = '_a00';
        
        if (equippable) {
          const { protection, maxDurability, currentDamage } = this.calculateArmorStats(equippable);
          
          if (maxDurability > 0) {
            // Calculate visual armor points based on protection and durability
            const durabilityRatio = (maxDurability - currentDamage) / maxDurability;
            const effectiveProtectionVisual = protection * durabilityRatio;
            
            // Clamp to display range (1-20)
            const armorPoints = Math.min(20, Math.max(0, Math.round(effectiveProtectionVisual)));
            
            // Format display value with leading zero if needed
            armorDisplay = `_a${armorPoints.toString().padStart(2, '0')}`;
          }
        }
        
        // Update the display
        player.onScreenDisplay.setTitle(armorDisplay, {
          fadeInDuration: 0,
          fadeOutDuration: 0,
          stayDuration: 20
        });
      } catch (error) {
        console.warn(`[ARMOR] Display error for ${player.name}: ${error.message}`);
      }
    }
  }
  
  /**
   * Clean up old damage events from the cache
   */
  cleanupDamageEvents() {
    const now = Date.now();
    for (const [id, event] of this.lastDamageEvents.entries()) {
      if (now - event.time > CONFIG.DAMAGE_CACHE_CLEANUP_TIME) {
        this.lastDamageEvents.delete(id);
      }
    }
  }
}

// Initialize the armor system
const armorSystem = new ArmorSystem();

// Export the system for potential reuse in other scripts
export default armorSystem;