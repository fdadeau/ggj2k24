
import data from "./assets.js";

import { audio } from "./audio.js";

import { Player } from "./player.js";

import { Dialog } from "./dialog.js";

export const FRAME_DELAY = 100;

const SPEED = 0.2;

const WALK_FRONT = [0,1,2,1];
const WALK_LEFT = [3,4,5,4];
const WALK_RIGHT = [6,7,8,7];
const WALK_BACK = [9,10,11,10];

const IDLE_FRONT = [1];
const IDLE_LEFT = [4];
const IDLE_RIGHT = [7];
const IDLE_BACK = [10];

const DEAD = [14];
/*
const DIE_FRONT = [1,1,1,1,1,1,1];
const DIE_LEFT = [4,4,4,4,4,4,4];
const DIE_RIGHT = [7,7,7,7,7,7,7];
const DIE_BACK = [10,10,10,10,10,10,10];
*/

const ARRESTED = [17,17,17,17,17,17,17,17,17,17];

const KILL_FRONT = [12,13,12,13,12,13];
const KILL_RIGHT = [15,16,15,16,15,16];
const KILL_LEFT = [18,19,18,19,18,19];
const KILL_BACK = [21,22,21,22,21,22];

const ARREST_FRONT = [1,1,1,1,1,1,1];
const ARREST_LEFT = [4,4,4,4,4,4,4];
const ARREST_RIGHT = [7,7,7,7,7,7,7];
const ARREST_BACK = [10,10,10,10,10,10,10];

const SPRITE_W = 48, SPRITE_H = 72;

// possible current actions (that require to update the entity state once the action is over)
const ACTION = { KILLS: 3, ARRESTS: 4}
const ARREST = { BEING_ARRESTED: 5, HAS_BEEN_ARRESTED: 6 };

const DEBUG = true;

/**
 * Abstract class for entities (PNJ, Player, Adversary) 
 * All are considered equally, but: 
 *    - PNJs follow their own scenarios
 *    - Player is controlled by the user
 *    - Adversary is controlled through messages received by the socket
 */
export class Entity {

    /**
     * Creates a character. 
     * @param {number} x starting X
     * @param {number} y starting Y
     * @param {number} vecX starting vecX
     * @param {number} vecY starting vecY
     * @param {string} skin spritesheet used for the skin
     * @param {Array} dialog dialog line of the character
     */
    constructor(x,y,vecX,vecY,skin,dialog) {
        /** @type {number} X position */
        this.x = x;
        /** @type {number} Y position */
        this.y = y;
        /** @type {number} X direction */
        this.vecX = vecX;
        /** @type {number} Y direction */
        this.vecY = vecY;
        /** @type {number} size of the character (hitbox) */
        this.size = 20;
        /** @type {number} speed of the character */
        this.speed = SPEED;

        /** @type {Object} orientation of the player {x, y} */
        this.orientation = { x: vecX || 1, y: vecY };

        // Dialogs 
        /** @type {Dialog} Dialog associated to the character */
        this.dialog = new Dialog(dialog);
        /** @type {Entity} entity to which the character is currently talking to */
        this.talkingTo = null;

        /** Life status of the character */
        this.alive = true;
        /** Arrested status */
        this.arrested = 0;  // 0: not arrested, otherwise ARREST.BEING_ARRESTED or ARREST.HAS_BEEN_ARRESTED
        /** Current action being performed */
        this.action = 0;    // 0 none specific (walk or talk), otherwise ACTION.KILLS or ACTION.ARRESTS
        /** Character that has been arrested (police usage only) */
        this.hasArrested = null;

        /** @type {Image} spritesheet used for the entity */
        this.sprite = data[skin];
        /** Animation */
        this.animation = this.whichAnimation();
        this.frame = 0;
        this.frameDelay = FRAME_DELAY;

        
    }


    //// --- Movement ----

    /**
     * Updates the character's state. 
     * @param {number} dt elapsed time since last update
     * @returns 
     */
    update(dt) {
        if (!this.alive) {
            return;
        }
        if (this.arrested) {
            return;
        }
        // Updating animation
        this.updateAnimation(dt);
        // no movement if player is talking to a PNJ
        if (this.talkingTo !== null) {
            if (this.dialog.speaker == this.id) {
                if (!this.dialog.isRunning()) {
                    this.endTalking();  // remove dialog link
                }
                else {  // dialog is not over --> update it
                    this.dialog.update();
                }
            }
            return;
        }
        const newX = this.x + this.vecX * SPEED * dt;
        const newY = this.y + this.vecY * SPEED * dt;
        if (!this.hitsSomething(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
    }


    /**
     * Checks if the current entity is hitting something that prevents from moving.  
     * @param {number} newX new X coordinate 
     * @param {number} newY new Y coordinate
     * @returns 
     */
    hitsSomething(newX, newY) {
        return false;
    }


    //// ---- RENDERING character & dialogs -----

    /**
     * Renders the character
     * @param {CanvasRenderingContext2D} ctx the context to draw on.
     */
    render(ctx) {
        let frame = this.animation[this.frame];
        let col = frame % 3;
        let row = Math.floor(frame / 3);

        let mirrorX = 1;
        if((!this.alive || this.arrested) && this.orientation.x < 0) {
            mirrorX = -1;
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(mirrorX, 1);
        ctx.drawImage(this.sprite, col * SPRITE_W, row * SPRITE_W, SPRITE_W, SPRITE_W, -SPRITE_H/2, -SPRITE_H/2, SPRITE_H, SPRITE_H);
        ctx.restore();
        
        // draw hitbox
        ctx.strokeStyle = "red";
        ctx.strokeRect(this.x - SPRITE_H/2, this.y - SPRITE_H/2, SPRITE_H, SPRITE_H);
        ctx.strokeRect(this.x-1, this.y+SPRITE_H/2-1, 3, 3);
    }

    renderDialog(ctx) {
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y, this instanceof Player || this.talkingTo instanceof Player);
        }
    } 


    collidesWith(x,y,w,h) {

    }


    /// --- Talking sequence --- 

    /**
     * Initiate a dialog with another entity
     * @param {Entity} who the entity to talk to
     */
    startTalkingWith(who) {
        DEBUG && console.log("startTalkingWith", who.id);
        this.vecX = 0;
        this.vecY = 0;
        this.setOrientationToFace(who.x, who.y);
        this.setAnimation(this.whichAnimation());
        this.talkingTo = who;
        who.respondsTo(this);
    }
    /**
     * Called to start a discussion.
     * @param {Entity} who the entity that started the discussion
     */
    respondsTo(who) {
        DEBUG && console.log("respondsTo", who.id);
        this.vecX = 0;
        this.vecY = 0;
        this.setOrientationToFace(who.x, who.y);
        this.setAnimation(this.whichAnimation());
        this.talkingTo = who;
        this.dialog.start(this.id);
    }
    /**
     * Ends talking and continues its activites.
     */
    endTalking() {
        DEBUG && console.log("endTalking", this.id);
        let d = this.dialog.getDuration();
        this.talkingTo.release(d);
        this.release(d);
    }
    /**
     * Releases character (not talking to anyone anymore)
     * @param {number} delay elapsed time during dialog 
     */    
    release(delay) { 
        DEBUG && console.log("release", this.id);
        this.talkingTo = null;
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

    //// --- Interactions ---

    /**
     * Check if character is available for interaction
     * @returns true if the character is alive and not talking to anyone
     */
    isAvailable() {
        return this.talkingTo == null && this.alive && !this.arrested;
    }
    
    /**
     * Arrests another player. 
     * To be called by the player or the adversary, not by a PNJ. 
     * @param {Entity} who character that is being arrested
     */
    arrests(who) {
        if (this.role == "police" && this.talkingTo == who) {
            DEBUG && console.log("arrests", who.id);
            //who.dialog.end();
            who.arrested = ARREST.BEING_ARRESTED;
            this.action = ACTION.ARRESTS;
            this.setAnimation(this.whichAnimation());
        }
    }
    /**
     * Called after arrestation phase is over. 
     */
    afterArrests() {
        DEBUG && console.log("after arrests");
        this.hasArrested = this.talkingTo;
        this.talkingTo.arrested = ARREST.HAS_BEEN_ARRESTED;
        this.endTalking();
        this.action = 0;
        this.setAnimation(this.whichAnimation());
        this.hasArrested.setAnimation(this.hasArrested.whichAnimation());
    }
    /**
     * 
     * @returns 
     */
    hasBeenArrested() {
        return this.arrested == ARREST.HAS_BEEN_ARRESTED;
    }

    kills(who) {
        DEBUG && console.log("kills", who.id)
        if (this.role == "killer" && this.talkingTo == who && who.dialog.speaker == who.id) {
            who.dialog.end();
            this.action = ACTION.KILLS;
            this.setAnimation(this.whichAnimation());
        }        
    }
    afterKills() {
        DEBUG && console.log("after kills");
        // killed policeman --> being arrested
        this.action = 0;
        this.setAnimation(this.whichAnimation());
        if (this.talkingTo.role == "police") {
            this.talkingTo.arrests(this);
            return;
        }
        // otherwise kills other character
        this.talkingTo.die();
        // steal sprite
        const spBackup = this.talkingTo.sprite;
        this.talkingTo.sprite = this.sprite;
        this.sprite = spBackup;
        // steal dialog
        this.dialog = this.talkingTo.dialog;
        // release bound
        this.release();
    }
    die() {
        if (this.talkingTo !== null) {
            this.talkingTo = null;
            this.alive = false;
            this.setAnimation(this.whichAnimation());
            audio.playSound("die", 42, 0.5, false);
        }
    }

    //// --- GAME END ---
    hasLost() {
        return this.role == "killer" && this.hasBeenArrested() || 
               this.role == "police" && this.hasArrested != null && this.hasArrested.role === undefined;
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
        if(this.arrested > 0) {
            return ARRESTED;
        }
        // is dead
        if(!this.alive){
            return DEAD;
        }
        // action of killing
        if (this.action == ACTION.KILLS) {
            if (this.orientation.x > 0) {
                return KILL_RIGHT;
            }
            if (this.orientation.x < 0) {
                return KILL_LEFT;
            }
            if (this.orientation.y > 0) {
                return KILL_FRONT;
            }
            return KILL_BACK;
        }
        // action of arresting 
        if (this.action == ACTION.ARRESTS) {
            if (this.orientation.x > 0) {
                return ARREST_RIGHT;
            }
            if (this.orientation.x < 0) {
                return ARREST_LEFT;
            }
            if (this.orientation.y > 0) {
                return ARREST_FRONT;
            }
            return ARREST_BACK;
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
            // next frame
            this.frame++;
            this.frameDelay = FRAME_DELAY;
            // if out of frame range
            if (this.frame >= this.animation.length && this.action == ACTION.KILLS) {
                this.afterKills();
                return;
            }
            if (this.frame >= this.animation.length && this.action == ACTION.ARRESTS) {
                this.afterArrests();
                return;
            }
            if (this.frame >= this.animation.length) {
                this.frame = 0;
            }
        }
    }

}
