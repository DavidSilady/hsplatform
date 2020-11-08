//David Silady
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const sh = require('./serverHousenka');
const CryptoJS = require('crypto-js');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

//Const values
const WS_PORT = 8082;
const HTTP_PORT = 8080;
const COOKIE_AGE = 1000 * 60 * 60 * 24; // 1 day
const DEBUG = true;
const MAX_USERS = 10000; //codes 0000 to 9999

//Global variables
const socketToUserID = new Map();
const userIDtoSocket = new Map();
const userIDtoGameCode = new Map();
const userIDtoUser = new Map();
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

//User Storage
const userStorage = [];
const usernameSet = new Set();
const mailSet = new Set();

function loadStorage() {
    //https://stackabuse.com/reading-and-writing-csv-files-with-node-js/
    fs.createReadStream('data.csv')
        .on('error', (err) => {
            debug('Error reading data.csv');
        })
        .pipe(csv())
        .on('data', (row) => {
            userStorage.push(row);
            usernameSet.add(row.username);
            mailSet.add(row.mail);
        })
        .on('end', () => {

            console.log('CSV file successfully processed');
        });
}
function serializeStorage() {
    const csvWriter = createCsvWriter({
        path: 'data.csv',
        header: [
            {id: 'mail', title: 'mail'},
            {id: 'username', title: 'username'},
            {id: 'password', title: 'password'},
            {id: 'maxScore', title: 'maxScore'},
            {id: 'maxLevel', title: 'maxLevel'}
        ]
    });
    csvWriter.writeRecords(userStorage).then(() => debug('CSV file updated.'));
}
function signUp(user) {
    let result = true;
    let outputMsg = '';
    if (usernameSet.has(user.username)) {
        result = false;
        outputMsg += `Username ${user.username} already in use. `;
    }
    if (mailSet.has(user.mail)) {
        result = false;
        outputMsg += `Mail ${user.mail} already in use. `;
    }
    if (result) {
        userStorage.push(user);
        usernameSet.add(user.username);
        mailSet.add(user.mail);
        serializeStorage();
        outputMsg = 'User Signed Up';
    }
    return {msg: outputMsg, result: result};
}
function login(user) {
    let storedUser = {};
    if (user.mail) {
        storedUser = getUserByMail(user.mail);
    } else if (user.username) {
        storedUser = getUserByUsername(user.username);
    }
    if (storedUser) {
        const bytes  = CryptoJS.AES.decrypt(storedUser.password, '13bc672d8b40');
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        debug(originalText);
        debug(user.password);
        if (originalText === user.password) {
            return [storedUser, {result: true, msg: `User ${storedUser.username} Logged In`}];
        } else {
            return [NaN, {result: false, msg: `Incorrect password`}];
        }
    } else {
        return [NaN, {result: false, msg: `Incorrect username`}];
    }
}
function getUserByMail(mail) {
    for (let i = 0; i < userStorage.length; i++) {
        if (userStorage[i].mail === mail) {
            return userStorage[i];
        }
    }
    //default
    return NaN;
}
function getUserByUsername(username) {
    for (let i = 0; i < userStorage.length; i++) {
        if (userStorage[i].username === username) {
            return userStorage[i];
        }
    }
    //default
    return NaN;
}

loadStorage();

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
    socketToUserID.set(socket, userID); //for 2-way search
    userIDtoSocket.set(userID, socket);
    const gameCode = userIDtoGameCode.get(userID)
    if (! activeGames.has(gameCode)) {
        const game = new sh.ServerGame(userIDtoUser.get(userID));
        activeGames.set(gameCode, game);
    }
    socket.isAlive = true;
    socket.on('pong', heartbeat); // updating isAlive for keepAlive

    socket.send(JSON.stringify({msg: 'WS Connection Established!'}));

    socket.on('message', function incoming(message) {
        console.log(`Received ${message}`);
        socket.send(JSON.stringify({msg: `Message ${message} received from user ${userID}`}));
    });

    socket.on('close', function () {
        const code = socketToUserID.get(socket)
        debug(`Socket closed: ${socketToUserID.get(socket)}`);
        activeCodes.delete(code);
        activeGames.delete(code);
        userIDtoSocket.delete(code);
        socketToUserID.delete(socket);
    });
});

// Intervals
//interval for game updates
const gameUpdate = setInterval(function update() {
    wss.clients.forEach(socket => {
        const userID = socketToUserID.get(socket);
        let user = userIDtoUser.get(userID);

        const game = activeGames.get(userIDtoGameCode.get(userID));
        if (game) {
            if (! user) { //if not registered, use the games base user
                user = game.user;
            }
            const currentLevel = game.gameState.level;
            const currentScore = game.gameState.body;
            if (currentLevel > user.maxLevel) {
                user.maxLevel = currentLevel;
            }
            if (currentScore > user.maxScore) {
                user.maxScore = currentScore;
            }
            socket.send(JSON.stringify({
                board: game.gameState.plocha,
                currentLevel: currentLevel,
                currentScore: currentScore,
                maxLevel: user.maxLevel,
                maxScore: user.maxScore,
                lives: game.gameState.lives
            }));
        }
    });
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
});

//Express setup
app.use(sessionParser);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Express Calls
//app.use(initSessionUser);
app.use(express.static('public'));
app.post('/init', function (req, res) {
    //
    // "Log in" user and set private userId and public userCode to session.
    //
    if (! req.session.userID) {
        req.session.userID = uuid.v4();
        // will keep original code if its still free
        req.session.gameCode = generateUserCode(req.session.gameCode); //public game in cookie and on site / 0000 - 9999
    }
    userIDtoGameCode.set(req.session.userID, req.session.gameCode);
    debug(req.session);
    console.log(`Updating session for user ${req.session.userID}`);
    res.send(JSON.stringify({ result: 'OK',
        message: 'Session updated',
        gameCode: req.session.gameCode,
        userID: req.session.userID
    }));
});

app.post('/signUp', function (req, res) {
    if (req.body.password && req.body.username && req.body.mail) {
        const cipherPassword = CryptoJS.AES.encrypt(req.body.password, '13bc672d8b40').toString();
        const user = {
            username: req.body.username,
            mail: req.body.mail,
            password: cipherPassword,
            maxScore: 0,
            maxLevel: 0
        }
        debug(user);
        const output = signUp(user);
        if (output.result) {
            userIDtoUser.set(req.session.userID, user);
        }
        res.status(200).send(JSON.stringify(output));
    } else {
        res.status(400).send(JSON.stringify({msg: 'Something went wrong.', result: false}));
    }
});
app.post('/login', function (req, res) {
   if (req.body.password && req.body.username) {
       const user = {
           username: req.body.username,
           password: req.body.password
       }
       const [loggedInUser, output] = login(user);
       if (output.result && loggedInUser) {
            userIDtoUser.set(req.session.userID, loggedInUser);
       }
       res.status(200).send(JSON.stringify(output));
   } else {
       res.status(400).send(JSON.stringify({msg: 'Something went wrong.', result: false}));
   }
});
app.post('/gameInput', function (req, res) {
    const gameCode = req.session.gameCode;
    if (gameCode && req.body.keyDown) {
        const game = activeGames.get(gameCode);
        if (game) {
            game.onKeyPress(req.body.keyDown);
        }
        res.status(200).send(JSON.stringify({msg: `Key: ${req.body.keyDown} received.`}))
    } else {
        res.status(200).send(JSON.stringify({msg: 'Unknown user or missing key.'}));
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
        res.status(400).send(JSON.stringify({msg: 'There has been an error.'}));
    }
}

function debug(output) {
    if (DEBUG) {
        console.log(output);
    }
}

app.listen(HTTP_PORT, () => console.log(`Listening for HTTP connection on port: ${HTTP_PORT}`));
server.listen(WS_PORT, () => console.log(`Listening for HTTP connection on port: ${WS_PORT}`));