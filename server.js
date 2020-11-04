const express = require('express');
const session = require('express-session');

//Const values
const PORT = 3000;
const COOKIE_AGE = 1000 * 60 * 60 * 24; // 1 day


//Server setup
const app = express();
const server = require('http').createServer(app);
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

app.use(express.static('public'));
app.use(sessionParser);
//app.get('/test', standardExpressCallback);
app.use(errorHandler);

function standardExpressCallback (req, res, next) {
    if (req.session.viewCount) {
        req.session.viewCount += 1;
    } else {
        req.session.viewCount = 1;
    }
    res.status(200).send( `<h1>Hello There ${req.session.viewCount}</h1>`)
}
function errorHandler(err, req, res, next) {
    if (err) {
        console.log(err)
        res.status(400).send('<h2>There has been an error.</h2>')
    }
}

server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
