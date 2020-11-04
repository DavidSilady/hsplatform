const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
    console.log('Connected');
})

socket.addEventListener('message', function (event) {
    console.log(`Message from the server: ${event.data}`);
})