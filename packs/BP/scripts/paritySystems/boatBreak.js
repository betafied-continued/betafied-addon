import { world, system, ItemStack } from "@minecraft/server";

// === Utility vector functions ===
function normalize(vector) {
  const mag = Math.sqrt(vector.x ** 2 + vector.z ** 2);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: vector.x / mag, y: 0, z: vector.z / mag };
}

function multiply(vector, scalar) {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar
  };
}

// === Block whitelist ===
const NON_SOLID_WHITELIST = ["minecraft:air", "minecraft:water", "minecraft:soul_sand"];

function isSolidBlock(block) {
  const id = block?.typeId;
  return id && !NON_SOLID_WHITELIST.includes(id);
}

function breakBoatWithParts(boat) {
  const loc = boat.location;
  const dim = boat.dimension;
  boat.kill();
  for (let i = 0; i < 3; i++) dim.spawnItem(new ItemStack("minecraft:oak_planks", 1), loc);
  for (let i = 0; i < 2; i++) dim.spawnItem(new ItemStack("minecraft:stick", 1), loc);
}

function breakBoatWithItem(boat) {
  const loc = boat.location;
  const dim = boat.dimension;
  boat.kill();
  dim.spawnItem(new ItemStack("minecraft:oak_boat", 1), loc);
}

// === Collision detection ===
system.runInterval(() => {
  const overworld = world.getDimension("overworld");

  for (const boat of overworld.getEntities({ type: "minecraft:boat" })) {
    const loc = boat.location;
    const x = Math.floor(loc.x);
    const y = Math.floor(loc.y);
    const z = Math.floor(loc.z);

    const offsets = [
      { x: x + 1, z }, { x: x - 1, z },
      { x, z: z + 1 }, { x, z: z - 1 }
    ];

    for (const offset of offsets) {
      const block = overworld.getBlock({ x: offset.x, y, z: offset.z });
      if (isSolidBlock(block)) {
        breakBoatWithParts(boat);
        break;
      }
    }
  }
}, 5);

// === Player punch = return boat item ===
world.afterEvents.entityHitEntity.subscribe(event => {
  const { damagingEntity, hitEntity } = event;
  if (
    damagingEntity.typeId === "minecraft:player" &&
    hitEntity.typeId === "minecraft:boat"
  ) {
    breakBoatWithItem(hitEntity);
  }
});

// === Particle trail every 0.8s only when in water and moving ===
system.runInterval(() => {
  const overworld = world.getDimension("overworld");

  for (const boat of overworld.getEntities({ type: "minecraft:boat" })) {
    const vel = boat.getVelocity?.();
    if (!vel || (Math.abs(vel.x) < 0.01 && Math.abs(vel.z) < 0.01)) continue;

    const boatPos = boat.location;
    const blockBelow = overworld.getBlock({
      x: Math.floor(boatPos.x),
      y: Math.floor(boatPos.y - 0.3), // check 0.3 below the boat
      z: Math.floor(boatPos.z)
    });

    if (!blockBelow || blockBelow.typeId !== "minecraft:water") continue;

    const dir = normalize({ x: vel.x, y: 0, z: vel.z });
    const offset = multiply(dir, -1); // behind the boat

    const bubblePos = {
      x: boatPos.x + offset.x,
      y: boatPos.y + 0.1,
      z: boatPos.z + offset.z
    };

    boat.dimension.spawnParticle("minecraft:basic_bubble_particle_gradual", bubblePos);
  }
}, 8); // 0.8s (16 ticks)