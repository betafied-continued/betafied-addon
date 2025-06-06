import { world } from "@minecraft/server";

const givenResist = new Set(); // Tracks who already received resistance
const RESIST_DURATION = 10; // in seconds
const RESIST_AMPLIFIER = 20; // Very high = near-invulnerability

world.afterEvents.playerDimensionChange.subscribe((event) => {
  const player = event.player;

  if (event.toDimension.id !== "minecraft:nether") return;
  if (givenResist.has(player.id)) return;

  player.addEffect("resistance", RESIST_DURATION * 20, {
    amplifier: RESIST_AMPLIFIER,
    showParticles: false
  });

  givenResist.add(player.id);
});