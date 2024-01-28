
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
    PIANO_LEFT: 26,
    PIANO_RIGHT: 27,
    SOFA_GREEN_CAT: 28,
    SOFA_RED_CAT_1: 29,
    SOFA_RED_CAT_2: 30,
    RABBIT: 31
};

export class Map {

    constructor(level, delay, adversaryRole, skins) {
        // sort walls 
        this.walls = level.walls;//.map(e => e[0] > e[2] ? [e[2],e[1],e[0],e[3]] : e).map(e => e[1] > e[3] ? [e[0],e[3],e[2],e[1]] : e);
        this.furnitures = level.furnitures;
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
        }

        const furnitures = this.createFurnitures();
        const characters = this.PNJs.filter((c) => this.player.sees(c.x, c.y));
        characters.push(...furnitures);
        characters.push(this.player);
        characters.sort(function(c1,c2) { return c1.y - c2.y; })
        const charWithDialog = [];
        for (let c of characters) {
            c.render(ctx);
            // small dot to indicate closest PNJ
            if (c instanceof PNJ && this.player.closestPNJ && this.player.closestPNJ.pnj == c && c.isAvailable()) {
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

    createFurnitures() {
        let furnitures_objects = [];
        for (let f of this.furnitures) {
            if (f[2] != FURNITURE_TYPE.NONE) {
                furnitures_objects.push(new Furniture(f[0], f[1], f[2]));
            }
        }
        return furnitures_objects;
    }

    renderFurnitures(ctx, w) {
        let furniture = this.getFurniture(w);
        if (furniture != null) {
            ctx.drawImage(furniture.img, furniture.x, furniture.y, furniture.width * 2, furniture.height * 2);
        }
    }

    isTooCloseFromOneFurniture(x, y, size) {
        let furnitures = this.createFurnitures();
        x = x - size;
        y = y - size;
        for(let f of furnitures){
            // TODO
            // if (x + size > f.x && 
            //     x < f.x + f.width &&
            //     y + size > f.y + size/4 &&
            //     y < f.y + f.height - size/2
            //     && f.id != FURNITURE_TYPE.CARPET){
            //         return f;
            // }
        }
        return null;
    }

    isTooCloseFromOneWall(x, y, size) {
        size = size * 2;
        // Check collision with walls
        for (let wall of this.walls) {
            if (x + size > wall[0] + TILE_SIDE / 16 && 
                x < wall[0] + wall[2] + TILE_SIDE / 16 &&
                y + size > wall[1] - TILE_SIDE / 16 &&
                y < wall[1] + wall[3] - TILE_SIDE / 4 &&
                (
                    (wall[4] >= TILE_TYPE.OUTSIDE_WALL 
                        && wall[4] <= TILE_TYPE.CORRIDOR_WALL) || 
                    wall[4] == TILE_TYPE.BAR_SHELVES)
                ) {
                return wall;
            }   
        } 

        // Check collision with furnitures
        return this.isTooCloseFromOneFurniture(x, y, size * 2);
    }


    computeWallsInViewport(viewport) {
        let r = this.walls.filter(w => hitboxCollision(w[0]-WALL_THICKNESS/2,w[1]-WALL_THICKNESS/2,w[2]+WALL_THICKNESS/2,w[3]+WALL_THICKNESS/2, viewport.x, viewport.y, viewport.x+WIDTH, viewport.y+HEIGHT));
        return r; 
    }
}

class Furniture {

    constructor(x, y, id) {
        this.id = id;
        this.name = this.getFurnitureNameByID(id);
        this.img = data[this.name];
        this.width = this.img.width;
        this.height = this.img.height;
        let split = this.name.split('_');
        this.position = split[split.length - 1];

        switch(this.position) {
            case 'left':
                this.x = x + TILE_SIDE - this.width * 2;
                this.y = y;
                break;
            case 'right':
                this.x = x;
                this.y = y;
                break;
            case 'front':
            default:
                this.x = x + TILE_SIDE / 2 - this.width;
                if (this.name.includes("green")) {
                    this.y = y + TILE_SIDE / 2;
                } else if (this.name == 'chevalet') {
                    this.y = y - TILE_SIDE * 0.75;
                } else if (this.name == 'bar') {
                    this.y = y;
                } else if (this.name == 'rabbit') {
                    this.y = y + TILE_SIDE / 2;
                } else { 
                    this.y = y - TILE_SIDE / 4;
                }
        }
    }

    getFurnitureNameByID(id) {
        for (const furniture_name in FURNITURE_TYPE) {
            if (FURNITURE_TYPE[furniture_name] === id) {
                return furniture_name.toLowerCase();
            }
        }
        return false;
    }

    render(ctx) {
        // ctx.fillStyle = '#f00';
        // ctx.fillRect(this.x, this.y, this.width * 2, this.height * 2)
        ctx.drawImage(
            this.img, 
            this.x, 
            this.y, 
            this.width * 2, 
            this.height * 2, 
            // this.x - this.width/2,
            // this.y -this.height/2,
            // this.width * 1.5, 
            // this.height * 1.5
        );
    }
}
