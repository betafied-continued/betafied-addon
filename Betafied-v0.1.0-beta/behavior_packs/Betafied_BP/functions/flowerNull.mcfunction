# Initialize scoreboard objective for flower cycle (runs once if not already set)
scoreboard objectives add FlowerCycle dummy

# Increment FlowerCycle score for all players
scoreboard players add @a FlowerCycle 1

# Reset FlowerCycle score to 0 if it reaches 2 or higher (cycles between 0 and 1)
scoreboard players reset @a[scores={FlowerCycle=2..}] FlowerCycle

# Replace non-dandelion/non-poppy flowers with dandelions for players with FlowerCycle=0
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:azure_bluet
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:oxeye_daisy
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:cornflower
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:lily_of_the_valley
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:allium
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:blue_orchid
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:red_tulip
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:orange_tulip
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:white_tulip
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:pink_tulip
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:sunflower
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:peony
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:rose_bush
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:lilac
execute as @a[scores={FlowerCycle=0}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:dandelion replace minecraft:leaf_litter

# Replace non-dandelion/non-poppy flowers with poppies for players with FlowerCycle=1
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:azure_bluet
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:oxeye_daisy
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:cornflower
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:lily_of_the_valley
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:allium
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:blue_orchid
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:red_tulip
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:orange_tulip
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:white_tulip
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:pink_tulip
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:sunflower
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:peony
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:rose_bush
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:lilac
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:leaf_litter
execute as @a[scores={FlowerCycle=1}] at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:poppy replace minecraft:minecraft:lily_of_the_valley

execute as @a at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:air replace minecraft:cactus_flower
execute as @a at @s run fill ~-39 ~-2 ~-39 ~39 ~2 ~39 minecraft:air replace minecraft:vine