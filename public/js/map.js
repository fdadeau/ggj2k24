
import { WIDTH, HEIGHT } from "./app.js";

import { Adversary, PNJ } from "./pnj.js";

import { hitboxCollision, distanceSQ } from "./geometry.js";

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
    RABBIT: 31,

    ROOM_VERTICAL_DOOR_LEFT: 32,
    ROOM_VERTICAL_DOOR_RIGHT: 33,
    BATHROOM_VERTICAL_DOOR_LEFT: 34,
    BATHROOM_VERTICAL_DOOR_RIGHT: 35,
};

export class Map {

    constructor(level, delay) {
        // sort walls 
        this.walls = level.walls;//.map(e => e[0] > e[2] ? [e[2],e[1],e[0],e[3]] : e).map(e => e[1] > e[3] ? [e[0],e[3],e[2],e[1]] : e);
        this.rooms = level.rooms;
        this.furnitures = level.furnitures;
        /** @todo compute these values from walls data from level */
        this.boundaries = [2048, 2048];
        /** @type {Entity[]} */
        const firstTalk = [1, "Fais moi rire.", 1600];
        this.characters = level.PNJs.map((p,i) => new PNJ(i+2, p.scenario, [firstTalk, ...p.dialog], delay, p.skin));
    }

    /**
     * Adds the two main protagonists to the map
     * @param {Player} player 
     * @param {Adversary} adversary 
     */
    addPlayerAndAdversary(player, adversary) {
        this.player = player;
        this.adversary = adversary;
        this.characters.unshift(player, adversary);
    }

    
    /**
     * Retrieves a character from its identificator
     * @param {*} id the id of the character
     * @returns { Entity } the character that is requested.
     */
    getCharacterById(id) {
        return this.characters[Number(id)];
    }


    /**
     * Updates the complete set of characters (except player). 
     * @param {number} dt time elapsed since last update
     */
    update(dt) {
        if (this.player.isAvailable()) {
            this.player.closestPNJ = null;
        }
        let min = Infinity;
        for (let p=1; p < this.characters.length; p++) {
            let c = this.characters[p];
            c.update(dt);
            let dist = distanceSQ(this.player.x, this.player.y, c.x, c.y);
            if (this.player.isAvailable() && dist < PROXIMITY && this.player.sees(c.x, c.y) && dist < min) {
                min = dist;
                this.player.closestPNJ = c;
            }
        }        
    }

    getRoomFor(x,y) {
        return this.rooms[Math.floor(y / TILE_SIDE)] ? this.rooms[Math.floor(y / TILE_SIDE)][Math.floor(x / TILE_SIDE)] : null;
    }


    render(ctx) {
        // ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        ctx.strokeStyle = "grey";
        for (let w of this.walls) {
            this.renderTiles(ctx, w);
        }

        const furnitures = this.createFurnitures();
        const characters = this.characters.filter((c) => this.player.sees(c.x, c.y));
        characters.push(...furnitures);
        characters.sort(function(c1,c2) { return (c1.id == FURNITURE_TYPE.CARPET ? -1 :
                                                (c2.id == FURNITURE_TYPE.CARPET ? 1 :
                                                (c1.y - (c1.alive ? 0 : (c1.size ?? 0))) -
                                                (c2.y - (c2.alive ? 0 : (c2.size ?? 0)))));
        });
        const charWithDialog = [];
        for (let c of characters) {
            c.render(ctx);
            // small dot to indicate closest PNJ
            if (this.player.timeToInteract <= 0 && c.id > 0 && this.player.closestPNJ == c && c.isAvailable()) {
                ctx.strokeStyle = "black";
                ctx.textAlign = "center";
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.roundRect(c.x - 20, c.y-63, 40, 20, [10]);
                ctx.stroke();
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.closePath();
                ctx.font = "bold 30px serif";
                ctx.fillStyle = "black";
                ctx.fillText("...",c.x, c.y-50);
            }
            if (c.dialog && c.dialog.isRunning()) {
                charWithDialog.push(c);
            }
        }
        
        // redraw tiles to hide other rooms
        this.renderTiles2(ctx);
        
        for(let c of charWithDialog) {
            c.renderDialog(ctx);
        }

    }

    renderTiles2(ctx) {
        this.playerRoom = this.playerRoom || null;
        let i0 = Math.floor((this.player.y + this.player.size) / TILE_SIDE);
        let j0 = Math.floor(this.player.x / TILE_SIDE);
        let room = this.rooms[i0][j0];
        if (typeof room == "number") {
            this.playerRoom = room;
        }
        else if (room && room.S && this.player.orientation.y > 0) {
            this.playerRoom = room.S;
        }
        else if (room && room.N && this.player.orientation.y < 0) {
            this.playerRoom = room.N;
        }
        else if (room && room.E && this.player.orientation.x > 0) {
            this.playerRoom = room.E;
        }
        else if (room && room.O && this.player.orientation.x < 0) {
            this.playerRoom = room.O;
        }
        
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        for (let i=0; i < this.rooms.length; i++) {
            for (let j=0; j < this.rooms[i].length; j++) {
                if (!(this.rooms[i][j] == this.playerRoom || this.rooms[i][j] !== null && (this.rooms[i][j].N == this.playerRoom || this.rooms[i][j].S == this.playerRoom || this.rooms[i][j].E == this.playerRoom || this.rooms[i][j].O == this.playerRoom))) {
                    ctx.fillRect(j*TILE_SIDE,i*TILE_SIDE,TILE_SIDE,TILE_SIDE);
                }
                if (i == i0 && j == j0 && (typeof this.rooms[i][j] === "object")) {
                    //console.log(this.walls[i][j])
                    //this.renderTiles(ctx, this.walls[i][j])
                }
            }
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
                ctx.fillStyle = '#96502e';
                break;
            case TILE_TYPE.BAR_VERTICAL_DOOR: // 14
                ctx.fillStyle = '#772b09';
                break;
            case TILE_TYPE.CORRIDOR_VERTICAL_DOOR: // 15
                tile_img = data['planks_floor'];
                ctx.fillStyle = '#916023';
                break;
            case TILE_TYPE.BATHROOM_HORIZONTAL_DOOR: // 16
                ctx.fillStyle = '#7fb9bd';
                break;
            case TILE_TYPE.BATHROOM_VERTICAL_DOOR: // 17
                ctx.fillStyle = '#7fb9bd';
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
        let sprite_space = TILE_SIDE - 96.6;
        x = x - size + sprite_space;
        y = y - size + sprite_space;
        for(let f of furnitures){
            if (x + size > f.x && 
                x < f.x + f.width * 2 &&
                y + size * 2 > f.y + size * 1.25 &&
                y < f.y + f.height * 2 - size * 1.5
                && f.id != FURNITURE_TYPE.CARPET && (f.id < FURNITURE_TYPE.RABBIT || f.id > FURNITURE_TYPE.BATHROOM_VERTICAL_DOOR_RIGHT)){
                    return f;
            }
        }
        return null;
    }

    isTooCloseFromOneWall(x, y, size) {
        size = size * 2;
        let sprite_space = TILE_SIDE - 96.6;
        x = x - size + sprite_space;
        y = y - size + sprite_space;
        // Check collision with walls
        for (let wall of this.walls) {
            if (x + size > wall[0] && 
                x < wall[0] + wall[2] &&
                y + size > wall[1] &&
                y < wall[1] + wall[3] - (wall[4] == TILE_TYPE.OUTSIDE_WALL ? 0 : size * 1.5) &&
                (
                    (wall[4] >= TILE_TYPE.OUTSIDE_WALL 
                        && wall[4] <= TILE_TYPE.CORRIDOR_WALL) || 
                    wall[4] == TILE_TYPE.BAR_SHELVES)
                ) {
                return wall;
            }   
        } 

        // Check collision with furnitures
        return this.isTooCloseFromOneFurniture(x, y, size);
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
                if (this.name.includes("green") || this.name == 'rabbit') {
                    this.y = y + TILE_SIDE / 2;
                } else if (this.name.includes("door") || this.name == 'bar') { 
                    this.y = y;
                } else if (this.name == 'chevalet') {
                    this.y = y - TILE_SIDE * 0.75;
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
        ctx.drawImage(
            this.img, 
            this.x, 
            this.y, 
            this.width * 2, 
            this.height * 2, 
        );
    }
}
