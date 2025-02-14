// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuriamo Socket.io con CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Oggetto per tenere traccia delle lobby create
const lobbies = {};

// Funzione per generare un codice univoco per la lobby
function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('Nuovo client connesso');
// Invia un messaggio di cortesia al client appena connesso
socket.emit('welcomeMessage', { message: "Welcome to the Escape Room Server!" });

  // Evento per creare una lobby
  socket.on('createLobby', (data) => {
    // data: { nickname, difficulty, numPlayers, timer }
    const lobbyCode = generateLobbyCode();
    lobbies[lobbyCode] = {
      code: lobbyCode,
      users: [data.nickname],
      difficulty: data.difficulty,
      numPlayers: data.numPlayers,
      timer: data.timer
    };
    // Salva informazioni sul socket
    socket.lobbyCode = lobbyCode;
    socket.nickname = data.nickname;
    socket.join(lobbyCode);
    console.log(`${data.nickname} ha creato la lobby ${lobbyCode}`);
    
    // Invia i dettagli della lobby al creatore, includendo anche il nickname
    socket.emit('lobbyCreated', { 
      lobbyCode, 
      nickname: data.nickname,   // Aggiungi il nickname qui
      users: lobbies[lobbyCode].users,
      difficulty: data.difficulty,
      numPlayers: data.numPlayers,
      timer: data.timer
    });
    
    // Aggiorna tutti i membri della lobby con la lista degli utenti
    io.to(lobbyCode).emit('lobbyUsers', { users: lobbies[lobbyCode].users });
  });
  

  socket.on('joinLobby', (data) => {
    // data: { nickname, lobbyCode }
    const lobbyCode = data.lobbyCode;
    if (lobbies[lobbyCode]) {
      if(lobbies[lobbyCode].users.length >= lobbies[lobbyCode].numPlayers) {
        socket.emit('capacity_error', { message: 'La lobby è piena' });
        return;
      }
      socket.lobbyCode = lobbyCode;
      socket.nickname = data.nickname;
      // Aggiungi il nickname solo se non è già presente nella lobby
      if (!lobbies[lobbyCode].users.includes(data.nickname)) {
        lobbies[lobbyCode].users.push(data.nickname);
        socket.join(lobbyCode);
        console.log(`${data.nickname} si è unito alla lobby ${lobbyCode}`);

        // Aggiorna la lista degli utenti per tutti i client nella lobby
        io.to(lobbyCode).emit('lobbyUsers', { users: lobbies[lobbyCode].users });

        // Invia la conferma al client che si è unito correttamente
        socket.emit('lobbyJoined', { 
          lobbyCode, 
          nickname: data.nickname, 
          users: lobbies[lobbyCode].users,
          difficulty: lobbies[lobbyCode].difficulty,
          numPlayers: lobbies[lobbyCode].numPlayers,
          timer: lobbies[lobbyCode].timer
        });

      } else {
        console.log(`Nickname ${data.nickname} già presente nella lobby ${lobbyCode}`);
        socket.emit('errorName', { message: 'Nickname gia usato' });
      }
      
    } else {
      socket.emit('error', { message: 'Lobby non trovata' });
    }
  });
  

  // Evento per gestire i messaggi della chat nella lobby
socket.on('lobbyChatMessage', (data) => {
  const { lobbyCode, nickname, message } = data;
  console.log(`Messaggio ricevuto nella lobby ${lobbyCode} da ${nickname}: ${message}`);

  // Logga i membri della room per verificare che siano presenti
  const roomMembers = io.sockets.adapter.rooms.get(lobbyCode);
  console.log(`Membri nella room ${lobbyCode}:`, roomMembers);

  if (lobbies[lobbyCode]) {
    io.to(lobbyCode).emit('lobbyChatMessage', { nickname, message });
    console.log(`Lobby ${lobbyCode} esiste e messaggio inviato agli altri utenti!`);
  } else {
    console.log(`Lobby ${lobbyCode} non esiste!`);
  }
});

socket.on('playerReady', (data) => {
  const lobbyCode = socket.lobbyCode;
  const ready = data.ready;
  const nickname = socket.nickname;

  if (lobbyCode && lobbies[lobbyCode]) {
    if (!lobbies[lobbyCode].playerReadyStatus) {
      lobbies[lobbyCode].playerReadyStatus = {};
    }

    lobbies[lobbyCode].playerReadyStatus[nickname] = ready;

    let readyPlayers = 0;
    for (const player in lobbies[lobbyCode].playerReadyStatus) {
      if (lobbies[lobbyCode].playerReadyStatus[player] === true) {
        readyPlayers++;
      }
    }

    const totalPlayers = lobbies[lobbyCode].users.length;

    io.to(lobbyCode).emit('gameStartUpdate', {
      readyPlayers: readyPlayers,
      totalPlayers: totalPlayers,
      message: `Giocatori pronti: ${readyPlayers}/${totalPlayers}`
    });

    console.log(`Giocatore ${nickname} è ${ready ? 'pronto' : 'non pronto'} nella lobby ${lobbyCode}. Totale: ${readyPlayers}/${totalPlayers}`);

    // Verifica se tutti i giocatori sono pronti
    if (readyPlayers === totalPlayers && totalPlayers >= 2) {
      io.to(lobbyCode).emit('gameStarted', { message: 'Il gioco sta per iniziare!' });
      console.log(`Il gioco è stato avviato per la lobby ${lobbyCode}`);
    }
  }
});



  // Gestione della disconnessione
  socket.on('disconnect', () => {
    const lobbyCode = socket.lobbyCode;
    const nickname = socket.nickname;
    if (lobbyCode && lobbies[lobbyCode]) {
      lobbies[lobbyCode].users = lobbies[lobbyCode].users.filter(user => user !== nickname);
      io.to(lobbyCode).emit('lobbyUsers', { users: lobbies[lobbyCode].users });
      console.log(`${nickname} si è disconnesso dalla lobby ${lobbyCode}`);
      if (lobbies[lobbyCode].users.length === 0) {
        delete lobbies[lobbyCode];
        console.log(`La lobby ${lobbyCode} è stata eliminata perché vuota`);
      }
    }
    console.log('Client disconnesso');
  });
});

server.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
