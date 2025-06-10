import { world, system } from "@minecraft/server";

// === CONFIGURATION ===
const baseRadius = 12;
const maxRadius = baseRadius * 2;
const slabThickness = 3;
const normalSlabsPerTick = 2;
const idleSlabsPerTick = 2;
const tickInterval = 7;
const idleDelay = 10 * 20; // 10 seconds
const dynamicTracking = true;
let idleDoublingEnabled = false; // GLOBAL toggle for idle doubling

// === STATE TRACKING ===
const playerStates = new Map();
const blocksToReplace = [
  "minecraft:blackstone",
  "minecraft:quartz_ore",
  "minecraft:ancient_debris",
  "minecraft:nether_gold_ore"
];
const chatDebug = new Set();

// === UTILITIES ===
function getSpiralOffsets(radius) {
  const spiral = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (dx * dx + dz * dz <= radius * radius) spiral.push({ dx, dz });
    }
  }
  return spiral;
}

function generateSlabYRanges(centerY) {
  const slabs = [];
  for (let i = 0; i < 100; i++) {
    const offset = Math.floor((i + 1) / 2) * (i % 2 === 0 ? 1 : -1);
    const startY = centerY + offset * slabThickness;
    if (startY < 5 || startY > 120) continue;
    slabs.push(startY);
  }
  return slabs;
}

// === CHAT COMMANDS ===
world.beforeEvents.chatSend.subscribe(e => {
  const msg = e.message.toLowerCase();
  const sender = e.sender;

  if (msg === "!console") {
    e.cancel = true;
    if (!sender.isOp()) {
      sender.sendMessage("§c[Error] You do not have permission to use this command.");
      return;
    }

    const isEnabled = chatDebug.has(sender.id);
    if (isEnabled) {
      chatDebug.delete(sender.id);
    } else {
      chatDebug.add(sender.id);
    }

    const status = isEnabled ? "§cDISABLED" : "§aENABLED";
    sender.sendMessage(`§8[Debug] Console output §l${status}`);
  }

  if (msg === "!afkradius") {
    e.cancel = true;
    if (!sender.isOp()) {
      sender.sendMessage("§c[Error] You do not have permission to use this command.");
      return;
    }

    idleDoublingEnabled = !idleDoublingEnabled;
    const status = idleDoublingEnabled ? "§aENABLED" : "§cDISABLED";
    sender.sendMessage(`§8[Global] AFK radius §l${status}`);
  }
});

// === MAIN LOOP ===
system.runInterval(() => {
  const nether = world.getDimension("nether");

  for (const player of nether.getPlayers()) {
    const id = player.id;
    const loc = player.location;
    const state = playerStates.get(id) ?? {
      prevX: loc.x,
      prevZ: loc.z,
      idleTicks: 0,
      countdownShown: -1,
      radius: baseRadius,
      slabIndex: 0,
      slabYs: generateSlabYRanges(Math.floor(loc.y)),
      replacedTotal: 0,
      cylinderComplete: false,
      idleThreshold: idleDelay,
      expansions: 0
    };

    const moved = (Math.abs(state.prevX - loc.x) > 0.1 || Math.abs(state.prevZ - loc.z) > 0.1);

    if (dynamicTracking && moved) {
      if (state.radius !== baseRadius) {
        state.radius = baseRadius;
        state.expansions = 0;
        state.idleThreshold = idleDelay;
        player.sendMessage("§e[Scan] Movement detected — radius reset.");
      }
      state.idleTicks = 0;
      state.countdownShown = -1;
      state.slabIndex = 0;
      state.slabYs = generateSlabYRanges(Math.floor(loc.y));
      state.cylinderComplete = false;
    } else {
      state.idleTicks++;

      const ticksLeft = state.idleThreshold - state.idleTicks;
      const secondsLeft = Math.ceil(ticksLeft / 20);
      if (
        idleDoublingEnabled &&
        ticksLeft > 0 &&
        secondsLeft !== state.countdownShown &&
        chatDebug.has(id)
      ) {
        player.sendMessage(`§7[Idle] Expanding radius in §e${secondsLeft}s`);
        state.countdownShown = secondsLeft;
      }

      if (
        idleDoublingEnabled &&
        state.idleTicks >= state.idleThreshold &&
        state.radius < maxRadius
      ) {
        state.expansions++;
        if (state.expansions === 1) {
          state.radius++;
        } else {
          state.radius += Math.floor(baseRadius / 2);
          state.idleThreshold += Math.floor(state.idleThreshold / 2);
        }

        if (state.radius > maxRadius) state.radius = maxRadius;

        state.slabIndex = 0;
        state.slabYs = generateSlabYRanges(Math.floor(loc.y));
        state.cylinderComplete = false;
        state.idleTicks = 0;
        state.countdownShown = -1;

        if (chatDebug.has(id))
          player.sendMessage(`§6[Idle] Radius expanded to §b${state.radius}§6 | Next in §b${Math.floor(state.idleThreshold / 20)}s`);
      }
    }

    let replaced = 0;
    const spiral = getSpiralOffsets(state.radius);
    const slabsPerTick = state.idleTicks >= state.idleThreshold ? idleSlabsPerTick : normalSlabsPerTick;

    for (let s = 0; s < slabsPerTick && state.slabIndex < state.slabYs.length; s++, state.slabIndex++) {
      const yStart = state.slabYs[state.slabIndex];
      for (let y = yStart; y < yStart + slabThickness; y++) {
        for (const { dx, dz } of spiral) {
          const x = Math.floor(loc.x + dx);
          const z = Math.floor(loc.z + dz);
          try {
            const block = nether.getBlock({ x, y, z });
            if (block) {
              if (block.typeId === "minecraft:magma") {
                block.setType("minecraft:soul_sand");
                replaced++;
                state.replacedTotal++;
              } else if (blocksToReplace.includes(block.typeId)) {
                block.setType("minecraft:netherrack");
                replaced++;
                state.replacedTotal++;
              }
            }
          } catch {}
        }
      }
    }

    if (replaced && chatDebug.has(id)) {
      player.sendMessage(`§7[Scan] Replaced §a${replaced} §7blocks this tick (${state.replacedTotal} total)`);
    }

    if (state.slabIndex >= state.slabYs.length) {
      if (!state.cylinderComplete) {
        state.cylinderComplete = true;
        if (chatDebug.has(id)) {
          player.sendMessage("§8[Scan] Cylinder complete — standing by...");
        }
      }
    } else {
      state.cylinderComplete = false;
    }

    state.prevX = loc.x;
    state.prevZ = loc.z;
    playerStates.set(id, state);
  }
}, tickInterval);