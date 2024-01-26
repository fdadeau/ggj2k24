import { Adversary, Dialog } from "./pnj.js";

const SPEED = 0.2;

const UP = 1, DOWN = 3, LEFT = 4, RIGHT = 2, TALK = 10;

const COMMANDS = { "ArrowUp": UP, "ArrowDown": DOWN, "ArrowLeft": LEFT, "ArrowRight": RIGHT, "Space": TALK };

const INTERACTION_TIMER = 5000;

export const END_GAME_STATE = {"WIN": 1, "LOSE": -1, "RUNNING": 0};

export class Player {

    constructor(role, map) {
        /** @type {string} role of the player "police", "killer" */
        this.role = role;
        /** @type {number} size of the player (hitbox) */
        this.size = 20;
        /** @type {Map} map of the level */
        this.map = map;
        // coordinates of the player
        const {x, y} = map.getPlayerStart(this);
        this.x = x;
        this.y = y;
        /* direction/orientation of the player */
        this.vecX = 0;
        this.vecY = 0;
        // segments defining the field of vision
        this.FOV = [];
        // direction 
        this.orientation = { x: 1, y: 0 };
        /** @type {Object} entity (PNJ or adversary) that is the closest { pnj, distance } */
        this.closestPNJ = null;
        /** @type {Entity} entity the player is currently talking to (null if none) */
        this.talkingTo = null;

        // Tells if the game ended and how
        this.endGame = END_GAME_STATE.RUNNING;

        // Timer between two interactions with other entity
        this.timeToInteract = -1;

        this.dialog = (role == "police") ? 
        new Dialog([[0,"Ecoutez laissez la police faire son travail.", 1000],[0,"Dès que nous aurons de plus amples informations,", 1000],[0,"vous en serez les premiers informés.",1000]]) :
        new Dialog([[0,"Tu veux un whisky ?",1000]]);
    }

    update(dt) {
        // no movement if player is talking to a PNJ
        if (this.talkingTo !== null) {
            if (!this.dialog.isRunning()) {
                // remove "talk link" between player and PNJ
                this.talkingTo = null;
            }
            else {  // dialog is not over --> update it
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
        }

        if(this.timeToInteract > 0){
            this.timeToInteract -= dt;
        }
        // TODO: go against a wall 
    }

    render(ctx) {
        ctx.fillStyle = ctx.strokeStyle = (this.role == "killer") ? "#008" : "maroon";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.orientation.x * this.size * 1.5, this.y + this.orientation.y * this.size * 1.5);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 2;

        if (false)      // field of view (not yet finished)
        for (let w of this.FOV) {
            ctx.beginPath();
            ctx.moveTo(w[0],w[1]);
            ctx.lineTo(w[2],w[3]);
            ctx.closePath();
            ctx.stroke();
        }
        
    }

    renderDialog(ctx) {
        if (this.dialog.isRunning() && this.talkingTo !== null) {
            this.dialog.render(ctx, this.x, this.y, this.talkingTo.x, this.talkingTo.y, true);
        }
    } 


    /** Check if the object/character at position(x,y) is seen by the player */
    sees(x,y) {
        return true;
    }

    /** 
     * Start discussion if character is close to the player and available. 
     */
    talk() {
        if (this.closestPNJ !== null && this.closestPNJ.pnj.isAvailable()) {
            this.closestPNJ.pnj.talk(this);
            this.talkingTo = this.closestPNJ.pnj;
            this.timeToInteract = INTERACTION_TIMER;
        }
    }

    talkWithAdversary(adversary){
        if(adversary.isAvailable()){
            console.log("talking to adversary");
            this.talkingTo = adversary;
            this.timeToInteract = INTERACTION_TIMER;
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
     * Computes the field of vision (FOV) of the player (not finished)
     * @param {Object} viewport { x, y, w, h } rectangle description of the viewport
     */
    computeFOV(viewport) {
        const wallsInViewport = this.map.computeWallsInViewport(viewport);
        
        const vStart = { x: this.orientation.x - 3 * this.orientation.y, y: this.orientation.y + 3 * this.orientation.x };
        const vEnd =   { x: this.orientation.x + 3 * this.orientation.y, y: this.orientation.y - 3 * this.orientation.x };

        const angles = {};
        wallsInViewport.forEach(([w0,w1,w2,w3]) => {
            angles[`${w0},${w1}`] = {x: w0, y: w1};
            angles[`${w2},${w3}`] = {x: w2, y: w3};
        });
        angles["vp1"] = { x: viewport.x, y: viewport.y };
        angles["vp2"] = { x: viewport.x + viewport.w, y: viewport.y };
        angles["vp3"] = { x: viewport.x + viewport.w, y: viewport.y + viewport.h };
        angles["vp4"] = { x: viewport.x, y: viewport.y + viewport.h };
        

        this.FOV = [];
        for (let a in angles) {
            if (isInFieldOfView(this, this.orientation, Math.PI*4/5, angles[a])) {
               this.FOV.push([this.x, this.y, angles[a].x, angles[a].y]);
            }
        }
        
        this.FOV.push([this.x, this.y, this.x + 50*vStart.x, this.y + 50*vStart.y]);
        this.FOV.push([this.x, this.y, this.x + 50*vEnd.x, this.y + 50*vEnd.y]);
    }


    /**
     * Kill the PNJ that we are talking to (if role == "killer")
     */
    kill(){
        if(this.talkingTo instanceof Adversary){
            this.endGame = END_GAME_STATE.LOSE;
        }else{
            this.talkingTo.die();
        }
    }

    /**
     * Arrest the PNJ that we are talking to (if role == "police")
     */
    arrest(){
        if(this.talkingTo instanceof Adversary){
            this.endGame = END_GAME_STATE.WIN;
        }else{
            this.endGame = END_GAME_STATE.LOSE;
        }  
    }

    /********  CONTROLS  ********/

    keyDown(key) {
        let oldVX = this.vecX;
        let oldVY = this.vecY; 
        switch (COMMANDS[key.code]) {
            case UP:
                this.vecY = this.orientation.y = -1;
                this.orientation.x = this.vecX;
                break;
            case DOWN: 
                this.vecY = this.orientation.y = 1;
                this.orientation.x = this.vecX;
                break;
            case LEFT: 
                this.vecX = this.orientation.x = -1;
                this.orientation.y = this.vecY;
                break;
            case RIGHT: 
                this.vecX = this.orientation.x = 1;
                this.orientation.y = this.vecY;
                break;
            case TALK:
                if(!this.isAvailable()){
                    return;
                }
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
            return { move: { x: this.x, y: this.y, vecX: this.vecX, vecY: this.vecY } };
        }
    }

    keyUp(key) {
        let oldVX = this.vecX;
        let oldVY = this.vecY; 
        switch (COMMANDS[key.code]) {
            case UP: 
                if (this.vecY < 0) {
                    this.vecY = 0;
                    if (this.orientation.x != 0) {
                        this.orientation.y = 0;
                    }
                }
                break;
            case DOWN:
                if (this.vecY > 0) {
                    this.vecY = 0
                    if (this.orientation.x != 0) {
                        this.orientation.y = 0;
                    }
                }
                break;
            case LEFT: 
                if (this.vecX < 0) {
                    this.vecX = 0;
                    if (this.orientation.y != 0) {
                        this.orientation.x = 0;
                    }
                }
                break;
            case RIGHT: 
                if (this.vecX > 0) {
                    this.vecX = 0;
                    if (this.orientation.y != 0) {
                        this.orientation.x = 0;
                    }
                }
                break;
        }
        if (this.vecX !== oldVX || this.vecY !== oldVY) {
            return { move: { x: this.x, y: this.y, vecX: this.vecX, vecY: this.vecY } };
        }
    }

}


function isInFieldOfView(startPoint, direction, fieldOfViewAngle, targetPoint) {
    const angleToTarget = Math.atan2(targetPoint.y - startPoint.y, targetPoint.x - startPoint.x);
    const angleDifference = Math.abs(normalizeAngle(angleToTarget - Math.atan2(direction.y, direction.x)));

    // Vérifier si l'angle entre la direction et le point cible est dans le champ de vision
    return angleDifference <= fieldOfViewAngle / 2;
}

// Fonction pour normaliser un angle entre -π et π
function normalizeAngle(angle) {
    while (angle > Math.PI) {
        angle -= 2 * Math.PI;
    }
    while (angle < -Math.PI) {
        angle += 2 * Math.PI;
    }
    return angle;
}

function raySegmentIntersection(rayStart, rayDirection, segmentStart, segmentEnd) {
    const rayEnd = {
        x: rayStart.x + rayDirection.x,
        y: rayStart.y + rayDirection.y
    };

    const den = (segmentEnd.y - segmentStart.y) * (rayEnd.x - rayStart.x) - (segmentEnd.x - segmentStart.x) * (rayEnd.y - rayStart.y);

    if (den === 0) {
        // Les segments sont parallèles ou colinéaires
        return null;
    }

    const ua = ((segmentEnd.x - segmentStart.x) * (rayStart.y - segmentStart.y) - (segmentEnd.y - segmentStart.y) * (rayStart.x - segmentStart.x)) / den;
    const ub = ((rayEnd.x - rayStart.x) * (rayStart.y - segmentStart.y) - (rayEnd.y - rayStart.y) * (rayStart.x - segmentStart.x)) / den;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        // Il y a une intersection
        const intersectionX = segmentStart.x + ua * (segmentEnd.x - segmentStart.x);
        const intersectionY = segmentStart.y + ua * (segmentEnd.y - segmentStart.y);

        return { x: intersectionX, y: intersectionY };
    } else {
        // Pas d'intersection
        return null;
    }
}
