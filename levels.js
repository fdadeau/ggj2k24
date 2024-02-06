/**
 * Level generator
 */

module.exports = { generate };

// Main function that generates the level
function generate() {
    const walls = WALLS_FLOORS;
    const furnitures = FURNITURES;
    const PNJs = [PNJ_0 ,PNJ_1, PNJ_2, PNJ_3, PNJ_4 , PNJ_5, PNJ_6, PNJ_7, PNJ_8 ];

    // Attributing random jokes to PNJs
    let availableJokes = JOKES.jokes.slice();
    let availableSkin = SKINS.slice();
    PNJs.forEach(pnj => {
        // Adding a random joke to the PNJ
        pnj.dialog = availableJokes.splice(Math.floor(Math.random() * availableJokes.length), 1)[0];
        // Adding a random skin to the PNJ
        pnj.skin = availableSkin.splice(Math.floor(Math.random() * availableSkin.length), 1);
        if(availableSkin.length == 0){
            availableSkin = SKINS.slice();
        }
    });

    if(availableSkin.length <= 1){
        availableSkin = SKINS.slice();
    }

    console.log("available skin: ", availableSkin);
    const policeSkin = availableSkin.splice(Math.floor(Math.random() * availableSkin.length), 1)[0];
    const killerSkin = availableSkin.splice(Math.floor(Math.random() * availableSkin.length), 1)[0];
    const killerJoke = availableJokes.splice(Math.floor(Math.random() * availableJokes.length), 1)[0];
    const start = { police: {x: 300, y: 180 }, killer: { x: 1100, y: 650 } };
    //const start = { police: {x: 600, y: 900 }, killer: { x: 600, y: 900 } };

    return { walls, furnitures, PNJs, start, rooms, killerJoke, policeSkin, killerSkin };
} 

const SKINS = [
    "groom-pink-spritesheet", 
    "groom-blue-spritesheet", 
    "groom-red-spritesheet",
    "chad-spritesheet",
    "madame-blue-spritesheet",
    "madame-pink-spritesheet",
    "madame-yellow-spritesheet",
    "costume-brown-spritesheet",
    "costume-green-spritesheet"
];

const TILE_SIDE = 128;


const TILES = [
    [5, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 5, 8, 8, 8, 8, 8, 5, 6, 6, 5, 0, 0, 5],
    [5, 0, 0, 5, 3, 3, 3, 3, 3, 5, 1, 1, 5, 0, 0, 5],
    [5, 0, 0, 5, 3, 3, 3, 3, 3, 17, 1, 1, 5, 0, 0, 5],
    [5, 0, 0, 5, 3, 3, 3, 3, 3, 5, 1, 1, 5, 0, 0, 5],
    [5, 0, 0, 9, 9, 9, 12, 9, 9, 9, 9, 9, 9, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 7, 11, 7, 18, 18, 5, 0, 5, 8, 8, 8, 5, 0, 0, 5],
    [5, 2, 2, 4, 4, 4, 5, 0, 5, 3, 3, 3, 5, 0, 0, 5],
    [5, 2, 2, 2, 2, 2, 5, 0, 5, 3, 3, 3, 5, 6, 6, 5],
    [5, 2, 2, 2, 2, 2, 15, 0, 15, 3, 3, 3, 5, 1, 1, 5],
    [5, 2, 2, 2, 2, 2, 5, 0, 5, 3, 3, 3, 17, 1, 1, 5],
    [5, 2, 2, 2, 2, 2, 5, 0, 5, 3, 3, 3, 5, 1, 1, 5],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
];

const FURNITURES_MAP = [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, 7, 8, -1, -1, -1, 30, -1, -1, 16, -1, -1, -1, 8, 7, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, 17, -1, 8, 10, 7, 4, 4, -1, 22, 3, -1, -1, -1, -1],
    [-1, -1, -1, -1, 12, -1, 25, -1, -1, 35, -1, 1, -1, -1, -1, -1],
    [-1, 18, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, 9, -1, 9, -1, 16, -1, -1, 29, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, 27, -1, 19, 21, 8, -1, -1, -1, 6, 9, 5, -1, -1, 31, -1],
    [-1, 13, 13, 20, 20, 20, -1, -1, -1, -1, 25, -1, -1, -1, -1, -1],
    [-1, 15, 14, -1, -1, -1, 33, -1, 32, -1, -1, 11, -1, 22, 3, -1],
    [-1, 28, 13, -1, 13, 13, -1, -1, -1, -1, -1, -1, 35, -1, 1, -1],
    [-1, 15, 20, -1, 20, 14, -1, -1, -1, 12, -1, -1, -1, -1, 1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
]

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


let WALLS_FLOORS = [];
let FURNITURES = [];
let DISPLAY_WALLS = [];
const JOKES = require("./public/assets/json/jokes.json");
for (let i = 0; i < TILES.length; i++) {
    for (let j = 0; j < TILES.length; j++) {
        FURNITURES.push([TILE_SIDE * j, TILE_SIDE * i, FURNITURES_MAP[i][j], i, j]) // [x, y, width, length, tyles_type, furniture_type]
        WALLS_FLOORS.push([TILE_SIDE * j, TILE_SIDE * i, TILE_SIDE, TILE_SIDE, TILES[i][j],i,j])
        // identify wall that should be drawn onto the character
        if (isWall(TILES[i][j])) {
            DISPLAY_WALLS.push([i,j]);
        }        
    }
}
let rooms = identifyRooms(TILES);

/**
 * Secondary map with rooms
 * Array of: 
 *      - null: should not be there (wall/unreachable space)
 *      - number : id of the room
 *      - door Object { dir1: id room1, dir2: id room2 }
 */
function identifyRooms(TILES) {
    const r = [];
    const directions = [[0,1],[0,-1],[1,0],[-1,0]];
    let nbRooms = 0;
    const doors = [];
    console.log("computing roooms")
    for (let i = 0; i < TILES.length; i++) {
        for (let j = 0; j < TILES.length; j++) {
            if (r[i] === undefined) {
                r[i] = [];
            }
            if (r[i][j] === undefined) {
                if (isWall(TILES[i][j])) {
                    r[i][j] = null;
                }
                else if (isDoor(TILES[i][j])) {
                    const d = {i,j};
                    doors.push(d);
                }
                else {  // room floor
                    nbRooms++;
                    const toExplore = [[i,j]];
                    while (toExplore.length > 0) {
                        const [i0,j0] = toExplore.shift();
                        if (!r[i0]) {
                            r[i0] = [];
                        }
                        r[i0][j0] = nbRooms;
                        directions.forEach(d => {
                            let i1 = i0 + d[0];
                            let j1 = j0 + d[1];
                            if (TILES[i1] !== undefined && TILES[i1][j1] !== undefined && !isWall(TILES[i1][j1]) && !isDoor(TILES[i1][j1]) && (r[i1] === undefined || r[i1][j1] === undefined)) {
                                toExplore.push([i1,j1]);
                            }
                        });
                    }
                }
            }
        }
    }
    doors.forEach(d => {
        const dr = {};
        if (r[d.i][d.j-1] != null) {
            dr["O"] = r[d.i][d.j-1];
        }
        if (r[d.i][d.j+1] != null) {
            dr["E"] = r[d.i][d.j+1];
        }
        if (r[d.i-1][d.j] != null) {
            dr["N"] = r[d.i-1][d.j];
        }
        if (r[d.i+1][d.j] != null) {
            dr["S"] = r[d.i+1][d.j];
        }
        r[d.i][d.j] = dr;
    });
    for (let i=0; i < r.length; i++) {
        for (let j=0; j < r[i].length; j++) {
            if (r[i][j] === null && r[i+1] && (typeof r[i+1][j] == "number")) {
                r[i][j] = r[i+1][j];
            }
        }
    }
    print(r);
    return r;
}
function isWall(w) {
    return w == TILE_TYPE.BAR_WALL || 
        w == TILE_TYPE.OUTSIDE_WALL || 
        w == TILE_TYPE.BAR_SHELVES ||
        w == TILE_TYPE.ROOM_WALL || 
        w == TILE_TYPE.BATHROOM_WALL || 
        w == TILE_TYPE.CORRIDOR_WALL;
}
function isDoor(w) {
    return w == TILE_TYPE.ROOM_HORIZONTAL_DOOR || w == TILE_TYPE.BAR_HORIZONTAL_DOOR ||
    w == TILE_TYPE.CORRIDOR_HORIZONTAL_DOOR || w == TILE_TYPE.ROOM_VERTICAL_DOOR || 
    w == TILE_TYPE.BAR_VERTICAL_DOOR || w == TILE_TYPE.CORRIDOR_VERTICAL_DOOR ||
    w == TILE_TYPE.BATHROOM_HORIZONTAL_DOOR || w == TILE_TYPE.BATHROOM_VERTICAL_DOOR;
}

function print(rooms) {
    for (let i=0; i < rooms.length; i++) {
        console.log(rooms[i].map(e => {
            if (e == null) return "  0";
            if (typeof e == "number") return "  " + e;
            return Object.values(e).join("-");
        }).join(", "));
    }
}



// main walls 
//[20,20,1980,20],[1980,20,1980,1980],[1980,1980,20,1980],[20,1980,20,20], 
// // first box
// [20,330,520,330],[520,330,520,170],[520,70,520,20],
// // second box
// [20,480,520,480],[520,480,520,650],[520,750,520,800],
// // third box 
// [700, 20, 700, 70], [700, 170, 700, 400], [700, 400, 1260, 400],
// // third box separation
// [700, 400, 700, 650], [700, 750, 700, 800]

const WALK = "walk", WAIT = "wait";

randomWAIT = [0, 10, 100, 300, 1000, 2000, 6000, 10000];


coordoneeHautGaucheGeneral ={x:160,y:140};
coordoneeHautDroiteGeneral ={x:1800,y:140};

coordoneeMilieuGaucheGeneral ={x:160,y:1000};
coordoneeMilieuDroiteGeneral ={x:1800,y:1000};
coordoneeMilieuPorte3General ={x:950,y:1000};
coordoneeMilieuPorte2General ={x:830,y:1000};
coordoneeChambreHautGeneral ={x:830,y:550};
coordoneeSdbHautGeneral ={x:1350,y:550};

function calculVitesse(x1,x2, y1,y2) {
    return Math.abs(x1 - x2 + y1 - y2) *5;
}

const PNJ_0 = { 
    scenario: [
        
        [WAIT, {    x : coordoneeHautGaucheGeneral.x , y: coordoneeHautGaucheGeneral.y+2, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautGaucheGeneral.x, ys: coordoneeHautGaucheGeneral.y+2, 
                    xd: coordoneeHautDroiteGeneral.x+10, yd: coordoneeHautDroiteGeneral.y+2}, 
            calculVitesse(  coordoneeHautGaucheGeneral.x, coordoneeHautDroiteGeneral.x+10, 
                            coordoneeHautGaucheGeneral.y+2, coordoneeHautDroiteGeneral.y+2)],
        [WAIT, {    x: coordoneeHautDroiteGeneral.x+10, y :coordoneeHautDroiteGeneral.y+2, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautDroiteGeneral.x+10, ys: coordoneeHautDroiteGeneral.y+2,
                    xd: coordoneeHautGaucheGeneral.x, yd: coordoneeHautGaucheGeneral.y+2}, 
            calculVitesse(  coordoneeHautGaucheGeneral.x, coordoneeHautDroiteGeneral.x+10, 
                            coordoneeHautGaucheGeneral.y+2, coordoneeHautDroiteGeneral.y+2)]],      
    dialog: []
}


const PNJ_1 = { 
    
    scenario: [
        [WAIT, {    x: coordoneeHautDroiteGeneral.x+5, y: coordoneeHautDroiteGeneral.y-5, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautDroiteGeneral.x+5, ys: coordoneeHautDroiteGeneral.y-5, 
                    xd: coordoneeHautGaucheGeneral.x+5, yd: coordoneeHautGaucheGeneral.y-5}, 
                    calculVitesse(  coordoneeHautGaucheGeneral.x+5, coordoneeHautDroiteGeneral.x+5, 
                                    coordoneeHautGaucheGeneral.y-5, coordoneeHautDroiteGeneral.y-5)],
        [WAIT, {    x: coordoneeHautGaucheGeneral.x+5, y: coordoneeHautGaucheGeneral.y-5, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautGaucheGeneral.x+5, ys: coordoneeHautGaucheGeneral.y-5, 
                    xd: coordoneeHautDroiteGeneral.x+5, yd: coordoneeHautDroiteGeneral.y-5}, 
                    calculVitesse(  coordoneeHautGaucheGeneral.x+5, coordoneeHautDroiteGeneral.x+5, 
                                    coordoneeHautGaucheGeneral.y-5, coordoneeHautDroiteGeneral.y-5)]],      
    dialog: []
}


const PNJ_2 = { //HautGauche MilieuGauche MilieuP3 MilieuDroite HautDroite  
    scenario: [
        [WAIT, {    x: coordoneeHautGaucheGeneral.x+30, y: coordoneeHautGaucheGeneral.y, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautGaucheGeneral.x+30, ys:  coordoneeHautGaucheGeneral.y+20,
                    xd: coordoneeMilieuGaucheGeneral.x+30, yd: coordoneeMilieuGaucheGeneral.y+20}, 
                    calculVitesse(  coordoneeHautGaucheGeneral.x+30, coordoneeMilieuGaucheGeneral.x+30, 
                                    coordoneeHautGaucheGeneral.y+20, coordoneeMilieuGaucheGeneral.y+20)], 
        [WAIT, {    x: coordoneeMilieuGaucheGeneral.x+30, y: coordoneeMilieuGaucheGeneral.y + 20, vecX: 0, vecY: 1}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuGaucheGeneral.x+30, ys: coordoneeMilieuGaucheGeneral.y+20, 
                    xd: coordoneeMilieuPorte3General.x-30, yd: coordoneeMilieuPorte3General.y+20}, 
                    calculVitesse(  coordoneeMilieuGaucheGeneral.x+30, coordoneeMilieuPorte3General.x-30, 
                                    coordoneeMilieuGaucheGeneral.y+20, coordoneeMilieuPorte3General.y+20)],
        [WAIT, {    x: coordoneeMilieuPorte3General.x-30, y: coordoneeMilieuPorte3General.y+20, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],       

        [WALK, {    xs: coordoneeMilieuPorte3General.x-30, ys: coordoneeMilieuPorte3General.y+20, 
                    xd: coordoneeMilieuDroiteGeneral.x, yd: coordoneeMilieuDroiteGeneral.y+20}, 
                    calculVitesse(  coordoneeMilieuPorte3General.x-30, coordoneeMilieuDroiteGeneral.x, 
                                    coordoneeMilieuPorte3General.y+20, coordoneeMilieuDroiteGeneral.y+20)],
        [WAIT, {    x: coordoneeMilieuDroiteGeneral.x , y: coordoneeMilieuDroiteGeneral.y+20, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuDroiteGeneral.x, ys: coordoneeMilieuDroiteGeneral.y+20, 
                    xd: coordoneeHautDroiteGeneral.x, yd: coordoneeHautDroiteGeneral.y},  
                    calculVitesse(  coordoneeMilieuDroiteGeneral.x, coordoneeHautDroiteGeneral.x, 
                                    coordoneeMilieuDroiteGeneral.y+20, coordoneeHautDroiteGeneral.y)],   
        [WAIT, {    x: coordoneeHautDroiteGeneral.x, y: coordoneeHautDroiteGeneral.y, vecX: 0, vecY: -1}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautDroiteGeneral.x, ys: coordoneeHautDroiteGeneral.y, 
                    xd: coordoneeHautGaucheGeneral.x+20, yd: coordoneeHautGaucheGeneral.y+20},  
                    calculVitesse(  coordoneeMilieuDroiteGeneral.x, coordoneeHautGaucheGeneral.x+20, 
                                    coordoneeHautDroiteGeneral.y, coordoneeHautGaucheGeneral.y+20)]],
    dialog: []
}


const PNJ_3 = {  //HautGauche HautDroite MilieuDroite MilieuPorte2 MilieuGauche 
    scenario: [

        [WAIT, {    x: coordoneeHautGaucheGeneral.x+30, y: coordoneeHautGaucheGeneral.y, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautGaucheGeneral.x+30, ys:  coordoneeHautGaucheGeneral.y+20,
                    xd: coordoneeMilieuGaucheGeneral.x+30, yd: coordoneeMilieuGaucheGeneral.y+20}, 
                    calculVitesse(  coordoneeHautGaucheGeneral.x+30, coordoneeMilieuGaucheGeneral.x+30, 
                                    coordoneeHautGaucheGeneral.y+20, coordoneeMilieuGaucheGeneral.y+20)], 
        [WAIT, {    x: coordoneeMilieuGaucheGeneral.x+30, y: coordoneeMilieuGaucheGeneral.y + 20, vecX: 0, vecY: 1}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuGaucheGeneral.x+30, ys: coordoneeMilieuGaucheGeneral.y+20, 
                    xd: coordoneeMilieuPorte2General.x-30, yd: coordoneeMilieuPorte2General.y+20}, 
                    calculVitesse(  coordoneeMilieuGaucheGeneral.x+30, coordoneeMilieuPorte2General.x-30, 
                                    coordoneeMilieuGaucheGeneral.y+20, coordoneeMilieuPorte2General.y+20)],
        [WAIT, {    x: coordoneeMilieuPorte2General.x-30, y: coordoneeMilieuPorte2General.y+20, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],       

        [WALK, {    xs: coordoneeMilieuPorte2General.x-30, ys: coordoneeMilieuPorte2General.y+20, 
                    xd: coordoneeMilieuDroiteGeneral.x, yd: coordoneeMilieuDroiteGeneral.y+20}, 
                    calculVitesse(  coordoneeMilieuPorte2General.x-30, coordoneeMilieuDroiteGeneral.x, 
                                    coordoneeMilieuPorte2General.y+20, coordoneeMilieuDroiteGeneral.y+20)],
        [WAIT, {    x: coordoneeMilieuDroiteGeneral.x , y: coordoneeMilieuDroiteGeneral.y+20, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuDroiteGeneral.x, ys: coordoneeMilieuDroiteGeneral.y+20, 
                    xd: coordoneeHautDroiteGeneral.x, yd: coordoneeHautDroiteGeneral.y},  
                    calculVitesse(  coordoneeMilieuDroiteGeneral.x, coordoneeHautDroiteGeneral.x, 
                                    coordoneeMilieuDroiteGeneral.y+20, coordoneeHautDroiteGeneral.y)],   
        [WAIT, {    x: coordoneeHautDroiteGeneral.x, y: coordoneeHautDroiteGeneral.y, vecX: 0, vecY: -1}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeHautDroiteGeneral.x, ys: coordoneeHautDroiteGeneral.y, 
                    xd: coordoneeHautGaucheGeneral.x+20, yd: coordoneeHautGaucheGeneral.y+20},  
                    calculVitesse(  coordoneeMilieuDroiteGeneral.x, coordoneeHautGaucheGeneral.x+20, 
                                    coordoneeHautDroiteGeneral.y, coordoneeHautGaucheGeneral.y+20)]

    ],
    dialog: []
}

const PNJ_4 = { //MilieuGauche MilieuP3 MilieuDroite MilieuP2 ChambreHaut ChambreHaut sdbHaut ChambreHaut ChambreHaut ChambreHaut MilieuP2 MilieuGauche
    scenario: [
        [WAIT, {    x: coordoneeMilieuGaucheGeneral.x+20, y: coordoneeMilieuGaucheGeneral.y+10, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuGaucheGeneral.x+20, ys: coordoneeMilieuGaucheGeneral.y+10, 
                    xd: coordoneeMilieuPorte3General.x-30, yd: coordoneeMilieuPorte3General.y+10}, 
                    calculVitesse(  coordoneeMilieuGaucheGeneral.x+20, coordoneeMilieuPorte3General.x-30, 
                                    coordoneeMilieuGaucheGeneral.y+10, coordoneeMilieuPorte3General.y+10)],
        [WAIT, {    x: coordoneeMilieuPorte3General.x-30, y: coordoneeMilieuPorte3General.y+10, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuPorte3General.x-30, ys: coordoneeMilieuPorte3General.y+10, 
                    xd: coordoneeMilieuDroiteGeneral.x, yd: coordoneeMilieuDroiteGeneral.y+10},
                    calculVitesse(  coordoneeMilieuDroiteGeneral.x, coordoneeMilieuPorte3General.x-30, 
                                    coordoneeMilieuDroiteGeneral.y+10, coordoneeMilieuPorte3General.y+10)],
        [WAIT, {    x: coordoneeMilieuDroiteGeneral.x, y: coordoneeMilieuDroiteGeneral.y+10, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],
        
        [WALK, {    xs: coordoneeMilieuDroiteGeneral.x, ys: coordoneeMilieuDroiteGeneral.y+10, 
                    xd: coordoneeMilieuPorte2General.x, yd: coordoneeMilieuPorte2General.y+10}, 
                    calculVitesse(  coordoneeMilieuDroiteGeneral.x, coordoneeMilieuPorte2General.x, 
                                    coordoneeMilieuDroiteGeneral.y+10, coordoneeMilieuPorte2General.y+10)],
        [WAIT, {    x: coordoneeMilieuPorte2General.x, y: coordoneeMilieuPorte2General.y+10, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuPorte2General.x, ys: coordoneeMilieuPorte2General.y+10, 
                    xd: coordoneeChambreHautGeneral.x, yd: coordoneeChambreHautGeneral.y}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x, coordoneeMilieuPorte2General.x, 
                                    coordoneeChambreHautGeneral.y, coordoneeMilieuPorte2General.y+10)],
        [WAIT, {    x: coordoneeChambreHautGeneral.x, y: coordoneeChambreHautGeneral.y, vecX: 0, vecY: -1}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeChambreHautGeneral.x, ys: coordoneeChambreHautGeneral.y,
                    xd: coordoneeChambreHautGeneral.x-70, yd: coordoneeChambreHautGeneral.y}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x, coordoneeChambreHautGeneral.x-70, 
                                    coordoneeChambreHautGeneral.y, coordoneeChambreHautGeneral.y)],
        [WAIT, {    x: coordoneeChambreHautGeneral.x-70, y: coordoneeChambreHautGeneral.y, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],


                    //test
        [WALK, {    xs: coordoneeChambreHautGeneral.x-70, ys: coordoneeChambreHautGeneral.y, 
                    xd: coordoneeChambreHautGeneral.x-70, yd: coordoneeChambreHautGeneral.y+20}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x-70, coordoneeChambreHautGeneral.x-70, 
                                    coordoneeChambreHautGeneral.y+20, coordoneeChambreHautGeneral.y)],
        [WAIT, {    x: coordoneeChambreHautGeneral.x-70, y: coordoneeChambreHautGeneral.y+20, vecX: 1, vecY: 0}, 
                        randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],
    


        [WALK, {    xs: coordoneeChambreHautGeneral.x-70, ys: coordoneeChambreHautGeneral.y+20, 
                    xd: coordoneeSdbHautGeneral.x, yd: coordoneeSdbHautGeneral.y+20}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x-70, coordoneeSdbHautGeneral.x, 
                                    coordoneeChambreHautGeneral.y+20, coordoneeSdbHautGeneral.y+20)],
        [WAIT, {    x: coordoneeSdbHautGeneral.x, y: coordoneeSdbHautGeneral.y+20, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],




        [WALK, {    xs: coordoneeSdbHautGeneral.x, ys: coordoneeSdbHautGeneral.y+20, 
                    xd: coordoneeChambreHautGeneral.x+5, yd: coordoneeChambreHautGeneral.y+20}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x+5, coordoneeSdbHautGeneral.x, 
                                    coordoneeChambreHautGeneral.y+20, coordoneeSdbHautGeneral.y+20)],
        [WAIT, {    x: coordoneeChambreHautGeneral.x+5, y: coordoneeChambreHautGeneral.y+20, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeChambreHautGeneral.x+5, ys: coordoneeChambreHautGeneral.y+20, 
                    xd: coordoneeChambreHautGeneral.x+120, yd: coordoneeChambreHautGeneral.y+20},
                    calculVitesse(  coordoneeChambreHautGeneral.x+5, coordoneeChambreHautGeneral.x+120, 
                                    coordoneeChambreHautGeneral.y+20, coordoneeChambreHautGeneral.y+20)], 
        [WAIT, {    x: coordoneeChambreHautGeneral.x+120, y: coordoneeChambreHautGeneral.y+20, vecX: 1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeChambreHautGeneral.x+120, ys: coordoneeChambreHautGeneral.y+20, 
                    xd: coordoneeChambreHautGeneral.x, yd: coordoneeChambreHautGeneral.y+20}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x, coordoneeChambreHautGeneral.x+120, 
                                    coordoneeChambreHautGeneral.y+20, coordoneeChambreHautGeneral.y+20)],
        [WAIT, {    x: coordoneeChambreHautGeneral.x, y: coordoneeChambreHautGeneral.y+20, vecX: -1, vecY: 0}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeChambreHautGeneral.x, ys: coordoneeChambreHautGeneral.y+20,
                    xd: coordoneeMilieuPorte2General.x, yd: coordoneeMilieuPorte2General.y+10}, 
                    calculVitesse(  coordoneeChambreHautGeneral.x, coordoneeMilieuPorte2General.x, 
                                    coordoneeChambreHautGeneral.y+20, coordoneeMilieuPorte2General.y+10)],
        [WAIT, {    x: coordoneeMilieuPorte2General.x, y: coordoneeMilieuPorte2General.y+10, vecX: 0, vecY: 1}, 
                    randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {    xs: coordoneeMilieuPorte2General.x, ys: coordoneeMilieuPorte2General.y, 
                    xd: coordoneeMilieuGaucheGeneral.x+20, yd: coordoneeMilieuGaucheGeneral.y+10}, 
                    calculVitesse(  coordoneeMilieuGaucheGeneral.x+20, coordoneeMilieuPorte2General.x, 
                                    coordoneeMilieuGaucheGeneral.y+10, coordoneeMilieuPorte2General.y)]

    ],
    dialog: []
}



const PNJ_5 = { //visite piece centre avec scenar salle de bain
    scenario: [
        [WALK, {xs: 185, ys: 1015, xd: 925, yd: 1015}, 4033],//droite 1 done
        [WAIT, {x: 925, y: 1015, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],
        [WALK, {xs: 925, ys: 1015, xd: 1805, yd: 1015}, 4796],//droite 2 done
        [WAIT, {x: 1805, y: 1015, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],
        
        [WALK, {xs: 1805, ys: 1015, xd: 835, yd: 1015}, 8000],//gauche 1 done
        [WAIT, {x: 835, y: 1015, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 835, ys: 1015, xd: 835, yd: 540}, 5286],//piece 1a done
        [WAIT, {x: 835, y: 540, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 835, ys: 540, xd: 1355, yd: 540}, 2834],//piece 1 vers piece 2 done
        [WAIT, {x: 1355, y: 540, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 1355, ys: 540, xd: 1355, yd: 612}, 392],//piece 2a haut done
        [WAIT, {x: 1355, y: 612, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 1355, ys: 612, xd: 1355, yd: 422}, 1035],//piece 2a bas 1 done
        [WAIT, {x: 1355, y: 422, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 1355, ys: 422, xd: 1355, yd: 555}, 725],//piece 2b haut done
        [WAIT, {x: 1355, y: 555, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 1355, ys: 555, xd: 835, yd: 555}, 2835],//piece 2 vers piece 1 done
        [WAIT, {x: 835, y: 555, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 835, ys: 555, xd: 955, yd: 555}, 654],//piece 1a gauche b done
        [WAIT, {x: 955, y: 555, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 955, ys: 555, xd: 835, yd: 555}, 654],//piece 1b retour done
        [WAIT, {x: 835, y: 555, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 835, ys: 1015, xd: 185, yd: 1015}, 3542],//gauche 2 done
        [WAIT, {x: 185, y: 1015, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]]
    ],
    dialog: []
}


const PNJ_6 = { //visite piece bas
    scenario: [
        [WALK, {xs: 400, ys: 1015, xd: 950, yd: 1015}, 3025],//droite 1
        [WAIT, {x: 950, y: 1015, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 950, ys: 1015, xd: 950, yd: 1565}, 3025],//couloir vers bas 1
        [WAIT, {x: 950, y: 1562, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 950, ys: 1565, xd: 410, yd: 1565}, 2970],// bas 1 vers piece gauche
        [WAIT, {x: 410, y: 1565, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 410, ys: 1565, xd: 1255, yd: 1565}, 4658],// piece gauche vers droite
        [WAIT, {x: 1255, y: 1565, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 

        [WALK, {xs: 1255, ys: 1565, xd: 1255, yd: 1604}, 215],// piece  droite vers bas
        [WAIT, {x: 1255, y: 1604, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 

        [WALK, {xs: 1255, ys: 1604, xd: 1445, yd: 1604}, 1045],// piece  droite vers piece droite droite
        [WAIT, {x: 1445, y: 1604, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1445, ys: 1604, xd: 1220, yd: 1604}, 1240],// piece  droite droite vers piece droite
        [WAIT, {x: 1220, y: 1604, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1220, ys: 1604, xd: 1220, yd: 1593}, 61],// piece  droite vers haut
        [WAIT, {x: 1220, y: 1593, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1220, ys: 1593, xd: 930, yd: 1593}, 1595],// piece  droite vers couloir vert : bas -> haut
        [WAIT, {x: 930, y: 1593, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]],

        [WALK, {xs: 930, ys: 1593, xd: 930, yd: 1000}, 3265],// couloir vertical vers couloir horiz : gauche
        [WAIT, {x: 930, y: 1000, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,
        
        [WALK, {xs: 930, ys: 1000, xd: 1870, yd: 1000}, 5170],// couloir horiz : milieu vers coin gauche
        [WAIT, {x: 1870, y: 1000, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 
        
        [WALK, {xs: 1870, ys: 1000, xd: 1870, yd: 200}, 4400],// couloir vertical : bas vers haut
        [WAIT, {x: 1870, y: 200, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1870, ys: 200, xd: 1770, yd: 200}, 552],// couloir vertical : haut gche vers haut dte
        [WAIT, {x: 1770, y: 200, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 

        [WALK, {xs: 1770, ys: 200, xd: 1770, yd: 1015}, 4484],// couloir vertical : haut vers bas
        [WAIT, {x: 1770, y: 1015, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 

        [WALK, {xs: 1770, ys: 1015, xd: 400, yd: 1015}, 7537],// retour depart
        [WAIT, {x: 1770, y: 400, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] 

    ],
    dialog: []
}

const PNJ_7 = { //visite que piece bas
    scenario: [

        [WALK, {xs: 970, ys: 1602, xd: 970, yd: 1852}, 1382],// bas 1 vers piece gauche
        [WAIT, {x: 970, y: 1852, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 970, ys: 1852, xd: 970, yd: 1602}, 1382],// couloir vers bas
        [WAIT, {x: 970, y: 1602, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 970, ys: 1602, xd: 400, yd: 1602}, 3197],// couloir vers haut
        [WAIT, {x: 400, y: 1602, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 400, ys: 1602, xd: 400, yd: 1850}, 1365],// piece gauche bas
        [WAIT, {x: 400, y: 1850, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,
        
        [WALK, {xs: 400, ys: 1850, xd: 400, yd: 1605}, 1364],// piece gauche haut
        [WAIT, {x: 400, y: 1605, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 400, ys: 1605, xd: 1425, yd: 1605}, 5771],// piece gauche vers droite
        [WAIT, {x: 1425, y: 1605, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 

        [WALK, {xs: 1425, ys: 1605, xd: 1425, yd: 1705},545 ],// piece  droite vers bas
        [WAIT, {x: 1425, y: 1705, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]], 

        [WALK, {xs: 1425, ys: 1705, xd: 1715, yd: 1705}, 1585],// piece  droite vers piece droite droite
        [WAIT, {x: 1715, y: 1705, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1715, ys: 1705, xd: 1210, yd: 1705}, 2755],// piece  droite droite vers piece droite
        [WAIT, {x: 1210, y: 1705, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1210, ys: 1705, xd: 1210, yd: 1602}, 556],// piece  droite vers haut
        [WAIT, {x: 1210, y: 1602, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 1210, ys: 1602, xd: 970, yd: 1602}, 1472],// piece  droite vers couloir vert : bas -> haut
        [WAIT, {x: 970, y: 1602, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]]

    ],
    dialog: []
}

const PNJ_8 = { //visite que piece bas
    scenario: [

        [WALK, {xs: 970, ys: 1600, xd: 400, yd: 1600}, 3135],// bas 1 vers piece gauche
        [WAIT, {x: 400, y: 1600, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 400, ys: 1600, xd: 400, yd: 1700}, 550],//piece gauche vers piece gauche
        [WAIT, {x: 400, y: 1700, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 400, ys: 1700, xd: 250, yd: 1700}, 830],//piece gauche vers piece gauche
        [WAIT, {x: 250, y: 1700, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 250, ys: 1700, xd: 250, yd: 1600}, 550],//piece gauche vers piece gauche
        [WAIT, {x: 250, y: 1600, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 250, ys: 1600, xd: 230, yd: 1600}, 110],//piece gauche vers piece gauche
        [WAIT, {x: 230, y: 1600, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 230, ys: 1600, xd: 250, yd: 1600}, 110],//piece gauche vers piece gauche
        [WAIT, {x: 250, y: 1600, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 250, ys: 1600, xd: 250, yd: 1700}, 550],//piece gauche vers piece gauche
        [WAIT, {x: 250, y: 1700, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 250, ys: 1700, xd: 410, yd: 1700}, 880],//piece gauche vers piece gauche
        [WAIT, {x: 410, y: 1700, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 410, ys: 1700, xd: 410, yd: 1400}, 1650],//piece gauche vers piece gauche
        [WAIT, {x: 410, y: 1400, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 410, ys: 1400, xd: 310, yd: 1400}, 550],//piece gauche vers piece gauche
        [WAIT, {x: 310, y: 1400, vecX: -1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 310, ys: 1400, xd: 310, yd: 1000}, 2200],//piece gauche vers piece gauche
        [WAIT, {x: 310, y: 1000, vecX: 0, vecY: 1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 310, ys: 1000, xd: 950, yd: 1000}, 3520],//piece gauche vers piece gauche
        [WAIT, {x: 950, y: 1000, vecX: 1, vecY: 0}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] ,

        [WALK, {xs: 950, ys: 1000, xd: 950, yd: 1600}, 3300],//piece gauche vers piece gauche
        [WAIT, {x: 950, y: 1600, vecX: 0, vecY: -1}, randomWAIT[Math.floor(Math.random() * randomWAIT.length)]] 

    ],
    dialog: []
}






function computeStart() {
    let x, y, nb;
    do {
        x = 5 + 10 * Math.floor(this.topLeft[0] + Math.random() * (this.bottomRight[0] - this.topLeft[0])) / 10;
        y = 5 + 10 * Math.floor(this.topLeft[1] + Math.random() * (this.bottomRight[1] - this.topLeft[1])) / 10;
        // count number of crossed walls
        nb = WALLS.filter(([a,b,c,d]) => (a == c && a < x && (y >= b && y <= d || y >= d && y <= b)));
    }
    while (/*nb.length % 2 != 1 ||*/ this.isTooCloseFromOneWall(x, y, 20) !== null);
    return {x,y};
}














