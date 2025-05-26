// This entire script serves as a backup in the event that the entity spawn rules are not working as intended.
// It is designed to remove any entities that are not in the allowed list.

import { world, system } from "@minecraft/server";

// Set of allowed mob type IDs for O(1) lookup efficiency
const ALLOWED_MOBS = new Set([
    "minecraft:fireball",
    "minecraft:item",
    "minecraft:minecart",
    "minecraft:chest_minecart",
    "minecraft:painting",
    "minecraft:boat",
    "minecraft:falling_block",
    "minecraft:arrow",
    "minecraft:chicken",
    "minecraft:cow",
    "minecraft:creeper",
    "minecraft:ghast",
    "minecraft:pig",
    "minecraft:player",
    "minecraft:sheep",
    "minecraft:skeleton",
    "minecraft:slime",
    "minecraft:spider",
    "minecraft:squid",
    "minecraft:wolf",
    "minecraft:zombie",
    "minecraft:zombie_pigman",
    "minecraft:snowball",
    "minecraft:egg",
    "minecraft:fishing_hook"
]);

/**
 * Checks all entities in the world and removes those not in the allowed list.
 */
function removeDisallowedEntities() {
    try {
        // Iterate through all entities in the overworld (or other dimensions if needed)
        for (const entity of world.getDimension("overworld").getEntities()) {
            // Skip processing if entity is undefined or lacks typeId
            if (!entity || typeof entity.typeId !== "string") {
                console.warn("Invalid entity detected:", entity);
                continue;
            }

            // Remove entity if its typeId is not in the allowed set
            if (!ALLOWED_MOBS.has(entity.typeId)) {
                try {
                    entity.remove();
                } catch (removeError) {
                    console.error(`Failed to remove entity ${entity.typeId}:`, removeError);
                }
            }
        }
    } catch (error) {
        console.error("Error in removeDisallowedEntities:", error);
    }
}

// Run the check periodically using system.runInterval
try {
    system.runInterval(() => {
        removeDisallowedEntities();
    }, 20); // Run every 20 ticks (1 second)
} catch (subscriptionError) {
    console.error("Failed to set up interval for entity cleanup:", subscriptionError);
}