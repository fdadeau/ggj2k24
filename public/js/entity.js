
import data from "./assets.js";
import { audio } from "./audio.js";

import { FRAME_DELAY } from "./gui.js";

import { KILL_BACK, KILL_FRONT, KILL_LEFT, KILL_RIGHT } from "./player.js";

const SPEED = 0.2;

const WALK_FRONT = [0,2];
const WALK_LEFT = [3,5];
const WALK_RIGHT = [6,8];
const WALK_BACK = [9,11];
const IDLE_FRONT = [1];
const IDLE_LEFT = [4];
const IDLE_RIGHT = [7];
const IDLE_BACK = [10];

const DEAD = [14];
const DIE_FRONT = [1,1,1,1,1,1,1];
const DIE_LEFT = [4,4,4,4,4,4,4];
const DIE_RIGHT = [7,7,7,7,7,7,7];
const DIE_BACK = [10,10,10,10,10,10,10];

const ARRESTED = [17,17,17,17,17,17,17,17,17,17];

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
        this.sprite = data["groom-pink-spritesheet"];
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

        if(this.animation == DEAD || this.animation == ARRESTED){
            let mirrorX = 1;
            if (this.orientation.x <= 0) {
                mirrorX = -1;
            }
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(mirrorX, 1);
            ctx.drawImage(
                this.sprite,
                col * size,
                row * size,
                size,
                size,
                -size / 2,
                -size / 2,
                size * 1.5,
                size * 1.5
            );

            ctx.restore();
            return;
        }

        ctx.drawImage(
            this.sprite, 
            col * size, 
            row * size, 
            size, 
            size, 
            this.x - size/2,
            this.y -size/2,
            size * 1.5, 
            size * 1.5
        );
    }

    isAvailable() {
        return this.talkingTo == null;
    }

    setSprite(s) {
        this.sprite = s;
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

    arrest(arrestedBy, endFlag) {
        this.dialog.end();
        this.arrestedBy = arrestedBy;
        this.endAfterThis = endFlag;
        this.setAnimation(this.whichAnimation());
    }

    die() {
        if (this.talkingTo !== null) {
            this.talkingTo.talkingTo = null;
            this.talkingTo = null;
        }
        this.dialog.end();
        this.alive = false;
        this.setAnimation(
            this.whichAnimation()
        );
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
        if(this.arrestedBy != null){
            return ARRESTED;
        }
        if(this.alive !== undefined && !this.alive){
            if (this.orientation.x > 0) {
                return DIE_RIGHT;
            }
            if (this.orientation.x < 0) {
                return DIE_LEFT
            }
            if (this.orientation.y < 0) {
                return DIE_BACK;
            }
            return DIE_FRONT;
        }
        // determine animation
        if (this.vecX == 0 && this.vecY == 0) {
            // not moving --> maybe only use IDLE_FRONT ?*
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
            
            if(this.frame+1 == this.animation.length && (this.animation == KILL_BACK || this.animation == KILL_FRONT || this.animation == KILL_LEFT || this.animation == KILL_RIGHT)){
                if(this.endAfterThis != undefined){
                    this.endGame = this.endAfterThis;
                }else{
                    this.setAnimation(this.whichAnimation());
                    this.switchAfterKill.to.setSprite(this.sprite);
                    this.setSprite(this.switchAfterKill.skin);
                }
            }

            if(this.frame+1 == this.animation.length && (this.animation == DIE_BACK || this.animation == DIE_FRONT || this.animation == DIE_LEFT || this.animation == DIE_RIGHT)){
                this.setAnimation(DEAD);
            }

            if(this.frame+1 == this.animation.length && this.animation == ARRESTED){
                console.log("ARRESTED", this);
                this.arrestedBy.endGame = this.endAfterThis;
            }
            this.frameDelay = FRAME_DELAY;
            this.frame = (this.frame + 1) % this.animation.length;
        }
    }

}
