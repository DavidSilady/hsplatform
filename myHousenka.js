// Housenka (Nibbles Revival)
// implementoval na Vanoce 2007 Milan Sorm


const TILE_SIZE = 48;
const DEBUG = true;

localStorage.setItem("DEBUG", "true");

let CONTEXT = {};
let IMAGES = {};
let coordinateHash = generateCoordinateHash();
housenkaInit();

function generateCoordinateHash() {
    let coordinateArray = [];
    for (let x = 0; x < xsize; x++) {
        for (let y = 0; y < ysize; y++) {
            let index = coords(x, y); //using the build in encoding
            coordinateArray[index] = {x: x, y: y};
        }
    }
    return coordinateArray;
}

//const obsahy = ['prazdne', 'telicko', 'zradlo', 'zed', 'klic', 'dvere', 'hlavicka'];
function loadImages() {
    if (DEBUG) console.log("Loading Images");

    //Free for commercial use - No atribution required
    //https://pixabay.com/service/license/
    document.write('<img id="borderImg" src="https://cdn.pixabay.com/photo/2013/07/12/13/17/brick-wall-146753_960_720.png" style="display: none" alt="borderImg">');

    //CC0 Public Domain
    //Free for commercial use.
    //No attribution required.
    //https://pixy.org/licence.php
    document.write('<img id="bodyImg" src="https://pixy.org/src/5/50318.png" style="display: none" alt="borderImg">');

    //Source: https://iconscout.com/icon/donut-doughnut-sweet-dessert-food-fastfood-emoj-symbol
    //You must give attribution to the Designer. You can copy, redistribute, remix, the work for commercial purposes as well.
    //Creative Commons 4 Attribution
    document.write('<img id="foodImg" src="https://cdn.iconscout.com/icon/free/png-64/donut-doughnut-sweet-dessert-food-fastfood-emoj-symbol-30698.png" style="display: none" alt="borderImg">');

    // Description	Linecons by Designmodo
    // Source	http://www.flaticon.com/packs/linecons
    // Author	Designmodo http://www.designmodo.com/s
    document.write('<img id="keyImg" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Linecons_small-key.svg" style="display: none" alt="borderImg">');

    // Source: https://creazilla.com/nodes/44854-door-emoji-clipart
    // Licence: CC 4.0
    document.write('<img id="doorImg" src="https://creazilla-store.fra1.digitaloceanspaces.com/emojis/44854/door-emoji-clipart-md.png" style="display: none" alt="borderImg">')

    // Source: https://commons.wikimedia.org/wiki/File:Eo_circle_pink_letter-o.svg
    // Description
    // English: A pink circle icon with a(n) letter-o symbol from the Emoji One BW icon font.
    // Date	17 April 2020
    // Source	Derived from Emoji One BW icons
    // Author	Emoji One contributors
    // Licence CC 4.0
    document.write('<img id="headImg" src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Eo_circle_red_white_letter-o.svg" style="display: none" alt="borderImg">')

    const borderImg = document.getElementById("borderImg");
    const bodyImg = document.getElementById("bodyImg");
    const foodImg = document.getElementById("foodImg");
    const keyImg = document.getElementById("keyImg");
    const doorImg = document.getElementById("doorImg");
    const headImg = document.getElementById("headImg");
    if (DEBUG) console.log("Images Loaded");

    return {
        borderImg: borderImg,
        bodyImg: headImg,
        foodImg: foodImg,
        keyImg: keyImg,
        doorImg: doorImg,
        headImg: bodyImg
    };
}

function drawBorders () {

    if(DEBUG) console.log("Building horizontal borders at:");
    //draw border
    for(let x = 0; x < xsize; x++) {
        if (DEBUG) console.log(x);
        CONTEXT.drawImage(IMAGES.borderImg, x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
        CONTEXT.drawImage(IMAGES.borderImg, x * TILE_SIZE, TILE_SIZE * (ysize - 1), TILE_SIZE, TILE_SIZE);
    }
    if(DEBUG) console.log("Building vertical borders at:");
    for(let y = 0; y < ysize; y++) {
        if (DEBUG) console.log(y);
        CONTEXT.drawImage(IMAGES.borderImg, 0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        CONTEXT.drawImage(IMAGES.borderImg, (xsize - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function deleteOriginalTable() {
    const tables = document.getElementsByTagName("TABLE");
    for (let i = tables.length - 1; i >= 0; i -= 1)
        if (tables[i])
            tables[i].parentNode.removeChild(tables[i]);
}

function housenkaInit () {
    //deleteOriginalTable();
    if (DEBUG) console.log("Building Canvas");
    document.write('<style>canvas {border: solid 3px red}</style>')
    document.write('<canvas id="myCanvas" width="'+(xsize * TILE_SIZE)+'" height="'+(ysize * TILE_SIZE)+'"> </canvas>');
    if (DEBUG) console.log("Canvas Built");
    const canvas = document.getElementById("myCanvas");
    CONTEXT = canvas.getContext("2d");
    IMAGES = loadImages();
    drawBorders();
    novaHra();
    window.onload = function () { startHry(); }
    document.defaultAction = false;
}

function stiskKlavesy (e) {
    //right down left up
    nastav_smer = [[39, 76, 68], [40, 75, 83], [37, 74, 65], [38, 73, 87]]; // added new keys

    const udalost = e || window["event"];

    klavesy[udalost["keyCode"]] = true;

    if (startuj_hru) {
        rozpohybujHousenku();
        startuj_hru = 0;
        show_result(hlaska);
    }

    let obslouzena = false;
    for (let key_group_index in nastav_smer) {
        nastav_smer[key_group_index].forEach(key => {
            if (key === udalost["keyCode"]) {
                if (DEBUG) console.log(key_group_index + ' ' + nastav_smer[key_group_index]);
                if (smer % 2 !== key_group_index % 2 && povolena_zmena_smeru) {
                    smer = key_group_index;
                    povolena_zmena_smeru = 0;
                }
            obslouzena = true;
        }})
    }

    if (udalost["keyCode"] === 27) {  // esc
        obslouzena = true;
        zastavHru('user');
    } else if (udalost["keyCode"] === 80) { // P
        obslouzena = true;
        zastavHousenku();
        startuj_hru = 1;
    }

    return !obslouzena;
}

function vymazPlochu () {
    let i;
    for (i in plocha) nastavBarvu(i,0);
    if (DEBUG) console.log("Clearing Canvas");
    CONTEXT.clearRect(TILE_SIZE, TILE_SIZE, (xsize - 1) * TILE_SIZE, (ysize - 1) * TILE_SIZE);
}


//const obsahy = ['prazdne', 'telicko', 'zradlo', 'zed', 'klic', 'dvere', 'hlavicka'];
function nastavBarvu (index, color) {
    plocha[index] = color;
    const coordinates = coordinateHash[index];
    document.getElementById('pole-'+index).className = obsahy[color];
    if (DEBUG) console.log("Writing Image " + obsahy[color] + " at " + coordinates.x + " " + coordinates.y);
    if (color === 0) {
        CONTEXT.clearRect(coordinates.x * TILE_SIZE, coordinates.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        //CONTEXT.drawImage(IMAGES.borderImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 1) {
        CONTEXT.drawImage(IMAGES.bodyImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 2) {
        CONTEXT.drawImage(IMAGES.foodImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 3) {
        CONTEXT.drawImage(IMAGES.borderImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 4) {
        CONTEXT.drawImage(IMAGES.keyImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 5) {
        CONTEXT.drawImage(IMAGES.doorImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 6) {
        CONTEXT.drawImage(IMAGES.headImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    }
}
