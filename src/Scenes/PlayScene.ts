// Imports
import Phaser from 'phaser';
import Player from '../GameComponents/Player';
import Spiker from '../GameComponents/Spiker';

// Consts
const PLAYER_SPRITE_NAME = 'player';
const PLAYER_SPRITE_PATH = '../assets/player.png';
const PLATFORM_SPRITE_NAME = 'platform';
const PLATFORM_SPRITE_PATH = '../assets/platform.png';
const PRINCESS_SPRITE_NAME = 'princess';
const PRINCESS_SPRITE_PATH = '../assets/princess.png';
const SPIKER_SPRITE_NAME = 'spiker';
const SPIKER_SPRITE_PATH = '../assets/spiker.png';
const BGMUSIC_NAME = 'BGMusic';
const BGMUSIC_PATH = '../assets/BGMusic.mp3';
const SPIKE_HIT_SOUND_NAME = 'spike';
const SPIKE_HIT_SOUND_PATH = '../assets/spike.mp3';
export const JUMP_SOUND_NAME = 'Jump';
const JUMP_SOUND_PATH = '../assets/Jump.mp3';
const levelHeight: number = 6000;

/**
 * PlayScene class
 */
export default class PlayScene extends Phaser.Scene {
	player: Player;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    boundaries: SceneBoundaries;
    wallTileSize: number = 64;
    spikers: Spiker[];
    spikerHitSound: Phaser.Sound.BaseSound;

    /**
     * Scene constructor
     */
	constructor() {
        super({
            key: 'PlayScene'
		});
	}
    
    /**
     * Loading all scene assets
     */
	preload() {
        this.load.image(PLAYER_SPRITE_NAME, PLAYER_SPRITE_PATH);
        this.load.image(PLATFORM_SPRITE_NAME, PLATFORM_SPRITE_PATH);
        this.load.image(PRINCESS_SPRITE_NAME, PRINCESS_SPRITE_PATH);
        this.load.image(SPIKER_SPRITE_NAME, SPIKER_SPRITE_PATH);
        this.load.audio(BGMUSIC_NAME, [BGMUSIC_PATH]);
        this.load.audio(SPIKE_HIT_SOUND_NAME, [SPIKE_HIT_SOUND_PATH]);
        this.load.audio(JUMP_SOUND_NAME, [JUMP_SOUND_PATH]);
	}

    /**
     * Scene creation function
     */
    create() {
        // Creating scene boundaries (useful for multiple objects)
        this.boundaries = {
            xmin: this.wallTileSize,
            xmax: this.game.config.width as number - this.wallTileSize,
            ymax: levelHeight,
            ymin: 0
        }

        // Creating and saving player game obejct
        this.player = new Player(this, this.boundaries.xmax / 2, this.boundaries.ymax - this.wallTileSize, PLAYER_SPRITE_NAME);

        // Creating platforms and spikers (enemeies)
        this.platforms = this.physics.add.staticGroup();
        this.buildPlatforms();
        this.spawnSpikers();

        // Creating colliders for platforms and spikers
        this.physics.add.collider(this.player, this.platforms, this.playerCollidedWithPlatform, null, this);
        this.spikers.forEach(currSpiker => this.physics.add.collider(currSpiker, this.player, null, this.playerCollidedWithSpiker), this);

        // Setting camera values
        this.cameras.main.setBounds(0, 0, this.boundaries.xmax, this.boundaries.ymax, true);
        this.cameras.main.startFollow(this.player, false, 1, 0.1);
        
        // Loading scene related sounds
        this.spikerHitSound = this.sound.add(SPIKE_HIT_SOUND_NAME, { // Spiker hit sound
            loop: false,
            volume: 0.75
        });
        this.sound.add(BGMUSIC_NAME, { // Background music
            loop: true,
            volume: 0.25
        }).play();
	}

    /**
     * Scene's update function -> happens every frame
     * @param time - Time passed since game started
     * @param delta - Time passed since last update
     */
    update(time: number, delta: number) {
        super.update(time, delta);

        // Updating game obejcts that need to be updated
        this.player.update(time, delta);
        this.spikers.forEach(currSpiker => currSpiker.update(time, delta));
    }

    /**
     * Builds level platforms randomly based on some constant variables and some hard coded values
     */
    buildPlatforms() {
        let xmin = this.boundaries.xmin - this.wallTileSize; // Min x to spawn in
        let xmax = this.boundaries.xmax + this.wallTileSize; // Max x to spawn in
        let ymax = this.boundaries.ymax; // Max y to spawn in (bottom of screen)
        let currY = ymax; // Indicates y where the next platform will be created in
        let minPlatformLength = 2;
        let maxPlatformLength = 12;
        let minHeightBetweenPlatforms = 300;
        let maxHeightBetweenPlatforms = 550;
        let avgHeightBetweenPlatforms = (minHeightBetweenPlatforms + maxHeightBetweenPlatforms) / 2;

        // Walls
        for (let i = 0; i < levelHeight + this.wallTileSize; i += this.wallTileSize) {
            this.platforms.create(xmin, i, PLATFORM_SPRITE_NAME);
            this.platforms.create(xmax, i, PLATFORM_SPRITE_NAME);
        }

        // Floors
        // First (bottom of screen) floor
        for (let i = 0; i < xmax; i += this.wallTileSize) {
            this.platforms.create(i, ymax, PLATFORM_SPRITE_NAME);
        }

        // Rest of platforms (screen size / avg size between each platform) = amount of platforms to fit screen
        let amountOfPlatforms = Math.floor((ymax / avgHeightBetweenPlatforms)) - 1;
        for (let platformIndex = 0; platformIndex < amountOfPlatforms; platformIndex++) {
            // Random height between the prev platform
            currY -= minHeightBetweenPlatforms +
                Math.floor(Math.random() * (maxHeightBetweenPlatforms - minHeightBetweenPlatforms));

            // Random platform size/length
            let currPlatformLength = minPlatformLength +
                Math.floor(Math.random() * (maxPlatformLength - minPlatformLength));

            // Even platforms = right side of screen, odd platforms = left side of screen
            let currStartX = xmax / 2;
            let currMaxX = xmax - (currPlatformLength * this.wallTileSize);
            if ((platformIndex % 2) != 0) {
                currStartX = xmin;
                currMaxX = xmax / 2;
            } 

            // Randoming x to spawn platforms from
            let randomX = currStartX + Math.floor(Math.random() * (currMaxX - currStartX));

            // Spawning current platform tiles
            for (let currPlatformTileIndex = 0; currPlatformTileIndex < currPlatformLength; currPlatformTileIndex++) {
                this.platforms.create(randomX + (currPlatformTileIndex * this.wallTileSize), currY, PLATFORM_SPRITE_NAME);
            }

            // Last/top platform
            if (platformIndex == amountOfPlatforms - 1) {
                this.spawnPrincess(randomX + ((currPlatformLength / 2) * this.wallTileSize), currY - this.wallTileSize);
            }
        }
    }

    /**
     * Spawn enemies/spikers randomly based on some constant variables and some hard coded values
     */
    spawnSpikers() {
        let spikerMinY = this.boundaries.ymax * 0.15; // Highest spiker y (closer to 0)
        let spikerMaxY = this.boundaries.ymax * 0.75; // Lowest spiker y (further from 0)
        let minSpikerSpawnDistance = spikerMaxY / 10; // Min distance between 2 spikers
        let maxSpikerSpawnDistance = spikerMaxY / 6; // Max distance between 2 spikers
        
        this.spikers = [];
        
        // Randoming first spiker y
        let randomDistanceBetweenSpikers = Math.floor(Math.random() * (maxSpikerSpawnDistance - minSpikerSpawnDistance));
        let currSpikerY = spikerMaxY + randomDistanceBetweenSpikers;
        
        // As long as currSpikerY is not above the min spiker spawning y
        while (currSpikerY > spikerMinY) {
            // Randoming spiker speed and adding him to array
            let speed = 0.05 + (Math.random() * 0.5);
            this.spikers.push(new Spiker(this, this.boundaries.xmax / 2, currSpikerY, SPIKER_SPRITE_NAME, speed));
            
            // Randoming next spiker y
            randomDistanceBetweenSpikers =
                minSpikerSpawnDistance + Math.floor(Math.random() * (maxSpikerSpawnDistance - minSpikerSpawnDistance));
            currSpikerY -= randomDistanceBetweenSpikers;
        }
    }

    /**
     * Spawns princess on given position
     * @param x - x position to spawn princess
     * @param y - y position to spawn princess
     */
    spawnPrincess(x: number, y: number) {
        let princess = this.physics.add.sprite(x, y, PRINCESS_SPRITE_NAME);
        this.physics.add.collider(this.player, princess, this.playerCollidedWithPrincess, () => true, this);
    }

    /**
     * Collision between player and platform
     */
    playerCollidedWithPlatform() {
        // Just letting the player know we collided on a platform
        this.player.land()
    }

    /**
     * Collision between player and princess
     */
    playerCollidedWithPrincess() {
        // Switching to winning scene
        this.game.scene.switch("PlayScene", "GGScene");
    }

    /**
     * Collision between player and spiker
     * @param s - spiker
     * @param p - player
     */
    playerCollidedWithSpiker(s: Spiker, p: Player) {
        // If player is above spiker
        if (p.y < s.y) {
            // Jump on spiker
            p.jump(true);
        } else {
            // If p is on ground ? push him : change his direction
            if (p.isOnGround) {
                p.currXSpeed = 1;
            } else {
                p.direction *= -1;
            }

            if (!p.scene.spikerHitSound.isPlaying) {
                p.scene.spikerHitSound.play();
            }
        }
    }
}

/**
 * Type for scene boundaries
 */
export type SceneBoundaries = {
    xmin: number,
    xmax: number,
    ymin: number,
    ymax: number
}