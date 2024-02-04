
/**
 * Class for Entities, NPCs, and the Adversary of the player
 */

import { Entity } from "./entity.js";

const WALK = "walk", WAIT = "wait";


export class PNJ extends Entity {

    /**
     * Creates a non-playable character
     * @param {Array} scenario 
     * @param {Array} dialog 
     * @param {number} delay start delay (in case the player starts after a while)
     * @param {string} skin spritesheet used for the character
     */
    constructor(id, scenario, dialog, delay, skin) {
        super(0,0,0,0,skin,dialog);
        this.id = id;
        let t = 0;
        // scenario of the character
        this.scenario = scenario.map(function(s) {
            let obj = JSON.parse(JSON.stringify(s[1]));
            obj.action = s[0];
            obj.startTime = t;
            t += s[2];
            obj.endTime = t;
            return obj;
        });
        // PNJ scenario 
        this.time = 0;
        this.startTime = Date.now() - delay;
        this.step = 0;
        while (this.scenario[this.step].endTime < delay) {
            this.step++;
        }
    }


    update(dt) {
        if (!this.alive || this.arrested) {
            return;
        }
        // Updating animation
        this.updateAnimation(dt);
        // case 1: taking to someone --> wait for dialog to be over
        if (this.talkingTo !== null) {
            super.update(dt);
            return;
        }
        // case 2: following the steps of the scenario
        this.time = Date.now() - this.startTime;
        if (this.time >= this.scenario[this.step].endTime) {
            // time overflow
            let d = this.scenario[this.step].endTime - this.time;
            this.step++;
            if (this.step >= this.scenario.length) {
                this.step = 0;
                // re-sync w.r.t. overflow
                this.startTime = Date.now() - d;
            }
        }
        // update character w.r.t. the current step
        switch (this.scenario[this.step].action) {
            case WALK:
                const startX = this.scenario[this.step].xs, endX = this.scenario[this.step].xd;
                const startY = this.scenario[this.step].ys, endY = this.scenario[this.step].yd;
                const delay = this.scenario[this.step].endTime - this.scenario[this.step].startTime;
                this.x = startX + (endX - startX) * (this.time - this.scenario[this.step].startTime) / (delay);
                this.y = startY + (endY - startY) * (this.time - this.scenario[this.step].startTime) / (delay);
                // determine orientation
                if (startX == endX) {
                    this.vecX = 0;
                    this.vecY = (endY < startY) ? -1 : 1;
                }else{
                    this.vecY = 0;
                    this.vecX = (endX < startX) ? -1 : 1;
                }
                this.orientation.x = this.vecX;
                this.orientation.y = this.vecY;
                const newAnimation = this.whichAnimation();
                if (newAnimation !== this.animation) {
                    this.setAnimation(newAnimation);
                }
                break;
            case WAIT:
                this.x = this.scenario[this.step].x;
                this.y = this.scenario[this.step].y;
                this.vecX = 0;
                this.vecY = 0;
                this.orientation.x = this.scenario[this.step].vecX;
                this.orientation.y = this.scenario[this.step].vecY;
                this.setAnimation(this.whichAnimation());
                break;
        }
    }


    /**
     * @override Entity.release
     * 
     * @param {number} delay 
     */
    release(delay) {
        super.release(delay);
        this.startTime += delay;
    }
}



/**
 * Class that represents the adversary of the player.
 * Controlled through the socket connection. 
 */
export class Adversary extends Entity {

    constructor(x, y, role, map, skin, dialog) {
        super(x, y, 0, 0, skin, [[1, "Fais moi rire.", 1600],...dialog]);
        this.id = (role == "police") ? 1 : 0;
        this.role = role;
        this.map = map;
    }

    /**
     * Update adversary movement
     * @param {number} x current X coordinate
     * @param {number} y current Y coodfinate 
     * @param {number} vecX new X direction
     * @param {number} vecY new Y direction
     */
    updateAdversaryMove(x,y,vecX,vecY) {
        this.x = x;
        this.y = y;
        this.vecX = vecX;
        if (this.vecX !== 0) {
            this.orientation.y = 0;
            this.orientation.x = this.vecX;
        }
        this.vecY = vecY;
        if (this.vecY !== 0) {
            this.orientation.x = 0;
            this.orientation.y = this.vecY;
        }
        const newAnim = this.whichAnimation();
        if (this.animation != newAnim) {
            this.setAnimation(newAnim);
        }
    }

    /**
     * Make the character start talking to another character. 
     * @param {*} x 
     * @param {*} y 
     * @param {*} id 
     * @param {*} px 
     * @param {*} py 
     */
    updateAdversaryTalk(x,y,id,px,py) {
        this.x = x;
        this.y = y;
        const who = this.map.characters[id];
        who.x = px;
        who.y = py;
        this.startTalkingWith(who);
    }
    updateAdversaryKill(x,y,id,px,py) {
        //this.x = x;
        //this.y = y;
        const who = this.map.characters[id];
        //who.x = px;
        //who.y = py;
        this.kills(who);
    }
    updateAdversaryArrest(x,y,id,px,py) {
        //this.x = x;
        //this.y = y;
        const who = this.map.characters[id];
        //who.x = px;
        //who.y = py;
        this.arrests(who);
    }

}


