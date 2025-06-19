import { world, system } from "@minecraft/server";

// Dimensions of the scan cube (centered on player)
const RADIUS_XZ = 4;
const RADIUS_Y = 4;

system.runInterval(() => {
  for (const player of world.getDimension("overworld").getPlayers()) {
    const { x: px, y: py, z: pz } = player.location;

    for (let dy = -RADIUS_Y; dy <= RADIUS_Y; dy++) {
      for (let dx = -RADIUS_XZ; dx <= RADIUS_XZ; dx++) {
        for (let dz = -RADIUS_XZ; dz <= RADIUS_XZ; dz++) {
          const x = Math.floor(px + dx);
          const y = Math.floor(py + dy);
          const z = Math.floor(pz + dz);

          try {
            const block = player.dimension.getBlock({ x, y, z });
            if (block && block.typeId === "minecraft:vine") {
              block.setType("minecraft:air");
            }
          } catch {
            // silently ignore errors
          }
        }
      }
    }
  }
}, 20); // Runs every second (20 ticks)