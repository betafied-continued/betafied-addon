import { world, ItemStack } from "@minecraft/server";

// Function to spawn an item at a specified location
function spawnOreItem(dimension, itemType, amount, location) {
    const itemEntity = dimension.spawnItem(new ItemStack(itemType, amount), location);
    itemEntity.clearVelocity(); // Prevent the item from moving
}

// Subscribe to entity spawn events
world.afterEvents.entitySpawn.subscribe((event) => {
    const { entity } = event;
    // Check if the entity is an item
    if (entity.typeId === "minecraft:item") {
        const itemComponent = entity.getComponent("minecraft:item");
        if (itemComponent && itemComponent.itemStack) {
            const itemTypeId = itemComponent.itemStack.typeId;
            const dimension = entity.dimension;
            const location = entity.location; // Use the exact location of the spawned entity

            // Check if the item is raw iron or raw gold
            if (itemTypeId === "minecraft:raw_iron") {
                // Remove the raw iron
                entity.remove();
                // Spawn iron ore block item
                spawnOreItem(dimension, "minecraft:iron_ore", 1, location);
            } else if (itemTypeId === "minecraft:raw_gold") {
                // Remove the raw gold
                entity.remove();
                // Spawn gold ore block item
                spawnOreItem(dimension, "minecraft:gold_ore", 1, location);
            }
        }
    }
});

// Optional: Track block breaks for debugging
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { block } = event;
    const blockType = block.typeId;

    // Log when ore blocks are broken (for debugging)
    if (
        blockType === "minecraft:iron_ore" ||
        blockType === "minecraft:gold_ore"
    ) {
        console.warn(`Broke ${blockType} at ${block.x}, ${block.y}, ${block.z}`);
    }
});