/**
 * Game class 
 */

// dimensions of the window
import { WIDTH, HEIGHT } from "./app.js";

import { Player } from "./player.js";
import { Map } from "./map.js";

export class Game {

    constructor(level, role, delay) {
        let playerIsPolice = role == "police";
        // Create the map
        this.map = new Map(level, delay, playerIsPolice? "killer" : "police");
        this.player = new Player(role, this.map, playerIsPolice? level.policeSkin : level.killerSkin);
        this.viewport = { x: 0, y: 0, w: WIDTH, h: HEIGHT };
        this.updateViewport();
    }

    /**
     * Update of the game
     * @param {number} dt elapsed time since last update
     */
    update(dt) {
        this.map.update(dt);
        this.player.update(dt);
        this.updateViewport();
    }

    /**
     * Update the adversary position (externally called when recieved through the socket)
     * @param {number} x X-coordinate
     * @param {number} y Y-coordinate
     * @param {number} vx movement on X
     * @param {number} vy movement on Y
     */
    updateAdversary(x,y,vx,vy) {
        this.map.updateAdversary(x,y,vx,vy);
    }

    updateAdversaryTalk(x,y,id,px,py) {
        this.map.updateAdversaryTalk(x,y,id,px,py);
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