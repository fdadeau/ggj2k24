
/**
 * Class for Entities, NPCs, and the Adversary of the player
 */

import { Player } from "./player.js";
import data from "./assets.js";
import { FRAME_DELAY } from "./gui.js";

const WALK = "walk", WAIT = "wait", TALK = "talk";

const SPEED = 0.2;

const WALK_FRONT = [0,1,2];
const WALK_LEFT = [3,4,5];
const WALK_RIGHT = [6,7,8];
const WALK_BACK = [9,10,11];
const IDLE_FRONT = [1];
const IDLE_LEFT = [4];
const IDLE_RIGHT = [7];
const IDLE_BACK = [10];

/**
 * Abstract class for entities
 */
class Entity {

    constructor(x,y,vecX,vecY,size) {
        this.x = x;
        this.y = y;
        this.vecX = vecX;
        this.vecY = vecY;
        this.size = size;
        this.speed = SPEED;
        this.talkingTo = null;

        this.animation = IDLE_RIGHT;
        this.frame = 0;
        this.frameDelay = FRAME_DELAY;
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
        return false;
    }

    talk(who) {
        this.talkingTo = who;
        who.talkingTo = this;
    }

    setAnimation(anim){
        this.animation = anim;
        this.frameDelay = FRAME_DELAY;
        this.frame = 0;
    }
}


export class PNJ extends Entity {

    constructor(scenario,dialog, delay) {
        super(0,0,0,0,20);
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
        this.dialog = new Dialog(dialog[1]);
        this.time = 0;
        this.startTime = Date.now() - delay;
        this.step = 0;
        this.alive = true;

        this.sprite = data["default-spritesheet"];
    }

    reset() {
        this.time = 0;
        this.step = 0;
    }

    die() {
        if (this.talkingTo !== null) {
            this.talkingTo.talkingTo = null;
            this.talkingTo = null;
        }
        this.dialog.end();
        this.alive = false;
    }

    update(dt) {
        if (!this.alive) {
            return;
        }
        // case 1: taking to someone
        if (this.talkingTo !== null) {
            // if dialog is over --> 
            if (!this.dialog.isRunning()) {
                // remove "talk link" between player and PNJ
                this.talkingTo.talkingTo = null;
                this.talkingTo = null;
                // re-sync timing
                this.startTime += this.dialog.getDuration();
            }
            else {  // dialog is not over --> update it
                this.dialog.update();
            }
            return;
        }
        // case 2: following the steps of the scenario
        this.startTime = this.startTime || Date.now();
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
                    if(this.vecY == -1 && this.animation != WALK_BACK){
                        this.setAnimation(WALK_BACK);
                    }
                    if(this.vecY == 1 && this.animation != WALK_FRONT){
                        this.setAnimation(WALK_FRONT);
                    }
                }else{
                    this.vecY = 0;
                    this.vecX = (endX < startX) ? -1 : 1;
                    if(this.vecX == -1 && this.animation != WALK_LEFT){
                        this.setAnimation(WALK_LEFT);
                    }
                    if(this.vecX == 1 && this.animation != WALK_RIGHT){
                        this.setAnimation(WALK_RIGHT);
                    }
                }
                break;
            case WAIT:
                this.x = this.scenario[this.step].x;
                this.y = this.scenario[this.step].y;
                this.vecX = this.scenario[this.step].vecX;
                this.vecY = this.scenario[this.step].vecY;
                if(this.vecX == -1){
                    this.setAnimation(IDLE_LEFT);
                }
                else if(this.vecX == 1){
                    this.setAnimation(IDLE_RIGHT);
                }
                else if(this.vecY == -1){
                    this.setAnimation(IDLE_BACK);
                }
                else if(this.vecY == 1){
                    this.setAnimation(IDLE_FRONT);
                }
                break;
        }
        // Updating animation
        this.frameDelay -= dt;
        if (this.frameDelay <= 0) {
            this.frameDelay = FRAME_DELAY;
            this.frame = (this.frame + 1) % this.animation.length;
        }
    }

    /**
     * Check if PNJ is available for interaction
     * @returns true if the PNJ is not talking to anyone
     */
    isAvailable() {
        return this.talkingTo == null && this.alive;
    }

    /**
     * Starts talking to the player
     * @param {Player} player 
     */
    talk(player) {
        if (this.isAvailable()) {
            /** @todo change orientation to face player */
            this.talkingTo = player;
            this.dialog.start();
            this.setAnimation(IDLE_FRONT);
        } 
    }

    render(ctx) {
        super.render(ctx);        
    }

    renderDialog(ctx) {
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y, this.talkingTo instanceof Player);
        }
    } 
}


export class Adversary extends Entity {

    constructor(x,y,vecX,vecY,size,role,map) {
        super(x,y,vecX,vecY,size);
        this.role = role;
        this.map = map;
        this.dialog = (role == "police") ? 
            new Dialog([[0,"Ecoutez laissez la police faire son travail.", 1000],[0,"Dès que nous aurons de plus amples informations,", 1000],[0,"vous en serez les premiers informés.",1000]]) :
            new Dialog([[0,"Tu veux un whisky ?",1000]]);

        this.sprite = data["groom-spritesheet"];
        this.oldVecX;
        this.oldVecY;
    }

    update(dt) {
        let newX = this.x + this.vecX * SPEED * dt;
        let newY = this.y + this.vecY * SPEED * dt;
        if (!this.map.isTooCloseFromOneWall(newX, newY, this.size)) {
            this.x = newX;
            this.y = newY;
        }

        // taking to someone
        if (this.talkingTo !== null) {
            // if dialog is over --> 
            if (!this.dialog.isRunning()) {
                // remove "talk link" between player and PNJ
                this.talkingTo.talkingTo = null;
                this.talkingTo = null;
            }
            else {  // dialog is not over --> update it
                this.dialog.update();
            }
            return;
        }

        this.frameDelay -= dt;
        if (this.frameDelay <= 0) {
            this.frameDelay = FRAME_DELAY;
            this.frame = (this.frame + 1) % this.animation.length;
        }
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} vecX 
     * @param {number} vecY 
     */
    updateAdversary(x,y,vecX,vecY) {
        this.x = x;
        this.y = y;
        this.oldVecX = this.vecX;
        this.oldVecY = this.vecY;
        if (vecX !== undefined) {
            this.vecX = vecX;
            if(this.vecX == 1){
                this.setAnimation(WALK_RIGHT);
            }
            if(this.vecX == -1){
                this.setAnimation(WALK_LEFT);
            }
        }
        if (vecY !== undefined) {
            this.vecY = vecY;
            if(this.vecY == -1){
                this.setAnimation(WALK_BACK);
            }
            if(this.vecY == 1){
                this.setAnimation(WALK_FRONT);
            }
        }

        if(vecY == 0 && vecX == 0){
            if(this.oldVecX == 1){
                this.setAnimation(IDLE_RIGHT);
            }
            if(this.oldVecX == -1){
                this.setAnimation(IDLE_LEFT);
            }
            if(this.oldVecY == -1){
                this.setAnimation(IDLE_BACK);
            }
            if(this.oldVecY == 1){
                this.setAnimation(IDLE_FRONT);
            }
        }
    }

    updateAdversaryTalk(x,y,id,px,py) {
        this.talkingTo = id;
        this.x = x;
        this.y = y;
        this.setAnimation(IDLE_FRONT);
    }


    talk(player) {
        if (this.isAvailable()) {
            /** @todo change orientation to face player */
            this.talkingTo = player;
            this.dialog.start();
            this.setAnimation(IDLE_FRONT);
        } 
    }

    isAvailable(){
        return this.talkingTo == null;
    }

    render(ctx) {
        super.render(ctx);
        /** prints dialog @todo move code somewhere else to avoid z-index issues */
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            //this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y);
        }
    }

    renderDialog(ctx) {
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y, this.talkingTo instanceof Player);
        }
    } 

}


export class Dialog {

    constructor(texts) {
        this.state = -1;
        this.t0 = 0;
        let endTime = 0;
        this.texts = texts.map(t => { 
            endTime += t[2]
            return { who: t[0], what: t[1], duration: t[2], endTime };
        });
    }

    update(dt) {
        if (this.state < 0) {
            return;
        }
        this.time = Date.now() - this.t0;
        if (this.time >= this.texts[this.state].endTime) {
            this.state++;
            if (this.state >= this.texts.length) {
                this.state = -1;
            }
        }
    }

    isRunning() {
        return this.state >= 0;
    }

    getDuration() {
        return this.texts[this.texts.length-1].endTime;
    }

    start() {
        if (this.state < 0) {
            this.t0 = Date.now();
            this.state = 0; 
        }
    }

    end() {
        this.state = -1;
    }

    render(ctx, x0, y0, x1, y1, showtext) {
        if (this.state >= 0) {
            ctx.fillStyle = "white";
            ctx.strokeStyle = "red";
            ctx.font = "15px arial";
            ctx.lineWidth = 3;
            let [x, y, d] = this.texts[this.state].who == 0 ? [x0,y0,20] : [x1,y1,-20]; 
            let w = ctx.measureText(this.texts[this.state].what).width;
            const dy = 50;
            const pad = 10;
            ctx.beginPath();
            ctx.moveTo(x, y - 30);
            ctx.lineTo(x + d, y - dy);
            ctx.lineTo(x + w/2 + pad, y - dy);
            ctx.lineTo(x + w/2 + pad, y - dy - 30);
            ctx.lineTo(x - w/2 - pad, y - dy - 30);
            ctx.lineTo(x - w/2 - pad, y - dy);
            ctx.lineTo(x, y - dy);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            if (showtext) {
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.verticalAlign = "middle";
                ctx.fillText(this.texts[this.state].what, x, y - dy - pad);
            }
        }
    }


}
