/**
 * Beta 1.7.3 Item Restriction System for Minecraft Bedrock
 * 
 * This script enforces the item limitations of Beta 1.7.3 by removing any items
 * that were not available in that version from players" inventories.
 * 
 * Compatible with Minecraft Bedrock Script API @minecraft/server v2.0.0-beta
 * Module target: ES2023
 */

import { world, system } from "@minecraft/server";

/**
 * System configuration settings
 */
const CONFIG = Object.freeze({
  // How frequently to check player inventories (in ticks)
  CHECK_INTERVAL_TICKS: 20, // 1 second
  
  // Cooldown for notification messages (in ticks)
  MESSAGE_COOLDOWN_TICKS: 60, // 3 seconds
  
  // Message to show when removing items
  CLEAR_MESSAGE: "Whoops! That\'s not allowed!",
  
  // Debug mode for additional logging
  DEBUG: false
});

/**
 * ItemRestrictionSystem class to handle item validation and removal
 */
class ItemRestrictionSystem {
  constructor() {
    // Set of allowed item IDs from Beta 1.7.3
    this.allowedItems = this.buildAllowedItemsSet();
    
    // Map to track message cooldowns by player ID
    this.playerMessageCooldowns = new Map();
    
    // Initialize the system
    this.initialize();
  }
  
  /**
   * Initialize the system and register event handlers
   */
  initialize() {
    try {
      // Start the periodic inventory check
      system.runInterval(this.checkAllPlayers.bind(this), CONFIG.CHECK_INTERVAL_TICKS);
      
      // Register player leave event for cleanup
      world.afterEvents.playerLeave.subscribe(this.handlePlayerLeave.bind(this));
      
      console.log("[ITEMS] Beta 1.7.3 item restriction system initialized");
      
      if (CONFIG.DEBUG) {
        console.log(`[ITEMS] Monitoring ${this.allowedItems.size} allowed items`);
      }
    } catch (error) {
      console.error(`[ITEMS] Initialization error: ${error.message}`);
    }
  }
  
  /**
   * Build the set of allowed item IDs
   * @returns {Set<string>} Set of allowed item IDs
   */
  buildAllowedItemsSet() {
    return new Set([
      // Tools
      "minecraft:iron_shovel", "minecraft:iron_pickaxe", "minecraft:iron_axe",
      "minecraft:flint_and_steel", "minecraft:wooden_sword", "minecraft:wooden_shovel",
      "minecraft:wooden_pickaxe", "minecraft:wooden_axe", "minecraft:stone_sword",
      "minecraft:stone_shovel", "minecraft:stone_pickaxe", "minecraft:stone_axe",
      "minecraft:diamond_sword", "minecraft:diamond_shovel", "minecraft:diamond_pickaxe",
      "minecraft:diamond_axe", "minecraft:golden_sword", "minecraft:golden_shovel",
      "minecraft:golden_pickaxe", "minecraft:golden_axe", "minecraft:wooden_hoe",
      "minecraft:stone_hoe", "minecraft:iron_hoe", "minecraft:diamond_hoe",
      "minecraft:golden_hoe", "minecraft:fishing_rod", "minecraft:shears",
      
      // Weapons & Combat
      "minecraft:bow", "minecraft:arrow", "minecraft:leather_helmet",
      "minecraft:leather_chestplate", "minecraft:leather_leggings", "minecraft:leather_boots",
      "minecraft:chainmail_helmet", "minecraft:chainmail_chestplate", "minecraft:chainmail_leggings",
      "minecraft:chainmail_boots", "minecraft:iron_helmet", "minecraft:iron_chestplate",
      "minecraft:iron_leggings", "minecraft:iron_boots", "minecraft:diamond_helmet",
      "minecraft:diamond_chestplate", "minecraft:diamond_leggings", "minecraft:diamond_boots",
      "minecraft:golden_helmet", "minecraft:golden_chestplate", "minecraft:golden_leggings",
      "minecraft:golden_boots",
      
      // Food
      "minecraft:apple", "minecraft:mushroom_stew", "minecraft:bread",
      "minecraft:porkchop", "minecraft:cooked_porkchop", "minecraft:golden_apple",
      "minecraft:fish", "minecraft:cooked_fish", "minecraft:cookie", "minecraft:cake", 
      
      // Resources & Materials
      "minecraft:coal", "minecraft:diamond", "minecraft:iron_ingot", "minecraft:gold_ingot",
      "minecraft:stick", "minecraft:bowl", "minecraft:string", "minecraft:feather",
      "minecraft:gunpowder", "minecraft:wheat_seeds", "minecraft:wheat", "minecraft:flint",
      "minecraft:leather", "minecraft:brick", "minecraft:clay_ball", "minecraft:sugar_cane",
      "minecraft:paper", "minecraft:book", "minecraft:slime_ball", "minecraft:egg",
      "minecraft:glowstone_dust", "minecraft:dye", "minecraft:bone", "minecraft:sugar",
      "minecraft:lapis_lazuli", "minecraft:redstone",
      
      // Blocks - Natural
      "minecraft:stone", "minecraft:dirt", "minecraft:oak_log", "minecraft:birch_log",
      "minecraft:spruce_log", "minecraft:oak_leaves", "minecraft:sand", "minecraft:gravel",
      "minecraft:gold_ore", "minecraft:iron_ore", "minecraft:coal_ore", "minecraft:diamond_ore",
      "minecraft:redstone_ore", "minecraft:oak_sapling", "minecraft:glass", "minecraft:sandstone",
      "minecraft:cactus", "minecraft:clay", "minecraft:reeds", "minecraft:snow", "minecraft:ice",
      "minecraft:snow_block", "minecraft:pumpkin", "minecraft:netherrack", "minecraft:soul_sand",
      "minecraft:glowstone",
      
      // Blocks - Crafted
      "minecraft:oak_planks", "minecraft:cobblestone", "minecraft:bricks",
      "minecraft:bookshelf", "minecraft:mossy_cobblestone", "minecraft:obsidian",
      "minecraft:gold_block", "minecraft:iron_block", "minecraft:diamond_block",
      "minecraft:tnt", "minecraft:lapis_block", "minecraft:sponge",
      
      // Functional Blocks
      "minecraft:furnace", "minecraft:crafting_table", "bh:crafting_table", 
      "minecraft:chest", "minecraft:jukebox", "minecraft:dispenser", "minecraft:spawner",
      "minecraft:locked_chest",
      
      // Decorative & Misc
      "minecraft:torch", "minecraft:ladder", "minecraft:sign", "minecraft:wooden_door",
      "minecraft:iron_door", "minecraft:white_wool", "minecraft:orange_wool",
      "minecraft:magenta_wool", "minecraft:light_blue_wool", "minecraft:yellow_wool",
      "minecraft:lime_wool", "minecraft:pink_wool", "minecraft:gray_wool",
      "minecraft:light_gray_wool", "minecraft:cyan_wool", "minecraft:purple_wool",
      "minecraft:blue_wool", "minecraft:brown_wool", "minecraft:green_wool",
      "minecraft:red_wool", "minecraft:black_wool", "minecraft:oak_fence",
      "minecraft:trapdoor", "minecraft:stone_button", "minecraft:wooden_pressure_plate",
      "minecraft:stone_pressure_plate", "minecraft:lever", "minecraft:stone_slab",
      "minecraft:oak_stairs", "minecraft:cobblestone_stairs",
      
      // Redstone
      "minecraft:redstone_torch", "minecraft:rail", "minecraft:repeater",
      "minecraft:piston", "minecraft:sticky_piston",
      
      // Plants & Flora
      "minecraft:poppy", "minecraft:dandelion", "minecraft:dead_bush",
      "minecraft:tall_grass", "minecraft:fern", "minecraft:brown_mushroom", 
      "minecraft:red_mushroom",
      
      // Vehicles & Special
      "minecraft:oak_boat", "minecraft:minecart", "minecraft:chest_minecart",
      "minecraft:furnace_minecart", "minecraft:saddle", "minecraft:bucket",
      "minecraft:water_bucket", "minecraft:lava_bucket", "minecraft:milk_bucket",
      "minecraft:snowball", "minecraft:map", "minecraft:compass", "minecraft:clock",
      "minecraft:bed", "minecraft:painting", "minecraft:barrier",
      
      // Special Blocks
      "minecraft:carved_pumpkin", "minecraft:lit_pumpkin", "minecraft:jack_o_lantern",
      
      // Music Discs
      "minecraft:music_disc_13", "minecraft:music_disc_cat"
    ]);
  }
  
  /**
   * Check all online players for invalid items
   */
  checkAllPlayers() {
    try {
      for (const player of world.getPlayers()) {
        this.checkPlayerInventory(player);
      }
    } catch (error) {
      console.error(`[ITEMS] Error checking players: ${error.message}`);
    }
  }
  
  /**
   * Check and clear invalid items from a player"s inventory
   * @param {Player} player - The player to check
   */
  checkPlayerInventory(player) {
    try {
      const inventoryComponent = player.getComponent("minecraft:inventory");
      if (!inventoryComponent?.container) {
        if (CONFIG.DEBUG) {
          console.warn(`[ITEMS] No inventory component for player "${player.name}"`);
        }
        return;
      }

      const container = inventoryComponent.container;
      let removedItems = false;
      let removedItemList = [];

      // Check all inventory slots
      for (let slot = 0; slot < container.size; slot++) {
        const item = container.getItem(slot);
        if (!item) continue;
        
        // Check if item is allowed
        if (!this.allowedItems.has(item.typeId)) {
          if (CONFIG.DEBUG) {
            removedItemList.push(`${item.typeId} (x${item.amount})`);
          }
          
          container.setItem(slot, undefined);
          removedItems = true;
        }
      }

      // Notify the player if items were removed
      if (removedItems) {
        if (CONFIG.DEBUG) {
          console.log(`[ITEMS] Removed from ${player.name}: ${removedItemList.join(", ")}`);
        }
        
        this.notifyPlayer(player);
      }
    } catch (error) {
      console.warn(`[ITEMS] Error checking inventory for "${player.name}": ${error.message}`);
    }
  }
  
  /**
   * Send notification to player about removed items (with cooldown)
   * @param {Player} player - The player to notify
   */
  notifyPlayer(player) {
    const currentTick = system.currentTick;
    const lastMessageTick = this.playerMessageCooldowns.get(player.id) ?? 0;

    // Check if cooldown has expired
    if (currentTick - lastMessageTick >= CONFIG.MESSAGE_COOLDOWN_TICKS) {
      player.sendMessage(CONFIG.CLEAR_MESSAGE);
      this.playerMessageCooldowns.set(player.id, currentTick);
    }
  }
  
  /**
   * Handle player leave event
   * @param {PlayerLeaveAfterEvent} event - The player leave event
   */
  handlePlayerLeave(event) {
    try {
      // Clean up player data when they leave
      const { playerId } = event;
      this.playerMessageCooldowns.delete(playerId);
      
      if (CONFIG.DEBUG) {
        console.log(`[ITEMS] Cleaned up data for player ID: ${playerId}`);
      }
    } catch (error) {
      console.warn(`[ITEMS] Error handling player leave: ${error.message}`);
    }
  }
}

// Initialize the item restriction system
const itemRestriction = new ItemRestrictionSystem();

// Export the system for potential reuse in other scripts
export default itemRestriction;