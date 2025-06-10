import { world, system, ItemStack } from "@minecraft/server";

// Function to replace minecraft:bow with bh:bow in a player's inventory
function replaceBowWithCustomBow(player) {
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory.container;

    // Loop through all inventory slots
    for (let slot = 0; slot < container.size; slot++) {
        const item = container.getItem(slot);
        if (item && item.typeId === "minecraft:bow") {
            try {
                // Create a new ItemStack for bh:bow
                const newItem = new ItemStack("bh:bow", item.amount);
                
                // Copy relevant data (e.g., enchantments, if applicable)
                if (item.data) {
                    newItem.setDynamicProperty("data", item.data);
                }

                // Replace the item in the slot
                container.setItem(slot, newItem);
            } catch (error) {
                console.error(`Failed to replace bow for ${player.name}: ${error.message}`);
            }
        }
    }
}

// Subscribe to the world tick event to continuously check all players
system.runInterval(() => {
    // Iterate through all players in the world
    for (const player of world.getAllPlayers()) {
        replaceBowWithCustomBow(player);
    }
}, 20); // Runs every 20 ticks (1 second)