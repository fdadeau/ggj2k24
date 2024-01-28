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
            "CREATE": new Button("Create Game", WIDTH*0.35, HEIGHT*0.7, 180, 60, true, "HotelMadriz"),
            "JOIN": new Button("Join Game", WIDTH*0.65, HEIGHT*0.7, 180, 60, true, "HotelMadriz"),
            "CREDITS": new Button("Credits", WIDTH*0.35, HEIGHT*0.84, 180, 60, true, "HotelMadriz"),
            "CONTROLS": new Button("Rules", WIDTH*0.65, HEIGHT*0.84, 180, 60, true, "HotelMadriz")
        }

        this.interactionButton = new InteractionButton("", WIDTH*.95, HEIGHT*.93, 64, 64, this);

        this.closeButton = new Button("X", WIDTH*.95, HEIGHT*.05, 64, 64, false, false);

        this.readyButton = new Button("Ready!", WIDTH*0.5, HEIGHT*0.75, 180, 60, true, "HotelMadriz")

        this.credits = false;
        this.controls = false;
    };

    /**
     * Launched when recieved from server
     * @param {Object} level Level description 
     * @param {string} role "police", "killer"
     * @param {number} delay the delay w.r.t. the start 
     */
    newGame(level, role, delay) {
        this.game = new Game(level, role, delay);
        this.state = STATE.WAITING_BEFORE_START;
        this.ready = false;
    }
    /**
     * Launched when recieved top from server
     */
    startGameFromServer(delay) {
        // TODO integrate delay
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
            // this.debug = JSON.stringify({x: this.game.map.adversary.x, y: this.game.map.adversary.y, vx: this.game.map.adversary.vecX, vy: this.game.map.adversary.vecY, role: this.game.player.role});
        }
    }

    renderTitleScreen(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(data["home_shiny_scene"],16, 26, 768, 448);
        ctx.drawImage(data["title"],WIDTH / 2 - 280/2, HEIGHT/2 - 80/2, 280, 80);
        ctx.drawImage(data["logoGGJ"], WIDTH - 100, HEIGHT - 110, 80, 80);
        for (let b in this.buttons) {
          this.buttons[b].render(ctx);
        }
    }

    renderWaitingScreen(ctx) {
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.textAlign = "center";
        ctx.fillText("You play the role of the " + this.game.player.role, WIDTH/2, HEIGHT*0.3);
        ctx.save();
        ctx.translate(WIDTH/2, HEIGHT/2);
        //ctx.translate(-this.game.player.x, -this.game.player.y);
        this.game.player.render(ctx);
        ctx.restore();
        const whatToDo = this.game.player.role == "killer" ? 
            "Stab victims with Morteau sausage. Don't get caught.": 
            "Discover who is the killer and arrest him. Don't be mistaken."
        ctx.fillText(whatToDo, WIDTH/2, HEIGHT*0.6)
        if (!this.ready) {
            this.readyButton.render(ctx);
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
        if(!this.endScreen){
            const zoomFactor = 1.75;
            ctx.scale(zoomFactor, zoomFactor);
            ctx.translate(-200,-125);
            this.game.render(ctx);
            ctx.font = "bold small-caps 60px HotelMadriz";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Victoire", WIDTH/2+20, HEIGHT/2+HEIGHT/4);
        }
        this.endScreen = true;
    }

    renderLose(ctx) {
        if(!this.endScreen){
            const zoomFactor = 1.75;
            ctx.scale(zoomFactor, zoomFactor);
            ctx.translate(-200,-125);
            this.game.render(ctx);
            ctx.font = "bold small-caps 60px HotelMadriz";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Defaite", WIDTH/2+20, HEIGHT/2+HEIGHT/4);
        }
        this.endScreen = true;
    }

    renderControls(ctx){
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(data["home_scene"],16, 26, 768, 448);
        ctx.drawImage(data["carpet"], 100, 50, 600, 400);
        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.fillText('Concept', 320, 160);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('Inspector :  Arrest the murderer', 160, 200);
        ctx.fillText('Murderer :   Kill without being caught', 160, 240);
        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";

        ctx.fillText('Controls', 320, 280);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('Arrows to move', 180, 320);
        ctx.fillText('Space to use an object', 180, 360);

        this.closeButton.render(ctx);
    }

    renderCredits(ctx){
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(data["home_scene"],16, 26, 768, 448);
        ctx.drawImage(data["carpet"], 100, 50, 600, 400);
        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.fillText('Coding', 170, 160);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('Fred Dadeau', 170, 200);
        ctx.fillText('Dorine Tabary', 170, 230);
        ctx.fillText('Robin Grappe', 170, 260);
        ctx.fillText('Tayeb Hakkar', 170, 290);

        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.fillText('Game Art', 320, 160);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('Marie-Almina', 320, 200);
        ctx.fillText('Gindre', 320, 230);
        ctx.fillText('Éléa Jacquin', 320, 260);
        ctx.font = "bold small-caps 20px arial";
        ctx.fillText('-', 380, 200);

        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.fillText('Sound Effects', 470, 160);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('Marie Almina Gindre', 470, 200);
        ctx.fillText('Robin Grappe', 470, 230);
        ctx.fillText('Tayeb Hakkar', 470, 260);
        ctx.fillText('Éléa Jacquin', 470, 290);

        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.fillText('Music', 200, 330);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('Raphaël Dadeau', 200, 360);
        ctx.fillText('Lancelot Vega', 200, 390);

        ctx.fillStyle = '#ffd728';
        ctx.font = "bold small-caps 25px HotelMadriz";
        ctx.fillText('Thanks to :', 380, 330);
        ctx.fillStyle = '#fff';
        ctx.font = "bold small-caps 20px HotelMadriz";
        ctx.fillText('All Besancon participants', 380, 360);
        ctx.fillText('for their jokes', 380, 390);

        this.closeButton.render(ctx);
    }

    /**
     * Renders the GUI
     * @param {CanvasRenderingContext2D} ctx Drawing area
     */
    render(ctx) {
        if(!(this.state == STATE.VICTORY || this.state == STATE.LOSE)){
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
        }
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
            case STATE.WAITING_BEFORE_START:
                this.renderWaitingScreen(ctx);
                break;
            case STATE.CONNECTION_LOST:
                this.renderConnectionLost(ctx);
                break;
            case STATE.RUNNING:
                this.game.render(ctx);
                // Rendering the interaction button
                if(this.game.player.closestPNJ != null){
                    this.interactionButton.render(ctx);
                }
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
                if (this.buttons["CREATE"].isAt(x,y) && ! this.credits && ! this.controls) {
                    return "create";
                }
                if (this.buttons["JOIN"].isAt(x,y) && ! this.credits && ! this.controls) {
                    return "join";
                }
                if (this.buttons["CREDITS"].isAt(x,y) && ! this.controls) {
                    this.credits = true;
                }
                if (this.buttons["CONTROLS"].isAt(x,y) && ! this.credits) {
                    this.controls = true;
                }
                if(this.closeButton.isAt(x,y)){
                    this.credits = false;
                    this.controls = false;
                }
                break;
            case STATE.WAITING_BEFORE_START:
                if (this.readyButton.isAt(x,y) && !this.ready) {
                    this.ready = true;
                    return "ready";
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

    constructor(txt, x, y, w, h, background, font) {
        this.x = x;
        this.y = y;
        this.txt = txt;
        this.padding = 20;
        this.height = h;
        this.width = w;
        this.x0 = x - w/2 - this.padding / 2;
        this.y0 = y - h/2 - this.padding / 2; 
        this.background = background;
        this.font = font;
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
        if (this.font == false) {
            ctx.font = `${this.height/2}px Arial`;
        } else {
            ctx.font = `${this.height/2}px ` + this.font;
        }
        
        if(this.background){
            ctx.drawImage(data["carpet"], this.x0, this.y0, this.width + this.padding, this.height+this.padding/16);
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