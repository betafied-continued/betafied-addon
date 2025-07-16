import { world, system, ItemStack, ItemTypes, EquipmentSlot } from "@minecraft/server";

// Runs every 5 seconds
system.runInterval(() => {
  for (const entity of world.getDimension("overworld").getEntities({ type: "zombie_pigman" })) {
    const equippable = entity.getComponent("equippable");
    if (!equippable) continue;

    const currentItem = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (!currentItem || currentItem.typeId !== "minecraft:golden_sword") {
      const sword = new ItemStack(ItemTypes.get("minecraft:golden_sword"), 1);
      equippable.setEquipment(EquipmentSlot.Mainhand, sword);
    }
  }
}, 20); // Every 5 seconds