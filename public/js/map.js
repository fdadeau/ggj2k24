
import { WIDTH, HEIGHT } from "./app.js";

import { Adversary, PNJ } from "./pnj.js";

import { hitboxCollision, distanceSQ } from "./geometry.js";

const WALL_THICKNESS = 20;

/** @type {number} proximity of the player with other characters */
const PROXIMITY = 10000;

const TILE_TYPE = {
    PLANKS_FLOOR: 0,
    BATHROOM_FLOOR: 1,
    BAR_FLOOR: 2,
    ROOM_FLOOR: 3,
    KITCHEN_FLOOR: 4,

    OUTSIDE_WALL: 5,
    BATHROOM_WALL: 6,
    BAR_WALL: 7,
    ROOM_WALL: 8,
    CORRIDOR_WALL: 9,

    DOOR: 10
}

export class Map {

    constructor(level, delay, adversaryRole) {
        // sort walls 
        this.walls = level.walls;//.map(e => e[0] > e[2] ? [e[2],e[1],e[0],e[3]] : e).map(e => e[1] > e[3] ? [e[0],e[3],e[2],e[1]] : e);
        /** @todo compute these values from walls data from level */
        this.topLeft = [20, 20];
        this.bottomRight = [1024, 1024];
        this.boundaries = [1024, 1024];
        this.playerStart = level.start;
        /** 
         * @type {Adversary}
         */
        this.adversary = new Adversary(0,0,0,0,20,adversaryRole,this);
        /** @type {Entity[]} */
        this.PNJs = [this.adversary, ...level.PNJs.map(p => new PNJ(p.scenario, p.dialog, delay))];
    }

    update(dt) {
        this.player.closestPNJ = null;
        for (let p in this.PNJs) {
            this.PNJs[p].id = p;   // crade
            this.PNJs[p].update(dt);
            let dist = distanceSQ(this.player.x, this.player.y, this.PNJs[p].x, this.PNJs[p].y);
            if (dist < PROXIMITY && this.player.sees(this.PNJs[p].x, this.PNJs[p].y) && (this.player.closestPNJ == null || this.player.closestPNJ.distance > dist)) {
                this.player.closestPNJ = { pnj: this.PNJs[p], distance: dist }; 
            }
        }        
    }

    getPlayerStart(player) {
        this.player = player;
        let roleAdv = this.player.role === "police" ? "killer" : "police";
        let {x, y} = this.playerStart[roleAdv];
        this.adversary.x = x;
        this.adversary.y = y;
        this.adversary.role = roleAdv;
        return this.playerStart[this.player.role];
    }

    /** Adversary update (propagation to dedicated object) */
    updateAdversary(x, y, vecX, vecY) {
        this.adversary.updateAdversary(x,y,vecX,vecY);
    }
    updateAdversaryTalk(x, y, id, px, py) {
        let pnj = this.PNJs[Number(id)];
        pnj.x = px;
        pnj.y = py;
        this.adversary.updateAdversary(x,y,0,0);

        if(pnj instanceof PNJ){
            pnj.talk(this.adversary);
        }
        if(pnj instanceof Adversary){
            this.player.talkWithAdversary(this.adversary);
        }
    }

    render(ctx) {
        // ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        ctx.strokeStyle = "grey";
        for (let w of this.walls) {
            // ctx.beginPath();
            // ctx.moveTo(w[0],w[1]);
            // ctx.lineTo(w[0]+w[2],w[1]);
            // ctx.lineTo(w[0]+w[2],w[1]+w[3]);
            // ctx.lineTo(w[0],w[1]+w[3]);
            // ctx.lineTo(w[0],w[1]);
            // ctx.stroke();
            switch (w[4]) {
                case TILE_TYPE.PLANKS_FLOOR: // 0
                    ctx.fillStyle = '#916023'; // Brown
                    break;
                case TILE_TYPE.BATHROOM_FLOOR: // 1
                    ctx.fillStyle = '#7fb9bd'; // Light Blue
                    break;
                case TILE_TYPE.BAR_FLOOR: // 2
                    ctx.fillStyle = '#772b09'; // Gold
                    break;
                case TILE_TYPE.ROOM_FLOOR: // 3
                    ctx.fillStyle = '#96502e'; // Light Green
                    break;
                case TILE_TYPE.KITCHEN_FLOOR: // 4
                    ctx.fillStyle = '#eed9d0'; // Chocolate
                    break;
                case TILE_TYPE.OUTSIDE_WALL: // 5
                    ctx.fillStyle = 'lightgray'; // Dim Gray
                    break;
                case TILE_TYPE.BATHROOM_WALL: // 6
                    ctx.fillStyle = '#bce8eb'; // Teal
                    break;
                case TILE_TYPE.BAR_WALL: // 7
                    ctx.fillStyle = '#781900'; // Saddle Brown
                    break;
                case TILE_TYPE.ROOM_WALL: // 8
                    ctx.fillStyle = '#e3b286'; // Light Yellow
                    break;
                case TILE_TYPE.CORRIDOR_WALL: // 9
                    ctx.fillStyle = '#b83a25'; // Dark Gray
                    break;
                case TILE_TYPE.DOOR: // 10
                    ctx.fillStyle = 'black';
            }
            
            ctx.fillRect(w[0], w[1], w[2], w[3])
        }
        const characters = this.PNJs.filter((c) => this.player.sees(c.x, c.y));
        characters.push(this.player);
        characters.sort(function(c1,c2) { return c1.y - c2.y; })
        const charWithDialog = [];
        for (let c of characters) {
            c.render(ctx);
            // small dot to indicate closest PNJ
            if (this.player.closestPNJ && this.player.closestPNJ.pnj == c && c.isAvailable()) {
                ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.roundRect(c.x-20, c.y-50, 40, 20, [10]);
                ctx.stroke();
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.closePath();
                ctx.font = "bold 30px serif";
                ctx.fillStyle = "black";
                ctx.fillText("...",c.x-11, c.y-37);
                /*
                ctx.beginPath();
                ctx.arc(c.x, c.y - c.size - 15, 5, 0, 2*Math.PI);
                ctx.closePath();
                ctx.fill();
                */
            }
            if (c.dialog && c.dialog.isRunning()) {
                charWithDialog.push(c);
            }
        }
        for(let c of charWithDialog) {
            c.renderDialog(ctx);
        }
    }


    isTooCloseFromOneWall(x, y, size) {
        for (let wall of this.walls) {
            //if (!(x + size < wall[0]-WALL_THICKNESS/2 || x - size > wall[2]+WALL_THICKNESS/2 || y + size < wall[1]-WALL_THICKNESS/2 || y - size > wall[3] + WALL_THICKNESS/2)) {
            if (x + size > wall[0] && x - size < wall[0] + wall[2] && y + size > wall[1] && y - size / 4 < wall[1] + wall[3] && wall[4] >= TILE_TYPE.OUTSIDE_WALL && wall[4] <= TILE_TYPE.CORRIDOR_WALL) {
                return wall;
            }   
        } 
        return null;
    }


    computeWallsInViewport(viewport) {
        let r = this.walls.filter(w => hitboxCollision(w[0]-WALL_THICKNESS/2,w[1]-WALL_THICKNESS/2,w[2]+WALL_THICKNESS/2,w[3]+WALL_THICKNESS/2, viewport.x, viewport.y, viewport.x+WIDTH, viewport.y+HEIGHT));
        return r; 
    }
}

