import { world } from "@minecraft/server";
await null;

// Subscribe to the entityHurt event to detect when a player takes damage
world.afterEvents.entityHurt.subscribe((event) => {
    const { hurtEntity, damage } = event;

    // Check if the hurt entity is a player
    if (hurtEntity.typeId !== "minecraft:player") return;

    // Get the player's inventory (equipment)
    const equipment = hurtEntity.getComponent("minecraft:equipment_inventory");

    // Armor slots to check (head, chest, legs, feet)
    const armorSlots = ["Head", "Chest", "Legs", "Feet"];
    let totalDamageReduction = 0;

    // Loop through each armor slot
    for (const slot of armorSlots) {
        const armorItem = equipment.getEquipment(slot);
        if (armorItem) {
            // Get durability component
            const durability = armorItem.getComponent("minecraft:durability");
            if (durability) {
                const currentDurability = durability.damage; // Current damage (lower is better)
                const maxDurability = durability.maxDurability;
                const remainingDurability = maxDurability - currentDurability;

                // Get wearable component for protection value
                const wearable = armorItem.getComponent("minecraft:wearable");
                const baseProtection = wearable.protection || 0;

                // Calculate damage reduction based on durability
                const durabilityRatio = remainingDurability / maxDurability;
                const protectionFactor = Math.min(0.8, (20 * durabilityRatio) * 0.04);
                const damageReduction = protectionFactor * baseProtection;

                totalDamageReduction += damageReduction;
            }
        }
    }

    // Calculate final damage taken
    const finalDamage = damage * (1 - Math.min(0.8, totalDamageReduction));

    // Apply the modified damage (reset the player's health manually)
    const healthComponent = hurtEntity.getComponent("minecraft:health");
    const currentHealth = healthComponent.currentValue;
    const newHealth = Math.max(0, currentHealth - finalDamage);

    // Set the player's health to reflect the modified damage
    healthComponent.setCurrentValue(newHealth);
});
