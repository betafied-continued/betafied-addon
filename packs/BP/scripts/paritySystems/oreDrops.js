import { world, ItemStack } from "@minecraft/server";

// Function to spawn an item at a specified location
function spawnOreItem(dimension, itemType, amount, location) {
    const itemEntity = dimension.spawnItem(new ItemStack(itemType, amount), location);
    itemEntity.clearVelocity(); // Prevent the item from moving
}

// Store the location of the recently broken dead bush
let recentDeadBushLocation = null;
let suppressStickDrop = false;

// Handle deadbush breaking
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { block } = event;

    if (block.typeId === "minecraft:deadbush") {
        suppressStickDrop = true;
        recentDeadBushLocation = block.location;

        setTimeout(() => {
            suppressStickDrop = false;
            recentDeadBushLocation = null;
        }, 100);
    }
});

// Handle item entity spawns
world.afterEvents.entitySpawn.subscribe((event) => {
    const { entity } = event;

    if (entity.typeId === "minecraft:item") {
        const itemComponent = entity.getComponent("minecraft:item");
        if (!itemComponent) return;

        const itemTypeId = itemComponent.itemStack.typeId;
        const dimension = entity.dimension;
        const location = entity.location;
        const amount = itemComponent.itemStack.amount;

        // Remove stick from dead bush if necessary
        if (itemTypeId === "minecraft:stick" && suppressStickDrop && recentDeadBushLocation) {
            const dx = Math.abs(location.x - recentDeadBushLocation.x);
            const dy = Math.abs(location.y - recentDeadBushLocation.y);
            const dz = Math.abs(location.z - recentDeadBushLocation.z);
            if (dx <= 2 && dy <= 2 && dz <= 2) {
                entity.remove();
                return;
            }
        }

        // Replace raw iron/gold with ores
        if (itemTypeId === "minecraft:raw_iron") {
            entity.remove();
            spawnOreItem(dimension, "minecraft:iron_ore", 1, location);
        } else if (itemTypeId === "minecraft:raw_gold") {
            entity.remove();
            spawnOreItem(dimension, "minecraft:gold_ore", 1, location);
        }

        // ✅ Replace all lapis lazuli drops with blue dye
        else if (itemTypeId === "minecraft:lapis_lazuli") {
            entity.remove();
            spawnOreItem(dimension, "minecraft:blue_dye", amount, location);
        }
    }
});