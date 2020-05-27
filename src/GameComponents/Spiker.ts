// Imports
import PlayScene from "../Scenes/PlayScene";

/**
 * Spiker (enemy) class
 */
export default class Spiker extends Phaser.Physics.Arcade.Sprite {
    currSpeed: number;
    direction: 1 | -1 = 1; // 1 => right, -1 => left
    scene: PlayScene;

    /**
     * Initializes the spiker class and it's required objects with params
     * @param scene - The scene to spawn the spiker in
     * @param x - X position to spawn the spiker in the scene
     * @param y - Y position to spawn the spiker in the scene
     * @param spriteName - Spiker sprite name
     * @param speed - Spiker's horizontal speed
     */
    constructor(scene: PlayScene , x: number, y: number, spriteName: string, speed: number) {
        super(scene, x, y, spriteName);

        // Initialize physics and other variables
        scene.physics.add.existing(this);
        scene.add.existing(this);
        this.currSpeed = speed;
    }

    /**
     * Spikers's update function -> happens every frame
     * @param time - Time passed since game started
     * @param delta - Time passed since last update
     */
    update(time: number, delta: number) {
        this.handleHorizontalMovement(delta);
        this.handleRotation();

        // Avoiding getting pushed by player
        if (this.body.velocity.x != 0 || this.body.velocity.y != 0) {
            this.setVelocity(0, 0);
        }
    }
    
    /**
     * Handles everything horizontal movement related
     * @param deltaTime - Time passed since last frame
     */
    handleHorizontalMovement(deltaTime: number) {
        let nextX = this.x + this.currSpeed * deltaTime * this.direction;
        
        // Change direction when hitting boundaries
        if (nextX <= this.scene.boundaries.xmin || nextX >= this.scene.boundaries.xmax) {
            this.direction *= -1;
        }
        
        this.x += this.currSpeed * deltaTime * this.direction;
    }

    /**
     * Rotating spiker according to it's direction and speed
     */
    handleRotation() {
        this.rotation += this.currSpeed / 10 * this.direction;
    }
}