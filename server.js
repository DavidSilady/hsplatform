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

//Helper functions


//Server setup
const app = express();
const server = require('http').createServer();
const WebSocket = require('ws');
const wss = new WebSocket.Server({server: server}, () => {});
const sessionParser = session({
    secret: 'key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: COOKIE_AGE
    }
});

//WSS setup
wss.on('connection', function connection(ws) {
    console.log('A new client connected.');
    ws.send('Welcome!');

    ws.on('message', function incoming(message) {
        console.log(`Received ${message}`);
        ws.send(`Message ${message} received`);
    })
});



//Express setup
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(sessionParser);


//Express Calls
app.use(initSessionUser);
app.use(express.static('public'));
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

app.listen(HTTP_PORT, () => console.log(`Listening for HTTP connection on port: ${HTTP_PORT}`))
server.listen(WS_PORT, () => console.log(`Listening for WS connection on port: ${WS_PORT}`));