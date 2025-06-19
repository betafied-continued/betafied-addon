import { world } from "@minecraft/server";

// Help entries (tags + command)
const HELP_ENTRIES = [
  {
    command: "/tag @s add builder_exempt",
    description: "Disable item restrictions."
  },
  {
    command: "/tag @s remove builder_exempt",
    description: "Re-enable item restrictions."
  },
  {
    command: "/tag @s add scan_debug",
    description: "Show debug messages while Nether blocks are being replaced around you."
  },
  {
    command: "/tag @s remove scan_debug",
    description: "Hide debug messages."
  },
  {
    command: "/tag @s add afkradius_enabled",
    description: "Enable idle-based radius expansion (used in Nether scanner)."
  },
  {
    command: "/tag @s remove afkradius_enabled",
    description: "Disable idle-based radius expansion."
  },
  {
    command: "!help",
    description: "Show this help message."
  }
];

// Chat listener for !help
world.beforeEvents.chatSend.subscribe(event => {
  const { sender, message } = event;

  if (message.trim().toLowerCase() === "!help") {
    sender.sendMessage("§eAvailable Tags & Commands:");
    for (const entry of HELP_ENTRIES) {
      sender.sendMessage(`§b${entry.command} §7- ${entry.description}`);
    }

    event.cancel = true;
  }
});