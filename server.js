//David Silady
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const sh = require('./serverHousenka');

//Const values
const WS_PORT = 8082;
const HTTP_PORT = 8080;
const COOKIE_AGE = 1000 * 60 * 60 * 24; // 1 day
const DEBUG = true;
const MAX_USERS = 10000; //codes 0000 to 9999

//Global variables
const socketToUserCode = new Map();
const userCodeToSocket = new Map();
const activeGames = new Map();
const activeCodes = new Set();

//Helper functions
function getCookie(cookies, name) {
    // https://stackoverflow.com/a/15724300
    const value = `; ${cookies}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
function heartbeat() {
    this.isAlive = true;
}
function generateUserCode(originalCode) {
    if (! originalCode) {
        originalCode = '0000';
    }
    while (activeCodes.has(originalCode)) {
        let number = Math.floor(Math.random() * MAX_USERS);
        originalCode = number.toLocaleString(
            'en-US',
            {minimumIntegerDigits: 4, useGrouping:false});
    }
    activeCodes.add(originalCode);
    return originalCode;
}

//Server setup
const app = express();
const server = require('http').createServer();
const WebSocket = require('ws');
const wss = new WebSocket.Server({server: server});
const sessionParser = session({
    secret: 'key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: COOKIE_AGE
    }
});


//WSS setup
wss.on('connection', function connection(socket, req) {
    console.log('A new client connected.');
    debug(getCookie(req.headers.cookie, 'uid'));
    const userID = getCookie(req.headers.cookie, 'uid');
    socketToUserCode.set(socket, userID); //for 2-way search
    userCodeToSocket.set(userID, socket);
    if (! activeGames.has(userID)) {
        const game = new sh.ServerGame(userID);
        activeGames.set(userID, game);
    }

    socket.isAlive = true;
    socket.on('pong', heartbeat); // updating isAlive for keepAlive

    socket.send(JSON.stringify({msg: 'WS Connection Established!'}));

    socket.on('message', function incoming(message) {
        console.log(`Received ${message}`);
        socket.send(JSON.stringify({msg: `Message ${message} received from user ${userID}`}));
    });

    socket.on('close', function () {
        const code = socketToUserCode.get(socket)
        debug(`Socket closed: ${socketToUserCode.get(socket)}`);
        activeCodes.delete(code);
        activeGames.delete(code);
        userCodeToSocket.delete(code);
        socketToUserCode.delete(socket);
    });
});

// Intervals
//interval for game updates
let index = 0;
const gameUpdate = setInterval(function update() {
    wss.clients.forEach(socket => {
        const userID = socketToUserCode.get(socket);
        const game = activeGames.get(userID)
        if (game) {
            socket.send(JSON.stringify({board: game.gameState.plocha}));
        }
    });
    index += 1;
}, 15);

//interval (keepalive) for detecting disconnects
//https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
const keepAlive = setInterval(function ping() {
    wss.clients.forEach(function each(socket) {
        if (socket.isAlive === false) return socket.terminate();

        socket.isAlive = false;
        socket.ping(function () {});
    });
}, 30000);

wss.on('close', function close() {
    clearInterval(gameUpdate);
    clearInterval(keepAlive);
})

//Express setup
app.use(sessionParser);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Express Calls
//app.use(initSessionUser);
app.use(express.static('public'));
app.post('/login', function (req, res) {
    //
    // "Log in" user and set private userId and public userCode to session.
    //
    if (! req.session.userID) {
        req.session.userID = uuid.v4(); //private
        // will keep original code if its still free
        req.session.userCode = generateUserCode(req.session.userCode); //public in cookie and on site / 0000 - 9999
    }

    console.log(`Updating session for user ${req.session.userID}`);
    res.send({ result: 'OK', message: 'Session updated', userCode: req.session.userCode, userID: req.session.userID});
});

app.post('/key', function (req, res) {
    const userCode = req.session.userCode
    if (userCode && req.body.keyDown) {
        const game = activeGames.get(userCode);
        if (game) {
            game.onKeyPress(req.body.keyDown);
        }
        res.status(200).send(JSON.stringify({msg: `Key: ${req.body.keyDown} received.`}))
    } else {
        res.status(400).send(JSON.stringify({msg: 'Unknown user or missing key.'}));
    }
});

app.post('/', postHandler);
app.use(errorHandler);

function postHandler (req, res, next) {
    debug(`${JSON.stringify(req.body)} from user ${req.session.userID}`);
    res.status(200).send( JSON.stringify({body: `Post Received: ${JSON.stringify(req.body)}`}));
}
function errorHandler(err, req, res, next) {
    if (err) {
        console.log(err)
        res.status(400).send('<h2>There has been an error.</h2>')
    }
}

function debug(output) {
    if (DEBUG) {
        console.log(output);
    }
}

app.listen(HTTP_PORT, () => console.log(`Listening for HTTP connection on port: ${HTTP_PORT}`));
server.listen(WS_PORT, () => console.log(`Listening for HTTP connection on port: ${WS_PORT}`));