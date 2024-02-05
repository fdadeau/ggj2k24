
import { Adversary, PNJ } from "./pnj.js";

import { hitboxCollision, distanceSQ } from "./geometry.js";

import { data } from "./loader.js";
import { SPRITE_H } from "./entity.js";

import { audio } from "./audio.js";

const TILE_SIDE = 128;

/** @type {number} proximity of the player with other characters */
const PROXIMITY = 10000;

const DEBUG = false;

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
        // rooms
        this.rooms = level.rooms;
        // sort walls 
        this.walls = level.walls.map(w => new Tile(w[4],w[0],w[1],w[2],w[3],w[5],w[6],level.rooms[w[5]][w[6]]));
        this.doors = this.walls.filter(w => w.isDoor());
        // initialise furnitures
        this.furnitures = this.createFurnitures(level.furnitures);
        /** @todo compute these values from walls data from level */
        this.boundaries = [2048, 2048];
        /** @type {Entity[]} */
        const firstTalk = [1, "Fais moi rire.", 1600];
        /** @type {Array} */
        this.characters = [null,null,...level.PNJs.map((p,i) => new PNJ(i+2, p.scenario, [firstTalk, ...p.dialog], delay, p.skin))];
        /** @type {Array} */
        this.toDisplay = [...this.furnitures, ...this.characters, ...this.doors];
        console.log(this.cat);       
    }

    /**
     * Adds the two main protagonists to the map
     * @param {Player} player 
     * @param {Adversary} adversary 
     */
    addPlayerAndAdversary(player, adversary) {
        this.player = player;
        this.adversary = adversary; 
        this.characters[player.id] = player;
        this.characters[adversary.id] = adversary;
        this.toDisplay = [player, adversary, ...this.toDisplay.filter(v => v != null)]
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
        this.player.closestPNJ = null;
        let min = Infinity;
        for (let p=0; p < this.characters.length; p++) {
            let c = this.characters[p];
            c.update(dt);
            let dist = distanceSQ(this.player.x, this.player.y, c.x, c.y);
            if (c !== this.player && this.player.isAvailable() && dist < PROXIMITY && this.player.sees(c.x, c.y) && dist < min) {
                min = dist;
                this.player.closestPNJ = c;
            }
        }        
    }

    getRoomFor(x,y) {
        return this.rooms[Math.floor(y / TILE_SIDE)] ? this.rooms[Math.floor(y / TILE_SIDE)][Math.floor(x / TILE_SIDE)] : null;
    }


    render(ctx) {
        // determine on which tile is the player
        const pLine = Math.floor((this.player.y + SPRITE_H/2) / TILE_SIDE);
        const pCol = Math.floor(this.player.x / TILE_SIDE);
        let wOfPlayer = 0;

        if (this.cat.tiles[`${pLine},${pCol}`] && Date.now() - this.cat.lastMeow > 20000) {
            audio.playSound("miaou","miaou",0.6,0);
            this.cat.lastMeow = Date.now();
        }

        // Render floors
        for (let t of this.walls) {
            if (t.isDoor() && t.room.N && t.line == pLine && t.col == pCol) {
                t.render(ctx, true);
            }
            else {
                t.render(ctx);
            }
        }

        // Renders characters and furnitures
        /*
        const furnitures = this.furnitures.filter((f) => true || this.player.sees(f.x, f.y));
        const characters = this.characters.filter((c) => true || this.player.sees(c.x, c.y));
        characters.push(...furnitures);
        */
        this.toDisplay.sort(function(c1,c2) { return c1.getZIndex() - c2.getZIndex(); });

        const charWithDialog = [];
        for (let c of this.toDisplay) {
            if (c instanceof Tile && c.line == pLine && c.col == pCol) {
                //c.render(ctx, true);
            } 
            else {
                c.render(ctx);
            }
            // small dot to indicate closest PNJ
            if (this.player.talkingTo == null && this.player.timeToInteract <= 0 && this.player.closestPNJ == c && c.isAvailable()) {
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
                ctx.fillText("...",c.x-2, c.y-50);
            }
            if (c.dialog && c.dialog.isRunning()) {
                charWithDialog.push(c);
            }
        }

        // redraw tiles to hide other rooms
        this.hideOtherRooms(ctx);
        
        for(let c of charWithDialog) {
            c.renderDialog(ctx);
        }

    }

    hideOtherRooms(ctx) {
        this.playerRoom = this.playerRoom || null;
        let i0 = Math.floor((this.player.y + SPRITE_H * 0.5) / TILE_SIDE);
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
        
        ctx.fillStyle = "#000";
        for (let i=0; i < this.rooms.length; i++) {
            for (let j=0; j < this.rooms[i].length; j++) {
                if (!(this.rooms[i][j] == this.playerRoom || this.rooms[i][j] !== null && (this.rooms[i][j].N == this.playerRoom || this.rooms[i][j].S == this.playerRoom || this.rooms[i][j].E == this.playerRoom || this.rooms[i][j].O == this.playerRoom))) {
                    ctx.fillRect(j*TILE_SIDE,i*TILE_SIDE,TILE_SIDE+1,TILE_SIDE+1);
                }
            }
        }
    }



    createFurnitures(levelFurnitures) {
        let furnitures_objects = [];
        
        // last miaou
        this.cat = { lastMeow: 0, tiles: {} };
        
        for (let f of levelFurnitures) {
            if (f[2] != FURNITURE_TYPE.NONE) {
                furnitures_objects.push(new Furniture(f[0], f[1], f[2]));
            }
            if (f[2] == FURNITURE_TYPE.SOFA_RED_CAT_1 || f[2] == FURNITURE_TYPE.SOFA_RED_CAT_2 || f[2] == FURNITURE_TYPE.SOFA_GREEN_CAT) {
                this.cat.tiles[`${f[3]},${f[4]}`] = 1;
            }
        }
        return furnitures_objects;
    }


    hitsSomething(x, y, size) {
        // Check collision with walls
        for (let wall of this.walls) {
            if (wall.collidesWith(x,y,size)) {
                return wall;
            }
        } 
        for (let f of this.furnitures) {
            if (f.collidesWith(x - size/2, y-5, size, 5)) {
                return f;
            }
        }
        return null;
    }

   
}

class Furniture {

    constructor(x, y, id) {
        this.id = id;
        this.name = this.getFurnitureNameByID(id);
        this.img = data[this.name];
        this.width = this.img.width * 2;
        this.height = this.img.height * 2;
        let split = this.name.split('_');
        this.position = split[split.length - 1];

        switch(this.position) {
            case 'left':
                this.x = x + TILE_SIDE - this.width;
                this.y = y;
                break;
            case 'right':
                this.x = x;
                this.y = y;
                break;
            case 'front':
            default:
                this.x = x + TILE_SIDE / 2 - this.width / 2;
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
        this.hitbox = this.computeHitbox();
    }

    getZIndex() {
        switch (this.id) {
            case FURNITURE_TYPE.CARPET: 
            case FURNITURE_TYPE.BATHROOM_VERTICAL_DOOR_LEFT:
            case FURNITURE_TYPE.BATHROOM_VERTICAL_DOOR_RIGHT:    
            case FURNITURE_TYPE.ROOM_VERTICAL_DOOR_LEFT:
            case FURNITURE_TYPE.ROOM_VERTICAL_DOOR_RIGHT:
                return -Infinity;
        }
        return this.y + this.height; 
    }

    computeHitbox() {
        let x = this.x;
        let y = this.y + this.height / 2;
        let h = this.height / 2;
        let w = this.width;
        switch (this.id) {
            case FURNITURE_TYPE.BATHROOM_VERTICAL_DOOR_LEFT:
            case FURNITURE_TYPE.BATHROOM_VERTICAL_DOOR_RIGHT:
            case FURNITURE_TYPE.CARPET:
            case FURNITURE_TYPE.ROOM_VERTICAL_DOOR_LEFT:
            case FURNITURE_TYPE.ROOM_VERTICAL_DOOR_RIGHT:
                x = y = -1;
                w = h = 0;
                break;
            case FURNITURE_TYPE.BED_FRONT:
            case FURNITURE_TYPE.PIANO_LEFT:
            case FURNITURE_TYPE.PIANO_RIGHT:
            case FURNITURE_TYPE.SOFA_BLUE_FRONT:    
            case FURNITURE_TYPE.SOFA_BLUE_LEFT:
            case FURNITURE_TYPE.SOFA_BLUE_RIGHT:
            case FURNITURE_TYPE.SOFA_GREEN_FRONT:
            case FURNITURE_TYPE.SOFA_GREEN_LEFT:
            case FURNITURE_TYPE.SOFA_GREEN_RIGHT:
            case FURNITURE_TYPE.SOFA_RED_FRONT:
            case FURNITURE_TYPE.SOFA_RED_LEFT:
            case FURNITURE_TYPE.SOFA_RED_RIGHT:
                y = this.y + 0.2 * this.height;
                h = this.height * 0.8;
                break;
        }
        return { x, y, w, h };
    }

    collidesWith(x, y, w, h) {
        return hitboxCollision(x, y, x+w, y+h, this.hitbox.x, this.hitbox.y, this.hitbox.x+this.hitbox.w, this.hitbox.y+this.hitbox.h);
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
        ctx.strokeStyle = "red";
        DEBUG && ctx.strokeRect(this.hitbox.x, this.hitbox.y, this.hitbox.w, this.hitbox.h);
        ctx.drawImage(
            this.img, 
            this.x, 
            this.y, 
            this.width, 
            this.height, 
        );
    }
}


class Tile {

    constructor(type, x, y, w, h, l, c, r) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.line = l;
        this.col = c;
        this.room = r;
        this.color = TILE_COLOR[type];
        this.image = TILE_IMAGE[type];
    }

    getZIndex() {
        return this.y + this.h;
    }

    render(ctx, noImage, isBlank) {
        if (this.image && !noImage) {
            ctx.drawImage(data[this.image], this.x, this.y, this.w+1, this.h+1);
        }
        else {
            ctx.fillStyle = isBlank ? "black" : this.color;
            ctx.fillRect(this.x, this.y, this.w+1, this.h+1);
        }
    }

    collidesWith(x,y,size) {
        if (this.isWall()) {
            return hitboxCollision(this.x, this.y, this.x+this.w, this.y+this.h, x-size/2, y-5, x+size/2, y+5)
        }
        if (this.room.O) {
            return hitboxCollision(this.x, this.y, this.x+this.w, this.y+this.h*0.5, x-size/2, y-5, x+size/2, y+5)
        }
        if (this.room.N) {
            return hitboxCollision(this.x, this.y, this.x+this.w*0.25, this.y+this.h, x-size/2, y-5, x+size/2, y+5)
                || hitboxCollision(this.x+0.75*this.w, this.y, this.x+this.w, this.y+this.h, x-size/2, y-5, x+size/2, y+5)
        }
        return null;
    }

    isWall() {
        return this.type == TILE_TYPE.BAR_WALL 
            || this.type == TILE_TYPE.ROOM_WALL 
            || this.type == TILE_TYPE.BATHROOM_WALL 
            || this.type == TILE_TYPE.CORRIDOR_WALL
            || this.type == TILE_TYPE.OUTSIDE_WALL
            || this.type == TILE_TYPE.BAR_SHELVES;
    }

    isDoor() {
        return this.type == TILE_TYPE.BAR_HORIZONTAL_DOOR 
            || this.type == TILE_TYPE.ROOM_HORIZONTAL_DOOR 
            || this.type == TILE_TYPE.BATHROOM_HORIZONTAL_DOOR 
            || this.type == TILE_TYPE.CORRIDOR_HORIZONTAL_DOOR;
    }
}

const TILE_TYPE = {
    // floors
    PLANKS_FLOOR: 0,
    BATHROOM_FLOOR: 1,
    BAR_FLOOR: 2,
    ROOM_FLOOR: 3,
    KITCHEN_FLOOR: 4,
    // walls
    OUTSIDE_WALL: 5,
    BATHROOM_WALL: 6,
    BAR_WALL: 7,
    BAR_SHELVES: 18,
    ROOM_WALL: 8,
    CORRIDOR_WALL: 9,
    // 
    ROOM_HORIZONTAL_DOOR: 10,
    BAR_HORIZONTAL_DOOR: 11,
    CORRIDOR_HORIZONTAL_DOOR: 12,
    ROOM_VERTICAL_DOOR: 13,
    BAR_VERTICAL_DOOR: 14,
    CORRIDOR_VERTICAL_DOOR: 15,
    BATHROOM_HORIZONTAL_DOOR: 16,
    BATHROOM_VERTICAL_DOOR: 17
};


/** Tile definition */
const TILE_COLOR = { };
TILE_COLOR[TILE_TYPE.PLANKS_FLOOR] = '#916023';
TILE_COLOR[TILE_TYPE.BATHROOM_FLOOR] = '#7fb9bd';
TILE_COLOR[TILE_TYPE.BAR_FLOOR] = '#772b09';
TILE_COLOR[TILE_TYPE.ROOM_FLOOR] = '#96502e';
TILE_COLOR[TILE_TYPE.KITCHEN_FLOOR] = '#eed9d0';

TILE_COLOR[TILE_TYPE.OUTSIDE_WALL] = 'black';
TILE_COLOR[TILE_TYPE.BATHROOM_WALL] = '#bce8eb';
TILE_COLOR[TILE_TYPE.BAR_WALL] = '#781900';
TILE_COLOR[TILE_TYPE.BAR_SHELVES] = '#781900';
TILE_COLOR[TILE_TYPE.ROOM_WALL] = '#e3b286';
TILE_COLOR[TILE_TYPE.CORRIDOR_WALL] = '#b83a25';

TILE_COLOR[TILE_TYPE.ROOM_HORIZONTAL_DOOR] = '#6d2a02';
TILE_COLOR[TILE_TYPE.BAR_HORIZONTAL_DOOR] = '#6d2a02';
TILE_COLOR[TILE_TYPE.CORRIDOR_HORIZONTAL_DOOR] = '#6d2a02';
TILE_COLOR[TILE_TYPE.ROOM_VERTICAL_DOOR] ='#96502e'
TILE_COLOR[TILE_TYPE.BAR_VERTICAL_DOOR] = '#772b09';
TILE_COLOR[TILE_TYPE.CORRIDOR_VERTICAL_DOOR] = '#916023';
TILE_COLOR[TILE_TYPE.BATHROOM_HORIZONTAL_DOOR] = '#7fb9bd';
TILE_COLOR[TILE_TYPE.BATHROOM_VERTICAL_DOOR] = '#7fb9bd';


const TILE_IMAGE = { };
TILE_IMAGE[TILE_TYPE.PLANKS_FLOOR] = 'planks_floor';
TILE_IMAGE[TILE_TYPE.KITCHEN_FLOOR] = 'kitchen_floor';

TILE_IMAGE[TILE_TYPE.BATHROOM_WALL] = 'bathroom_wall';
TILE_IMAGE[TILE_TYPE.BAR_WALL] = 'bar_wall';
TILE_IMAGE[TILE_TYPE.BAR_SHELVES] = 'bar_shelves';
TILE_IMAGE[TILE_TYPE.ROOM_WALL] = 'room_wall';
TILE_IMAGE[TILE_TYPE.CORRIDOR_WALL] = 'corridor_wall';

TILE_IMAGE[TILE_TYPE.ROOM_HORIZONTAL_DOOR] = 'room_horizontal_door';
TILE_IMAGE[TILE_TYPE.BAR_HORIZONTAL_DOOR] = 'bar_horizontal_door';
TILE_IMAGE[TILE_TYPE.CORRIDOR_HORIZONTAL_DOOR] = 'corridor_horizontal_door';
TILE_IMAGE[TILE_TYPE.CORRIDOR_VERTICAL_DOOR] = 'planks_floor';
