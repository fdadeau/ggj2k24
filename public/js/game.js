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

const NB_ROUNDS = 4;
const THIRTY_SECONDS = 31 * 1000;

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
        // Rounds
        this.time = THIRTY_SECONDS;
        this.step = 1;
    }

    isOver() {
        if (this.player.hasLost()) {
            return { winner: this.adversary.role };
        }
        if (this.adversary.hasLost()) {
            return { winner: this.player.role };
        }
        if (this.player.murders + this.adversary.murders > this.step) {
            return { winner: "police", message: "La folie meurtière du tueur a causé sa perte." };
        }
        if (this.step > NB_ROUNDS) {
            return { winner: "killer", message: "Le tueur a réussi à s'échapper." };
        }
    }

    /**
     * Update of the game
     * @param {number} dt elapsed time since last update
     */
    update(dt) {
        this.time -= dt;
        if (this.time < 0) {
            if (this.player.murders + this.adversary.murders < this.step) {
                this.time = 0;
                return { winner: "police", message: "Le tueur n'a pas pu assouvir sa folie meurtrière." };
            }
            this.step++;
            if (this.step <= NB_ROUNDS) {
                this.time = THIRTY_SECONDS;
            }
        }
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
        if (this.gameover) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, 120, 0, 2 * Math.PI);
            ctx.rect(this.viewport.x + WIDTH, this.viewport.y, -WIDTH, HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
        else {
            ctx.fillColor = "black";
            ctx.fillRect(this.viewport.x, this.viewport.y, WIDTH, 30);
            ctx.textAlign = "right";
            let chrono = Math.floor(this.time / 1000);
            if (chrono < 10) {
                chrono = "0" + chrono;
            }
            chrono = "0:" + chrono;
            const txt = (this.player.role == "police" 
                    ? "coincez ce meurtrier" 
                    : (this.player.murders == this.step ? "ne vous faites pas démasquer" : "commettez un meurtre")) + " - Fin du tour " + chrono;
            ctx.font = "bold 18px arial";
            ctx.fillStyle = "white";
            ctx.fillText("Objectif : " + txt, this.viewport.x + WIDTH - 10, this.viewport.y + 20);
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