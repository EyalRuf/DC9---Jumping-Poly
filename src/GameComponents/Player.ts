// Imports
import PlayScene, {  JUMP_SOUND_NAME } from "../Scenes/PlayScene";
import GGScene from '../Scenes/GGScene';

// Consts
const GRAVITY = 2000;
const BOUNCINESS: number = 0.4;
const JUMP_FORCE_MAX: number = 1500;
const JUMP_FORCE_MIN: number = 300;
const JUMP_FORCE_INC: number = 50;
const MAX_SPEED: number = 0.75;
const SPEED_INC: number = 0.01;
const MIN_Y_SCALE = 0.5;
const Y_SCALE_INC: number = 0.01;

/**
 * Player class
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    cursorsSecondary: { left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key, cheat: Phaser.Input.Keyboard.Key}
    currXSpeed: number = 0;
    direction: 1 | -1 = 1; // 1 => right, -1 => left
    isOnGround: boolean = false;
    isPreparingJump: boolean = false;
    jumpForce = JUMP_FORCE_MIN;
    scene: PlayScene;
    jumpSound: Phaser.Sound.BaseSound;

    /**
     * Initializes the player class and it's required objects with params
     * @param scene - The scene to spawn the player in
     * @param x - X position to spawn the player in the scene
     * @param y - Y position to spawn the player in the scene
     * @param spriteName - Player sprite name
     */
    constructor(scene: PlayScene | GGScene, x: number, y: number, spriteName: string) {
        super(scene, x, y, spriteName);

        // Adding the player sprite and physics
        scene.physics.add.existing(this);
        scene.add.existing(this);

        // Initializing all class variables and setting default physics
        this.scene = scene as PlayScene;
        this.setBounce(0, BOUNCINESS);
        this.setGravityY(GRAVITY);
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.cursorsSecondary = {
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, true, true),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, true, true),
            cheat: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z, true, true)
        };
        this.jumpSound = this.scene.sound.add(JUMP_SOUND_NAME, {
            loop: false,
            volume: 0.75
        });
    }

    /**
     * Player's update function -> happens every frame
     * @param time - Time passed since game started
     * @param delta - Time passed since last update
     */
    update(time: number, delta: number) {
        // Handling player input        
        this.handleHorizontalMovementInput(delta);
        this.handleJumpInput();

        // Because I'm setting this variable to true every time player touches the ground this essentially makes it
        // false just when you're not on the ground
        // (I don't 100% know why this has to be, but I know that if I remove it all hell breaks loose)
        this.isOnGround = false;

        // Here just in case the teacher can't beat the level and he wants to cheat his way up ;)
        if (this.cursorsSecondary.cheat.isDown) { // Cheat button
            this.y -= 10;
            this.setGravityY(0);
        } else if (this.cursorsSecondary.cheat.isUp) {
            if (this.body.gravity.y == 0) { // Set gravity back to no cheat (only when it was set to cheat in the first place)
                this.setGravityY(GRAVITY);
            }
        }
    }

    /**
     * Handle all jump INPUT related logic
     */
    handleJumpInput() {
        // Not preparing a jump
        if (!this.isPreparingJump) { 
            if (this.cursors.space.isDown) { // Start preparing a jump
                this.isPreparingJump = true;
            }
        } else { // Jump is being prepared
            if (!this.cursors.space.isDown) { // Jump has been released
                if (this.isOnGround) {
                    this.jump(false);
                }
            } else { // Still holding in / preparing the jump
                this.jumpForce += JUMP_FORCE_INC;
                this.jumpForce = this.jumpForce > JUMP_FORCE_MAX ? JUMP_FORCE_MAX : this.jumpForce;
                this.scaleY = this.scaleY <= MIN_Y_SCALE ? MIN_Y_SCALE : this.scaleY - Y_SCALE_INC;
            }
        }
    }

    /**
     * Executes a jump
     * @param onSpiker - whether we jumped on a spiker
     */
    jump(onSpiker: boolean) {
        // Using current body velocity to add on to the jump => jumping twice in succession makes a bigger jump
        let currVelocityY = this.body.velocity.y;

        // If we jumped on spiker and velocity is going down => we don't want to diminish speed but add to it.
        if (onSpiker && currVelocityY > 0) {
            currVelocityY *= -1;
        }

        this.setVelocityY(this.body.velocity.y + (this.jumpForce * -1));

        if (!this.jumpSound.isPlaying) {
            this.jumpSound.play();
        }

        // In case of a big jump I'm moving the player up a bit to avoid sprite
        // teleporting / clipping(because of the scaling)
        if (this.jumpForce > JUMP_FORCE_MAX / 2) {
            this.y -= 32;
        }

        // Resets all jump related variables back to their base values
        this.isPreparingJump = false;
        this.isOnGround = false;
        this.scaleY = 1;
        this.jumpForce = JUMP_FORCE_MIN;
    }

    /**
     * Handles everything horizontal movement related
     * @param deltaTime - Time passed since last frame
     */
    handleHorizontalMovementInput(deltaTime: number) {
        if (this.isOnGround) {
            let isMoving: boolean = this.cursors.left.isDown || this.cursors.right.isDown ||
                this.cursorsSecondary.left.isDown || this.cursorsSecondary.right.isDown;

            // Adding/decreasing speed according to whether we're moving
            this.currXSpeed += isMoving ? SPEED_INC : -SPEED_INC;

            // Ensuring speed boundaries
            if (this.currXSpeed > MAX_SPEED) {
                this.currXSpeed = MAX_SPEED;
            } else if (this.currXSpeed < 0) {
                this.currXSpeed = 0;
            }
            
            // Setting direction and resetting speed if we changed direction
            if (this.cursors.right.isDown || this.cursorsSecondary.right.isDown) {
                if (this.direction == -1) {
                    this.currXSpeed = 0;
                }
                this.direction = 1
            }
            else if (this.cursors.left.isDown || this.cursorsSecondary.left.isDown) {
                if (this.direction == 1) {
                    this.currXSpeed = 0;
                }
                this.direction = -1;
            }
        }
        
        // Applying movement by speed * direction * delta time (delta is to avoid different speeds for different frame rates)
        this.x += this.currXSpeed * deltaTime * this.direction;
        this.ensureBoundaries();
    }

    /**
     * Ensures the player remains within the game boundaries (at least horizontally)
     * + Changes direction if we hit the boundary
     */
    ensureBoundaries() {
        if (this.x <= this.scene.boundaries.xmin || this.x >= this.scene.boundaries.xmax) {
            if (this.x < this.scene.boundaries.xmin)
                this.x = this.scene.boundaries.xmin;
            else if (this.x > this.scene.boundaries.xmax)
                this.x = this.scene.boundaries.xmax;
            
            this.direction *= -1;
        }
    }

    /**
     * Sets variables related to player landing back on the ground
     */
    land() {
        this.isOnGround = true;
    }
}