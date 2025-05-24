import { world, ItemStack } from "@minecraft/server";

// Function to spawn an item at a specified location
function spawnOreItem(dimension, itemType, amount, location) {
    const itemEntity = dimension.spawnItem(new ItemStack(itemType, amount), location);
    itemEntity.clearVelocity(); // Prevent the item from moving
}

// Store the location of the recently broken dead bush
let recentDeadBushLocation = null;
let suppressStickDrop = false;

// Subscribe to player break block events
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { block, player } = event;
    const blockType = block.typeId;

    // Check if the broken block is a dead bush
    if (blockType === "minecraft:deadbush") {
        suppressStickDrop = true; // Flag to suppress stick drops
        recentDeadBushLocation = block.location; // Store the exact location
        // Optional: Log for debugging
        console.warn(`Broke deadbush at ${block.x}, ${block.y}, ${block.z}`);
        
        // Reset the flag and location after a short delay
        setTimeout(() => {
            suppressStickDrop = false;
            recentDeadBushLocation = null;
        }, 100); // 100ms delay to cover the drop timing
    }

    // Existing debug logging for ore blocks
    if (
        blockType === "minecraft:iron_ore" ||
        blockType === "minecraft:gold_ore"
    ) {
        console.warn(`Broke ${blockType} at ${block.x}, ${block.y}, ${block.z}`);
    }
});

// Subscribe to entity spawn events
world.afterEvents.entitySpawn.subscribe((event) => {
    const { entity } = event;
    // Check if the entity is an item
    if (entity.typeId === "minecraft:item") {
        const itemComponent = entity.getComponent("minecraft:item");
        if (itemComponent && itemComponent.itemStack) {
            const itemTypeId = itemComponent.itemStack.typeId;
            const dimension = entity.dimension;
            const location = entity.location;

            // Check if the item is a stick and suppressStickDrop is true
            if (itemTypeId === "minecraft:stick" && suppressStickDrop && recentDeadBushLocation) {
                // Calculate distance between stick spawn and dead bush location
                const dx = Math.abs(location.x - recentDeadBushLocation.x);
                const dy = Math.abs(location.y - recentDeadBushLocation.y);
                const dz = Math.abs(location.z - recentDeadBushLocation.z);

                // Check if the stick is within a 2-block radius
                if (dx <= 2 && dy <= 2 && dz <= 2) {
                    entity.remove(); // Remove the stick drop
                    return; // Exit to avoid further processing
                }
            }

            // Existing logic for raw iron or raw gold
            if (itemTypeId === "minecraft:raw_iron") {
                entity.remove();
                spawnOreItem(dimension, "minecraft:iron_ore", 1, location);
            } else if (itemTypeId === "minecraft:raw_gold") {
                entity.remove();
                spawnOreItem(dimension, "minecraft:gold_ore", 1, location);
            }
        }
    }
});