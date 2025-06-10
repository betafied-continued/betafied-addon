import { world } from "@minecraft/server";

world.beforeEvents.playerPlaceBlock.subscribe((event) => {
    try {
        const y = event.block.location.y;
        if (y >= 128) {
            event.cancel = true;
            event.player.sendMessage("Height limit for building is 128 blocks");
        }
    } catch (e) {
        console.warn("Error in deny_build_y128:", e);
    }
});