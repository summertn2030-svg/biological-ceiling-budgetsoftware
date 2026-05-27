const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

let votes = [];
let votingOpen = true; // Tracks if the audience is allowed to vote right now

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/public/client.html'));
app.get('/host', (req, res) => res.sendFile(__dirname + '/public/host.html'));

io.on('connection', (socket) => {
    // Send existing data and the current freeze/unfreeze status to anyone who connects
    socket.emit('update', votes);
    socket.emit('voting_state_changed', votingOpen);

    // When an iPad submits a vote
    socket.on('submit', (data) => {
        votes.push({
            elt: parseFloat(data.elt),
            bio: parseFloat(data.bio),
            exist: parseFloat(data.exist),
            time: new Date().toLocaleTimeString()
        });
        io.emit('update', votes); // Instantly tell everyone (especially the host)
    });

    // When the CFO presses "Freeze" or "Unfreeze"
    socket.on('toggle_voting', (state) => {
        votingOpen = state;
        io.emit('voting_state_changed', votingOpen); // Tell all iPads to lock/unlock
    });

    // When the CFO clears the session
    socket.on('clear', () => {
        votes = [];
        io.emit('update', votes);
    });
});

server.listen(process.env.PORT || 3000, () => console.log('Server is running on port 3000!'));