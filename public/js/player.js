
import data from "./assets.js";

import { Entity } from "./entity.js";
import { Adversary, Dialog } from "./pnj.js";

import { FRAME_DELAY } from "./gui.js";
import { audio } from "./audio.js";
import { WIDTH, HEIGHT } from "./app.js";

const SPEED = 0.2;

const UP = 1, DOWN = 3, LEFT = 4, RIGHT = 2, TALK = 10;

const COMMANDS = { "ArrowUp": UP, "ArrowDown": DOWN, "ArrowLeft": LEFT, "ArrowRight": RIGHT, "Space": TALK };

export const INTERACTION_TIMER = 5000;

export const END_GAME_STATE = {"WIN": 1, "LOSE": -1, "RUNNING": 0};

export const KILL_FRONT = [12,13,12,13,12,13];
export const KILL_RIGHT = [15,16,15,16,15,16];
export const KILL_LEFT = [18,19,18,19,18,19];
export const KILL_BACK = [21,22,21,22,21,22];

export const ARREST_FRONT = [1,1,1,1,1,1,1];
export const ARREST_LEFT = [4,4,4,4,4,4,4];
export const ARREST_RIGHT = [7,7,7,7,7,7,7];
export const ARREST_BACK = [10,10,10,10,10,10,10];

export class Player extends Entity {

    constructor(role, map, skin) {
        super(0,0,0,0,20);
        /** @type {string} role of the player "police", "killer" */
        this.role = role;
        /** @type {Map} map of the level */
        this.map = map;
        // coordinates of the player
        const {x, y} = map.getPlayerStart(this);
        this.x = x;
        this.y = y;
        // segments defining the field of vision
        this.FOV = [];
        /** @type {Object} entity (PNJ or adversary) that is the closest { pnj, distance } */
        this.closestPNJ = null;
        /** @type {Entity} entity the player is currently talking to (null if none) */
        this.talkingTo = null;

        // Tells if the game ended and how
        this.endGame = END_GAME_STATE.RUNNING;

        // Timer between two interactions with other entity
        this.timeToInteract = -1;

        // Dialogs
        this.dialog = (role == "police") ? 
        new Dialog([[0,"Ecoutez laissez la police faire son travail.", 1000],[0,"Dès que nous aurons de plus amples informations,", 1000],[0,"vous en serez les premiers informés.",1000]]) :
        new Dialog([[0,"Tu veux un whisky ?",1000]]);

        this.sprite = data[skin];
        this.animation = this.whichAnimation();
        this.switchAfterKill = null;

        audio.playSound("footsteps",1,1,true);
    }

    update(dt) {
        // no movement if player is talking to a PNJ
        if (this.talkingTo !== null) {
            if (!this.dialog.isRunning() && !this.talkingTo.dialog.isRunning()) {
                // remove "talk link" between player and PNJ
                this.talkingTo = null;
            }else {  // dialog is not over --> update it
                this.dialog.update();
            }
            return;
        }
        const newX = this.x + this.vecX * SPEED * dt;
        const newY = this.y + this.vecY * SPEED * dt;
        const wall = this.map.isTooCloseFromOneWall(newX, newY, this.size);
        if (wall == null) {
            this.x = newX;
            this.y = newY;
            if(this.vecX != 0 || this.vecY != 0){
                if(!audio.audioIsPlaying(1)){
                    audio.resume(1);
                }
            }else{
                if(audio.audioIsPlaying(1)){
                    audio.pause(1);
                }
            }
        }else{
            if(audio.audioIsPlaying(1)){
                audio.pause(1);
            }
        }

        if(this.timeToInteract > 0){
            this.timeToInteract -= dt;
        }

        // Updating animation
        this.updateAnimation(dt);

        // TODO: go against a wall 
    }

    setAnimation(anim){
        this.animation = anim;
        this.frameDelay = FRAME_DELAY;
        this.frame = 0;
    }

    render(ctx) {
        super.render(ctx);       
    }

    renderDialog(ctx) {
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y, true);
        }
    } 


    /** Check if the object/character at position(x,y) is seen by the player */
    sees(x,y) {
        return this.map.getRoomFor(this.x, this.y) == this.map.getRoomFor(x,y);
    }

    getInteraction() {
        if (!this.isAvailable() && this.timeToInteract < INTERACTION_TIMER) {
            return { wait: { current: this.timeToInteract, total: INTERACTION_TIMER } };
        }
        if (this.closestPNJ != null && this.talkingTo != null) {
            return { action: this.role == "killer" ? "stab" : "arrest" };
        }
        return null;
    }

    /** 
     * Start discussion if character is close to the player and available. 
     */
    talk() {
        if (this.closestPNJ !== null && this.closestPNJ.pnj.isAvailable() && this.isAvailable()) {
            this.vecX = 0;
            this.vecY = 0;
            this.closestPNJ.pnj.talk(this);
            this.talkingTo = this.closestPNJ.pnj;
            this.setOrientationToFace(this.closestPNJ.pnj.x, this.closestPNJ.pnj.y);
            this.setAnimation(this.whichAnimation());
            this.timeToInteract = INTERACTION_TIMER;
            if(audio.audioIsPlaying(1)){
                audio.pause(1);
            }
        }
    }

    talkWithAdversary(adversary){
        if(adversary.isAvailable()){
            this.talkingTo = adversary;
            this.dialog.start();
        }
    }

    /** 
     * Check if the player is available.
     * @returns true if one can interact with the character 
     */
    isAvailable() {
        return this.timeToInteract <= 0;
    }


    /**
     * Interact with the closest PNJ
     */
    interact(){
        if(this.talkingTo != null){
            if(this.role == "killer"){
                this.kill();
            }else{
                this.arrest();
            }
            return;
        }
        if(this.isAvailable() && this.closestPNJ != null){
            if(this.talkingTo == null){
                this.talk();
            }
        }
    }


    /**
     * Kill the PNJ that we are talking to (if role == "killer")
     */
    kill(){
        if(this.talkingTo != null){
            audio.playSound("kill",2,1,false);
            this.setAnimation(
                this.whichKillAnimation()
            );
            if(this.talkingTo instanceof Adversary){
                this.endAfterThis = END_GAME_STATE.LOSE;
                this.talkingTo.die();
            }else{
                this.switchAfterKill = {
                    to: this.talkingTo,
                    skin: this.talkingTo.sprite
                };
                this.talkingTo.die();
            }
        }
    }

    whichKillAnimation(){
        if(this.orientation.x == 1){
            return KILL_RIGHT;
        }else if(this.orientation.x == -1){
            return KILL_LEFT;
        }else if(this.orientation.y == 1){
            return KILL_FRONT;
        }
        return KILL_BACK;
    }

    whichArrestAnimation(){
        if(this.orientation.x == 1){
            return ARREST_RIGHT;
        }else if(this.orientation.x == -1){
            return ARREST_LEFT;
        }else if(this.orientation.y == 1){
            return ARREST_FRONT;
        }
        return ARREST_BACK;
    }

    /**
     * Arrest the PNJ that we are talking to (if role == "police")
     */
    arrest(){
        if(this.talkingTo != null){
            this.dialog.end();
            audio.playSound("trap_sound",6,1,false);
            this.setAnimation(
                this.whichArrestAnimation()
            );
            if(this.talkingTo instanceof Adversary){
                this.talkingTo.arrest(this, END_GAME_STATE.WIN);
            }else{
                this.talkingTo.arrest(this, END_GAME_STATE.LOSE);
            }
            console.log("arrested");
        }
    }

    /********  CONTROLS  ********/

    keyDown(key) {
        let oldVX = this.vecX;
        let oldVY = this.vecY; 
        switch (COMMANDS[key.code]) {
            case UP:
                this.vecY = this.orientation.y = -1;
                //this.orientation.x = this.vecX;
                this.vecX = this.orientation.x = 0;
                //this.setAnimation(WALK_BACK);
                break;
            case DOWN: 
                this.vecY = this.orientation.y = 1;
                //this.orientation.x = this.vecX;
                this.vecX = this.orientation.x = 0;
                //this.setAnimation(WALK_FRONT);
                break;
            case LEFT: 
                this.vecX = this.orientation.x = -1;
                //this.orientation.y = this.vecY;
                this.vecY = this.orientation.y = 0;
                break;
            case RIGHT: 
                this.vecX = this.orientation.x = 1;
                //this.orientation.y = this.vecY;
                this.vecY = this.orientation.y = 0;
                break;
            case TALK:
                const notTalkingBefore = this.talkingTo === null;
                this.talk();
                if (notTalkingBefore && this.talkingTo != null) {
                    return { talk: { x: this.x, y: this.y, pnjId: this.talkingTo.id, pnjX: this.talkingTo.x, pnjY: this.talkingTo.y } }
                }
                
                if(this.talkingTo != null){
                    if(this.role == "killer"){
                        this.kill();
                    }else{
                        this.arrest();
                    }
                }
                break;
        }
        if (this.vecX !== oldVX || this.vecY !== oldVY) {
            this.setAnimation(this.whichAnimation())
            return { move: { x: this.x, y: this.y, vecX: this.vecX, vecY: this.vecY } };
        }
    }

    keyUp(key) {
        let oldVX = this.vecX;
        let oldVY = this.vecY; 
        if (key) {
            switch (COMMANDS[key.code]) {
                case UP: 
                    if (this.vecY < 0) {
                        this.vecY = 0;
                    }
                    break;
                case DOWN:
                    if (this.vecY > 0) {
                        this.vecY = 0
                    }
                    break;
                case LEFT: 
                    if (this.vecX < 0) {
                        this.vecX = 0;
                    }
                    break;
                case RIGHT: 
                    if (this.vecX > 0) {
                        this.vecX = 0;
                    }
                    break;
            }
        }
        else {
            this.vecX = 0;
            this.vecY = 0;
        }
        if (this.vecX !== oldVX || this.vecY !== oldVY) {
            this.setAnimation(this.whichAnimation())
            return { move: { x: this.x, y: this.y, vecX: this.vecX, vecY: this.vecY } };
        }
    }

}
