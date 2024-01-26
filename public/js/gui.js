/**
 * Class describing the Graphical User Interface
 */

import { WIDTH, HEIGHT } from "./app.js";

import { Game } from "./game.js";

const STATE = { 
    LOADING: -999,                
    TITLE_SCREEN: 0,            // 2 buttons "create" "join"
    JOIN_SCREEN: 5,             // 2 buttons "back", "refresh"
    WAITING_BEFORE_START: 10,   // waiting for the other player 
    RUNNING: 42,                // game is playing
    CONNECTION_LOST: 100,       // one payer has left --> game is over
    VICTORY: 69,               // player has won
    LOSE: -69,                 // player has lost
    GAMEOVER: 999               /** @todo add new states */
}

let framerate = { time: 0, frames: 0, rate: 0 };

class GUI {

    constructor() {
        /** @type {number} Current state of the GUI */
        this.state = STATE.LOADING;
        /** @type {Game} Game instance */
        this.game = null;
        /** @type {string} debug info */
        this.debug = null;
        /** @type {Object} message info */
        this.info = null;

        /** buttons */
        this.buttons = {
            "CREATE": new Button("Create game", WIDTH*0.4, HEIGHT*0.8, 140, 40),
            "JOIN": new Button("Join game", WIDTH*0.7, HEIGHT*0.8, 140, 40)
        }
    };

    /**
     * Launched when recieved from 
     * @param {Object} level Level description 
     * @param {string} role "police", "killer"
     * @param {number} delay the delay w.r.t. the start 
     */
    newGame(level, role, delay) {
        this.game = new Game(level, role, delay);
        this.state = STATE.RUNNING;    
    }
    /**
     * Called when connection to the other player has been lost.
     */
    interruptGame() {
        this.state = STATE.CONNECTION_LOST;
    }
    /**
     * Called when the other player moves/stops moving. 
     * @param {Object} data Object { x, y, vecX, vecY } representing other player's position/movement
     */
    updateAdversary(data) {
        if (this.game) {
            this.game.updateAdversary(data.x, data.y, data.vecX, data.vecY);
        }
    }
    updateAdversaryTalk(data) {
        if (this.game) {
            this.game.updateAdversaryTalk(data.x, data.y, data.id, data.pnjX, data.pnjY);
        }
    }

    /**
     * Displays the message on the screen
     * @param {string} txt message to display
     * @param {number} delay time of message display
     */
    writeInfo(txt, delay) {
        this.info = { txt, delay };
    }

    start() {
        this.state = STATE.TITLE_SCREEN;
    }

    win(){
        this.state = STATE.VICTORY;
    }

    lose(){
        this.state = STATE.LOSE;
    }

    /**
     * Updates the GUI
     * @param {number} dt Time elpsed since last update
     */
    update(dt) {
        framerate.time += dt;
        framerate.frames++;
        if (framerate.time >= 1000) {
            framerate.rate = framerate.frames;
            framerate.time = 0;
            framerate.frames = 0;
        }
        if (this.info) {
            this.info.delay -= dt;
            if (this.info.delay < 0) {
                this.info = null;
            }
        }
        if (this.state == STATE.RUNNING && this.game !== null) {
            this.game.update(dt);
            this.debug = JSON.stringify({x: this.game.map.adversary.x, y: this.game.map.adversary.y, vx: this.game.map.adversary.vecX, vy: this.game.map.adversary.vecY});
        }
    }

    renderTitleScreen(ctx) {
        ctx.font = "24px arial";
        ctx.textAlign = "center";
        ctx.fillText("INSERT TITLE HERE", WIDTH/2, HEIGHT/2);
        for (let b in this.buttons) {
          this.buttons[b].render(ctx);
        }
    }

    renderConnectionLost(ctx) {
        ctx.textAlign = "center";
        ctx.font = "18px arial";
        ctx.fillText("Other player has been disconnected.", WIDTH / 2, HEIGHT / 2 -20);
        ctx.fillText("Click to return to title screen.", WIDTH / 2, HEIGHT / 2 + 20);
    }
    
    renderInfos(){
        if (this.info) {
            ctx.textAlign = "center";
            ctx.font = "18px arial";
            ctx.fillStyle = "black";
            ctx.fillText(this.info.txt, WIDTH / 2, HEIGHT / 2 + 50);
        }
    }

    renderDebug(ctx) {
        if (this.debug) {
            ctx.fillText("DEBUG: " + this.debug, 1, 10);
        }
    }

    renderVictory(ctx) {
        ctx.textAlign = "center";
        ctx.font = "18px arial";
        ctx.fillText("You won !", WIDTH / 2, HEIGHT / 2);
    }

    renderLose(ctx) {
        ctx.textAlign = "center";
        ctx.font = "18px arial";
        ctx.fillText("You lost !", WIDTH / 2, HEIGHT / 2);
    }

    /**
     * Renders the GUI
     * @param {CanvasRenderingContext2D} ctx Drawing area
     */
    render(ctx) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        ctx.font = "10px arial";
        ctx.textAlign = "left";
        ctx.fillStyle = "black";
        ctx.fillText(framerate.rate + " fps", 1, 25);

        switch(this.state){
            case STATE.TITLE_SCREEN:
                this.renderTitleScreen(ctx);
                break;
            case STATE.CONNECTION_LOST:
                this.renderConnectionLost(ctx);
                break;
            case STATE.RUNNING:
                this.game.render(ctx);
                break;
            case STATE.VICTORY:
                this.renderVictory(ctx);
                break;
            case STATE.LOSE:
                this.renderLose(ctx);
                break;
        }

        this.renderInfos(ctx);
        this.renderDebug(ctx);
    }



    /************************************************
     *                  GUI INTERACTIONS            *
     ************************************************/

    /**
     * Key down (press) event captured
     * @param {KeyboardEvent} e the keyboard event that has been captured
     */
    keydown(e) {
        if (this.game && this.state == STATE.RUNNING) {
            return this.game.keydown(e);
        }
    }
    /**
     * Key up (release) event captured
     * @param {KeyboardEvent} e the keyboard event that has been captured
     */
    keyup(e) {
        if (this.game && this.state == STATE.RUNNING) {
            return this.game.keyup(e);
        }
    }
    /**
     * Click on the canvas. 
     * @param {number} x X-coordinate relative to the canvas
     * @param {number} y Y-coordinate relative to the canvas
     * @returns 
     */
    click(x,y) {
        this.debug = x+","+y;
        if (this.state == STATE.TITLE_SCREEN) {
            if (this.buttons["CREATE"].isAt(x,y)) {
                console.log("clic sur create");
                return "create";
            }
            if (this.buttons["JOIN"].isAt(x,y)) {
                console.log("clic sur join");
                return "join";
            }
            return;
        }
        if (this.state == STATE.CONNECTION_LOST) {
            this.game = null;
            this.state = STATE.TITLE_SCREEN;
        }
    }
    dblclick(x, y) { }
    mousemove(x, y) { }
}


/**
 * GUI button
 */
class Button {

    constructor(txt, x, y, w, h) {
        this.x = x;
        this.y = y;
        this.txt = txt;
        this.padding = 20;
        this.height = h;
        this.width = w;
        this.x0 = x - w/2 - this.padding / 2;
        this.y0 = y - h/2 - this.padding / 2; 
    }

    render(ctx) {
        ctx.verticalAlign = "middle";
        ctx.textAlign = "center";
        ctx.font = `${this.height/2}px arial`;
        ctx.fillStyle = "red";
        ctx.fillRect(this.x0, this.y0, this.width + this.padding, this.height+this.padding/2);
        ctx.fillStyle = "black";
        ctx.fillRect(this.x0 + this.padding/2, this.y0 + this.padding/2, this.width, this.height - this.padding/2);
        ctx.fillStyle = "white";
        ctx.fillText(this.txt, this.x, this.y);
    }

    isAt(x, y) {
        return x >= this.x0 && x <= this.x0 + this.width + this.padding && y >= this.y0 && y <= this.y0 + this.height + this.padding;
    }

}

export default GUI;