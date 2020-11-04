const express = require('express')
const session = require('express-session')
const fs = require('fs')
const port = 3000

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: 'key',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

app.get('/', standardExpressCallback)
app.use(errorHandler)

function standardExpressCallback (req, res, next) {
    if (req.session.viewCount) {
        console.log('View Count Up')
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

app.listen(port)