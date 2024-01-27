/**
 * Level generator
 */

module.exports = { generate };

// Main function that generates the level
function generate() {
    const walls = WALLS_FLOORS;
    const furnitures = FURNITURES;
    const PNJs = [PNJ_0];
    //const start = { police: {x: 90, y: 90 }, killer: { x: 1100, y: 650 } };
    const start = { police: {x: 600, y: 900 }, killer: { x: 600, y: 900 } };
    return { walls, furnitures, PNJs, start };
} 

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
    [5, 2, 2, 2, 2, 2, 14, 0, 15, 3, 3, 3, 5, 1, 1, 5],
    [5, 2, 2, 2, 2, 2, 5, 0, 5, 3, 3, 3, 15, 1, 1, 5],
    [5, 2, 2, 2, 2, 2, 5, 0, 5, 3, 3, 3, 5, 1, 1, 5],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
];

const FURNITURES_MAP = [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, 7, 8, -1, -1, -1, 16, -1, -1, 16, -1, -1, -1, 8, 7, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, 17, -1, 8, 10, 7, 4, 4, -1, 22, 3, -1, -1, -1, -1],
    [-1, -1, -1, -1, 12, -1, 25, -1, -1, -1, -1, 1, -1, -1, -1, -1],
    [-1, 18, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, 9, -1, 9, -1, 16, -1, -1, 16, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, 9, -1, 19, 21, 8, -1, -1, -1, 6, 9, 5, -1, -1, -1, -1],
    [-1, 13, 13, 20, 20, 20, -1, -1, -1, -1, 25, -1, -1, -1, -1, -1],
    [-1, 15, 14, -1, -1, -1, -1, -1, -1, -1, -1, 11, -1, 22, 3, -1],
    [-1, 13, 13, -1, 13, 13, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1],
    [-1, 15, 20, -1, 20, 14, -1, -1, -1, 12, -1, -1, -1, -1, 1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
]

let WALLS_FLOORS = [];
let FURNITURES = [];
for (let i = 0; i < TILES.length; i++) {
    for (let j = 0; j < TILES.length; j++) {
        FURNITURES.push([TILE_SIDE * j, TILE_SIDE * i, TILE_SIDE, TILE_SIDE, FURNITURES_MAP[i][j]]) // [x, y, width, length, tyles_type, furniture_type]
        WALLS_FLOORS.push([TILE_SIDE * j, TILE_SIDE * i, TILE_SIDE, TILE_SIDE, TILES[i][j],])
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

const PNJ_0 = { 
    scenario: [
        [WAIT, {x: 80, y: 140, vecX: 1, vecY: 0}, 1000],
        [WALK, {xs: 80, ys: 140, xd: 1100, yd: 140}, 8000],
        [WAIT, {x: 1100, y: 140, vecX: 0, vecY: 1}, 2000],
        [WALK, {xs: 1100, ys: 140, xd: 80, yd: 140}, 10000]
    ],
    dialog: [        [
                [0, "Vous voulez un whisky ?", 1600],
                [1, "Juste un doigt.", 1600],
                [0, "Vous ne voulez pas un whisky d'abord ?", 2000]
            ],
            [
                [0, "Baba et babi sont sur un bateau", 1600],
                [1, "Babi bêle ? ", 1600],
                [0, "et baba cool ! ", 2000]
            ]
    ]
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














