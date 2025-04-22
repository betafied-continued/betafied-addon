// This entire script serves as a backup in the event that the entity spawn rules are not working as intended.
// It is designed to remove any entities that are not in the allowed list.

import { world } from "@minecraft/server";

// Set of allowed mob type IDs for O(1) lookup efficiency
const ALLOWED_MOBS = new Set([
    "minecraft:item",
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
    "minecraft:zombie_pigman" // Zombified Piglin in Bedrock
]);

/**
 * Handles the entity spawn event and removes entities not in the allowed list.
 * @param {Object} event - The entity spawn event object from the Minecraft API.
 */
function handleEntitySpawn(event) {
    try {
        const { entity } = event;

        // Skip processing if entity is undefined or lacks typeId
        if (!entity || typeof entity.typeId !== "string") {
            console.warn("Invalid entity detected in spawn event:", event);
            return;
        }

        // Remove entity if its typeId is not in the allowed set
        if (!ALLOWED_MOBS.has(entity.typeId)) {
            entity.remove();
        }
    } catch (error) {
        console.error("Error in entity spawn handler:", error);
    }
}

// Subscribe to the entitySpawn event with error handling
try {
    world.afterEvents.entitySpawn.subscribe(handleEntitySpawn);
} catch (subscriptionError) {
    console.error("Failed to subscribe to entitySpawn event:", subscriptionError);
}