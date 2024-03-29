import { preload, data } from "./loader.js";

export const WIDTH = 800, HEIGHT = 500;     // should be a ratio of 16/10

import GUI from "./gui.js";

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

    const socket = io();//('http://localhost:5500');

    socket.on("newgame", function({level,role,delay}) {
        gui.newGame(level, role, delay);
    });
    socket.on("startGame", function() {
        gui.startGameFromServer(0);
    });
    socket.on("playerLeft", function() {
        gui.interruptGame();
    });
    socket.on("playerMove", function(data) {
        console.log("playerMove", data);
        gui.updateAdversary("move", data);
    });
    socket.on("playerTalk", function(data) {
        console.log("playerTalk", data);
        gui.updateAdversary("talk", data);
    });
    socket.on("playerKill", function(data) {
        console.log("playerKill", data);
        gui.updateAdversary("kill", data);
    });
    socket.on("playerArrest", function(data) {
        console.log("playerArrest", data);
        gui.updateAdversary("arrest", data);
    });
    socket.on("noSuchGame", function() {
        gui.writeInfo("No available game", 1000);
    });
    socket.on("gameIsFull", function() {
        gui.writeInfo("Game is full", 1000);
    });
    
    /**  
     * Callback invoked each time a resource has been loaded. 
     * @param {number} current number of loaded resources 
     * @param {number} total number of expected resources
     * @returns 
     */
    function onLoad(current, total) {
        CXT.clearRect(0, 0, WIDTH, HEIGHT);
        CXT.fillStyle = '#000';
        CXT.fillRect(0, 0, WIDTH, HEIGHT);
        CXT.fillStyle = '#fff';
        CXT.font = "bold small-caps 40px HotelMadriz";
        // loading not yet completed
        if (current < total) {
            CXT.fillText(`Loading resources...`, WIDTH * 0.4, HEIGHT * 0.5);
            CXT.font = "bold small-caps 40px arial";
            CXT.fillText(`(${(current / total) / 100 | 0}%)`, WIDTH * 0.75, HEIGHT * 0.5);
            return;
        }
        // loading complete!
        loaded = true;
        CXT.font = "bold small-caps 40px HotelMadriz";
        CXT.imageSmoothingEnabled = true;
        // CXT.drawImage(data["logoGGJ"], WIDTH - 130, HEIGHT - 130, 120, 120)
        CXT.imageSmoothingEnabled = false;
        CXT.fillText(`Resources loaded.`, WIDTH / 2, HEIGHT * 0.4);
        CXT.fillText(`Click to start game.`, WIDTH / 2, HEIGHT * 0.6);
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
        let r = gui.update(now - lastUpdate);
        // Check if the game ended (depending on player actions)
        if (r && r.gameover) {
            socket.emit("endGame",{ winner: r.gameover.winner });
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
        if (r && r.talk) {
            socket.emit("playerTalk",r.talk);
            return;
        }
        if (r && r.kill) {
            socket.emit("playerKill", r.kill);
            return;
        }
        if (r && r.arrest) {
            socket.emit("playerArrest", r.arrest);
            return;
        }
        if (r == "ready") {
            socket.emit("ready");
            return;
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
            socket.emit("playerMove", r.move);
            return;
        }
        if (r && r.talk) {
            socket.emit("playerTalk", r.talk);
            return;
        }
        if (r && r.kill) {
            socket.emit("playerKill", r.kill);
            return;
        }
        if (r && r.arrest) {
            socket.emit("playerArrest", r.arrest);
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

   

    const manette = document.getElementById("manette");
    manette.addEventListener("touchstart", function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const manetteBB = manette.getBoundingClientRect();
        const x = e.changedTouches.item(0).clientX - manetteBB.left - manetteBB.width / 2;
        const y = e.changedTouches.item(0).clientY - manetteBB.top - manetteBB.height / 2;
        let c = gui.touchStart(x,y);
        if (c) {
            manette.setAttribute("class",c.klass);
            if (c.move) {
                socket.emit("playerMove",c.move);  
            }
        }
    }, true);
    manette.addEventListener("touchmove", function (e) {
        const manetteBB = manette.getBoundingClientRect();
        const x = e.changedTouches.item(0).clientX - manetteBB.left - manetteBB.width / 2;
        const y = e.changedTouches.item(0).clientY - manetteBB.top - manetteBB.height / 2;
        let c = gui.touchMove(x,y);
        if (c) {
            manette.setAttribute("class",c.klass);
            if (c.move) {
                socket.emit("playerMove",c.move);  
            }
        }
    });
    manette.addEventListener("touchend", function(e) {
        let c = gui.touchEnd();
        manette.setAttribute("class","");
        if (c && c.move) {
            socket.emit("playerMove",c.move);  
        }
    });
    CVS.addEventListener("touchstart", function(e) {
        let r = gui.keydown({code:"Space"});
        if (r && r.talk) {
            socket.emit("playerTalk", r.talk);
            return;
        }
        if (r && r.kill) {
            socket.emit("playerKill", r.kill);
            return;
        }
        if (r && r.arrest) {
            socket.emit("playerArrest", r.arrest);
            return;
        }
    });


    /** Polyfill for setting fullscreen display */
    function goFullScreen() {
        document.body.requestFullscreen && document.body.requestFullscreen() || document.body.webkitRequestFullscreen && document.body.webkitRequestFullscreen() || document.body.msRequestFullscreen && document.body.msRequestFullscreen();
    }
});
