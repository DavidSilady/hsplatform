//David Silady
//Sorry for the messy code - ran out of time...

//Client communication

const userSignUp = async () => {
    const username = signUpUsername.value;
    const password = signUpPassword.value;
    const mail = signUpMail.value;
    if (! validateEmail(mail)) {
        signUpResult.innerText = 'valid mail required';
        return;
    }
    if (username === '' && validateUsername(username)) {// TODO proper validation
        signUpResult.innerText = 'username required (can only contain letters [a-z, A-Z])';
        return;
    }
    if (password === '') {
        signUpResult.innerText = 'password required';
        return;
    }
    postData('/signUp', {username: username, password: password, mail: mail}).then(data => {
        debug(data);
        if (data.msg) {
            signUpResult.innerText = data.msg;
        }
        if (data.result) {
            loggedIn = true;
            loginResult.innerText = 'Logged In.';
            debug('Logged In');
        }
    })
}

const userLogin = async () => {
    const username = loginUsername.value;
    const password = loginPassword.value;
    if (username && password) {
        postData('/login', {username: username, password: password}).then(data => {
            debug(data);
            if (data.msg) {
                loginResult.innerText = data.msg;
            }
            if (data.result) {
                loggedIn = true;
                debug('Logged In');
            }
        });
    } else {
        loginResult.innerText = 'Username and Password required';
    }
}

const main = document.getElementById('worm');
const assignedGameCode = document.createElement('h3');

//Login / Sign Up

    const signUpDiv = document.createElement('div');
    const loginDiv = document.createElement('div');

    const loginPassword = document.createElement("input"); //input element, text
    loginPassword.setAttribute('type',"password");
    loginPassword.setAttribute('placeholder',"password");
    loginPassword.setAttribute('name',"password");

    const loginUsername = document.createElement("input"); //input element, text
    loginUsername.setAttribute('type',"text");
    loginUsername.setAttribute('name',"username");
    loginUsername.setAttribute('placeholder',"name");


    const signUpUsername = document.createElement("input"); //input element, text
    signUpUsername.setAttribute('type',"text");
    signUpUsername.setAttribute('name',"username");
    signUpUsername.setAttribute('placeholder',"name");

    const signUpPassword = document.createElement("input"); //input element, text
    signUpPassword.setAttribute('type',"password");
    signUpPassword.setAttribute('placeholder',"password");
    signUpPassword.setAttribute('name',"password");

    const signUpMail = document.createElement("input"); //input element, text
    signUpMail.setAttribute('type',"text");
    signUpMail.setAttribute('name',"mail");
    signUpMail.setAttribute('placeholder',"mail");

    const signUpResult = document.createElement('p');
    signUpResult.innerText = 'Game will be reset upon sign up.';

    const loginResult = document.createElement('p');
    loginResult.innerText = 'Game will be reset upon login.';


// const submit = document.createElement("input"); //input element, Submit button
// submit.setAttribute('type',"submit");
// submit.setAttribute('value',"Log In");

    const loginButton = document.createElement('button');
    loginButton.onclick = userLogin;
    loginButton.innerText = 'Log In';



    const signUpButton = document.createElement('button');
    signUpButton.onclick = userSignUp;
    signUpButton.innerText = 'Sign Up';

    loginDiv.appendChild(loginUsername);
    loginDiv.appendChild(loginPassword);
    loginDiv.appendChild(loginButton);
    loginDiv.appendChild(loginResult);

    signUpDiv.appendChild(signUpMail);
    signUpDiv.appendChild(signUpUsername);
    signUpDiv.appendChild(signUpPassword);
    signUpDiv.appendChild(signUpButton);
    signUpDiv.appendChild(signUpResult);

    main.appendChild(signUpDiv);
    main.appendChild(loginDiv);

    const gameStateHeader = document.createElement('h4');
    const spectateStateHeader = document.createElement('h4');
    main.appendChild(gameStateHeader);

async function init() {
    await postData('/init', {}).then(data => {
        console.log(data);
        document.cookie = `uid=${data.userID}`;
        document.cookie = `gameCode=${data.gameCode}`;
        assignedGameCode.innerText = `Assigned game code: ${data.gameCode}`;

    });

    const socket = await new WebSocket('ws://localhost:8082');

    socket.addEventListener('open', function (event) {
        console.log('Connection open.');
    });

    socket.addEventListener('message', function (event) {
        const jsonData = JSON.parse(event.data);
        if (jsonData.main && canvasReady) {
            updateBoard(jsonData.main.board, CONTEXT);
            gameStateHeader.innerText = `| Max Score: ${jsonData.main.maxScore} | `
            gameStateHeader.innerText += ` Current Score: ${jsonData.main.currentScore} | `
            gameStateHeader.innerText += ` Max Level: ${jsonData.main.maxLevel} | `
            gameStateHeader.innerText += ` Current Level: ${jsonData.main.currentLevel} | `
            gameStateHeader.innerText += ` Lives: ${jsonData.main.lives} | `
        } if (jsonData.spectate && spectateReady) {
            updateBoard(jsonData.spectate.board, SPECTATE_CONTEXT);
            spectateStateHeader.innerText = `| Max Score: ${jsonData.spectate.maxScore} | `
            spectateStateHeader.innerText += ` Current Score: ${jsonData.spectate.currentScore} | `
            spectateStateHeader.innerText += ` Max Level: ${jsonData.spectate.maxLevel} | `
            spectateStateHeader.innerText += ` Current Level: ${jsonData.spectate.currentLevel} | `
            spectateStateHeader.innerText += ` Lives: ${jsonData.spectate.lives} | `
        } else if (jsonData.msg) {
            console.log(jsonData.msg);
        } else {
            //debug(jsonData);
        }
    });

    return socket;
}

const socket = init();

const DEBUG = false;
function debug(output) {
    if (DEBUG) console.log(output);
}

function validateEmail(email) {
    // https://stackoverflow.com/a/46181
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateUsername(username) {
    return /^[a-z]+$/i.test(username);
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




document.onkeydown = postKey;
function postKey(e) {
    if (keyInputEnabled) {
        postData('/gameInput', {keyDown: e.code}).then(res => {
            debug(res)
        });
    }
}

//HOUSENKA CLIENT
let IMG_LOADED = 0;
const xsize = 41;
const ysize = 31;

const TILE_SIZE = 16;

let canvasReady = false;

localStorage.setItem("DEBUG", "true");

let CONTEXT = {};
let SPECTATE_CONTEXT = {};
let IMAGES = {};
saveGameBlock();
housenkaInit().then(r => {
    console.log('Canvas Ready');
    canvasReady = true;
});

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

function drawBorders (context) {

    if(DEBUG) console.log("Building horizontal borders");
    //draw border
    for(let x = 0; x < xsize; x++) {
        context.drawImage(IMAGES.borderImg, x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
        context.drawImage(IMAGES.borderImg, x * TILE_SIZE, TILE_SIZE * (ysize - 1), TILE_SIZE, TILE_SIZE);
    }
    if(DEBUG) console.log("Building vertical borders");
    for(let y = 0; y < ysize; y++) {
        context.drawImage(IMAGES.borderImg, 0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        context.drawImage(IMAGES.borderImg, (xsize - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

async function housenkaInit () {
    //deleteOriginalTable();
    if (DEBUG) console.log("Building Canvas");
    document.write('<style>canvas {border: solid 3px #ff0000}</style>')
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.width = xsize * TILE_SIZE;
    canvas.height = ysize * TILE_SIZE;
    main.appendChild(canvas);
    if (DEBUG) console.log("Canvas Built");
    // const canvas = document.getElementById("myCanvas");
    CONTEXT = canvas.getContext("2d");
    IMAGES = await loadImages();
    drawBorders(CONTEXT);
}

function reverse_coords (position) {
    const x = position % xsize;
    const y = Math.floor(position / xsize);

    return {x: x, y: y};
}

function updateBoard (board, context) {
    for (let index = 0; index < board.length; index++) {
        canvasInput(reverse_coords(index), board[index], context);
    }
}

function canvasInput (coordinates, color, context) {
    //const obsahy = ['prazdne', 'telicko', 'zradlo', 'zed', 'klic', 'dvere', 'hlavicka'];
    if (color === 0) {
        context.clearRect(coordinates.x * TILE_SIZE, coordinates.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        //CONTEXT.drawImage(IMAGES.borderImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 1) {
        context.drawImage(IMAGES.bodyImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 2) {
        context.drawImage(IMAGES.foodImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 3) {
        context.drawImage(IMAGES.borderImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 4) {
        context.drawImage(IMAGES.keyImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 5) {
        context.drawImage(IMAGES.doorImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    } else if (color === 6) {
        context.drawImage(IMAGES.headImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
    }
}

// I N T E R F A C E
main.appendChild(assignedGameCode);
let loggedIn = false;
let keyInputEnabled = false;
const startButton = document.createElement('button');
startButton.onclick = () => {
    keyInputEnabled = !keyInputEnabled;
    debug(`Game Key Input Enabled: ${keyInputEnabled}`);
}
startButton.innerText = '(Enable | Disable) Keyboard Input';
main.appendChild(startButton);



const remoteControl = function () {
    const codeControlTextField = document.createElement("input"); //input element, text
    codeControlTextField.setAttribute('type',"text");
    codeControlTextField.setAttribute('name',"code");
    codeControlTextField.setAttribute('placeholder',"code");
    codeControlTextField.value = assignedGameCode.innerText;
    const controlButtonsDiv = document.createElement('div');
    main.appendChild(controlButtonsDiv);

    controlButtonsDiv.appendChild(codeControlTextField);

    const rightButton = document.createElement('button');
    rightButton.onclick = () => {
        remoteGameInput('KeyD');
    }
    rightButton.innerText = ' > ';

    const upButton = document.createElement('button');
    upButton.onclick = () => {
        remoteGameInput('KeyW');
    }
    upButton.innerText = ' ^ ';

    const downButton = document.createElement('button');
    downButton.onclick = () => {
        remoteGameInput('KeyS');
    }
    downButton.innerText = ' v ';

    const leftButton = document.createElement('button');
    leftButton.onclick = () => {
        remoteGameInput('KeyA');
    }
    leftButton.innerText = ' < ';

    const stopButton = document.createElement('button');
    stopButton.onclick = () => {
        remoteGameInput('KeyP');
    }
    stopButton.innerText = ' S T O P ';

    controlButtonsDiv.append(leftButton, upButton, downButton, rightButton, stopButton);

    function remoteGameInput(keyCode) {
        const gameCode = codeControlTextField.value;
        if (gameCode) {
            postData('/gameInput', {keyDown: keyCode, altGame: gameCode}).then(res => {
                debug(res)
            });
        } else {
            postData('/gameInput', {keyDown: keyCode}).then(res => {
                debug(res)
            });
        }
    }
}
remoteControl();


function saveGameBlock() {
    const fileInputDiv = document.createElement('div');
    main.appendChild(fileInputDiv);
    const downloadStateButton = document.createElement('button');
    downloadStateButton.onclick = () => {
        //could be GET
        debug('Get state');
        postData('/getState', {msg: 'Serialize State'}).then(data => {
            debug(data);
            if (data.file) {
                const gameState = data.file;
                debug(gameState);
                download(gameState, 'game.txt', 'text');
            }
        });
    }
    downloadStateButton.innerText = 'Download Game State';

    const inputElement = document.createElement('input');
    inputElement.setAttribute('type', 'file');
    inputElement.addEventListener("change", handleFiles, false);
    async function handleFiles() {
        const file = this.files[0];
        debug(file);
        const reader = new FileReader();
        await reader.readAsText(file);
        reader.onloadend = () => postData('/updateState', {gameState: reader.result}).then(data => {debug(data)});
    }

    fileInputDiv.appendChild(downloadStateButton);
    fileInputDiv.appendChild(inputElement);
}



// Function to download data to a file
function download(data, filename, type) {
    //https://stackoverflow.com/a/30832210
    const file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        const a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}



function createTable(table, data) {
    clearElement(table);
    //https://www.valentinog.com/blog/html-table/
    function generateTableHead(table, data) {
        let thead = table.createTHead();
        let row = thead.insertRow();
        for (let key of data) {
            let th = document.createElement("th");
            debug(key)
            let text = document.createTextNode(key);
            th.appendChild(text);
            row.appendChild(th);
        }

    }

    function generateTable(table, data) {
        for (let element of data) {
            let row = table.insertRow();
            for (let key in element) {
                let cell = row.insertCell();
                let text = document.createTextNode(element[key]);
                cell.appendChild(text);
            }
        }
    }
    let keys = Object.keys(data[0]);

    generateTable(table, data);
    generateTableHead(table, keys);
}


function activeGamesBlock() {
    const activeGamesButton = document.createElement('button');
    activeGamesButton.onclick = function () {
        postData('/activeGames', {msg: 'Request Active Games'}).then(data => {
            debug(data);
            if (data.msg) {
                console.log(data.msg);
            }
            if (data.activeGames) {
                const activeGamesArray = data.activeGames;
                debug(activeGamesArray);
                createTable(gamesTable, activeGamesArray);
            }
        });
    }
    const activeGamesDiv = document.createElement('div');

    activeGamesButton.innerText = 'Show (Update) Active Games';
    const gamesTable = document.createElement('table');
    activeGamesDiv.appendChild(activeGamesButton);
    activeGamesDiv.appendChild(gamesTable);
    main.appendChild(activeGamesDiv);
}


function clearElement(element) {
    element.innerHTML = '';
}


let spectateReady = false;
function spectateGameBlock() {
    const codeInput = document.createElement("input"); //input element, text
    codeInput.setAttribute('type', "text");
    codeInput.setAttribute('name', "code");
    codeInput.setAttribute('placeholder', "code");

    const spectateDiv = document.createElement('div');
    main.appendChild(spectateDiv);

    spectateDiv.appendChild(codeInput);

    const spectateButton = document.createElement('button');
    spectateButton.onclick = () => {
        const code = codeInput.value;
        if (code) {
            postData('/spectate', {code: code}).then(data => {
                spectateDiv.appendChild(spectateStateHeader);
                const canvas = document.createElement('canvas');
                canvas.setAttribute('id', 'myCanvas');
                canvas.width = xsize * TILE_SIZE;
                canvas.height = ysize * TILE_SIZE;
                spectateDiv.appendChild(canvas);
                SPECTATE_CONTEXT = canvas.getContext("2d");
                drawBorders(SPECTATE_CONTEXT);
            }).then(() => {
                spectateReady = true;
                }
            );
        }
    }
    spectateButton.innerText = 'Spectate Game';
    spectateDiv.appendChild(spectateButton);
}
spectateGameBlock();

activeGamesBlock();


function scoreBoardBlock() {
    const showScoreBoardButton = document.createElement('button');
    showScoreBoardButton.onclick = function () {
        postData('/scoreBoard', {msg: 'Request Score Board'}).then(data => {
            debug(data);
            if (data.msg) {
                console.log(data.msg);
            }
            if (data.scoreBoard) {
                const activeGamesArray = data.scoreBoard;
                debug(activeGamesArray);
                createTable(scoreTable, activeGamesArray);
            }
        });
    }
    const scoreBoardDiv = document.createElement('div');

    showScoreBoardButton.innerText = 'Show (Update) Score Board';
    const scoreTable = document.createElement('table');
    scoreBoardDiv.appendChild(showScoreBoardButton);
    scoreBoardDiv.appendChild(scoreTable);
    main.appendChild(scoreBoardDiv);
}
scoreBoardBlock();

function audioPlayer(url) {
    const audio = new Audio(url);
    audio.muted = false;
    audio.loop = true;
    const authorButton = document.createElement('button');
    authorButton.innerText = 'Roll';
    authorButton.onclick = () => {
        window.open('https://bit.ly/2GFGsjQ');
    }
    const audioButton = document.createElement('button');
    audioButton.innerText = ' [ Play / Pause ] Audio ';
    let playing = false;
    audioButton.onclick = () => {
        playing = !playing;
        if (playing) {
            audio.play().then(() => {debug('Audio playing.')});
        } else {
            audio.pause();
        }

    }
    const audioDiv = document.createElement('div');
    audioDiv.appendChild(audioButton);
    audioDiv.appendChild(authorButton);
    main.appendChild(audioDiv);
}

//https://archive.org/details/TobyFoxMegalovania
// MEGALOVANIA
// Performed by
// Toby Fox
// Written by
// Toby Fox
//Publisher's song ID: MCMP-001-100
// Source: Materia Collective
//https://materiamusicpub.com/
//https://materia.to/undertaleID
//Soundtrack to indie RPG Undertale
//
//audioPlayer("https://archive.org/download/TobyFoxMegalovania/Toby%20Fox%20-%20Megalovania.mp3");


//License: Public Domain
//https://creativecommons.org/licenses/publicdomain/
//Source: https://archive.org/details/ER37leftbehind/02.WagonRide.flac
//Author Adhesion & Scrap Heap
//Year 2006
audioPlayer("https://ia802703.us.archive.org/28/items/ER37leftbehind/02.WagonRide_64kb.mp3");