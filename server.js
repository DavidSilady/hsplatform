//David Silady
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');

//Const values
const WS_PORT = 8082;
const HTTP_PORT = 8080;
const COOKIE_AGE = 1000 * 60 * 60 * 24; // 1 day
const DEBUG = true;

//Global variables
const connections = new Map();

//Helper functions
function getCookie(cookies, name) {
    // https://stackoverflow.com/a/15724300
    const value = `; ${cookies}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
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
    connections.set(socket, userID);

    socket.send('WS Connection Established!');

    socket.on('message', function incoming(message) {
        console.log(`Received ${message}`);
        socket.send(`Message ${message} received from user ${userID}`);
    });

    socket.on('close', function () {
        connections.delete(userID);
    });

    // let index = 0;
    // const interval = setInterval(function update() {
    //     debug(connections).get(userID);
    //     connections.get(userID).send(`Update ${index} for ${connections[userID]}`);
    // }, 10000);
});

let index = 0;
const interval = setInterval(function update() {
    wss.clients.forEach(socket => {
        socket.send(`Update ${index} for ${connections.get(socket)}`);
    });
    index += 1;
}, 3000);

//Express setup
app.use(sessionParser);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Express Calls
//app.use(initSessionUser);
app.use(express.static('public'));
app.post('/login', function (req, res) {
    //
    // "Log in" user and set userId to session.
    //
    const id = uuid.v4();

    console.log(`Updating session for user ${id}`);
    req.session.userID = id;
    res.send({ result: 'OK', message: 'Session updated', userID: id });
});
app.delete('/logout', function (request, response) {
    const ws = map.get(request.session.userId);

    console.log('Destroying session');
    request.session.destroy(function () {
        if (ws) ws.close();

        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});
app.post('/', postHandler);
app.use(errorHandler);

function initSessionUser (req, res, next) {
    if (! req.session.userCode) {
        req.session.userCode = 1;
    }
    if (! req.session.userID) {
        req.session.userID = uuid.v4();
    }
    next();
}

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