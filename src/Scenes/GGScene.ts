// Imports
import Phaser from 'phaser';
import Player from '../GameComponents/Player';
import { SceneBoundaries } from './PlayScene';

// Consts
const PLAYER_SPRITE_NAME = 'player';
const PLAYER_SPRITE_PATH = '../assets/player.png';
const PLATFORM_SPRITE_NAME = 'platform';
const PLATFORM_SPRITE_PATH = '../assets/platform.png';
const PRINCESS_SPRITE_NAME = 'princess';
const PRINCESS_SPRITE_PATH = '../assets/princess.png';
const SAVED_PRINCESS_SOUND_NAME = 'SavedPrincess';
const SAVED_PRINCESS_SOUND_PATH = '../assets/SavedPrincess.mp3';
const levelHeight: number = 700;

/**
 * GGscene class
 */
export default class GGScene extends Phaser.Scene {
    player: Player;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    boundaries: SceneBoundaries;
    wallTileSize: number = 64;

    /**
     * Scene constructor
     */
    constructor() {
        super({
            key: 'GGScene'
        });
    }

    /**
    * Loading all scene assets
    */
    preload() {
        this.load.image(PLAYER_SPRITE_NAME, PLAYER_SPRITE_PATH);
        this.load.image(PLATFORM_SPRITE_NAME, PLATFORM_SPRITE_PATH);
        this.load.image(PRINCESS_SPRITE_NAME, PRINCESS_SPRITE_PATH);
        this.load.audio(SAVED_PRINCESS_SOUND_NAME, [SAVED_PRINCESS_SOUND_PATH]);
    }

    /**
     * Scene creation function
     */
    create() {
        // Creating scene boundaries
        this.boundaries = {
            xmin: this.wallTileSize,
            xmax: this.game.config.width as number - this.wallTileSize,
            ymax: levelHeight,
            ymin: 0
        }
        
        // Creating and saving player game obejct
        this.player = new Player(this, this.boundaries.xmax * 0.35, 50, PLAYER_SPRITE_NAME);

        // Creating platforms and their collider
        this.platforms = this.physics.add.staticGroup();
        this.buildPlatforms();
        this.physics.add.collider(this.player, this.platforms, this.playerCollidedWithPlatform, () => true, this);

        // Setting camera values
        this.cameras.main.setBounds(0, 0, this.boundaries.xmax, this.boundaries.ymax, true);
        this.cameras.main.startFollow(this.player, false, 1, 0.1);

        // Creating GG texts, sprites, and sound
        let textX = this.boundaries.xmax * 0.65;
        let textY = this.boundaries.ymax / 2;

        this.add.text(textX, textY, "YOU WIN!", {
            fontSize: "70px",
            color: "000"
        });
        this.add.text(textX, textY + 150, "F5 to try again", {
            fontSize: "36px",
            color: "000"
        });

        this.add.sprite(textX + 150, textY + 100, PRINCESS_SPRITE_NAME);
        this.sound.add(SAVED_PRINCESS_SOUND_NAME).play();
    }

    /**
     * Scene's update function -> happens every frame
     * @param time - Time passed since game started
     * @param delta - Time passed since last update
     */
    update(time: number, delta: number) {
        super.update(time, delta);
        this.player.update(time, delta);
    }

    /**
     * Builds level wall and floor
     */
    buildPlatforms() {
        let xmin = this.boundaries.xmin - this.wallTileSize;
        let xmax = this.boundaries.xmax + this.wallTileSize;
        let ymax = this.boundaries.ymax;

        // Walls
        for (let i = 0; i < levelHeight + this.wallTileSize; i += this.wallTileSize) {
            this.platforms.create(xmin, i, PLATFORM_SPRITE_NAME);
            this.platforms.create(xmax, i, PLATFORM_SPRITE_NAME);
        }

        // Floor
        for (let i = 0; i < xmax; i += this.wallTileSize) {
            this.platforms.create(i, ymax, PLATFORM_SPRITE_NAME);
        }
    }

    /**
     * Letting player know we collided with platform
     */
    playerCollidedWithPlatform() {
        this.player.land()
    }
}