
import { WIDTH, HEIGHT } from "./app.js";

import { Adversary, PNJ } from "./pnj.js";

import { hitboxCollision, distanceSQ } from "./geometry.js";

import { SKINS } from "./game.js";

import { data } from "./loader.js";

const WALL_THICKNESS = 20;

const TILE_SIDE = 128;

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
    BAR_SHELVES: 18,
    ROOM_WALL: 8,
    CORRIDOR_WALL: 9,

    ROOM_HORIZONTAL_DOOR: 10,
    BAR_HORIZONTAL_DOOR: 11,
    CORRIDOR_HORIZONTAL_DOOR: 12,
    ROOM_VERTICAL_DOOR: 13,
    BAR_VERTICAL_DOOR: 14,
    CORRIDOR_VERTICAL_DOOR: 15,
    BATHROOM_HORIZONTAL_DOOR: 16,
    BATHROOM_VERTICAL_DOOR: 17
};

const FURNITURE_TYPE = {
    NONE: -1,
    SINK_FRONT: 0,
    SINK_LEFT: 1,
    SINK_RIGHT: 2,
    TUB: 3,
    BED_FRONT: 4,
    BED_LEFT: 5,
    BED_RIGHT: 6,
    PLANT_1: 7,
    PLANT_2: 8,
    PLANT_3: 9,
    SOFA_BLUE_FRONT: 10,
    SOFA_BLUE_LEFT: 11,
    SOFA_BLUE_RIGHT: 12,
    SOFA_GREEN_FRONT: 13,
    SOFA_GREEN_LEFT: 14,
    SOFA_GREEN_RIGHT: 15,
    SOFA_RED_FRONT: 16,
    SOFA_RED_LEFT: 17,
    SOFA_RED_RIGHT: 18,
    CHEVALET: 19,
    ROUND_TABLE: 20,
    BAR: 21,
    WC_FRONT: 22,
    WC_LEFT: 23,
    WC_RIGHT: 24,
    CARPET: 25,
}

export class Map {

    constructor(level, delay, adversaryRole, skins) {
        // sort walls 
        this.walls = level.walls;//.map(e => e[0] > e[2] ? [e[2],e[1],e[0],e[3]] : e).map(e => e[1] > e[3] ? [e[0],e[3],e[2],e[1]] : e);
        /** @todo compute these values from walls data from level */
        this.topLeft = [20, 20];
        this.bottomRight = [2048, 2048];
        this.boundaries = [2048, 2048];
        this.playerStart = level.start;
        /** 
         * @type {Adversary}
         */
        this.adversary = new Adversary(0,0,0,0,20,adversaryRole,this);
        /** @type {Entity[]} */
        this.PNJs = [this.adversary, ...level.PNJs.map(p => new PNJ(p.scenario, p.dialog, delay))];

        // Giving a random skin to each PNJ
        for (let p in this.PNJs) {
            let skin = skins[Math.floor(Math.random() * skins.length)];
            console.log("skin", skin);
            skins = skins.filter(s => s != skin);
            this.PNJs[p].sprite = data[skin];
            if(skins.length == 0){
                skins = SKINS;
            }
        }
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
            this.renderTiles(ctx, w);
            this.renderFurnitures(ctx, w);
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

    renderTiles(ctx, w) {
        let tile_img = null;
        switch (w[4]) {
            case TILE_TYPE.PLANKS_FLOOR: // 0
                tile_img = data['planks_floor'];
                ctx.fillStyle = '#916023';
                break;
            case TILE_TYPE.BATHROOM_FLOOR: // 1
                ctx.fillStyle = '#7fb9bd';
                break;
            case TILE_TYPE.BAR_FLOOR: // 2
                ctx.fillStyle = '#772b09'; // Gold
                break;
            case TILE_TYPE.ROOM_FLOOR: // 3
                ctx.fillStyle = '#96502e';
                break;
            case TILE_TYPE.KITCHEN_FLOOR: // 4
                tile_img = data['kitchen_floor'];
                ctx.fillStyle = '#eed9d0';
                break;

            case TILE_TYPE.OUTSIDE_WALL: // 5
                ctx.fillStyle = 'black';
                break;
            case TILE_TYPE.BATHROOM_WALL: // 6
                tile_img = data['bathroom_wall'];
                ctx.fillStyle = '#bce8eb';
                break;
            case TILE_TYPE.BAR_WALL: // 7
                tile_img = data['bar_wall'];
                ctx.fillStyle = '#781900';
                break;
            case TILE_TYPE.BAR_SHELVES: // 18
                tile_img = data['bar_shelves'];
                ctx.fillStyle = '#781900';
                break;
            case TILE_TYPE.ROOM_WALL: // 8
                tile_img = data['room_wall'];
                ctx.fillStyle = '#e3b286';
                break;
            case TILE_TYPE.CORRIDOR_WALL: // 9
                tile_img = data['corridor_wall'];
                ctx.fillStyle = '#b83a25'; // Dark Gray
                break;

            case TILE_TYPE.ROOM_HORIZONTAL_DOOR: // 10
                tile_img = data['room_horizontal_door'];
                ctx.fillStyle = '#6d2a02';
                break;
            case TILE_TYPE.BAR_HORIZONTAL_DOOR: // 11
                tile_img = data['bar_horizontal_door'];
                ctx.fillStyle = '#6d2a02';
                break;
            case TILE_TYPE.CORRIDOR_HORIZONTAL_DOOR: // 12
                tile_img = data['corridor_horizontal_door'];
                ctx.fillStyle = '#6d2a02';
                break;
            case TILE_TYPE.ROOM_VERTICAL_DOOR: // 13
            case TILE_TYPE.BAR_VERTICAL_DOOR: // 14
            case TILE_TYPE.CORRIDOR_VERTICAL_DOOR: // 15
                ctx.fillStyle = '#6d2a02';
                break;
            case TILE_TYPE.BATHROOM_HORIZONTAL_DOOR: // 16
                ctx.fillStyle = '#10585d';
                break;
            case TILE_TYPE.BATHROOM_VERTICAL_DOOR: // 17
                ctx.fillStyle = '#10585d';
                break;
        }

        if (tile_img == null) {
            ctx.fillRect(w[0], w[1], w[2]+1, w[3]+1);
        } else {
            ctx.drawImage(tile_img, w[0], w[1], w[2]+1, w[3]+1);
        }
    }

    renderFurnitures(ctx, w) {
        let furniture = this.getFurniture(w);
        if (furniture != null) {
            ctx.drawImage(furniture.img, furniture.x, furniture.y, furniture.width * 2, furniture.height * 2);
        }
    }

    getFurniture(w) {
        let x = w[0];
        let y = w[1];
        let furniture_img = null;
        let width = null;
        let height = null;

        switch (w[5]) {
            case FURNITURE_TYPE.NONE: // -1
                return null;
            case FURNITURE_TYPE.SINK_FRONT: // 0
                furniture_img =  data['sink_front'];
                width = 24;
                height = 33;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.SINK_LEFT: // 1
                furniture_img =  data['sink_left'];
                width = 14;
                height = 30;
                x = x + TILE_SIDE - width * 2;
                break;
            case FURNITURE_TYPE.SINK_RIGHT: // 2
                furniture_img =  data['sink_right'];
                width = 14;
                height = 30;
                break;
            case FURNITURE_TYPE.TUB: // 3
                furniture_img =  data['tub'];
                width = 62;
                height = 28;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.BED_FRONT: // 4
                furniture_img =  data['bed_front'];
                width = 46;
                height = 62;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.BED_LEFT: // 5
                furniture_img =  data['bed_left'];
                width = 57;
                height = 41;
                x = x + TILE_SIDE - width * 2;
                break;
            case FURNITURE_TYPE.BED_RIGHT: // 6
                furniture_img =  data['bed_right'];
                width = 57;
                height = 41;
                break;
            case FURNITURE_TYPE.PLANT_1: // 7
                furniture_img =  data['plant_1'];
                width = 13;
                height = 28;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.PLANT_2: // 8
                furniture_img =  data['plant_2'];
                width = 25;
                height = 28;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.PLANT_3: // 9
                furniture_img =  data['plant_3'];
                width = 17;
                height = 30;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.SOFA_BLUE_FRONT: // 10
                furniture_img =  data['sofa_blue_front'];
                width = 50;
                height = 32;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.SOFA_BLUE_LEFT: // 11
                furniture_img =  data['sofa_blue_left'];
                width = 20;
                height = 53;
                x = x + TILE_SIDE - width * 2;
                break;
            case FURNITURE_TYPE.SOFA_BLUE_RIGHT: // 12
                furniture_img =  data['sofa_blue_right'];
                width = 20;
                height = 53;
                break;
            case FURNITURE_TYPE.SOFA_GREEN_FRONT: // 13
                furniture_img =  data['sofa_green_front'];
                width = 50;
                height = 32;
                x = x + TILE_SIDE / 2 - width;
                y = y + TILE_SIDE / 2;
                break;
            case FURNITURE_TYPE.SOFA_GREEN_LEFT: // 14
                furniture_img =  data['sofa_green_left'];
                width = 20;
                height = 53;
                x = x + TILE_SIDE - width * 2;
                break;
            case FURNITURE_TYPE.SOFA_GREEN_RIGHT: // 15
                furniture_img =  data['sofa_green_right'];
                width = 20;
                height = 53;
                break;
            case FURNITURE_TYPE.SOFA_RED_FRONT: // 16
                furniture_img =  data['sofa_red_front'];
                width = 50;
                height = 32;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.SOFA_RED_LEFT: // 17
                furniture_img =  data['sofa_red_left'];
                width = 20;
                height = 53;
                x = x + TILE_SIDE - width * 2;
                break;
            case FURNITURE_TYPE.SOFA_RED_RIGHT: // 18
                furniture_img =  data['sofa_red_right'];
                width = 20;
                height = 53;
                break;
            case FURNITURE_TYPE.CHEVALET: // 19
                furniture_img = data['chevalet'];
                width = 64;
                height = 64;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE * 0.75;
                break;
            case FURNITURE_TYPE.ROUND_TABLE: // 20
                furniture_img = data['round_table'];
                width = 18;
                height = 22;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.BAR: // 21
                furniture_img = data['bar'];
                width = 64;
                height = 37;
                x = x + TILE_SIDE / 2 - width;
                break;
            case FURNITURE_TYPE.WC_FRONT: // 22
                furniture_img = data['wc_front'];
                width = 18;
                height = 31;
                x = x + TILE_SIDE / 2 - width;
                y = y - TILE_SIDE / 4;
                break;
            case FURNITURE_TYPE.WC_LEFT: // 23
                furniture_img = data['wc_left'];
                width = 24;
                height = 30;
                x = x + TILE_SIDE - width * 2;
                break;
            case FURNITURE_TYPE.WC_RIGHT: // 24
                furniture_img = data['wc_right'];
                width = 24;
                height = 30;
                break;
            case FURNITURE_TYPE.CARPET: // 25
                furniture_img = data['carpet'];
                width = 64;
                height = 32;
                x = x + TILE_SIDE - width * 2;
                break;
        }
        return {img: furniture_img, x: x, y: y, width: width, height: height};
    }


    isTooCloseFromOneWall(x, y, size) {
        size = size * 2;
        // j, i, width, height, type, type
        for (let wall of this.walls) {
            //if (!(x + size < wall[0]-WALL_THICKNESS/2 || x - size > wall[2]+wall[3]/2 || y + size < wall[1]-wall[4]/2 || y - size > wall[3] + wall[4]/2)) {
            let furniture = this.getFurniture(wall);
            if ((x + size > wall[0] + TILE_SIDE / 16 && 
                x < wall[0] + wall[2] + TILE_SIDE / 16 &&  // HERE
                y + size > wall[1] - TILE_SIDE / 16 && // To down
                y < wall[1] + wall[3] - TILE_SIDE / 4 && // To up
                (
                    (wall[4] >= TILE_TYPE.OUTSIDE_WALL 
                        && wall[4] <= TILE_TYPE.CORRIDOR_WALL) || 
                    wall[4] == TILE_TYPE.BAR_SHELVES)
                ) ||
                (furniture !== null &&
                x + size > furniture.x && 
                x < furniture.x + furniture.width + TILE_SIDE / 4 &&  // HERE
                y + size > furniture.y /*- TILE_SIDE/16*/ && // To down
                y < furniture.y + furniture.height /*- TILE_SIDE / 8*/ &&
                wall[5] != FURNITURE_TYPE.CARPET)) {
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

