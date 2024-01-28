/**
 * Class describing the Graphical User Interface
 */

import { WIDTH, HEIGHT } from "./app.js";

import { Game } from "./game.js";

import data from "./assets.js";

import { INTERACTION_TIMER } from "./player.js";

import { audio } from "./audio.js";

export const FRAME_DELAY = 100;

export const STATE = { 
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
            "CREATE": new Button("Create game", WIDTH*0.35, HEIGHT*0.7, 140, 40, true),
            "JOIN": new Button("Join game", WIDTH*0.65, HEIGHT*0.7, 140, 40, true),
            "CREDITS": new Button("Credits", WIDTH*0.35, HEIGHT*0.84, 140, 40, true),
            "CONTROLS": new Button("Rules", WIDTH*0.65, HEIGHT*0.84, 140, 40, true)
        }

        this.interactionButton = new InteractionButton("", WIDTH*.95, HEIGHT*.93, 64, 64, this);

        this.closeButton = new Button("X", WIDTH*.95, HEIGHT*.05, 32, 32, false);

        this.credits = false;
        this.controls = false;
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
            this.game.updateAdversaryTalk(data.x, data.y, data.pnjId, data.pnjX, data.pnjY);
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
        if(!audio.audioIsPlaying("theme_sing")){
            // TODO : reactivate
            //**audio.playMusic("theme_sing", 0.5); 
        }
    }

    win(winner){
        this.state = STATE.VICTORY;
        this.winner = winner;
    }

    lose(winner){
        this.state = STATE.LOSE;
        this.winner = winner;
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
            this.debug = JSON.stringify({x: this.game.map.adversary.x, y: this.game.map.adversary.y, vx: this.game.map.adversary.vecX, vy: this.game.map.adversary.vecY, role: this.game.player.role});
        }
    }

    renderTitleScreen(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(data["home_shiny_scene"],16, 26, 768, 448);
        ctx.drawImage(data["title"],WIDTH / 2 - 280/2, HEIGHT/2 - 80/2, 280, 80);
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
    
    renderInfos(ctx){
        if (this.info) {
            ctx.textAlign = "center";
            ctx.font = "18px arial";
            ctx.fillStyle = "black";
            ctx.fillText(this.info.txt, WIDTH / 2, HEIGHT / 2 + 50);
        }
    }

    renderDebug(ctx) {
        if (this.debug) {
            ctx.font = "8px arial";
            ctx.textAlign = "left";
            ctx.fillText("DEBUG: " + this.debug, 1, 10);
        }
    }

    renderVictory(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        if(this.winner == "police" && this.game.player.role == "police"){
            ctx.drawImage(data["arrest_scene"],16, 26, 768, 448);
        }
        if(this.winner == "killer" && this.game.player.role == "killer"){
            ctx.drawImage(data["kill_scene"],16, 26, 768, 448);
        }
        ctx.font = "24px arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Victoire !", WIDTH/2+20, HEIGHT/2);
        for (let b in this.buttons) {
          this.buttons[b].render(ctx);
        }
    }

    renderLose(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        if(this.winner == "police" && this.game.player.role == "killer"){
            ctx.drawImage(data["arrest_scene"],16, 26, 768, 448);
        }
        if(this.winner == "killer" && this.game.player.role == "police"){
            ctx.drawImage(data["kill_scene"],16, 26, 768, 448);
        }
        ctx.font = "24px arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Défaite...", WIDTH/2+20, HEIGHT/2);
        for (let b in this.buttons) {
          this.buttons[b].render(ctx);
        }
    }

    renderControls(ctx){
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(data["home_scene"],16, 26, 768, 448);
        ctx.drawImage(data["carpet"], 100, 50, 600, 400);
        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px arial"
        ctx.fillText('Concept', 320, 160);
        ctx.fillText('Controls', 320, 330);

        this.closeButton.render(ctx);
    }

    renderCredits(ctx){
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(data["home_scene"],16, 26, 768, 448);
        ctx.drawImage(data["carpet"], 100, 50, 600, 400);
        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px arial"
        ctx.fillText('Coding', 170, 160);
        ctx.fillStyle = '#000';
        ctx.font = "bold small-caps 20px arial"
        ctx.fillText('Fred Dadeau', 170, 200);
        ctx.fillText('Robin Grappe', 170, 230);
        ctx.fillText('Tayeb Hakkar', 170, 260);


        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px arial"
        ctx.fillText('Music', 490, 160);
        ctx.fillStyle = '#000';
        ctx.font = "bold small-caps 20px arial"
        ctx.fillText('Raphaël Dadeau', 490, 200);
        // TODO + bruiteurs

        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px arial"
        ctx.fillText('Game Art', 330, 160);
        ctx.fillStyle = '#000';
        ctx.font = "bold small-caps 20px arial"
        ctx.fillText('Marie-Almina', 330, 200);
        ctx.fillText('Gindre', 330, 230);
        ctx.fillText('Éléa Jacquin', 330, 260);

        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px arial"
        ctx.fillText('Thanks to :', 320, 330);
        ctx.fillStyle = '#000';
        ctx.font = "bold small-caps 20px arial"
        ctx.fillText('All Besançon participants', 250, 360);
        ctx.fillText('for their jokes', 320, 390);

        this.closeButton.render(ctx);
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
                if(this.controls){
                    this.renderControls(ctx);
                    return;   
                }
                if(this.credits){
                    this.renderCredits(ctx);
                    return;
                }
                this.renderTitleScreen(ctx);
                break;
            case STATE.CONNECTION_LOST:
                this.renderConnectionLost(ctx);
                break;
            case STATE.RUNNING:
                this.game.render(ctx);
                // Rendering the interaction button
                this.interactionButton.render(ctx);
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
        switch(this.state){
            case STATE.TITLE_SCREEN:
                if (this.buttons["CREATE"].isAt(x,y)) {
                    return "create";
                }
                if (this.buttons["JOIN"].isAt(x,y)) {
                    return "join";
                }
                if (this.buttons["CREDITS"].isAt(x,y)) {
                    this.credits = true;
                }
                if (this.buttons["CONTROLS"].isAt(x,y)) {
                    this.controls = true;
                }
                if(this.closeButton.isAt(x,y)){
                    this.credits = false;
                    this.controls = false;
                }
                break;
            case STATE.CONNECTION_LOST:
                this.game = null;
                this.state = STATE.TITLE_SCREEN;
                break;
            case STATE.RUNNING:
                if(this.interactionButton.isAt(x,y)){
                    console.log("clic sur interaction");
                    return "interaction";
                }
                break;
        }
    }
    dblclick(x, y) { }
    mousemove(x, y) { }
    touchStart(x, y) {
        if (!this.game) return;
        let key = "";
        if (Math.abs(x) > Math.abs(y)) {
            key = x < 0 ? "ArrowLeft" : "ArrowRight";
        }
        else {
            key = y < 0 ? "ArrowUp" : "ArrowDown";
        }
        if (this.lastKey !== key) {
            this.lastKey = key;
            let r = this.game.keydown({ code: key })
            if (r) {
                r.klass = key;
            }
            return r;
        }
    }
    touchMove(x,y) {
        if (!this.game) return;
        let key = "";
        if (Math.abs(x) > Math.abs(y)) {
            key = x < 0 ? "ArrowLeft" : "ArrowRight";
        }
        else {
            key = y < 0 ? "ArrowUp" : "ArrowDown";
        }
        if (this.lastKey !== key) {
            this.game.keyup();
            this.lastKey = key;
            let r = this.game.keydown({ code: key })
            if (r) {
                r.klass = key;
            }
            return r;
        }
    }
    touchEnd() {
        if (!this.game) return;
        this.lastKey = null;
        return this.game.keyup();
    }
}


/**
 * GUI button
 */
class Button {

    constructor(txt, x, y, w, h, background) {
        this.x = x;
        this.y = y;
        this.txt = txt;
        this.padding = 20;
        this.height = h;
        this.width = w;
        this.x0 = x - w/2 - this.padding / 2;
        this.y0 = y - h/2 - this.padding / 2; 
        this.background = background;
    }

    render(ctx) {
        /*
        ctx.verticalAlign = "middle";
        ctx.textAlign = "center";
        ctx.font = `${this.height/2}px arial`;
        ctx.fillStyle = "red";
        ctx.fillRect(this.x0, this.y0, this.width + this.padding, this.height+this.padding/2);
        ctx.fillStyle = "black";
        ctx.fillRect(this.x0 + this.padding/2, this.y0 + this.padding/2, this.width, this.height - this.padding/2);
        ctx.fillStyle = "white";
        ctx.fillText(this.txt, this.x, this.y);
        */
        ctx.verticalAlign = "middle";
        ctx.textAlign = "center";
        ctx.font = `${this.height/2}px arial`;
        if(this.background){
            ctx.drawImage(data["carpet"], this.x0, this.y0, this.width + this.padding, this.height+this.padding/2);
        }
        ctx.fillStyle = "white";
        ctx.fillText(this.txt, this.x, this.y);
    }

    isAt(x, y) {
        return x >= this.x0 && x <= this.x0 + this.width + this.padding && y >= this.y0 && y <= this.y0 + this.height + this.padding;
    }
}

class InteractionButton extends Button {
    constructor(txt, x, y, w, h, gui) {
        super(txt, x, y, w, h);
        this.gui = gui;
    }

    render(ctx) {
        if(!this.gui.game.player.isAvailable() && this.gui.game.player.timeToInteract < INTERACTION_TIMER){
            // Draw the timer
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, 2*Math.PI);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fill();
            ctx.closePath();
            ctx.beginPath();    
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.width/2, 0, 2*Math.PI*this.gui.game.player.timeToInteract/INTERACTION_TIMER);
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fill();
        }else{
            if(this.gui.game.player.talkingTo == null){
                ctx.drawImage(data["question"], this.x0, this.y0);
            }else{
                if(this.gui.game.player.role == "killer"){;
                    ctx.drawImage(data["saussage"], this.x0, this.y0);
                }else{
                    ctx.drawImage(data["trap"], this.x0, this.y0);
                }
            }
        }
    }
}

export default GUI;