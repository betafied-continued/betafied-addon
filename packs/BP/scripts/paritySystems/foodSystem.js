/**
 * Beta 1.7.3 Food System Emulator for Minecraft Bedrock
 * 
 * This script emulates the classic food mechanics from Minecraft Beta 1.7.3,
 * where food items directly restored health instead of using a hunger system.
 * 
 * Compatible with Minecraft Bedrock Script API @minecraft/server v2.0.0-beta
 * Module target: ES2023
 */

import { world, system, ItemStack } from "@minecraft/server";

// Constants and configuration
const FOOD_ITEMS = Object.freeze({
  "minecraft:apple": { health: 4 },
  "minecraft:bread": { health: 5 },
  "minecraft:cookie": { health: 1 },
  "minecraft:fish": { health: 2 },
  "minecraft:cooked_fish": { health: 5 },
  "minecraft:golden_apple": { health: 42 },
  "minecraft:mushroom_stew": { health: 10, returnContainer: "minecraft:bowl" },
  "minecraft:porkchop": { health: 3 },
  "minecraft:cooked_porkchop": { health: 8 }
});

const CAKE_CONFIG = {
  blockId: "minecraft:cake",
  healthRestore: 3,
  maxBites: 6,
  stateProperty: "bite_counter"
};

/**
 * Formats item ID into a readable display name
 * @param {string} typeId - The Minecraft item ID
 * @returns {string} Formatted display name
 */
const formatItemName = (typeId) => {
  const namePart = typeId.split(":")?.[1];
  return namePart ? namePart.replace(/_/g, " ") : "unknown item";
};

/**
 * FoodSystem class to handle food-related gameplay mechanics
 */
class FoodSystem {
  constructor() {
    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Registers all necessary event handlers
   */
  registerEventHandlers() {
    world.beforeEvents.itemUse.subscribe(this.handleFoodConsumption.bind(this));
    world.beforeEvents.playerInteractWithBlock.subscribe(this.handleCakeInteraction.bind(this));
  }

  /**
   * Handles food item consumption events
   * @param {ItemUseBeforeEvent} event - The item use event
   */
  handleFoodConsumption(event) {
    const { source: player, itemStack } = event;
    
    // Early return if conditions not met
    if (!player || !itemStack || !FOOD_ITEMS[itemStack.typeId]) {
      return;
    }

    // Cancel vanilla handling
    event.cancel = true;

    // Process in next tick to avoid race conditions
    system.run(() => {
      try {
        if (player.typeId !== "minecraft:player") return;

        const inventory = player.getComponent("minecraft:inventory")?.container;
        const healthComponent = player.getComponent("minecraft:health");
        
        if (!inventory || !healthComponent) {
          console.warn("Required player components missing");
          return;
        }

        const selectedSlot = player.selectedSlotIndex;
        const slotItem = inventory.getItem(selectedSlot);

        // Verify the selected item still matches
        if (!slotItem || slotItem.typeId !== itemStack.typeId) {
          console.warn(`Item mismatch in selected slot: expected ${itemStack.typeId}`);
          return;
        }

        this.consumeFoodItem(player, inventory, healthComponent, itemStack, selectedSlot);
      } catch (error) {
        console.warn(`Food consumption error: ${error.message}`);
      }
    });
  }

  /**
   * Processes the food item consumption and health restoration
   * @param {Player} player - The player consuming the food
   * @param {Container} inventory - The player's inventory
   * @param {EntityHealthComponent} healthComponent - The player's health component
   * @param {ItemStack} item - The food item being consumed
   * @param {number} slot - The inventory slot index
   */
  consumeFoodItem(player, inventory, healthComponent, item, slot) {
    const foodData = FOOD_ITEMS[item.typeId];
    
    // Restore health
    const currentHealth = healthComponent.currentValue;
    const maxHealth = healthComponent.defaultValue;
    const newHealth = Math.min(currentHealth + foodData.health, maxHealth);
    
    if (newHealth > currentHealth) {
      healthComponent.setCurrentValue(newHealth);
    }

    // Handle inventory updates
    const newAmount = item.amount - 1;
    
    // Remove the consumed item
    inventory.setItem(slot, newAmount > 0 
      ? new ItemStack(item.typeId, newAmount) 
      : undefined);
    
    // Handle special cases like returning containers
    if (foodData.returnContainer && newAmount <= 0) {
      this.tryAddItemToInventory(inventory, new ItemStack(foodData.returnContainer, 1));
    } else if (foodData.returnContainer && !inventory.isFull()) {
      this.tryAddItemToInventory(inventory, new ItemStack(foodData.returnContainer, 1));
    }
  }

  /**
   * Handles cake block interaction events
   * @param {PlayerInteractWithBlockBeforeEvent} event - The block interaction event
   */
  handleCakeInteraction(event) {
    const { player, block } = event;
    
    // Early return if not a cake block
    if (!block || block.typeId !== CAKE_CONFIG.blockId) {
      return;
    }

    // Cancel vanilla handling
    event.cancel = true;

    // Process in next tick to avoid race conditions
    system.run(() => {
      try {
        if (player.typeId !== "minecraft:player") return;

        const healthComponent = player.getComponent("minecraft:health");
        if (!healthComponent) {
          console.warn("Player health component missing");
          return;
        }

        // Restore health from cake
        const currentHealth = healthComponent.currentValue;
        const maxHealth = healthComponent.defaultValue;
        const newHealth = Math.min(currentHealth + CAKE_CONFIG.healthRestore, maxHealth);

        if (newHealth > currentHealth) {
          healthComponent.setCurrentValue(newHealth);
          player.playSound("random.burp", { volume: 0.5, pitch: 1.0 });
        }

        // Update cake state
        const currentBites = block.permutation.getState(CAKE_CONFIG.stateProperty) ?? 0;
        const newBites = currentBites + 1;

        if (newBites < CAKE_CONFIG.maxBites) {
          // Update cake with more bites taken
          block.setPermutation(
            block.permutation.withState(CAKE_CONFIG.stateProperty, newBites)
          );
        } else {
          // Remove cake if max bites reached
          system.runTimeout(() => {
            block.dimension.setBlockType(block.location, "minecraft:air");
          }, 1); // Slight delay to avoid potential race conditions
        }
      } catch (error) {
        console.warn(`Cake interaction error: ${error.message}`);
      }
    });
  }

  /**
   * Safely attempts to add an item to the inventory
   * @param {Container} inventory - The player's inventory
   * @param {ItemStack} itemStack - The item to add
   * @returns {boolean} Whether the item was successfully added
   */
  tryAddItemToInventory(inventory, itemStack) {
    try {
      if (!inventory.isFull()) {
        return inventory.addItem(itemStack);
      }
      return false;
    } catch (error) {
      console.warn(`Failed to add item to inventory: ${error.message}`);
      return false;
    }
  }
}

// Initialize the food system
const betaFoodSystem = new FoodSystem();

// Export the system for potential reuse in other scripts
export default betaFoodSystem;