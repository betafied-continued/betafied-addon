// This entire script serves as a backup in the event that the player.json hunger system is not working as intended.

import { world, system } from "@minecraft/server";

const SPEED = 0.1;

system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        p.getComponent("minecraft:movement")?.setCurrentValue(SPEED);
    }
}, 1);