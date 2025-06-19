import { world, system } from "@minecraft/server";

const playerStates = {};

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    try {
      const pos = player.location;
      const block = player.dimension.getBlock({
        x: Math.floor(pos.x),
        y: Math.floor(pos.y + 1.8),
        z: Math.floor(pos.z)
      });

      const blockId = block?.typeId ?? "";
      const inWater = blockId.includes("water");
      const wasInWater = playerStates[player.name] ?? false;

      // Water breathing logic
      if (blockId !== "minecraft:air") {
        player.removeEffect("minecraft:water_breathing");
      } else {
        player.addEffect("minecraft:water_breathing", 10, {
          amplifier: 0,
          showParticles: false
        });
      }

      // Show or clear actionbar
      if (inWater) {
        player.onScreenDisplay.setActionBar("test");
        playerStates[player.name] = true;
      } else if (wasInWater) {
        player.onScreenDisplay.setActionBar(""); // Clear message
        playerStates[player.name] = false;
      }
    } catch (e) {
      console.warn(`ActionBar script error for ${player.name}:`, e);
    }
  }
}, 5); // Every 0.25s