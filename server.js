const http = require('http')
const fs = require('fs')
const port = 3000

const server = http.createServer(function (req, res) {

    fs.readFile('index.html', function (error, data) {
        if (error) {
            res.writeHead(404);
            res.write('Error: File Not Found');
            res.end();
            console.log(error)
        }
        else if (req.url === '/index.html'){
            res.writeHead(
                200,
                {'Content-Type': 'text/html' }
            );
            res.write(data);
            res.end();
        } else {
            res.write('No good');
            res.end();
        }
    })
})

server.listen(port, function (error) {
    if (error) {
        console.log('Something went wrong', error);
    } else {
        console.log('Server is listening on port ' + port);
    }
})