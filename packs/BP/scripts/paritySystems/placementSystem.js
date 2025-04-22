import { world, Direction, BlockPermutation, system } from '@minecraft/server';

const BLOCK_CONFIGS = {
    CEILING_RESTRICTED: new Set(['minecraft:stone_button', 'minecraft:lever']),
    BOTTOM_ONLY_SLABS: new Set(['minecraft:cobblestone_slab', 'minecraft:oak_slab', 'minecraft:smooth_stone_slab']),
    BOTTOM_ONLY_STAIRS: new Set(['minecraft:oak_stairs', 'minecraft:stone_stairs']),
    VERTICAL_ONLY_LOGS: new Set(['minecraft:oak_log', 'minecraft:birch_log', 'minecraft:spruce_log']),
    STRIPPABLE_LOGS: new Set(['minecraft:oak_log', 'minecraft:birch_log', 'minecraft:spruce_log']),
    AXES: new Set([
        'minecraft:wooden_axe',
        'minecraft:stone_axe',
        'minecraft:iron_axe',
        'minecraft:golden_axe',
        'minecraft:diamond_axe'
    ]),
    SHOVELS: new Set([
        'minecraft:wooden_shovel',
        'minecraft:stone_shovel',
        'minecraft:iron_shovel',
        'minecraft:golden_shovel',
        'minecraft:diamond_shovel'
    ]),
    PATHABLE_BLOCKS: new Set(['minecraft:dirt', 'minecraft:grass_block']) // Corrected 'minecraft:grass' to 'minecraft:grass_block'
};

function preventCeilingPlacement(event) {
    if (!event.itemStack || !BLOCK_CONFIGS.CEILING_RESTRICTED.has(event.itemStack.typeId)) return;
    if (event.blockFace === Direction.Down) event.cancel = true;
}

function preventLogStripping(event) {
    const { itemStack, block } = event;
    if (itemStack && BLOCK_CONFIGS.AXES.has(itemStack.typeId) && BLOCK_CONFIGS.STRIPPABLE_LOGS.has(block.typeId)) {
        event.cancel = true;
    }
}

function preventPathCreation(event) {
    const { itemStack, block, player } = event;
    // Check if the item is a shovel and the block is dirt or grass_block
    if (
        itemStack &&
        BLOCK_CONFIGS.SHOVELS.has(itemStack.typeId) &&
        BLOCK_CONFIGS.PATHABLE_BLOCKS.has(block.typeId)
    ) {
        // Optionally, add a check for block above to ensure path creation is possible
        const blockAbove = block.above();
        if (!blockAbove || blockAbove.isAir) {
            event.cancel = true; // Cancel the path creation action
        }
    }
}

function calculateFacingDirection(viewVector) {
    if (Math.abs(viewVector.x) > Math.abs(viewVector.z)) return viewVector.x > 0 ? 0 : 1;
    return viewVector.z > 0 ? 2 : 3;
}

function handleBlockPlacement(event) {
    const { block, player } = event;

    if (BLOCK_CONFIGS.BOTTOM_ONLY_SLABS.has(block.typeId)) {
        try {
            block.setPermutation(BlockPermutation.resolve(block.typeId, { 'minecraft:vertical_half': 'bottom' }));
        } catch { }
    }

    if (BLOCK_CONFIGS.BOTTOM_ONLY_STAIRS.has(block.typeId)) {
        try {
            const viewVector = player.getViewDirection();
            const newDirection = calculateFacingDirection(viewVector);
            system.runTimeout(() => {
                try {
                    block.setPermutation(BlockPermutation.resolve(block.typeId, {
                        'upside_down_bit': false,
                        'weirdo_direction': newDirection
                    }));
                } catch { }
            }, 1);
        } catch { }
    }

    if (BLOCK_CONFIGS.VERTICAL_ONLY_LOGS.has(block.typeId)) {
        try {
            block.setPermutation(BlockPermutation.resolve(block.typeId, { 'pillar_axis': 'y' }));
        } catch { }
    }
}

function registerEventHandlers() {
    world.beforeEvents.playerInteractWithBlock.subscribe(preventCeilingPlacement);
    world.beforeEvents.playerInteractWithBlock.subscribe(preventLogStripping);
    world.beforeEvents.playerInteractWithBlock.subscribe(preventPathCreation);
    world.afterEvents.playerPlaceBlock.subscribe(handleBlockPlacement);
}

registerEventHandlers();