/**
 * Enhanced Building Behavior Manager for Minecraft Bedrock
 * API Version: 2.0.0-beta
 * Module Target: ES2023
 * 
 * This module manages various building and interaction behaviors in Minecraft,
 * enforcing specific placement rules and preventing certain interactions.
 */

import { world, Direction, BlockPermutation, system } from '@minecraft/server';

/**
 * Configuration constants for block types and tools
 * @constant {Object} BLOCK_CONFIGS
 */
const BLOCK_CONFIGS = Object.freeze({
  // Blocks that cannot be placed on ceilings
  CEILING_RESTRICTED: new Set([
    'minecraft:stone_button',
    'minecraft:lever'
  ]),
  
  // Slabs that should only be placed in bottom position
  BOTTOM_ONLY_SLABS: new Set([
    'minecraft:cobblestone_slab',
    'minecraft:oak_slab',
    'minecraft:smooth_stone_slab',
    'minecraft:sandstone_slab',
  ]),
  
  // Stairs that should only be placed in bottom position
  BOTTOM_ONLY_STAIRS: new Set([
    'minecraft:oak_stairs',
    'minecraft:stone_stairs'
  ]),
  
  // Logs that should always be placed vertically
  VERTICAL_ONLY_LOGS: new Set([
    'minecraft:oak_log',
    'minecraft:birch_log',
    'minecraft:spruce_log'
  ]),
  
  // Logs that can be stripped with axes
  STRIPPABLE_LOGS: new Set([
    'minecraft:oak_log',
    'minecraft:birch_log',
    'minecraft:spruce_log'
  ]),
  
  // Tool types
  AXES: new Set([
    'minecraft:wooden_axe',
    'minecraft:stone_axe',
    'minecraft:iron_axe',
    'minecraft:golden_axe',
    'minecraft:diamond_axe',
    'minecraft:netherite_axe' // Added missing netherite axe
  ]),
  
  SHOVELS: new Set([
    'minecraft:wooden_shovel',
    'minecraft:stone_shovel',
    'minecraft:iron_shovel',
    'minecraft:golden_shovel',
    'minecraft:diamond_shovel',
    'minecraft:netherite_shovel' // Added missing netherite shovel
  ]),
  
  // Blocks that can be turned into paths
  PATHABLE_BLOCKS: new Set([
    'minecraft:dirt',
    'minecraft:grass_block'
  ]),
  
  // Items for growth
  BONEMEAL: new Set([
    'minecraft:bone_meal'
  ])
});

/**
 * Prevents placing certain blocks on ceilings
 * @param {BeforeItemUseOnEvent} event - The interaction event
 */
function preventCeilingPlacement(event) {
  const { itemStack, blockFace } = event;
  
  // Early exit if condition not met
  if (!itemStack || !BLOCK_CONFIGS.CEILING_RESTRICTED.has(itemStack.typeId)) {
    return;
  }
  
  // Cancel if trying to place on ceiling
  if (blockFace === Direction.Down) {
    event.cancel = true;
  }
}

/**
 * Prevents stripping logs with axes
 * @param {BeforeItemUseOnEvent} event - The interaction event
 */
function preventLogStripping(event) {
  const { itemStack, block } = event;
  
  // Early exit if either condition not met
  if (!itemStack || !block) {
    return;
  }
  
  if (BLOCK_CONFIGS.AXES.has(itemStack.typeId) && 
      BLOCK_CONFIGS.STRIPPABLE_LOGS.has(block.typeId)) {
    event.cancel = true;
  }
}

/**
 * Prevents creating dirt paths unless there's a block above
 * @param {BeforeItemUseOnEvent} event - The interaction event
 */
function preventPathCreation(event) {
  const { itemStack, block } = event;
  
  // Early exit if conditions not met
  if (!itemStack || !block) {
    return;
  }
  
  if (BLOCK_CONFIGS.SHOVELS.has(itemStack.typeId) && 
      BLOCK_CONFIGS.PATHABLE_BLOCKS.has(block.typeId)) {
    
    try {
      const blockAbove = block.above();
      // Allow path creation only if there's a non-air block above
      if (!blockAbove || blockAbove.isAir) {
        event.cancel = true;
      }
    } catch (error) {
      // Log error but don't crash
      console.warn(`Error checking block above: ${error.message}`);
      // Default to preventing path creation on error
      event.cancel = true;
    }
  }
}

/**
 * Prevents using bonemeal on short grass and ferns
 * @param {BeforeItemUseOnEvent} event - The interaction event
 */
function preventBonemealOnShortGrass(event) {
  const { itemStack, block } = event;
  
  // Early exit if conditions not met
  if (!itemStack || !block) {
    return;
  }
  
  if (BLOCK_CONFIGS.BONEMEAL.has(itemStack.typeId) && 
      (block.typeId === 'minecraft:short_grass' || block.typeId === 'minecraft:fern')) {
    event.cancel = true;
  }
}

/**
 * Calculates facing direction based on player's view vector
 * @param {Vector3} viewVector - Player's view direction vector
 * @returns {number} Direction value (0-3)
 */
function calculateFacingDirection(viewVector) {
  // Compare absolute values to determine primary direction
  if (Math.abs(viewVector.x) > Math.abs(viewVector.z)) {
    return viewVector.x > 0 ? 0 : 1; // East (0) or West (1)
  }
  return viewVector.z > 0 ? 2 : 3; // South (2) or North (3)
}

/**
 * Prevents waterlogging of placed blocks
 * @param {AfterEvents.PlayerPlaceBlockEvent} event - The block placement event
 */
function preventWaterlogging(event) {
  const { block } = event;
  
  if (!block) return;
  
  try {
    // Check if the block property exists before accessing
    if (typeof block.isWaterlogged === 'boolean' && block.isWaterlogged) {
      block.setWaterlogged(false);
    }
  } catch (error) {
    console.warn(`Failed to prevent waterlogging: ${error.message}`);
  }
}

/**
 * Handles various block placement rules
 * @param {AfterEvents.PlayerPlaceBlockEvent} event - The block placement event
 */
function handleBlockPlacement(event) {
  const { block, player } = event;
  
  if (!block || !player) return;

  // First handle waterlogging prevention
  preventWaterlogging(event);

  // Handle slabs placement
  if (BLOCK_CONFIGS.BOTTOM_ONLY_SLABS.has(block.typeId)) {
    try {
      const permutation = BlockPermutation.resolve(block.typeId, { 
        'minecraft:vertical_half': 'bottom' 
      });
      block.setPermutation(permutation);
    } catch (error) {
      console.warn(`Failed to set slab orientation: ${error.message}`);
    }
  }

  // Handle stairs placement
  if (BLOCK_CONFIGS.BOTTOM_ONLY_STAIRS.has(block.typeId)) {
    try {
      const viewVector = player.getViewDirection();
      const newDirection = calculateFacingDirection(viewVector);
      
      // Use a timeout to ensure the block is fully placed
      system.runTimeout(() => {
        try {
          const permutation = BlockPermutation.resolve(block.typeId, {
            'upside_down_bit': false,
            'weirdo_direction': newDirection
          });
          block.setPermutation(permutation);
        } catch (error) {
          console.warn(`Failed to set stairs orientation: ${error.message}`);
        }
      }, 1);
    } catch (error) {
      console.warn(`Failed to calculate stairs direction: ${error.message}`);
    }
  }

  // Handle log placement
  if (BLOCK_CONFIGS.VERTICAL_ONLY_LOGS.has(block.typeId)) {
    try {
      const permutation = BlockPermutation.resolve(block.typeId, { 
        'pillar_axis': 'y' 
      });
      block.setPermutation(permutation);
    } catch (error) {
      console.warn(`Failed to set log orientation: ${error.message}`);
    }
  }
}

/**
 * Main initialization function that registers all event handlers
 */
function initializeBuildingBehaviors() {
  try {
    // Register before-events
    world.beforeEvents.playerInteractWithBlock.subscribe(preventCeilingPlacement);
    world.beforeEvents.playerInteractWithBlock.subscribe(preventLogStripping);
    world.beforeEvents.playerInteractWithBlock.subscribe(preventPathCreation);
    world.beforeEvents.playerInteractWithBlock.subscribe(preventBonemealOnShortGrass);
    
    // Register after-events
    world.afterEvents.playerPlaceBlock.subscribe(handleBlockPlacement);
    
    console.info('Building behavior managers initialized successfully');
  } catch (error) {
    console.error(`Failed to initialize building behaviors: ${error.message}`);
  }
}

// Initialize the module
initializeBuildingBehaviors();

// Export functions for potential testing or modular use
export {
  preventCeilingPlacement,
  preventLogStripping,
  preventPathCreation,
  preventBonemealOnShortGrass,
  handleBlockPlacement,
  BLOCK_CONFIGS
};