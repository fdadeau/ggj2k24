/**
 * Game class 
 */

// dimensions of the window
import { WIDTH, HEIGHT } from "./app.js";

import { Player } from "./player.js";
import { Map } from "./map.js";
import { Adversary } from "./pnj.js";

const POLICE_DIALOG = [
    [0,"Ecoutez laissez la police faire son travail.", 1000],
    [0,"Dès que nous aurons de plus amples informations,", 1000],
    [0,"vous en serez les premiers informés.",1000]
];

export class Game {

    constructor(level, role, delay) {
        // Create the map
        this.map = new Map(level, delay, (role == "police") ? "killer" : "police");
        // Instantiate player & adversary
        let spX = level.start.police.x, spY = level.start.police.y;
        let skX = level.start.killer.x, skY = level.start.killer.y;
        if (role === "police") {
            this.player = new Player(spX, spY, "police", this.map, level.policeSkin, POLICE_DIALOG);
            this.adversary = new Adversary(skX, skY, "killer", this.map, level.killerSkin, level.killerJoke);
        }
        else {
            this.player = new Player(skX, skY, "killer", this.map, level.killerSkin, level.killerJoke);
            this.adversary = new Adversary(spX, spY, "police", this.map, level.policeSkin, POLICE_DIALOG);
        }
        this.map.addPlayerAndAdversary(this.player, this.adversary);
        // Initialize viewport 
        this.viewport = { x: 0, y: 0, w: WIDTH, h: HEIGHT };
    }

    isOver() {
        if (this.player.hasLost()) {
            return { winner: this.adversary.role };
        }
        if (this.adversary.hasLost()) {
            return { winner: this.player.role };
        }
    }

    /**
     * Update of the game
     * @param {number} dt elapsed time since last update
     */
    update(dt) {
        this.map.update(dt);
        this.updateViewport();
    }

    /**
     * Called to update an adversary movement on 
     * @param {string} what which action has to be updated
     * @param {Object} data information required to perform the considered update
     * @returns 
     */
    updateAdversary(what, data) {
        if (what == "move") {
            return this.adversary.updateAdversaryMove(data.x, data.y, data.vecX, data.vecY);
        }
        if (what == "talk") {
            return this.adversary.updateAdversaryTalk(data.x, data.y, data.id, data.px, data.py);
        }
        if (what == "kill") {
            return this.adversary.updateAdversaryKill(data.x, data.y, data.id, data.px, data.py);
        }
        if (what == "arrest") {
            return this.adversary.updateAdversaryArrest(data.x, data.y, data.id, data.px, data.py);
        }
    }

    /**
     * Computes the dimensions of the visible area (used for centering camera on the player)
     */
    updateViewport() {
        this.viewport.x = this.player.x - WIDTH / 2;
        if (this.viewport.x < 0) {
            this.viewport.x = 0;
        }
        else if (this.player.x + WIDTH / 2 > this.map.boundaries[0]) {
            this.viewport.x = this.map.boundaries[0] - WIDTH;
        }
        this.viewport.y = this.player.y - HEIGHT / 2;
        if (this.player.y - HEIGHT / 2 < 0) {
            this.viewport.y = 0;
        }
        else if (this.player.y + HEIGHT / 2 > this.map.boundaries[1]) {
            this.viewport.y = this.map.boundaries[1] - HEIGHT;
        }
    }

    getPlayerInteraction() {
        return this.player.getInteraction(); 
    }

    /**
     * Renders the game
     * @param {CanvasRenderingContext2D} ctx the context to be drawn
     */
    render(ctx) {
        ctx.save();
        ctx.translate(-this.viewport.x, -this.viewport.y);
        this.map.render(ctx); 
        if (this.isOver()) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, 120, 0, 2 * Math.PI);
            ctx.rect(this.player.x + WIDTH, this.player.y - HEIGHT, -2*WIDTH, 2*HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }  

    /**
     * Called when a key is pressed.
     * @param {KeyboardEvent} e 
     * @returns null if no movement that needs propagation, an object describing the update to send to the socket
     * @todo: update with actions on PNJ (kill, talk, accuse adversary)
     */
    keydown(e) {
        return this.player.keyDown(e)
    }
    /**
     * Called when a key is released. 
     * @param {KeyboardEvent} e 
     * @returns null if no movement that needs propagation, an object describing the update to send to the socket
     */
    keyup(e) {
        return this.player.keyUp(e)
    }   
}