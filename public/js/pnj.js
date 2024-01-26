
/**
 * Class for Entities, NPCs, and the Adversary of the player
 */

const WALK = "walk", WAIT = "wait", TALK = "talk";

const SPEED = 0.2;

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
    }

    update(dt) {
        this.x += this.vecX * this.speed * dt;
        this.y += this.vecY * this.speed * dt;
    }

    render(ctx) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    isAvailable() {
        return true;
    }

    talk(who) {

    }

}


export class PNJ extends Entity {

    constructor(scenario,dialog) {
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
        this.dialog = new Dialog(dialog);
        this.time = 0;
        this.step = 0;
    }

    reset() {
        this.time = 0;
        this.step = 0;
    }

    update(dt) {
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
                }
                else {
                    this.vecY = 0;
                    this.vecX = (endX < startX) ? -1 : 1;
                }
                break;
            case WAIT:
                this.x = this.scenario[this.step].x;
                this.y = this.scenario[this.step].y;
                this.vecX = this.scenario[this.step].vecX;
                this.vecY = this.scenario[this.step].vecY;
                break;
        }
    }

    /**
     * Check if PNJ is available for interaction
     * @returns true if the PNJ is not talking to anyone
     */
    isAvailable() {
        return this.talkingTo == null;
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
        } 
    }

    render(ctx) {
        super.render(ctx);
        /** prints dialog @todo move code somewhere else to avoid z-index issues */
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y);
        }
    }
}


export class Adversary extends Entity {

    constructor(x,y,vecX,vecY,size,role,map) {
        super(x,y,vecX,vecY,size);
        this.role = role;
        this.map = map;
    }

    update(dt) {
        let newX = this.x + this.vecX * SPEED * dt;
        let newY = this.y + this.vecY * SPEED * dt;
        if (!this.map.isTooCloseFromOneWall(newX, newY, this.size)) {
            this.x = newX;
            this.y = newY;
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
        if (vecX !== undefined) {
            this.vecX = vecX;
        }
        if (vecY !== undefined) {
            this.vecY = vecY;
        }
    }
}


class Dialog {

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

    render(ctx, x0, y0, x1, y1) {
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
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.verticalAlign = "middle";
            ctx.fillText(this.texts[this.state].what, x, y - dy - pad);
        }
    }


}
