//David Silady
//Client communication
const socket = new WebSocket('ws://localhost:8082');

socket.addEventListener('open', function (event) {
    console.log('Connection open.');
})

socket.addEventListener('message', function (event) {
    console.log(`Message from the server: ${event.data}`);
})

const sendMessage = async () => {
    postData('/', {message: 'hi server'}).then(data => {
        console.log(data);
    })
}

async function postData(url = '', data = {}) {
    //https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

const main = document.getElementById('worm');
const button = document.createElement('button');
button.onclick = sendMessage;
button.innerText = 'Send Message'
main.appendChild(button)

document.onkeydown = postKey;
function postKey(e) {
    postData('/', {keyDown: e.code}).then(res => {
        console.log(res)});
}


//HOUSENKA CLIENT
let IMG_LOADED = 0;
const xsize = 41;
const ysize = 18;

const TILE_SIZE = 16;
const DEBUG = true;

localStorage.setItem("DEBUG", "true");

let CONTEXT = {};
let IMAGES = {};
let coordinateHash = generateCoordinateHash();
housenkaInit().then(r => {
    console.log('Canvas Ready')
});

function coords (x,y) {
    return y*xsize + x;
}

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

async function loadImg(src) {
    let img;
    const promise =  new Promise(resolve => {
        img = new Image();
        img.onload = function () {
            resolve();
        }
        img.src = src;
    });
    await promise;
    return img;
}

//https://stackoverflow.com/a/56341485
//const obsahy = ['prazdne', 'telicko', 'zradlo', 'zed', 'klic', 'dvere', 'hlavicka'];
async function loadImages() {
    if (DEBUG) console.log("Loading Images");

    // TODO: Make all promises parallel
    //If not - i forgot

    //Free for commercial use - No atribution required
    //https://pixabay.com/service/license/
    const borderImg = await loadImg(
        "https://cdn.pixabay.com/photo/2013/07/12/13/17/brick-wall-146753_960_720.png");
    //CC0 Public Domain
    //Free for commercial use.
    //No attribution required.
    //https://pixy.org/licence.php
    const bodyImg = await loadImg("https://pixy.org/src/5/50318.png");

    //Source: https://iconscout.com/icon/donut-doughnut-sweet-dessert-food-fastfood-emoj-symbol
    //You must give attribution to the Designer. You can copy, redistribute, remix, the work for commercial purposes as well.
    //Creative Commons 4 Attribution
    const foodImg = await loadImg("https://cdn.iconscout.com/icon/free/png-64/donut-doughnut-sweet-dessert-food-fastfood-emoj-symbol-30698.png");

    // Description	Linecons by Designmodo
    // Source	http://www.flaticon.com/packs/linecons
    // Author	Designmodo http://www.designmodo.com/s
    const keyImg = await loadImg("https://upload.wikimedia.org/wikipedia/commons/9/99/Linecons_small-key.svg");

    // Source: https://creazilla.com/nodes/44854-door-emoji-clipart
    // Licence: CC 4.0
    const doorImg = await loadImg("https://creazilla-store.fra1.digitaloceanspaces.com/emojis/44854/door-emoji-clipart-md.png");

    // Source: https://commons.wikimedia.org/wiki/File:Eo_circle_pink_letter-o.svg
    // Description
    // English: A pink circle icon with a(n) letter-o symbol from the Emoji One BW icon font.
    // Date	17 April 2020
    // Source	Derived from Emoji One BW icons
    // Author	Emoji One contributors
    // Licence CC 4.0
    const headImg = await loadImg("https://upload.wikimedia.org/wikipedia/commons/d/d9/Eo_circle_red_white_letter-o.svg");
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

    if(DEBUG) console.log("Building horizontal borders");
    //draw border
    for(let x = 0; x < xsize; x++) {
        CONTEXT.drawImage(IMAGES.borderImg, x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
        CONTEXT.drawImage(IMAGES.borderImg, x * TILE_SIZE, TILE_SIZE * (ysize - 1), TILE_SIZE, TILE_SIZE);
    }
    if(DEBUG) console.log("Building vertical borders");
    for(let y = 0; y < ysize; y++) {
        CONTEXT.drawImage(IMAGES.borderImg, 0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        CONTEXT.drawImage(IMAGES.borderImg, (xsize - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

async function housenkaInit () {
    //deleteOriginalTable();
    if (DEBUG) console.log("Building Canvas");
    document.write('<style>canvas {border: solid 3px red}</style>')
    document.write('<canvas id="myCanvas" width="' + (xsize * TILE_SIZE) + '" height="' + (ysize * TILE_SIZE) + '"> </canvas>');
    if (DEBUG) console.log("Canvas Built");
    const canvas = document.getElementById("myCanvas");
    CONTEXT = canvas.getContext("2d");
    IMAGES = await loadImages();
    drawBorders();
}