import { preload, data } from "./loader.js";

export const WIDTH = 800, HEIGHT = 500;     // should be a ratio of 16/10

import GUI, { STATE } from "./gui.js";
import {END_GAME_STATE} from "./player.js";

/**
 *  Application 
 *  - loads resources 
 *  - starts GUI when ready
 */
document.addEventListener("DOMContentLoaded", function() {

    /** @type {HTMLCanvasElement} Canvas */
    const CVS = document.querySelector("canvas");
    /** @type {CanvasRenderingContext2D} Canvas 2D context */
    const CXT = CVS.getContext("2d");
    CXT.textAlign = "center";
    CXT.verticalAlign = "middle";
    CXT.font = "20px arial";
    CXT.fillStyle = "black";
    CXT.imageSmoothingEnabled = false;

    // GUI for game interactions
    const gui = new GUI();

    /** @type { boolean } true if all resources have been successfully loaded */ 
    let loaded = false;
    // start preload
    preload(onLoad).catch(onError);


    const socket = io('http://localhost:5500');

    socket.on("newgame", function({level,role,delay}) {
        gui.newGame(level, role, delay);
    });
    socket.on("playerMove", function(data) {
        //console.log("playerMove", data)
        gui.updateAdversary(data);
    });
    socket.on("playerLeft", function() {
        gui.interruptGame();
    });
    socket.on("playerTalk", function(data) {
        //console.log("playerTalk", data)
        gui.updateAdversaryTalk(data);
    });
    socket.on("noSuchGame", function() {
        gui.writeInfo("No available game", 2000);
    });
    socket.on("gameIsFull", function() {
        gui.writeInfo("Game is full", 2000);
    });
    socket.on("endGame", function({winner}) {
        console.log("endGame", winner);
        gui.game.player.endGame = winner == gui.game.player.role ? END_GAME_STATE.WIN : END_GAME_STATE.LOSE;
    }
    );
    
    /**  
     * Callback invoked each time a resource has been loaded. 
     * @param {number} current number of loaded resources 
     * @param {number} total number of expected resources
     * @returns 
     */
    function onLoad(current, total) {
        CXT.clearRect(0, 0, WIDTH, HEIGHT);
        // loading not yet completed
        if (current < total) {
            CXT.fillText(`Loading resources... (${(current / total) / 100 | 0}%)`, WIDTH / 2, HEIGHT * 0.5);
            return;
        }
        // loading complete!
        loaded = true;
        CXT.imageSmoothingEnabled = true;
        CXT.drawImage(data["logoGGJ"], WIDTH - 130, HEIGHT - 130, 120, 120)
        CXT.imageSmoothingEnabled = false;
        CXT.fillText(`Resources loaded. Click to start game.`, WIDTH / 2, HEIGHT * 0.5);
    }
    function onError(err) {
        CXT.clearRect(0, 0, WIDTH, HEIGHT);
        CXT.textAlign = "center";
        CXT.fillText("Unable to load resource: " + err, WIDTH / 2, HEIGHT * 0.4);
        CXT.fillText("Solve the problem to start the game.", WIDTH / 2, HEIGHT * 0.6);
    }

    // last update
    let lastUpdate = Date.now();
    // game loop
    function mainloop() {
        requestAnimationFrame(mainloop);
        let now = Date.now();
        gui.update(now - lastUpdate);
        // Check if the game ended (depending on player actions)
        if(gui.state ==  STATE.RUNNING && gui.game !== null && gui.game.player.endGame !== END_GAME_STATE.RUNNING){
            console.log("endGame", gui.game.player.endGame);
            if(gui.game.player.endGame === END_GAME_STATE.WIN){
                socket.emit("endGame",{winner:gui.game.player.role});
                gui.win(gui.game.player.role);
            }else{
                let winner = gui.game.player.role == "police" ? "killer" : "police";
                gui.lose(winner);
                socket.emit("endGame",{winner:winner});
            }
        }
        gui.render(CXT);
        lastUpdate = now;
    }


    /** Event listeners **/
    CVS.addEventListener("click", function(e) {
        if (!loaded) {
            return;
        }
        if (gui.state < 0) {
           // goFullScreen();
            gui.start();
            mainloop();
            return;
        }
        const rect = CVS.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (CVS.width / rect.width) | 0; 
        const y = (e.clientY - rect.top) * (CVS.height / rect.height) | 0;
        
        const r = gui.click(x, y);
        if (r == "create") {
            socket.emit("create");
            return;
        }
        if (r == "join") {
            socket.emit("join");
            return;
        }
        if (r == "exit") {
            socket.emit("exit");
            return;
        }
        if(r == "interaction"){
            gui.game.player.interact();
        }
    });
    document.addEventListener("dblclick", function(e) {
        if (e.target !== CVS && !document.fullscreenElement) {
            goFullScreen();
        }
    });
    document.addEventListener("keydown", function(e) { 
        if (e.repeat) return;
        let r = gui.keydown(e); 
        if (r && r.move) {
            socket.emit("playerMove",r.move);
            return;
        }
        if (r && r.talk) {
            socket.emit("playerTalk",r.talk);
            return;
        }
    });
    document.addEventListener("keyup", function(e) { 
        let r = gui.keyup(e); 
        if (r && r.move) {
            socket.emit("playerMove",r.move);
            return;
        }
    });

    /** Polyfill for setting fullscreen display */
    function goFullScreen() {
        CVS.requestFullscreen && CVS.requestFullscreen() || CVS.webkitRequestFullscreen && CVS.webkitRequestFullscreen() || CVS.msRequestFullscreen && CVS.msRequestFullscreen();
    }
});
