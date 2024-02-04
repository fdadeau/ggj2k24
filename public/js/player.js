

import { Entity, SPRITE_H } from "./entity.js";
import { audio } from "./audio.js";

import { Map } from "./map.js";


const UP = 1, DOWN = 3, LEFT = 4, RIGHT = 2, ACTION = 10;

const COMMANDS = { "ArrowUp": UP, "ArrowDown": DOWN, "ArrowLeft": LEFT, "ArrowRight": RIGHT, "Space": ACTION };

export const INTERACTION_TIMER = 5000;

const FOOTSTEPS = "steps", TALK = "talk";

export class Player extends Entity {

    constructor(x, y, role, map, skin, dialog) {
        super(x, y, 0, 0, skin, [[1, "Fais moi rire.", 1600],...dialog]);
        /** Id (used to identify in the messages) */
        this.id = (role == "police") ? 1 : 0;
        /** @type {string} role of the player "police", "killer" */
        this.role = role;
        /** @type {Map} map of the level */
        this.map = map;
        /** @type {Object} entity (PNJ or adversary) that is the closest { pnj, distance } */
        this.closestPNJ = null;
        // Timer between two interactions with other entity
        this.timeToInteract = -1;
    }

    update(dt) {
        super.update(dt);
        if (this.timeToInteract > 0){
            this.timeToInteract -= dt;
        }
        if(this.vecX != 0 || this.vecY != 0){
            if(!audio.audioIsPlaying(FOOTSTEPS)) {
                audio.playSound("footsteps",FOOTSTEPS,0.5,1);
            }
        }
        else{
            audio.pause(FOOTSTEPS);
        }
    }

    hitsSomething(newX, newY) {
        const wall = this.map.hitsSomething(newX, newY + SPRITE_H/2, SPRITE_H/2);
        return wall != null;
    }

    release(delay) {
        this.timeToInteract = INTERACTION_TIMER;
        super.release(delay)
    }

    /** Check if the object/character at position(x,y) is seen by the player */
    sees(x,y) {
        const r1 = this.map.getRoomFor(this.x, this.y + SPRITE_H / 2);
        const r2 = this.map.getRoomFor(x,y + SPRITE_H / 2);
        return r1 == r2 ||
            r2 != null && (r1 == r2.N || /*r1 == r2.S ||*/ r1 == r2.E || r1 == r2.O) ||
            r1 != null && (r2 == r1.N || /*r2 == r1.S ||*/ r2 == r1.E || r2 == r1.O);
    }

    /**
     *  Provides information on the current interaction possibilities for the player.
     *  @return { Object } An object that has a single key providing the action or a waiting time, null if no action can be made. 
     */
    getInteraction() {
        if (this.alive && !this.arrested && this.timeToInteract > 0 && this.timeToInteract < INTERACTION_TIMER) {
            return { wait: { current: this.timeToInteract, total: INTERACTION_TIMER } };
        }
        if (this.alive && !this.arrested && this.talkingTo != null && this.talkingTo.id != this.id) {
            return { action: this.role == "killer" ? "stab" : "arrest" };
        }
        return null;
    }

    /** 
     * Start discussion if character is close to the player and available. 
     */
    talk() {
        if (this.timeToInteract <= 0 && this.talkingTo == null && this.closestPNJ !== null && this.closestPNJ.isAvailable() && this.isAvailable()) {
            console.log("talk", this.closestPNJ.id);
            this.startTalkingWith(this.closestPNJ);
            audio.pause(FOOTSTEPS);
            return { talk: { x: this.x, y: this.y, id: this.talkingTo.id, px: this.talkingTo.x, py: this.talkingTo.y } };
            
        }
    }


    /**
     * Kill the PNJ that we are talking to (if role == "killer")
     */
    kill() {
        if(this.talkingTo != null) {
            let kill = { x: this.x, y: this.y, id: this.talkingTo.id, px: this.talkingTo.x, py: this.talkingTo.y };
            super.kills(this.talkingTo);
            return { kill };
        }
    }

    /**
     * Arrest the PNJ that we are talking to (if role == "police")
     */
    arrest() {
        if (this.talkingTo != null) {
            let arrest = { x: this.x, y: this.y, id: this.talkingTo.id, px: this.talkingTo.x, py: this.talkingTo.y };
            this.arrests(this.talkingTo);
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
                // first possible action: talk
                let r = this.talk();
                if (r && r.talk) {
                    return r;
                }
                // other possible action: kill/arrest
                if (this.talkingTo != null && this.talkingTo.speaker !== this.id) {
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
