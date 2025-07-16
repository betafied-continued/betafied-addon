import { world, system } from "@minecraft/server";

// Track which players have fog applied
const hasFog = new Set();

// Run every 1 second
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const name = player.name;
    const dim = player.dimension.id;

    try {
      // Apply fog when in the Overworld
      if (dim === "minecraft:overworld") {
        if (!hasFog.has(name)) {
          player.runCommand(`fog @s push bt:old_water_fog beta`);
          hasFog.add(name);
        }
      } else {
        // Remove fog when not in Overworld
        if (hasFog.has(name)) {
          player.runCommand(`fog @s pop "beta"`);
          hasFog.delete(name);
        }
      }
    } catch (e) {
      console.warn(`Fog error for ${name}: ${e}`);
    }
  }
}, 20); // Run every second