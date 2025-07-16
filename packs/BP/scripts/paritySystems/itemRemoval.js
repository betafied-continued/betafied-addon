import { world, system } from "@minecraft/server";

const CONFIG = Object.freeze({
  CHECK_INTERVAL_TICKS: 20,
  MESSAGE_COOLDOWN_TICKS: 60,
  CLEAR_MESSAGE: "Whoops! That's not allowed!",
});

class ItemRestrictionSystem {
  constructor() {
    this.allowedItems = this.buildAllowedItemsSet();
    this.playerMessageCooldowns = new Map();
    this.initialize();
  }

  initialize() {
    system.runInterval(() => this.checkAllPlayers(), CONFIG.CHECK_INTERVAL_TICKS);
    world.afterEvents.playerLeave.subscribe((event) => {
      this.playerMessageCooldowns.delete(event.playerId);
    });
    console.log("[ITEMS] Restriction system running (manual /tag exemption)");
  }

  buildAllowedItemsSet() {
    return new Set([
      "minecraft:iron_shovel", "minecraft:iron_pickaxe", "minecraft:iron_axe",
      "minecraft:flint_and_steel", "minecraft:wooden_sword", "minecraft:wooden_shovel",
      "minecraft:wooden_pickaxe", "minecraft:wooden_axe", "minecraft:stone_sword",
      "minecraft:stone_shovel", "minecraft:stone_pickaxe", "minecraft:stone_axe",
      "minecraft:diamond_sword", "minecraft:diamond_shovel", "minecraft:diamond_pickaxe",
      "minecraft:diamond_axe", "minecraft:golden_sword", "minecraft:golden_shovel",
      "minecraft:golden_pickaxe", "minecraft:golden_axe", "minecraft:wooden_hoe",
      "minecraft:stone_hoe", "minecraft:iron_hoe", "minecraft:diamond_hoe",
      "minecraft:golden_hoe", "minecraft:fishing_rod", "minecraft:shears", "minecraft:iron_sword", "minecraft:charcoal",
      
      // Weapons & Combat
      "minecraft:bow", "minecraft:arrow", "minecraft:leather_helmet",
      "minecraft:leather_chestplate", "minecraft:leather_leggings", "minecraft:leather_boots",
      "minecraft:chainmail_helmet", "minecraft:chainmail_chestplate", "minecraft:chainmail_leggings",
      "minecraft:chainmail_boots", "minecraft:iron_helmet", "minecraft:iron_chestplate",
      "minecraft:iron_leggings", "minecraft:iron_boots", "minecraft:diamond_helmet",
      "minecraft:diamond_chestplate", "minecraft:diamond_leggings", "minecraft:diamond_boots",
      "minecraft:golden_helmet", "minecraft:golden_chestplate", "minecraft:golden_leggings",
      "minecraft:golden_boots", "bh:bow",
      
      // Food
      "minecraft:apple", "minecraft:mushroom_stew", "minecraft:bread",
      "minecraft:porkchop", "minecraft:cooked_porkchop", "minecraft:golden_apple",
      "minecraft:fish", "minecraft:cooked_fish", "minecraft:cod", "minecraft:cooked_cod",
      "minecraft:cookie", "minecraft:cake", 
      
      // Resources & Materials
      "minecraft:coal", "minecraft:diamond", "minecraft:iron_ingot", "minecraft:gold_ingot",
      "minecraft:stick", "minecraft:bowl", "minecraft:string", "minecraft:feather",
      "minecraft:gunpowder", "minecraft:wheat_seeds", "minecraft:wheat", "minecraft:flint",
      "minecraft:leather", "minecraft:brick", "minecraft:clay_ball", "minecraft:sugar_cane",
      "minecraft:paper", "minecraft:book", "minecraft:slime_ball", "minecraft:egg",
      "minecraft:glowstone_dust", "minecraft:bone", "minecraft:sugar",
      "minecraft:lapis_lazuli", "minecraft:redstone", "minecraft:dye",
      "minecraft:ink_sac", "minecraft:red_dye", "minecraft:green_dye",
      "minecraft:cocoa_beans", "minecraft:purple_dye", "minecraft:cyan_dye",
      "minecraft:light_gray_dye", "minecraft:gray_dye", "minecraft:pink_dye",
      "minecraft:lime_dye", "minecraft:yellow_dye", "minecraft:light_blue_dye",
      "minecraft:magenta_dye","minecraft:orange_dye", "minecraft:bone_meal",
      
      // Blocks - Natural
      "minecraft:stone", "minecraft:grass_block", "minecraft:dirt",
      "minecraft:oak_log", "minecraft:birch_log", "minecraft:spruce_log",
      "minecraft:oak_leaves", "minecraft:spruce_leaves", "minecraft:birch_leaves",
      "minecraft:oak_sapling", "minecraft:spruce_sapling", "minecraft:birch_sapling", 
      "minecraft:sand", "minecraft:gravel",
      "minecraft:gold_ore", "minecraft:iron_ore", "minecraft:coal_ore", "minecraft:diamond_ore",
      "minecraft:redstone_ore", "minecraft:lapis_ore",
      "minecraft:glass", "minecraft:sandstone",
      "minecraft:cactus", "minecraft:clay", "minecraft:reeds", "minecraft:pumpkin",
      "minecraft:snow", "minecraft:ice", "minecraft:snow_layer",
      "minecraft:netherrack", "minecraft:soul_sand", "minecraft:glowstone",
      
      // Blocks - Crafted
      "minecraft:oak_planks", "minecraft:cobblestone", "minecraft:bricks", "minecraft:brick_block",
      "minecraft:bookshelf", "minecraft:mossy_cobblestone", "minecraft:obsidian",
      "minecraft:gold_block", "minecraft:iron_block", "minecraft:diamond_block",
      "minecraft:tnt", "minecraft:lapis_block", "minecraft:sponge",
      
      // Functional Blocks
      "minecraft:furnace", "minecraft:crafting_table", "bh:crafting_table", 
      "minecraft:chest", "minecraft:jukebox", "minecraft:dispenser", "minecraft:spawner",
      "minecraft:locked_chest", //what
      
      // Decorative & Misc
      "minecraft:torch", "minecraft:ladder", "minecraft:sign", "minecraft:wooden_door",
      "minecraft:iron_door", "minecraft:white_wool", "minecraft:orange_wool",
      "minecraft:magenta_wool", "minecraft:light_blue_wool", "minecraft:yellow_wool",
      "minecraft:lime_wool", "minecraft:pink_wool", "minecraft:gray_wool",
      "minecraft:light_gray_wool", "minecraft:cyan_wool", "minecraft:purple_wool",
      "minecraft:blue_wool", "minecraft:brown_wool", "minecraft:green_wool",
      "minecraft:red_wool", "minecraft:black_wool", "minecraft:oak_fence",
      "minecraft:trapdoor", "minecraft:stone_button", "minecraft:wooden_pressure_plate",
      "minecraft:stone_pressure_plate", "minecraft:lever", "minecraft:stone_slab",
      "minecraft:oak_stairs", "minecraft:oak_slab", "minecraft:stone_stairs",
      "minecraft:cobblestone_slab", "minecraft:web", "minecraft:smooth_stone_slab",
      "minecraft:sandstone_slab", "minecraft:oak_sign",
      
      // Redstone
      "minecraft:redstone_torch", "minecraft:rail", "minecraft:golden_rail", "minecraft:detector_rail", "minecraft:repeater",
      "minecraft:piston", "minecraft:sticky_piston", "minecraft:noteblock",
      
      // Plants & Flora
      "minecraft:poppy", "minecraft:dandelion", "minecraft:deadbush",
      "minecraft:tall_grass", "minecraft:fern", "minecraft:brown_mushroom", 
      "minecraft:red_mushroom",
      
      // Vehicles & Special
      "minecraft:oak_boat", "minecraft:minecart", "minecraft:chest_minecart",
      "minecraft:furnace_minecart", "minecraft:saddle", "minecraft:bucket",
      "minecraft:water_bucket", "minecraft:lava_bucket", "minecraft:milk_bucket",
      "minecraft:snowball", "minecraft:filled_map", "minecraft:empty_map", "minecraft:compass", "minecraft:clock",
      "minecraft:bed", "minecraft:painting", "minecraft:barrier", "minecraft:blue_dye",
      
      // Special Blocks
      "minecraft:carved_pumpkin", "minecraft:lit_pumpkin", "minecraft:jack_o_lantern", "minecraft:bedrock", 
      
      // Mod Support
      "hrb:herobrine_settings", "hrb:script_openSettings",
      
      // Music Discs
      "minecraft:music_disc_13", "minecraft:music_disc_cat"
    ]);
  }

  checkAllPlayers() {
    for (const player of world.getPlayers()) {
      if (!player.hasTag("builder_exempt")) {
        this.checkPlayerInventory(player);
      }
    }
  }

  checkPlayerInventory(player) {
    try {
      const inventory = player.getComponent("minecraft:inventory")?.container;
      if (!inventory) return;

      let removed = false;
      for (let i = 0; i < inventory.size; i++) {
        const item = inventory.getItem(i);
        if (item && !this.allowedItems.has(item.typeId)) {
          inventory.setItem(i, undefined);
          removed = true;
        }
      }

      if (removed) this.notifyPlayer(player);
    } catch (e) {
      console.warn(`[ITEMS] Inventory error for ${player.name}: ${e.message}`);
    }
  }

  notifyPlayer(player) {
    const now = system.currentTick;
    const last = this.playerMessageCooldowns.get(player.id) ?? 0;

    if (now - last >= CONFIG.MESSAGE_COOLDOWN_TICKS) {
      player.sendMessage(CONFIG.CLEAR_MESSAGE);
      this.playerMessageCooldowns.set(player.id, now);
    }
  }
}

const itemRestriction = new ItemRestrictionSystem();
export default itemRestriction;