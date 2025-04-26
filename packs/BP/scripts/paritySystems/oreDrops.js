/**
 * Raw Ore to Block Ore Transformer
 * Minecraft Bedrock Script API (@server v2.0.0-beta)
 * 
 * This script converts raw ore items into their block forms when they spawn in the world.
 * For example, raw iron items are converted to iron ore blocks.
 */

import { world, ItemStack, system } from "@minecraft/server";

// Configuration map for ore transformations
const ORE_TRANSFORMATIONS = Object.freeze({
  "minecraft:raw_iron": "minecraft:iron_ore",
  "minecraft:raw_gold": "minecraft:gold_ore",
  "minecraft:raw_copper": "minecraft:copper_ore", // Added support for copper
});

/**
 * Spawns an ore block item at the specified location
 * @param {Dimension} dimension - The dimension to spawn the item in
 * @param {string} itemType - The type ID of the item to spawn
 * @param {number} amount - The amount of items to spawn
 * @param {Vector3} location - The location to spawn the item at
 * @returns {Entity|null} The spawned item entity or null if operation failed
 */
function spawnOreItem(dimension, itemType, amount, location) {
  try {
    if (!dimension || !itemType || !location) {
      console.warn("Invalid parameters provided to spawnOreItem");
      return null;
    }

    // Create new item stack with specified parameters
    const itemStack = new ItemStack(itemType, amount);
    
    // Spawn the item in the world
    const itemEntity = dimension.spawnItem(itemStack, location);
    
    if (itemEntity) {
      // Prevent the item from moving
      itemEntity.clearVelocity();
      
      // Return the item entity for potential further processing
      return itemEntity;
    }
    return null;
  } catch (error) {
    console.error(`Failed to spawn ore item: ${error.message}`);
    return null;
  }
}

/**
 * Handles the transformation of raw ore items to ore blocks
 * @param {EntitySpawnAfterEvent} event - The entity spawn event
 */
function handleOreTransformation(event) {
  try {
    const { entity } = event;
    
    // Early exit if entity is null or not an item
    if (!entity || entity.typeId !== "minecraft:item") {
      return;
    }
    
    // Get the item component
    const itemComponent = entity.getComponent("minecraft:item");
    
    // Validate the item component and item stack
    if (!itemComponent?.itemStack) {
      return;
    }
    
    const itemTypeId = itemComponent.itemStack.typeId;
    const targetOreType = ORE_TRANSFORMATIONS[itemTypeId];
    
    // Check if this item should be transformed
    if (!targetOreType) {
      return;
    }
    
    const dimension = entity.dimension;
    const location = entity.location;
    const amount = itemComponent.itemStack.amount || 1;
    
    // Short delay to ensure timing with other game processes
    system.runTimeout(() => {
      try {
        // Remove the original item
        if (entity.isValid()) {
          entity.remove();
          
          // Spawn the replacement ore block item
          const newItem = spawnOreItem(dimension, targetOreType, amount, location);
          
          // Log successful transformation
          if (newItem) {
            console.info(`Transformed ${itemTypeId} to ${targetOreType} at (${Math.floor(location.x)}, ${Math.floor(location.y)}, ${Math.floor(location.z)})`);
          }
        }
      } catch (error) {
        console.error(`Error during ore transformation: ${error.message}`);
      }
    }, 1);
  } catch (error) {
    console.error(`Failed to process entity spawn event: ${error.message}`);
  }
}

/**
 * Initializes the ore transformation system
 */
function initializeOreTransformer() {
  try {
    // Register event handlers
    world.afterEvents.entitySpawn.subscribe(handleOreTransformation);
    
    console.info("Ore Transformation System initialized successfully");
  } catch (error) {
    console.error(`Failed to initialize Ore Transformer: ${error.message}`);
  }
}

// Initialize the system
initializeOreTransformer();

// Export functions for potential testing or modular use
export {
  spawnOreItem,
  handleOreTransformation,
  ORE_TRANSFORMATIONS
};