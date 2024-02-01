

import { Entity } from "./entity.js";
import { audio } from "./audio.js";

import { Map } from "./map.js";


const UP = 1, DOWN = 3, LEFT = 4, RIGHT = 2, ACTION = 10;

const COMMANDS = { "ArrowUp": UP, "ArrowDown": DOWN, "ArrowLeft": LEFT, "ArrowRight": RIGHT, "Space": ACTION };

export const INTERACTION_TIMER = 5000;


export class Player extends Entity {

    constructor(x, y, role, map, skin, dialog) {
        super(x, y, 0, 0, skin, [[1, "Fais moi rire.", 1600],...dialog]);
        /** Id (used to identify in the messages) */
        this.id = 0;
        /** @type {string} role of the player "police", "killer" */
        this.role = role;
        /** @type {Map} map of the level */
        this.map = map;
        /** @type {Object} entity (PNJ or adversary) that is the closest { pnj, distance } */
        this.closestPNJ = null;
       
        // Timer between two interactions with other entity
        this.timeToInteract = -1;

        audio.playSound("footsteps",1,1,true);
    }

    update(dt) {
        super.update(dt);
        if (this.timeToInteract > 0){
            this.timeToInteract -= dt;
        }
        if(this.vecX != 0 || this.vecY != 0){
            if(!audio.audioIsPlaying(1)){
                audio.resume(1);
            }
        }
        else{
            if(audio.audioIsPlaying(1)){
                audio.pause(1);
            }
        }
    }

    hitsSomething(newX, newY) {
        const wall = this.map.isTooCloseFromOneWall(newX, newY, this.size);
        return wall != null;
    }

    release(delay) {
        super.release(delay)
        this.timeToInteract = INTERACTION_TIMER;
    }

    /** Check if the object/character at position(x,y) is seen by the player */
    sees(x,y) {
        return this.map.getRoomFor(this.x, this.y) == this.map.getRoomFor(x,y);
    }

    /**
     *  Provides information on the current interaction possibilities for the player.
     *  @return { Object } An object that has a single key providing the action or a waiting time, null if no action can be made. 
     */
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
        if (this.closestPNJ !== null && this.closestPNJ.isAvailable() && this.isAvailable()) {
            console.log("talk", this.closestPNJ.id);
            this.startTalkingWith(this.closestPNJ);
            if(audio.audioIsPlaying(1)){
                audio.pause(1);
            }
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
     * Kill the PNJ that we are talking to (if role == "killer")
     */
    kill() {
        if(this.talkingTo != null) {
            let kill = { x: this.x, y: this.y, id: this.talkingTo.id, px: this.talkingTo.x, py: this.talkingTo.y };
            super.kills(this.talkingTo);
            audio.playSound("kill",2,1,false);
            return { kill };
        }
    }

    /**
     * Arrest the PNJ that we are talking to (if role == "police")
     */
    arrest() {
        if (this.talkingTo != null) {
            let arrest = { x: this.x, y: this.y, id: this.talkingTo.id, px: this.talkingTo.x, py: this.talkingTo.y };
            super.arrests(this.talkingTo);
            audio.playSound("trap_sound",6,1,false);
            return { arrest };
        }
    }

    /********  CONTROLS  ********/

    keyDown(key) {
        if (this.arrested) {
            return;
        }
        let oldVX = this.vecX;
        let oldVY = this.vecY; 
        switch (COMMANDS[key.code]) {
            case UP:
                if (!this.talkingTo) {
                    this.vecY = this.orientation.y = -1;
                    this.vecX = this.orientation.x = 0;
                }
                break;
            case DOWN: 
                if (!this.talkingTo) {
                    this.vecY = this.orientation.y = 1;
                    this.vecX = this.orientation.x = 0;
                }
                break;
            case LEFT: 
                if (!this.talkingTo) {
                    this.vecX = this.orientation.x = -1;
                    this.vecY = this.orientation.y = 0;
                }
                break;
            case RIGHT: 
                if (!this.talkingTo) {
                    this.vecX = this.orientation.x = 1;
                    this.vecY = this.orientation.y = 0;
                }
                break;
            case ACTION:
                const notTalkingBefore = this.talkingTo === null;
                this.talk();
                if (notTalkingBefore && this.talkingTo != null) {
                    return { talk: { x: this.x, y: this.y, pnjId: this.talkingTo.id, pnjX: this.talkingTo.x, pnjY: this.talkingTo.y } }
                }
                
                if (this.talkingTo != null) {
                    return (this.role == "killer") ? this.kill() : this.arrest();
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
