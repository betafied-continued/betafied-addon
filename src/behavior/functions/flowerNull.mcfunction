# Initialize scoreboard objective for flower cycle (runs once if not already set)
scoreboard objectives add FlowerCycle dummy

# Increment FlowerCycle score for the fake player
scoreboard players add Global FlowerCycle 1

# Reset FlowerCycle to 0 if it reaches 2 or higher (cycles between 0 and 1)
execute if score Global FlowerCycle matches 2.. run scoreboard players set Global FlowerCycle 0

# Replace non-dandelion/non-poppy flowers with dandelions when FlowerCycle=0
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:azure_bluet
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:oxeye_daisy
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:cornflower
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:lily_of_the_valley
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:allium
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:blue_orchid
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:red_tulip
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:orange_tulip
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:white_tulip
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:pink_tulip
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:sunflower
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:peony
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:rose_bush
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:lilac
execute if score Global FlowerCycle matches 0 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:dandelion replace minecraft:leaf_litter

# Replace non-dandelion/non-poppy flowers with poppies when FlowerCycle=1
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:azure_bluet
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:oxeye_daisy
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:cornflower
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:lily_of_the_valley
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:allium
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:blue_orchid
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:red_tulip
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:orange_tulip
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:white_tulip
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:pink_tulip
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:sunflower
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:peony
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:rose_bush
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:lilac
execute if score Global FlowerCycle matches 1 at @a[hasitem={location=slot.weapon.mainhand,item=bone_meal}] run fill ~-6 ~-2 ~-6 ~6 ~2 ~6 minecraft:poppy replace minecraft:leaf_litter