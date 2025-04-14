import { world, system, ItemStack } from "@minecraft/server";

// Constants for food items and their health restoration values
const FOOD_ITEMS = Object.freeze({
    "minecraft:cookie": { health: 1 },
    "minecraft:porkchop": { health: 3 },
    "minecraft:cooked_fish": { health: 5 },
    "minecraft:bread": { health: 5 },
    "minecraft:cooked_porkchop": { health: 8 },
    "minecraft:mushroom_stew": { health: 10 },
    "minecraft:golden_apple": { health: 42 }
});

const CAKE_BLOCK_ID = "minecraft:cake";
const CAKE_HEALTH_RESTORE = 3;
const MAX_CAKE_BITES = 6;

// Utility function to format item names for display
const formatItemName = (typeId) => 
    typeId.split(":")[1]?.replace(/_/g, " ") || "unknown item";

// Utility function to get inventory slot for an item (fallback if needed)
const findInventorySlot = (inventory, itemTypeId) => {
    for (let i = 0; i < inventory.size; i++) {
        const slotItem = inventory.getItem(i);
        if (slotItem?.typeId === itemTypeId) return i;
    }
    return -1;
};

// Handle food consumption
const handleFoodConsumption = (event) => {
    const { source: player, itemStack: item } = event;
    
    if (!item || !FOOD_ITEMS[item.typeId] || item.typeId === CAKE_BLOCK_ID) return;

    event.cancel = true;

    const inventory = player.getComponent("minecraft:inventory")?.container;
    const healthComponent = player.getComponent("minecraft:health");
    if (!inventory || !healthComponent) {
        console.warn("Player inventory or health component missing");
        return;
    }

    system.run(() => {
        try {
            if (player.typeId !== "minecraft:player") return;

            // Use selectedSlotIndex to identify the hotbar slot
            const selectedSlot = player.selectedSlotIndex;
            const slotItem = inventory.getItem(selectedSlot);

            // Verify the item in the selected slot matches the used item
            if (!slotItem || slotItem.typeId !== item.typeId) {
                console.warn(`Item ${item.typeId} not found in selected slot ${selectedSlot}`);
                // Fallback to searching inventory
                const fallbackSlot = findInventorySlot(inventory, item.typeId);
                if (fallbackSlot === -1) {
                    console.warn(`Item ${item.typeId} not found in inventory`);
                    return;
                }
                // Use fallback slot if needed
                handleItemConsumption(player, inventory, healthComponent, item, fallbackSlot);
                return;
            }

            // Handle consumption for the selected slot
            handleItemConsumption(player, inventory, healthComponent, item, selectedSlot);
        } catch (error) {
            console.warn(`Error handling food consumption: ${error.message}`);
        }
    });
};

// Helper function to handle item consumption logic
const handleItemConsumption = (player, inventory, healthComponent, item, slot) => {
    const { health: healthToRestore } = FOOD_ITEMS[item.typeId];
    const currentHealth = healthComponent.currentValue;
    const maxHealth = healthComponent.defaultValue;
    const newHealth = Math.min(currentHealth + healthToRestore, maxHealth);

    if (newHealth > currentHealth) {
        healthComponent.setCurrentValue(newHealth);
        const foodName = formatItemName(item.typeId);
    }

    // Update inventory
    if (item.typeId === "minecraft:mushroom_stew") {
        const newAmount = item.amount - 1;
        inventory.setItem(slot, newAmount > 0 
            ? new ItemStack(item.typeId, newAmount) 
            : new ItemStack("minecraft:bowl", 1));
        if (newAmount > 0 && !inventory.isFull()) {
            inventory.addItem(new ItemStack("minecraft:bowl", 1));
        }
    } else {
        const newAmount = item.amount - 1;
        inventory.setItem(slot, newAmount > 0 
            ? new ItemStack(item.typeId, newAmount) 
            : undefined);
    }
};

// Handle cake interaction (unchanged)
const handleCakeInteraction = (event) => {
    const { player, block } = event;

    if (block.typeId !== CAKE_BLOCK_ID) return;

    event.cancel = true;

    system.run(() => {
        try {
            if (player.typeId !== "minecraft:player") return;

            const healthComponent = player.getComponent("minecraft:health");
            if (!healthComponent) {
                console.warn("Player health component missing");
                return;
            }

            const currentHealth = healthComponent.currentValue;
            const maxHealth = healthComponent.defaultValue;
            const newHealth = Math.min(currentHealth + CAKE_HEALTH_RESTORE, maxHealth);

            if (newHealth > currentHealth) {
                healthComponent.setCurrentValue(newHealth);
            }

            const currentBites = block.permutation.getState("bite_counter") ?? 0;
            const newBites = currentBites + 1;

            if (newBites <= MAX_CAKE_BITES) {
                block.setPermutation(
                    block.permutation.withState("bite_counter", newBites)
                );

                if (newBites === MAX_CAKE_BITES) {
                    system.runTimeout(() => {
                        block.dimension.setBlockType(block.location, "minecraft:air");
                    }, 1);
                }
            }

            player.playSound("random.burp");
        } catch (error) {
            console.warn(`Error handling cake interaction: ${error.message}`);
        }
    });
};

// Subscribe to events
world.beforeEvents.itemUse.subscribe(handleFoodConsumption);
world.beforeEvents.playerInteractWithBlock.subscribe(handleCakeInteraction);