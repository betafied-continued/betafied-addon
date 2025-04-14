import { world, Direction, BlockPermutation, system } from '@minecraft/server';

const BLOCK_CONFIGS = {
    CEILING_RESTRICTED: new Set(['minecraft:stone_button', 'minecraft:lever']),
    BOTTOM_ONLY_SLABS: new Set(['minecraft:cobblestone_slab', 'minecraft:oak_slab']),
    BOTTOM_ONLY_STAIRS: new Set(['minecraft:oak_stairs', 'minecraft:cobblestone_stairs']),
    VERTICAL_ONLY_LOGS: new Set(['minecraft:oak_log', 'minecraft:birch_log', 'minecraft:spruce_log'])
};

function preventCeilingPlacement(event) {
    if (!event.itemStack || !BLOCK_CONFIGS.CEILING_RESTRICTED.has(event.itemStack.typeId)) return;
    if (event.blockFace === Direction.Down) event.cancel = true;
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
    world.afterEvents.playerPlaceBlock.subscribe(handleBlockPlacement);
}

registerEventHandlers();