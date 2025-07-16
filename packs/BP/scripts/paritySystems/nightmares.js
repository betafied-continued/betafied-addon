import { world, system } from "@minecraft/server";

const directions = [
  { x: 0, z: -1 }, // south
  { x: 0, z: 1 },  // north
  { x: -1, z: 0 }, // east
  { x: 1, z: 0 }   // west
];

function getDirectionVector(facing) {
  return directions[facing] || { x: 0, z: 0 };
}

const SLEEP_START = 12541;
const SLEEP_END = 23458;

async function checkPlayerNightmare(player) {
  const commandResult = await player.runCommand("time query daytime");
  // The result comes as a string, e.g. "The time is 13000"
  const timeMatch = commandResult.statusMessage ? commandResult.statusMessage.match(/\d+/) : null;
  if (!timeMatch) return;
  const time = parseInt(timeMatch[0]);
  if (time < SLEEP_START || time > SLEEP_END) return;

  const dim = player.dimension;
  const blockPos = {
    x: Math.floor(player.location.x),
    y: Math.floor(player.location.y),
    z: Math.floor(player.location.z)
  };

  const bedBlock = dim.getBlock(blockPos);
  if (!bedBlock || !bedBlock.typeId.includes("bed")) return;

  const facing = bedBlock.permutation.getState("minecraft:facing_direction");
  const dir = getDirectionVector(facing);

  const pillowBack = dim.getBlock({
    x: bedBlock.location.x - dir.x,
    y: bedBlock.location.y,
    z: bedBlock.location.z - dir.z
  });

  if (pillowBack && pillowBack.typeId === "minecraft:air") {
    const mob = Math.random() < 0.5 ? "minecraft:zombie" : "minecraft:skeleton";
    const spawnPos = {
      x: bedBlock.location.x + 0.5 + (Math.random() - 0.5) * 2,
      y: bedBlock.location.y + 1,
      z: bedBlock.location.z + 0.5 + (Math.random() - 0.5) * 2
    };
    dim.spawnEntity(mob, spawnPos);
  }
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    checkPlayerNightmare(player);
  }
}, 20);