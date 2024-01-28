const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 5500;

app.use(express.static('public'));

// detault game page 
app.get('/', function(_req, res) {  
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/status', (_req, res) => {
    res.setHeader('Content-type', 'application/json');
    res.json({ status: "server OK", games, rooms });
});
app.get('/clean', (_req,res) => {
    for (let r  in rooms) {
        delete rooms[r];
    }
    for (let i in games) {
        delete games[i];
    }
    res.setHeader('Content-type', 'application/json');
    res.json({ status: "rooms cleaned", rooms, rooms });
});

server.listen(PORT, () => {
    console.log(`Serveur en cours d'écoute sur le port ${PORT}`);
});


const levels = require("./levels");

// Structure pour stocker les salles de jeu
const rooms = {};
const games = {};

// Gérer la connexion d'un client
io.on('connection', (socket) => {
    
    console.log('New player: ' + socket.id);

    socket.on("create", () => {
        let currentGame = 0;
        do {
            currentGame = "#" + (Math.random() * 899999 + 100000 | 0);
        }
        while (rooms[currentGame]);
        rooms[currentGame] = { adversary: {}, level: levels.generate(), t0: Date.now(), roles: {"police": null, "killer": null} };
        const role = (Math.random() < 0.5) ? "police" : "killer";
        rooms[currentGame].roles[role] = socket.id;
        games[socket.id] = currentGame;
        console.log("Player " + socket.id + " created game " + currentGame + " ("+ role+")");
        socket.emit("newgame", { level: rooms[currentGame].level, role, delay: 0 });
    });

    // Rejoindre une salle de jeu
    socket.on('join', (roomId) => {
        // auto-filling of first available game (TODO remove to propose list of games)
        for (let i in rooms) {
            if (rooms[i].roles.police == null ^ rooms[i].roles.killer == null) {
                roomId = i;
                break;
            }
        }
        // Room can not be found
        if (!roomId || !rooms[roomId]) {
            socket.emit("noSuchGame");
            return;
        }
        const room = rooms[roomId];
        // Room is alreay full
        if (room.roles.police && room.roles.killer) {
            socket.emit("gameIsFull");
            return;
        }
        // Room OK 
        games[socket.id] = roomId;
        // compute associated game data (id opponent, player role, etc.)
        let otherID = room.roles.police || room.roles.killer;
        let role = (room.roles.police == null) ? "police" : "killer";
        console.log(`Player ${socket.id} joined game ${roomId} (${role})`);
        room.roles[role] = socket.id;
        room.adversary[otherID] = socket.id;
        room.adversary[socket.id] = otherID;

        // Informer le joueur qu'il a rejoint la salle, avec son rôle
        socket.emit('newgame', { level: rooms[roomId].level, role, delay: Date.now() - rooms[roomId].t0 });
        // Informer les autres joueurs de la salle qu'un nouveau joueur a rejoint
        socket.to(otherID).emit("playerJoined");
    });

    // Écouter les mouvements du joueur
    socket.on('playerMove', (data) => {
        let currentGame = games[socket.id];
        if (currentGame && rooms[currentGame]) {
            // inform the adversary of the movement
            socket.volatile.to(rooms[currentGame].adversary[socket.id]).emit('playerMove', data);
        }
    });
    // Écouter les mouvements du joueur
    socket.on('playerTalk', (data) => {
        let currentGame = games[socket.id];
        if (currentGame && rooms[currentGame]) {
            // inform the adversary that two players are talking to each other
            socket.volatile.to(rooms[currentGame].adversary[socket.id]).emit('playerTalk', data);
        }
    });

    socket.on('exit', function() {
        let currentGame = games[socket.id];
        console.log(`Player ${socket.id} has quit game ${currentGame}`);
        delete games[socket.id];
        if (currentGame && rooms[currentGame]) {
            socket.to(rooms[currentGame].adversary[socket.id]).emit('playerLeft');
            delete rooms[currentGame];   
            console.log("--> Game " + currentGame + " deleted")
        }
        currentGame = null;
    });

    // Gérer la déconnexion d'un client
    socket.on('disconnect', () => {
        let currentGame = games[socket.id];
        console.log('Un joueur s\'est déconnecté, salle associée = ' + currentGame);
        delete games[socket.id];
        // Retirer le joueur de la salle
        if (currentGame && rooms[currentGame]) {
            socket.to(rooms[currentGame].adversary[socket.id]).emit('playerLeft');
            delete rooms[currentGame];   
            console.log("--> Game " + currentGame + " deleted")
        }
        currentGame = null;
    });

    // Gérer la fin de partie
    socket.on('endGame', (data) => {
        let currentGame = games[socket.id];
        console.log(`Game ${currentGame} ended, data = ${data.winner} won`);
        delete games[socket.id];
        // Retirer le joueur de la salle
        if (currentGame && rooms[currentGame]) {
            socket.to(rooms[currentGame].adversary[socket.id]).emit('endGame', data);
            delete rooms[currentGame];   
            console.log("--> Game " + currentGame + " deleted")
        }
        currentGame = null;
    });
});

