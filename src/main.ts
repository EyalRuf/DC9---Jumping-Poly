import Phaser, { Math } from 'phaser';

import PlayScene from './Scenes/PlayScene';
import GGScene from './Scenes/GGScene';

/**
 * Initializing phaser game with imported scenes
 */
new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'content',
    width: 1200,
    height: 700,
    physics: {
        default: 'arcade'
    },
    backgroundColor: "#EDEEC9",
    scene: [
        PlayScene,
        GGScene
    ]
});
