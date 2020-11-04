const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
    console.log('Connected');
})

socket.addEventListener('message', function (event) {
    console.log(`Message from the server: ${event.data}`);
})

const sendMessage = () => {
    socket.send('Hello Server');
}

const main = document.getElementById('worm');
const button = document.createElement('button');
button.onclick = sendMessage;
button.innerText = 'Send Message'
main.appendChild(button)