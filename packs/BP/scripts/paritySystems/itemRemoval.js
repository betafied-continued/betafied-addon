// Most items are uncraftable if they were not in the game before 1.7.3, so this script will remove them from players' inventories just in case.
// This script is designed to run in the background and remove any items that are not in the allowed list.

import { world, system } from "@minecraft/server";

// Configuration for allowed items and settings
const CONFIG = Object.freeze({
    ALLOWED_ITEMS: new Set([
        "minecraft:iron_shovel",
        "minecraft:iron_pickaxe",
        "minecraft:iron_axe",
        "minecraft:flint_and_steel",
        "minecraft:apple",
        "minecraft:bow",
        "minecraft:arrow",
        "minecraft:coal",
        "minecraft:diamond",
        "minecraft:iron_ingot",
        "minecraft:gold_ingot",
        "minecraft:iron_sword",
        "minecraft:wooden_sword",
        "minecraft:wooden_shovel",
        "minecraft:wooden_pickaxe",
        "minecraft:wooden_axe",
        "minecraft:stone_sword",
        "minecraft:stone_shovel",
        "minecraft:stone_pickaxe",
        "minecraft:stone_axe",
        "minecraft:diamond_sword",
        "minecraft:diamond_shovel",
        "minecraft:diamond_pickaxe",
        "minecraft:diamond_axe",
        "minecraft:stick",
        "minecraft:bowl",
        "minecraft:mushroom_stew",
        "minecraft:golden_sword",
        "minecraft:golden_shovel",
        "minecraft:golden_pickaxe",
        "minecraft:golden_axe",
        "minecraft:string",
        "minecraft:feather",
        "minecraft:gunpowder",
        "minecraft:wooden_hoe",
        "minecraft:stone_hoe",
        "minecraft:iron_hoe",
        "minecraft:diamond_hoe",
        "minecraft:golden_hoe",
        "minecraft:wheat_seeds",
        "minecraft:wheat",
        "minecraft:bread",
        "minecraft:leather_helmet",
        "minecraft:leather_chestplate",
        "minecraft:leather_leggings",
        "minecraft:leather_boots",
        "minecraft:chainmail_helmet",
        "minecraft:chainmail_chestplate",
        "minecraft:chainmail_leggings",
        "minecraft:chainmail_boots",
        "minecraft:iron_helmet",
        "minecraft:iron_chestplate",
        "minecraft:iron_leggings",
        "minecraft:iron_boots",
        "minecraft:diamond_helmet",
        "minecraft:diamond_chestplate",
        "minecraft:diamond_leggings",
        "minecraft:diamond_boots",
        "minecraft:golden_helmet",
        "minecraft:golden_chestplate",
        "minecraft:golden_leggings",
        "minecraft:golden_boots",
        "minecraft:flint",
        "minecraft:porkchop",
        "minecraft:cooked_porkchop",
        "minecraft:painting",
        "minecraft:golden_apple",
        "minecraft:sign",
        "minecraft:wooden_door",
        "minecraft:bucket",
        "minecraft:water_bucket",
        "minecraft:lava_bucket",
        "minecraft:minecart",
        "minecraft:saddle",
        "minecraft:iron_door",
        "minecraft:redstone",
        "minecraft:snowball",
        "minecraft:oak_boat",
        "minecraft:leather",
        "minecraft:milk_bucket",
        "minecraft:brick",
        "minecraft:clay_ball",
        "minecraft:sugar_cane",
        "minecraft:paper",
        "minecraft:book",
        "minecraft:slime_ball",
        "minecraft:chest_minecart",
        "minecraft:furnace_minecart",
        "minecraft:egg",
        "minecraft:compass",
        "minecraft:fishing_rod",
        "minecraft:clock",
        "minecraft:glowstone_dust",
        "minecraft:fish",
        "minecraft:cooked_fish",
        "minecraft:dye",
        "minecraft:bone",
        "minecraft:sugar",
        "minecraft:cake",
        "minecraft:bed",
        "minecraft:repeater",
        "minecraft:cookie",
        "minecraft:map",
        "minecraft:oak_planks",
        "minecraft:oak_log",
        "minecraft:oak_leaves",
        "minecraft:shears",
        "minecraft:music_disc_13",
        "minecraft:music_disc_cat",
        "minecraft:gravel",
        "minecraft:sand",
        "minecraft:cobblestone",
        "minecraft:gold_block",
        "minecraft:iron_block",
        "minecraft:diamond_block",
        "minecraft:tnt",
        "minecraft:poppy",
        "minecraft:dandelion",
        "minecraft:stone_button",
        "minecraft:wooden_pressure_plate",
        "minecraft:stone_pressure_plate",
        "minecraft:cactus",
        "minecraft:clay",
        "minecraft:reeds",
        "minecraft:jukebox",
        "minecraft:dirt",
        "minecraft:stone",
        "minecraft:oak_sapling",
        "minecraft:gold_ore",
        "minecraft:iron_ore",
        "minecraft:coal_ore",
        "minecraft:sponge",
        "minecraft:glass",
        "minecraft:wool",
        "minecraft:dead_bush",
        "minecraft:tall_grass",
        "minecraft:fern",
        "minecraft:piston",
        "minecraft:brown_mushroom",
        "minecraft:red_mushroom",
        "minecraft:stone_slab",
        "minecraft:bricks",
        "minecraft:bookshelf",
        "minecraft:mossy_cobblestone",
        "minecraft:obsidian",
        "minecraft:torch",
        "minecraft:spawner",
        "minecraft:oak_stairs",
        "minecraft:chest",
        "minecraft:diamond_ore",
        "minecraft:crafting_table",
        "minecraft:furnace",
        "minecraft:ladder",
        "minecraft:rail",
        "minecraft:cobblestone_stairs",
        "minecraft:lever",
        "minecraft:redstone_ore",
        "minecraft:redstone_torch",
        "minecraft:snow",
        "minecraft:ice",
        "minecraft:snow_block",
        "minecraft:oak_fence",
        "minecraft:pumpkin",
        "minecraft:netherrack",
        "minecraft:soul_sand",
        "minecraft:glowstone",
        "minecraft:jack_o_lantern",
        "minecraft:locked_chest",
        "minecraft:trapdoor"
    ]),
    CHECK_INTERVAL_TICKS: 20, // Check every 1 second (20 ticks)
    MESSAGE_COOLDOWN_TICKS: 60, // Prevent spam by limiting messages (3 seconds)
    CLEAR_MESSAGE: "Whoops! That's not allowed!",
});

// Player state to track message cooldowns
const playerMessageCooldowns = new Map();

/**
 * Checks and clears invalid items from a player's inventory.
 * @param {import("@minecraft/server").Player} player - The player to check.
 */
function checkAndClearInvalidItems(player) {
    try {
        const inventoryComponent = player.getComponent("minecraft:inventory");
        if (!inventoryComponent?.container) {
            console.warn(`No inventory component for player '${player.name}'`);
            return;
        }

        const { container } = inventoryComponent;
        let removedItems = false;

        // Iterate through inventory slots
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot);
            if (item && !CONFIG.ALLOWED_ITEMS.has(item.typeId)) {
                container.setItem(slot, undefined); // Clear invalid item
                removedItems = true;
            }
        }

        // Notify player if items were removed, respecting cooldown
        if (removedItems) {
            const currentTick = system.currentTick;
            const lastMessageTick = playerMessageCooldowns.get(player.id) ?? 0;

            if (currentTick - lastMessageTick >= CONFIG.MESSAGE_COOLDOWN_TICKS) {
                player.sendMessage(CONFIG.CLEAR_MESSAGE);
                playerMessageCooldowns.set(player.id, currentTick);
            }
        }
    } catch (error) {
        console.warn(`Error checking inventory for '${player.name}': ${error.message}`);
    }
}

/**
 * Main loop to check all players' inventories.
 */
function startInventoryCheckLoop() {
    system.runInterval(() => {
        try {
            for (const player of world.getPlayers()) {
                checkAndClearInvalidItems(player);
            }
        } catch (error) {
            console.error("Error in inventory check loop:", error);
        }
    }, CONFIG.CHECK_INTERVAL_TICKS);
}

/**
 * Cleans up player state on leave.
 */
function setupPlayerCleanup() {
    world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        playerMessageCooldowns.delete(playerId);
    });
}

// Initialize the script
try {
    startInventoryCheckLoop();
    setupPlayerCleanup();
    console.log("Beta 1.7.3 item restriction script initialized.");
} catch (error) {
    console.error("Failed to initialize item restriction script:", error);
}