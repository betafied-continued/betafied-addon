import { world, system } from "@minecraft/server";

const SPEED = 0.1;

system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        p.getComponent("minecraft:movement")?.setCurrentValue(SPEED);
    }
}, 1);