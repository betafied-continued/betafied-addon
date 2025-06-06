import { world } from "@minecraft/server";

world.afterEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;
    console.info(`<${player.name}> ${message}`);
});