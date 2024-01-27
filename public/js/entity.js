
import data from "./assets.js";

import { FRAME_DELAY } from "./gui.js";


const SPEED = 0.2;

const WALK_FRONT = [0,1,2];
const WALK_LEFT = [3,4,5];
const WALK_RIGHT = [6,7,8];
const WALK_BACK = [9,10,11];
const IDLE_FRONT = [1];
const IDLE_LEFT = [4];
const IDLE_RIGHT = [7];
const IDLE_BACK = [10];

const DEAD = [10];

/**
 * Abstract class for entities
 */
export class Entity {

    constructor(x,y,vecX,vecY,size) {
        /** @type {number} X position */
        this.x = x;
        /** @type {number} Y position */
        this.y = y;
        /** @type {number} X direction */
        this.vecX = vecX;
        /** @type {number} Y direction */
        this.vecY = vecY;
        /** @type {number} size of the player (hitbox) */
        this.size = size;
        /** @type {number} speed of the player */
        this.speed = SPEED;
        /** @type {Entity} entity to which the player is currently talking to */
        this.talkingTo = null;

        /** @type {Object} orientation of the player {x, y} */
        this.orientation = { x: vecX || 1, y: vecY };

        /** Animation */
        this.animation = this.whichAnimation();
        this.frame = 0;
        this.frameDelay = FRAME_DELAY;
        /** @type {Image} spritesheet used for the entity */
        this.sprite = data["default-spritesheet"];
    }

    update(dt) {
        this.x += this.vecX * this.speed * dt;
        this.y += this.vecY * this.speed * dt;

    }

    render(ctx) {
        let size = 48;
        let frame = this.animation[this.frame];
        let col = frame % 3;
        let row = Math.floor(frame / 3);

        ctx.drawImage(
            this.sprite, 
            col * size, 
            row * size, 
            size, 
            size, 
            this.x - size/2,
            this.y -size/2,
            size, 
            size
        );
        
        /*
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
        */
    }

    isAvailable() {
        return this.talkingTo == null;
    }

    /**
     * Set the entity's orientation to face a given point
     * @param {number} x 
     * @param {number} y 
     */
    setOrientationToFace(x,y) {
        const dX = this.x - x;
        const dY = this.y - y;
        if (Math.abs(dX) > Math.abs(dY)) {
            // horizontal orientation
            this.orientation.y = 0;
            this.orientation.x = dX < 0 ? 1 : -1;
        }
        else {  // vertical orientation
            this.orientation.x = 0;
            this.orientation.y = dY < 0 ? 1 : -1;
        }
    }

    talk(who) {
        this.talkingTo = who;
        who.talkingTo = this;
    }

    /** Sets the animation */
    setAnimation(anim){
        if (this.animation !== anim) {
            this.animation = anim;
            this.frameDelay = FRAME_DELAY;
            this.frame = 0;
        }
    }
    whichAnimation() {
        if(this.alive !== undefined && !this.alive){
            return DEAD;
        }
        // determine animation
        if (this.vecX == 0 && this.vecY == 0) {
            // not moving --> maybe only use IDLE_FRONT ?
            if (this.orientation.x > 0) {
                return IDLE_RIGHT;
            }
            if (this.orientation.x < 0) {
                return IDLE_LEFT;
            }
            if (this.orientation.y < 0) {
                return IDLE_BACK;
            }
            return IDLE_FRONT;
        }
        if (this.vecX > 0) {
            return WALK_RIGHT;
        }
        if (this.vecX < 0) {
            return WALK_LEFT;
        }
        if (this.vecY < 0) {
            return WALK_BACK;
        }
        return WALK_FRONT;
    }
    updateAnimation(dt) {
        this.frameDelay -= dt;
        if (this.frameDelay <= 0) {
            this.frameDelay = FRAME_DELAY;
            this.frame = (this.frame + 1) % this.animation.length;
        }
    }

}
