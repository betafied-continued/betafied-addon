import { world, system, BlockTypes } from "@minecraft/server";

const replaceable = new Set([
  "minecraft:air",
  "minecraft:water",
  "minecraft:bubble_column"
]);

// Retry-based column clearer
function clearBubbleColumn(dimension, x, y, z, tries = 0) {
  if (tries >= 10) return;

  system.runTimeout(() => {
    for (let dy = 0; dy < 12; dy++) {
      const block = dimension.getBlock({ x, y: y + dy, z });
      if (!block) continue;

      if (replaceable.has(block.typeId)) {
        block.setType(BlockTypes.get("minecraft:light_block_0"));
      }
    }

    clearBubbleColumn(dimension, x, y, z, tries + 1);
  }, 1);
}

// Soul sand placed → clear column above
world.afterEvents.playerPlaceBlock.subscribe(event => {
  const { block, dimension } = event;
  if (block.typeId !== "minecraft:soul_sand") return;

  const { x, y, z } = block.location;
  clearBubbleColumn(dimension, x, y + 1, z);
});

// Soul sand broken → check if soul sand below is now exposed
world.afterEvents.playerBreakBlock.subscribe(event => {
  const { block, dimension } = event;

  const below = dimension.getBlock({
    x: block.location.x,
    y: block.location.y - 1,
    z: block.location.z
  });

  if (below?.typeId === "minecraft:soul_sand") {
    clearBubbleColumn(dimension, below.location.x, below.location.y + 1, below.location.z);
  }
});