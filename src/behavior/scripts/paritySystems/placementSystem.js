import { world, system, GameMode } from "@minecraft/server";
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";
import { getPlayerClan } from "./clanSystem.js";
import { getPlayerRank } from "./rankSystem.js";

// Configuration
const WEBHOOK_URL = "https://discord.com/api/webhooks/1369222114867154995/A66uJ_nBM3ywPz5AbIx8ajMJNHOtCc1aGeyXMmfYzrXOKi7sgh-orIkXeol22lj0Tles";
const PUNISHMENTS_WEBHOOK_URL = "https://discord.com/api/webhooks/1371037649422516265/60hJo7o5DeExYbPuX5pYwH6IaAlRQMCX3hdq2ba6s5311BZsWFpbg2JYxCyn81Jw7NtF";
const DEBUG_MODE = true; // Enabled for debugging X-ray and TPS
const REPORT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const ADMIN_RANKS = ["Admin", "Moderator"];
const TPS_THRESHOLD = 15;
const MAX_REACH = 6; // Max block reach in survival
const KILL_AURA_THRESHOLD = 3; // Max entities hit in 0.5s
const ORE_MINING_RATIO_THRESHOLD = 0.05; // Ore blocks / total blocks
const FAST_XRAY_THRESHOLD = 0.5; // High ratio for quick detection
const VIOLATION_THRESHOLD = 3; // Auto-ban after 3 violations
const VIOLATION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const MAX_VERTICAL_SPEED = 0.5; // Blocks per tick (survival)
const MAX_HORIZONTAL_SPEED = 0.3; // Blocks per tick (sprinting)
const MAX_BLOCKS_TRACKED = 1000; // Reset stats after 1000 blocks
const XRAY_CHECK_BLOCKS = 50; // Check ratio at 50 blocks for testing
const FAST_XRAY_CHECK_BLOCKS = 20; // Quick check for high ratios
const MESSAGES = {
    REPORT_SENT: "§aReport sent against {player} for: {reason}",
    REPORT_COOLDOWN: "§cPlease wait {time} seconds before reporting again.",
    REPORT_INVALID_PLAYER: "§cPlayer not found.",
    REPORT_INVALID_REASON: "§cPlease provide a reason for the report.",
    REPORT_ADMIN: "§cYou cannot report staff members.",
    BAN_SUCCESS: "§aBanned {player} for {duration}. Reason: {reason}",
    KICK_SUCCESS: "§aKicked {player}. Reason: {reason}",
    BAN_INVALID_DURATION: "§cInvalid duration. Use format like 5m, 5h, 5d, 5w, 5y.",
    INVIS_TOGGLED_ON: "§aInvisibility enabled (spectator mode).",
    INVIS_TOGGLED_OFF: "§aInvisibility disabled (survival mode).",
    TP_SUCCESS: "§aTeleported to {player}.",
    TP_INVALID_PLAYER: "§cPlayer not found.",
    TP_SAME_PLAYER: "§cYou cannot teleport to yourself.",
    ANTI_CHEAT_ALERT: "§cSuspected {type} hack detected: {details}",
    AUTO_BAN: "§c{player} has been automatically banned for repeated hack violations.",
    UNBAN_SUCCESS: "§aUnbanned {player}.",
    UNBAN_NOT_BANNED: "§c{player} is not banned."
};

// State
const recentReports = new Map(); // { playerName:targetName: timestamp }
const webhookQueue = [];
const playerMiningStats = new Map(); // { playerName: { ores: number, total: number } }
const playerAttackTimestamps = new Map(); // { playerName: [{ entityId, timestamp }] }
const playerViolations = new Map(); // { playerName: [{ type, timestamp, details }] }
const playerLastPosition = new Map(); // { playerName: { location, timestamp } }
let lastTPSCheck = Date.now();
let tickCount = 0;
let currentTPS = 20.00;
let lastTPSNotification = 0;

// Utility Functions
function logDebug(message) {
    if (DEBUG_MODE) console.log(`[AntiCheatReportSystem] ${message}`);
}

function formatTime(ms) {
    return Math.ceil(ms / 1000);
}

function sanitizeMessage(message) {
    return message.replace(/@(\w+|everyone|here)/g, "@\u200B$1");
}

function vectorSubtract(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z
    };
}

function vectorDistance(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    const dz = v1.z - v2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getNearbyPlayers(player, maxDistance = 10) {
    if (!player?.isValid || !player?.location) return [];
    const nearby = [];
    for (const p of world.getPlayers()) {
        if (!p.isValid || !p.location || p.name === player.name) continue;
        const distance = vectorDistance(player.location, p.location);
        if (distance <= maxDistance) nearby.push(p.name);
    }
    return nearby;
}

async function sendToWebhook(payload, webhookUrl = WEBHOOK_URL) {
    try {
        if (payload.embeds?.length > 0) {
            for (const embed of payload.embeds) {
                if (embed.fields) {
                    for (const field of embed.fields) {
                        field.name = field.name?.substring(0, 256) || "Unnamed";
                        field.value = field.value?.substring(0, 1024) || "No data";
                    }
                }
                embed.title = embed.title?.substring(0, 256) || "Notification";
            }
        }

        const finalPayload = {
            content: sanitizeMessage(payload.embeds?.[0]?.title?.substring(0, 2000) || "Notification"),
            embeds: payload.embeds || []
        };

        const payloadString = JSON.stringify(finalPayload);
        if (payloadString.length > 6000) {
            logDebug("Payload exceeds 6000 characters, truncating embeds");
            finalPayload.embeds = [];
            finalPayload.content = sanitizeMessage(`${finalPayload.content} (Embed truncated due to size limit)`);
        }

        const request = new HttpRequest(webhookUrl)
            .setMethod(HttpRequestMethod.Post)
            .setBody(JSON.stringify(finalPayload))
            .setHeaders([new HttpHeader("Content-Type", "application/json")])
            .setTimeout(5);

        const response = await http.request(request);
        if (response.status !== 200 && response.status !== 204) {
            logDebug(`Webhook failed: Status ${response.status}, Body: ${response.body || "No body"}`);
        } else {
            logDebug("Webhook sent successfully");
        }
    } catch (error) {
        logDebug(`Webhook error: ${error.stack || error}`);
    }
}

function processWebhookQueue() {
    if (webhookQueue.length === 0) return;
    const batch = webhookQueue.splice(0, Math.min(webhookQueue.length, 5)); // Process up to 5 at a time
    for (const { payload, url } of batch) {
        sendToWebhook(payload, url);
    }
}

function parseDuration(durationStr) {
    const regex = /^(\d+)([mhdwy])$/;
    const match = durationStr.match(regex);
    if (!match) return null;
    const amount = parseInt(match[1]);
    const units = {
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24,
        w: 1000 * 60 * 60 * 24 * 7,
        y: 1000 * 60 * 60 * 24 * 365
    };
    return amount * units[match[2]];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    if (days < 365) return `${days} day${days !== 1 ? "s" : ""}`;
    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? "s" : ""}`;
}

function getPlayerInventory(player) {
    if (!player?.isValid) return "Invalid player";
    try {
        const inventory = player.getComponent("minecraft:inventory")?.container;
        if (!inventory) return "No inventory";
        const items = [];
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item) {
                items.push(`${item.typeId.replace("minecraft:", "")} x${item.amount}`);
            }
        }
        return items.length ? items.join(", ") : "Empty";
    } catch (error) {
        logDebug(`Error getting inventory for ${player.name}: ${error}`);
        return "Error accessing inventory";
    }
}

// Anti-Cheat Functions
function recordViolation(player, type, details) {
    if (!player?.isValid || ADMIN_RANKS.includes(getPlayerRank(player))) return;
    const now = Date.now();
    let violations = playerViolations.get(player.name) || [];
    violations = violations.filter(v => now - v.timestamp < VIOLATION_WINDOW_MS);
    violations.push({ type, timestamp: now, details });
    playerViolations.set(player.name, violations);

    logDebug(`Violation recorded for ${player.name}: ${type}, Total: ${violations.length}`);

    if (violations.length >= VIOLATION_THRESHOLD) {
        const reason = `Automatic ban for repeated hack violations: ${violations.map(v => v.type).join(", ")}`;
        banPlayer({ name: "System", isValid: true }, player, "7d", reason);
        world.sendMessage(MESSAGES.AUTO_BAN.replace("{player}", player.name));
        playerViolations.delete(player.name); // Clear violations after ban
    }
}

function checkKillAura(player, entity) {
    if (!player?.isValid || !entity?.isValid || ADMIN_RANKS.includes(getPlayerRank(player))) return;
    const now = Date.now();
    let attacks = playerAttackTimestamps.get(player.name) || [];
    attacks = attacks.filter(t => now - t.timestamp < 500); // Last 0.5s
    attacks.push({ entityId: entity.id, timestamp: now });
    playerAttackTimestamps.set(player.name, attacks);

    const uniqueEntities = new Set(attacks.map(a => a.entityId));
    if (uniqueEntities.size >= KILL_AURA_THRESHOLD) {
        const details = `Hit ${uniqueEntities.size} entities in 0.5s`;
        player.sendMessage(MESSAGES.ANTI_CHEAT_ALERT.replace("{type}", "KillAura").replace("{details}", details));
        webhookQueue.push({
            payload: {
                embeds: [{
                    title: "KillAura Detected",
                    color: 0xff0000,
                    fields: [
                        { name: "Player", value: player.name, inline: true },
                        { name: "Details", value: details, inline: false },
                        { name: "Time", value: new Date().toISOString(), inline: true }
                    ]
                }]
            },
            url: WEBHOOK_URL
        });
        recordViolation(player, "KillAura", details);
    }
}

function checkReach(player, targetLocation) {
    if (!player?.isValid || !player.location || !targetLocation || ADMIN_RANKS.includes(getPlayerRank(player))) return;
    const distance = vectorDistance(player.location, targetLocation);
    if (distance > MAX_REACH && player.getGameMode() === GameMode.survival) {
        const details = `Interacted at ${distance.toFixed(2)} blocks`;
        player.sendMessage(MESSAGES.ANTI_CHEAT_ALERT.replace("{type}", "Reach").replace("{details}", details));
        webhookQueue.push({
            payload: {
                embeds: [{
                    title: "Reach Hack Detected",
                    color: 0xff0000,
                    fields: [
                        { name: "Player", value: player.name, inline: true },
                        { name: "Details", value: details, inline: false },
                        { name: "Time", value: new Date().toISOString(), inline: true }
                    ]
                }]
            },
            url: WEBHOOK_URL
        });
        recordViolation(player, "Reach", details);
    }
}

function checkFlyHack(player) {
    if (!player?.isValid || !player.location) {
        logDebug(`Skipping fly check for ${player?.name || "unknown"}: Invalid player or location`);
        return;
    }

    const playerRank = getPlayerRank(player);
    if (ADMIN_RANKS.includes(playerRank) || player.getGameMode() !== GameMode.survival) {
        logDebug(`Skipping fly check for ${player.name}: Admin (${playerRank}) or not in survival`);
        return;
    }

    const now = Date.now();
    const lastPos = playerLastPosition.get(player.name);
    if (!lastPos || !lastPos.location || now - lastPos.timestamp < 50) {
        playerLastPosition.set(player.name, { location: player.location, timestamp: now });
        return;
    }

    try {
        const deltaTime = (now - lastPos.timestamp) / 1000; // Time in seconds
        const deltaPos = vectorSubtract(player.location, lastPos.location);
        const verticalSpeed = Math.abs(deltaPos.y) / deltaTime;
        const horizontalSpeed = Math.sqrt(deltaPos.x ** 2 + deltaPos.z ** 2) / deltaTime;

        logDebug(`Fly check for ${player.name}: VerticalSpeed=${verticalSpeed.toFixed(2)}, HorizontalSpeed=${horizontalSpeed.toFixed(2)}`);

        if (verticalSpeed > MAX_VERTICAL_SPEED || horizontalSpeed > MAX_HORIZONTAL_SPEED) {
            const details = `Vertical speed: ${verticalSpeed.toFixed(2)} blocks/s, Horizontal speed: ${horizontalSpeed.toFixed(2)} blocks/s`;
            player.sendMessage(MESSAGES.ANTI_CHEAT_ALERT.replace("{type}", "Fly").replace("{details}", details));
            webhookQueue.push({
                payload: {
                    embeds: [{
                        title: "Fly Hack Detected",
                        color: 0xff0000,
                        fields: [
                            { name: "Player", value: player.name, inline: true },
                            { name: "Details", value: details, inline: false },
                            { name: "Time", value: new Date().toISOString(), inline: true }
                        ]
                    }]
                },
                url: WEBHOOK_URL
            });
            recordViolation(player, "Fly", details);
        }

        playerLastPosition.set(player.name, { location: player.location, timestamp: now });
    } catch (error) {
        logDebug(`Error in fly check for ${player.name}: ${error.stack || error}`);
    }
}

function trackMining(player, block) {
    if (!player?.isValid) {
        logDebug(`Skipping mining track for ${player.name || "unknown"}: Invalid player`);
        return;
    }

    const playerRank = getPlayerRank(player);
    if (ADMIN_RANKS.includes(playerRank)) {
        logDebug(`Skipping mining track for ${player.name}: Admin rank (${playerRank})`);
        return;
    }

    const blockType = block.typeId.replace("minecraft:", "");
    const isOre = ["coal_ore", "iron_ore", "gold_ore", "diamond_ore", "emerald_ore", "lapis_ore", "redstone_ore"].includes(blockType);
    let stats = playerMiningStats.get(player.name) || { ores: 0, total: 0 };
    stats.total++;
    if (isOre) stats.ores++;
    playerMiningStats.set(player.name, stats);

    logDebug(`Player ${player.name} broke block: ${blockType}, Ore: ${isOre}, Stats: ${stats.ores}/${stats.total}`);

    // Memory management: Reset stats after MAX_BLOCKS_TRACKED
    if (stats.total >= MAX_BLOCKS_TRACKED) {
        logDebug(`Resetting stats for ${player.name} after ${stats.total} blocks to prevent memory leaks`);
        playerMiningStats.set(player.name, { ores: 0, total: 0 });
        return;
    }

    // Fast X-ray check for blatant cases
    if (stats.total >= FAST_XRAY_CHECK_BLOCKS) {
        const ratio = stats.ores / stats.total;
        logDebug(`Fast X-Ray check for ${player.name}: Ratio=${ratio.toFixed(2)}, Threshold=${FAST_XRAY_THRESHOLD}`);
        if (ratio > FAST_XRAY_THRESHOLD) {
            const details = `Mined ${stats.ores} ores out of ${stats.total} blocks (ratio: ${ratio.toFixed(2)})`;
            player.sendMessage(MESSAGES.ANTI_CHEAT_ALERT.replace("{type}", "X-Ray").replace("{details}", details));
            webhookQueue.push({
                payload: {
                    embeds: [{
                        title: "X-Ray Hack Detected (Fast Check)",
                        color: 0xff0000,
                        fields: [
                            { name: "Player", value: player.name, inline: true },
                            { name: "Details", value: details, inline: false },
                            { name: "Time", value: new Date().toISOString(), inline: true }
                        ]
                    }]
                },
                url: WEBHOOK_URL
            });
            recordViolation(player, "X-Ray", details);
            playerMiningStats.set(player.name, { ores: 0, total: 0 }); // Reset stats
            return;
        }
    }

    // Standard X-ray check
    if (stats.total >= XRAY_CHECK_BLOCKS) {
        const ratio = stats.ores / stats.total;
        logDebug(`Standard X-Ray check for ${player.name}: Ratio=${ratio.toFixed(2)}, Threshold=${ORE_MINING_RATIO_THRESHOLD}`);
        if (ratio > ORE_MINING_RATIO_THRESHOLD) {
            const details = `Mined ${stats.ores} ores out of ${stats.total} blocks (ratio: ${ratio.toFixed(2)})`;
            player.sendMessage(MESSAGES.ANTI_CHEAT_ALERT.replace("{type}", "X-Ray").replace("{details}", details));
            webhookQueue.push({
                payload: {
                    embeds: [{
                        title: "X-Ray Hack Detected",
                        color: 0xff0000,
                        fields: [
                            { name: "Player", value: player.name, inline: true },
                            { name: "Details", value: details, inline: false },
                            { name: "Time", value: new Date().toISOString(), inline: true }
                        ]
                    }]
                },
                url: WEBHOOK_URL
            });
            recordViolation(player, "X-Ray", details);
        }
        playerMiningStats.set(player.name, { ores: 0, total: 0 }); // Reset stats
    }
}

// Invisibility Toggle
export function toggleInvisibility(player) {
    if (!player?.isValid) {
        logDebug(`Invalid player for invisibility toggle: ${player?.name || "unknown"}`);
        return false;
    }

    try {
        const currentMode = player.getGameMode();
        system.runTimeout(() => {
            try {
                if (currentMode !== GameMode.spectator) {
                    player.setGameMode(GameMode.spectator);
                    player.sendMessage(MESSAGES.INVIS_TOGGLED_ON);
                    logDebug(`Enabled invisibility for ${player.name}`);
                } else {
                    player.setGameMode(GameMode.survival);
                    player.sendMessage(MESSAGES.INVIS_TOGGLED_OFF);
                    logDebug(`Disabled invisibility for ${player.name}`);
                }
            } catch (error) {
                logDebug(`Failed to toggle invisibility for ${player.name}: ${error}`);
                player.sendMessage(`§cFailed to toggle invisibility: ${error.message}`);
            }
        }, 0);
        return true;
    } catch (error) {
        logDebug(`Error in toggleInvisibility: ${error.stack || error}`);
        player.sendMessage(`§cError toggling invisibility: ${error.message}`);
        return false;
    }
}

// Teleport
export function teleportToPlayer(player, target) {
    if (!player?.isValid || !target?.isValid) {
        logDebug(`Invalid player or target for teleport: player=${player?.name || "unknown"}, target=${target?.name || "unknown"}`);
        player?.sendMessage(MESSAGES.TP_INVALID_PLAYER);
        return false;
    }

    if (player.name === target.name) {
        player.sendMessage(MESSAGES.TP_SAME_PLAYER);
        return false;
    }

    try {
        system.runTimeout(() => {
            try {
                player.teleport(target.location, { dimension: target.dimension });
                player.sendMessage(MESSAGES.TP_SUCCESS.replace("{player}", target.name));
                logDebug(`Teleported ${player.name} to ${target.name}`);
            } catch (error) {
                logDebug(`Failed to teleport ${player.name} to ${target.name}: ${error}`);
                player.sendMessage(`§cFailed to teleport: ${error.message}`);
            }
        }, 0);
        return true;
    } catch (error) {
        logDebug(`Error in teleportToPlayer: ${error.stack || error}`);
        player.sendMessage(`§cError teleporting: ${error.message}`);
        return false;
    }
}

// Ban, Unban, and Kick
export function checkBan(player) {
    if (!player?.name) return false;
    const banData = world.getDynamicProperty(`banData:${player.name.toLowerCase()}`);
    if (!banData) return false;

    try {
        const { expiry, reason } = JSON.parse(banData);
        if (Date.now() >= expiry) {
            world.setDynamicProperty(`banData:${player.name.toLowerCase()}`, undefined);
            logDebug(`Ban expired for ${player.name}`);
            return false;
        }
        return { expiry, reason };
    } catch (error) {
        console.warn(`Invalid ban data for ${player.name}: ${error}`);
        world.setDynamicProperty(`banData:${player.name.toLowerCase()}`, undefined);
        return false;
    }
}

// Update the main loop to use checkBan
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (!player.isValid) continue;

        // Ban Enforcement
        const banInfo = checkBan(player);
        if (banInfo) {
            const { expiry, reason, issuer } = banInfo;
            const formattedDuration = formatDuration(expiry - Date.now());
            const banMessage = [
                "\n",
                "\n§cYou are banned from the server!\n",
                `§eReason: §f${reason}\n`,
                `§eDuration: §f${formattedDuration}\n`,
                `§eBanned by: §f${issuer || "Unknown"}\n`,
                `§eExpires: §f${new Date(expiry).toLocaleString()}\n`
            ].join(" ").slice(0, 256);

            system.runTimeout(() => {
                try {
                    player.runCommand(`kick "${player.name}" ${banMessage}`);
                    logDebug(`Kicked banned player ${player.name}`);
                } catch (error) {
                    logDebug(`Failed to kick banned player ${player.name}: ${error}`);
                }
            }, 0);
        }

        // Kick Enforcement (unchanged, as it doesn"t relate to bans)
        const kickData = player.getDynamicProperty("kickData");
        if (kickData) {
            try {
                const { reason, issuer } = JSON.parse(kickData);
                const kickMessage = [
                    "§cYou have been kicked from the server!",
                    `§eReason: §f${reason}`,
                    `§eKicked by: §f${issuer || "Unknown"}`
                ].join(" ").slice(0, 256);

                system.runTimeout(() => {
                    try {
                        player.runCommand(`kick "${player.name}" ${kickMessage}`);
                        player.setDynamicProperty("kickData", undefined);
                        logDebug(`Kicked player ${player.name}`);
                    } catch (error) {
                        logDebug(`Failed to kick player ${player.name}: ${error}`);
                        player.setDynamicProperty("kickData", undefined);
                    }
                }, 0);
            } catch (error) {
                logDebug(`Invalid kick data for ${player.name}: ${error}`);
                player.setDynamicProperty("kickData", undefined);
            }
        }
    }

    // Process Webhook Queue
    processWebhookQueue();
}, 100); // Run every 5 seconds (100 ticks)

// Add playerSpawn handler for login-time ban enforcement
world.beforeEvents.playerSpawn.subscribe(event => {
    const { player, initialSpawn } = event;
    if (!initialSpawn || !player?.name) return;

    const banInfo = checkBan(player);
    if (banInfo) {
        const { expiry, reason, issuer } = banInfo;
        const formattedDuration = formatDuration(expiry - Date.now());
        const banMessage = [
            "\n",
            "\n§cYou are banned from the server!\n",
            `§eReason: §f${reason}\n`,
            `§eDuration: §f${formattedDuration}\n`,
            `§eBanned by: §f${issuer || "Unknown"}\n`,
            `§eExpires: §f${new Date(expiry).toLocaleString()}\n`
        ].join(" ").slice(0, 256);

        system.runTimeout(() => {
            try {
                player.runCommand(`kick "${player.name}" ${banMessage}`);
                logDebug(`Prevented banned player ${player.name} from spawning`);
            } catch (error) {
                logDebug(`Failed to kick banned player ${player.name} on spawn: ${error}`);
            }
        }, 0);
    }
});

export function banPlayer(issuer, targetOrName, durationStr, reason) {
    if (!issuer?.isValid) {
        issuer?.sendMessage("§cInvalid issuer.");
        logDebug(`Ban failed: Invalid issuer=${issuer?.name || "unknown"}`);
        return false;
    }

    const targetName = typeof targetOrName === "string" ? targetOrName : targetOrName?.name;
    if (!targetName) {
        issuer.sendMessage("§cInvalid target name.");
        logDebug(`Ban failed: Invalid target=${targetOrName}`);
        return false;
    }

    const duration = parseDuration(durationStr);
    if (!duration) {
        issuer.sendMessage(MESSAGES.BAN_INVALID_DURATION);
        logDebug(`Ban failed: Invalid duration=${durationStr}`);
        return false;
    }

    const expiry = Date.now() + duration;
    const banData = JSON.stringify({ expiry, reason, issuer: issuer.name });
    try {
        const targetNameLower = targetName.toLowerCase();
        world.setDynamicProperty(`banData:${targetNameLower}`, banData);
        logDebug(`Set ban data for ${targetNameLower}: ${banData}`);
    } catch (error) {
        logDebug(`Failed to set ban data for ${targetName}: ${error.stack || error}`);
        issuer.sendMessage(`§cFailed to ban ${targetName}: Unable to set ban data.`);
        return false;
    }

    const formattedDuration = formatDuration(duration);
    issuer.sendMessage(MESSAGES.BAN_SUCCESS.replace("{player}", targetName).replace("{duration}", formattedDuration).replace("{reason}", reason));

    // Attempt to kick if the player is online
    const target = world.getPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase());
    if (target?.isValid) {
        const banMessage = [
            "\n",
            "\n§cYou are banned from the server!\n",
            `§eReason: §f${reason}\n`,
            `§eDuration: §f${formattedDuration}\n`,
            `§eBanned by: §f${issuer.name}\n`,
            `§eExpires: §f${new Date(expiry).toLocaleString()}\n`
        ].join(" ").slice(0, 256);

        system.runTimeout(() => {
            try {
                target.runCommand(`kick "${target.name}" ${banMessage}`);
                logDebug(`Immediately kicked banned player ${target.name}`);
            } catch (error) {
                logDebug(`Failed to kick banned player ${target.name}: ${error.stack || error}`);
                issuer.sendMessage(`§cFailed to kick ${target.name} after banning: ${error.message}`);
            }
        }, 0);
    }

    webhookQueue.push({
        payload: {
            embeds: [{
                title: "Player Banned",
                color: 0xff0000,
                fields: [
                    { name: "Player", value: targetName, inline: true },
                    { name: "Banned By", value: issuer.name, inline: true },
                    { name: "Duration", value: formattedDuration, inline: true },
                    { name: "Reason", value: reason, inline: false },
                    { name: "Expires", value: new Date(expiry).toISOString(), inline: true }
                ],
                timestamp: new Date().toISOString()
            }]
        },
        url: WEBHOOK_URL
    }, {
        payload: {
            embeds: [{
                title: "Player Banned",
                color: 0xff0000,
                fields: [
                    { name: "Player", value: targetName, inline: true },
                    { name: "Duration", value: formattedDuration, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        },
        url: PUNISHMENTS_WEBHOOK_URL
    });

    return true;
}

export function unbanPlayer(issuer, target) {
    if (!issuer?.isValid || !target?.name) {
        issuer?.sendMessage("§cInvalid player or target.");
        logDebug(`Unban failed: Invalid issuer=${issuer?.name || "unknown"}, target=${target?.name || "unknown"}`);
        return false;
    }

    const targetNameLower = target.name.toLowerCase();
    const banData = world.getDynamicProperty(`banData:${targetNameLower}`);
    if (!banData) {
        issuer.sendMessage(MESSAGES.UNBAN_NOT_BANNED.replace("{player}", target.name));
        logDebug(`Unban failed: No ban data found for banData:${targetNameLower}`);
        return false;
    }

    try {
        world.setDynamicProperty(`banData:${targetNameLower}`, undefined);
        issuer.sendMessage(MESSAGES.UNBAN_SUCCESS.replace("{player}", target.name));
        logDebug(`Successfully unbanned ${target.name} by ${issuer.name}`);

        webhookQueue.push({
            payload: {
                embeds: [{
                    title: "Player Unbanned",
                    color: 0x00ff00,
                    fields: [
                        { name: "Player", value: target.name, inline: true },
                        { name: "Unbanned By", value: issuer.name, inline: true },
                        { name: "Time", value: new Date().toISOString(), inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            },
            url: WEBHOOK_URL
        }, {
            payload: {
                embeds: [{
                    title: "Player Unbanned",
                    color: 0x00ff00,
                    fields: [
                        { name: "Player", value: target.name, inline: true },
                        { name: "Time", value: new Date().toISOString(), inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            },
            url: PUNISHMENTS_WEBHOOK_URL
        });

        return true;
    } catch (error) {
        logDebug(`Failed to unban ${target.name}: ${error.stack || error}`);
        issuer.sendMessage(`§cFailed to unban ${target.name}: ${error.message}`);
        return false;
    }
}

export function kickPlayer(issuer, target, reason) {
    if (!issuer?.isValid || !target?.isValid) {
        issuer?.sendMessage("§cInvalid player or target.");
        return false;
    }

    const kickData = JSON.stringify({ reason, issuer: issuer.name });
    try {
        target.setDynamicProperty("kickData", kickData);
    } catch (error) {
        logDebug(`Failed to set kick data for ${target.name}: ${error}`);
        issuer.sendMessage(`§cFailed to kick ${target.name}: Unable to set kick data.`);
        return false;
    }

    issuer.sendMessage(MESSAGES.KICK_SUCCESS.replace("{player}", target.name).replace("{reason}", reason));

    webhookQueue.push({
        payload: {
            embeds: [{
                title: "Player Kicked",
                color: 0xff5555,
                fields: [
                    { name: "Player", value: target.name, inline: true },
                    { name: "Kicked By", value: issuer.name, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        },
        url: WEBHOOK_URL
    }, {
        payload: {
            embeds: [{
                title: "Player Kicked",
                color: 0xff5555,
                fields: [
                    { name: "Player", value: target.name, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        },
        url: PUNISHMENTS_WEBHOOK_URL
    });

    return true;
}

// Report System
export function handleReport(player, target, reason) {
    try {
        if (!player?.isValid || !target?.isValid) {
            logDebug(`Skipping report due to invalid player: ${player?.name || "unknown"} or target: ${target?.name || "unknown"}`);
            player?.sendMessage(MESSAGES.REPORT_INVALID_PLAYER);
            return;
        }

        if (ADMIN_RANKS.includes(getPlayerRank(target))) {
            player.sendMessage(MESSAGES.REPORT_ADMIN);
            return;
        }

        const now = Date.now();
        const reportKey = `${player.name}:${target.name}`;
        const lastReport = recentReports.get(reportKey) || 0;
        if (now - lastReport < REPORT_COOLDOWN_MS) {
            player.sendMessage(MESSAGES.REPORT_COOLDOWN.replace("{time}", formatTime(REPORT_COOLDOWN_MS - (now - lastReport))));
            return;
        }

        if (!reason) {
            player.sendMessage(MESSAGES.REPORT_INVALID_REASON);
            return;
        }

        recentReports.set(reportKey, now);
        const reportDetails = {
            reporter: player.name,
            reporterClan: getPlayerClan(player) || "None",
            accused: target.name,
            accusedClan: getPlayerClan(target) || "None",
            accusedInventory: getPlayerInventory(target),
            reason,
            location: `${Math.floor(player.location.x)},${Math.floor(player.location.y)},${Math.floor(player.location.z)}`,
            timestamp: new Date().toISOString(),
            nearbyPlayers: getNearbyPlayers(player)
        };

        webhookQueue.push({
            payload: {
                embeds: [{
                    title: "Player Report",
                    color: 0xff5555,
                    fields: [
                        { name: "Reporter", value: `${reportDetails.reporter} [${reportDetails.reporterClan}]`, inline: true },
                        { name: "Accused", value: `${reportDetails.accused} [${reportDetails.accusedClan}]`, inline: true },
                        { name: "Reason", value: reason, inline: false },
                        { name: "Accused Inventory", value: reportDetails.accusedInventory, inline: false },
                        { name: "Location", value: reportDetails.location, inline: true },
                        { name: "Time", value: reportDetails.timestamp, inline: true },
                        { name: "Nearby Players", value: reportDetails.nearbyPlayers.length ? reportDetails.nearbyPlayers.join(", ") : "None", inline: false }
                    ]
                }]
            },
            url: WEBHOOK_URL
        });

        player.sendMessage(MESSAGES.REPORT_SENT.replace("{player}", target.name).replace("{reason}", reason));
        logDebug(`Report by ${player.name} against ${target.name}: ${reason}`);
    } catch (error) {
        logDebug(`Error in handleReport: ${error.stack || error}`);
        player?.sendMessage(`§cError processing report: ${error.message}`);
    }
}

// Event Handlers
world.afterEvents.entityHitEntity.subscribe(event => {
    const { damagingEntity, hitEntity } = event;
    if (damagingEntity.typeId === "minecraft:player") {
        checkKillAura(damagingEntity, hitEntity);
        checkReach(damagingEntity, hitEntity.location);
    }
});

world.beforeEvents.playerBreakBlock.subscribe(event => {
    const { player, block } = event;
    trackMining(player, block);
});

world.afterEvents.playerLeave.subscribe(event => {
    try {
        recentReports.forEach((_, key) => {
            if (key.startsWith(event.playerName + ":") || key.endsWith(":" + event.playerName)) {
                recentReports.delete(key);
            }
        });
        playerMiningStats.delete(event.playerName);
        playerAttackTimestamps.delete(event.playerName);
        playerViolations.delete(event.playerName);
        playerLastPosition.delete(event.playerName);
        logDebug(`Cleared data for ${event.playerName}`);
    } catch (error) {
        logDebug(`Error in playerLeave handler: ${error.stack || error}`);
    }
});

// TPS Calculation (separate loop for accuracy)
system.runInterval(() => {
    tickCount++;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTPSCheck;

    if (timeDelta >= 1000) {
        currentTPS = Math.min((tickCount * 1000) / timeDelta, 20.00).toFixed(2);
        logDebug(`TPS calculated: tickCount=${tickCount}, timeDelta=${timeDelta}ms, TPS=${currentTPS}`);
        tickCount = 0;
        lastTPSCheck = currentTime;

        if (currentTPS < TPS_THRESHOLD && Date.now() - lastTPSNotification > 60000) {
            webhookQueue.push({
                payload: {
                    embeds: [{
                        title: "Low TPS Warning",
                        color: 0xff0000,
                        fields: [
                            { name: "Current TPS", value: currentTPS, inline: true },
                            { name: "Threshold", value: TPS_THRESHOLD.toString(), inline: true },
                            { name: "Time", value: new Date().toISOString(), inline: true }
                        ]
                    }]
                },
                url: WEBHOOK_URL
            });
            lastTPSNotification = Date.now();
            logDebug(`Low TPS warning sent: ${currentTPS}`);
        }
    }
}, 1); // Run every tick (50ms)

// Main Loop (for bans, kicks, webhooks, fly checks)
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (!player.isValid) continue;

        // Fly Hack Check
        checkFlyHack(player);

        // Ban Enforcement
        const banData = player.getDynamicProperty("banData");
        if (banData) {
            try {
                const { expiry, reason, issuer } = JSON.parse(banData);
                if (Date.now() >= expiry) {
                    player.setDynamicProperty("banData", undefined);
                    logDebug(`Ban expired for ${player.name}`);
                    continue;
                }

                const formattedDuration = formatDuration(expiry - Date.now());
                const banMessage = [
                    "\n",
                    "\n§cYou are banned from the server!\n",
                    `§eReason: §f${reason}\n`,
                    `§eDuration: §f${formattedDuration}\n`,
                    `§eBanned by: §f${issuer || "Unknown"}\n`,
                    `§eExpires: §f${new Date(expiry).toLocaleString()}\n`
                ].join(" ").slice(0, 256);

                system.runTimeout(() => {
                    try {
                        player.runCommand(`kick "${player.name}" ${banMessage}`);
                        logDebug(`Kicked banned player ${player.name}`);
                    } catch (error) {
                        logDebug(`Failed to kick banned player ${player.name}: ${error}`);
                    }
                }, 0);
            } catch (error) {
                logDebug(`Invalid ban data for ${player.name}: ${error}`);
                player.setDynamicProperty("banData", undefined);
            }
        }

        // Kick Enforcement
        const kickData = player.getDynamicProperty("kickData");
        if (kickData) {
            try {
                const { reason, issuer } = JSON.parse(kickData);
                const kickMessage = [
                    "§cYou have been kicked from the server!",
                    `§eReason: §f${reason}`,
                    `§eKicked by: §f${issuer || "Unknown"}`
                ].join(" ").slice(0, 256);

                system.runTimeout(() => {
                    try {
                        player.runCommand(`kick "${player.name}" ${kickMessage}`);
                        player.setDynamicProperty("kickData", undefined);
                        logDebug(`Kicked player ${player.name}`);
                    } catch (error) {
                        logDebug(`Failed to kick player ${player.name}: ${error}`);
                        player.setDynamicProperty("kickData", undefined);
                    }
                }, 0);
            } catch (error) {
                logDebug(`Invalid kick data for ${player.name}: ${error}`);
                player.setDynamicProperty("kickData", undefined);
            }
        }
    }

    // Process Webhook Queue
    processWebhookQueue();
}, 100); // Run every 5 seconds (100 ticks)
export { MESSAGES };
console.log("Anti-Cheat and Report System with TPS Monitoring loaded.");
