// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(express.static('public')); // Serve i file statici dalla cartella "public"

// Configuriamo Socket.io con CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Oggetto per tenere traccia delle lobby create
const lobbies = {};

// --- Quiz Arrays ---
// Array di percorsi delle immagini dei quiz (le immagini si trovano in public/assets)
const quizImages = [
  'http://localhost:3001/assets/quiz11.jpg',
  'http://localhost:3001/assets/quiz22.jpg',
  'http://localhost:3001/assets/quiz33.jpg',
  'http://localhost:3001/assets/quiz44.jpg',
  'http://localhost:3001/assets/quiz55.jpg',
  'http://localhost:3001/assets/quiz66.jpg',
  'http://localhost:3001/assets/quiz77.jpg',
  'http://localhost:3001/assets/quiz88.jpg',
];

// Array delle soluzioni per ciascun quiz (soluzioni di lunghezza e tipo variabili)
const quizSolutions = [
  '42',    // Soluzione per quiz1
  '5',  
  '18',  
  '30',  
  '24',
  'choices',
  '10',
  '21',
];

// Funzione per generare un codice univoco per la lobby
function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Funzione per ottenere un set di 3 quiz casuali
function getRandomQuizSet() {
  const quizIndices = [];
  while (quizIndices.length < 3 && quizIndices.length < quizImages.length) {
    const rand = Math.floor(Math.random() * quizImages.length);
    if (!quizIndices.includes(rand)) {
      quizIndices.push(rand);
    }
  }
  const quizSet = quizIndices.map(index => ({
    id: index,
    image: quizImages[index],
    solution: quizSolutions[index]
  }));
  return quizSet;
}


  //Funzioni per il puzzle
  // Funzione per generare il puzzle risolto (3x3)
  function generateSolvedBoard() {
    const board = [];
    let count = 1;
    for (let row = 0; row < 3; row++) {
      board[row] = [];
      for (let col = 0; col < 3; col++) {
        if (row === 2 && col === 2) {
          board[row][col] = 0; // 0 rappresenta lo spazio vuoto
        } else {
          board[row][col] = count++;
        }
      }
    }
    return board;
  }
  
  // Funzione per mischiare il puzzle eseguendo mosse valide
  function shuffleBoard(board, moves = 50) {
    let blankPos = { x: 2, y: 2 };
    for (let i = 0; i < moves; i++) {
      const possibleMoves = [];
      if (blankPos.y > 0) possibleMoves.push({ x: blankPos.x, y: blankPos.y - 1 });
      if (blankPos.y < 2) possibleMoves.push({ x: blankPos.x, y: blankPos.y + 1 });
      if (blankPos.x > 0) possibleMoves.push({ x: blankPos.x - 1, y: blankPos.y });
      if (blankPos.x < 2) possibleMoves.push({ x: blankPos.x + 1, y: blankPos.y });
      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      // Scambia lo spazio vuoto con il tassello scelto
      board[blankPos.y][blankPos.x] = board[move.y][move.x];
      board[move.y][move.x] = 0;
      blankPos = move;
    }
    return board;
  }

// --- Fine Quiz Arrays ---

function getlobbiesList() {
  const lobbyList = Object.values(lobbies).map((lobby, index) => {
  
    let isPublic;
    if (typeof lobby.visibility === 'string') {
      isPublic = lobby.visibility.toLowerCase() === 'public';
    } else {
      isPublic = Boolean(lobby.visibility);
    }

    return {
      name: lobby.name || `Lobby ${index + 1}`,
      lobbyCode: isPublic ? lobby.code : '',
      isPublic: isPublic,
      currentUsers: lobby.users.length,
      maxUsers: lobby.numPlayers
    };
  });

  return lobbyList;
}

app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('Nuovo client connesso');
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
      timer: data.timer,
      visibility: data.visibility
    };
    socket.lobbyCode = lobbyCode;
    socket.nickname = data.nickname;
    socket.join(lobbyCode);
    console.log(`${data.nickname} ha creato la lobby ${lobbyCode}`);
    
    socket.emit('lobbyCreated', { 
      lobbyCode, 
      nickname: data.nickname,
      users: lobbies[lobbyCode].users,
      difficulty: data.difficulty,
      numPlayers: data.numPlayers,
      timer: data.timer,
      visibility: data.visibility
    });
    
    io.to(lobbyCode).emit('lobbyUsers', { users: lobbies[lobbyCode].users });
  });
  
  socket.on('joinLobby', (data) => {
    // data: { nickname, lobbyCode }
    const lobbyCode = data.lobbyCode;
    if (lobbies[lobbyCode]) {
      if (lobbies[lobbyCode].users.length >= lobbies[lobbyCode].numPlayers) {
        socket.emit('capacity_error', { message: 'La lobby è piena' });
        return;
      }
      socket.lobbyCode = lobbyCode;
      socket.nickname = data.nickname;
      if (!lobbies[lobbyCode].users.includes(data.nickname)) {
        lobbies[lobbyCode].users.push(data.nickname);
        socket.join(lobbyCode);
        console.log(`${data.nickname} si è unito alla lobby ${lobbyCode}`);
        io.to(lobbyCode).emit('lobbyUsers', { users: lobbies[lobbyCode].users });
        socket.emit('lobbyJoined', { 
          lobbyCode, 
          nickname: data.nickname, 
          users: lobbies[lobbyCode].users,
          difficulty: lobbies[lobbyCode].difficulty,
          numPlayers: lobbies[lobbyCode].numPlayers,
          timer: lobbies[lobbyCode].timer,
          visibility: lobbies[lobbyCode].visibility
        });
      } else {
        console.log(`Nickname ${data.nickname} già presente nella lobby ${lobbyCode}`);
        socket.emit('errorName', { message: 'Nickname gia usato' });
      }
    } else {
      socket.emit('error', { message: 'Lobby non trovata' });
    }
  });

  socket.on('getLobbies', () => {
    
    const lobbyList = getlobbiesList();
  
    socket.emit('lobbiesList', lobbyList);
  });
  
  
  
  socket.on('lobbyChatMessage', (data) => {
    const { lobbyCode, nickname, message } = data;
    console.log(`Messaggio ricevuto nella lobby ${lobbyCode} da ${nickname}: ${message}`);
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
      const totalPlayers = lobbies[lobbyCode].numPlayers;
      io.to(lobbyCode).emit('gameStartUpdate', {
        readyPlayers: readyPlayers,
        totalPlayers: totalPlayers,
        message: `Giocatori pronti: ${readyPlayers}/${totalPlayers}`
      });
      console.log(`Giocatore ${nickname} è ${ready ? 'pronto' : 'non pronto'} nella lobby ${lobbyCode}. Totale: ${readyPlayers}/${totalPlayers}`);
      if (readyPlayers == totalPlayers ) {
        io.to(lobbyCode).emit('gameStarted', { message: 'Il gioco sta per iniziare!' });
        console.log(`Il gioco è stato avviato per la lobby ${lobbyCode}`);
          // Resetta lo stato di tutti i giocatori a non pronti
        for (const player in lobbies[lobbyCode].playerReadyStatus) {
          lobbies[lobbyCode].playerReadyStatus[player] = false;
        }
      }
    }
  });

  socket.on('gameStarted', (data) => {
    const lobbyCode = socket.lobbyCode;
    if (lobbyCode && lobbies[lobbyCode]) {
      console.log(`Il gioco è iniziato per la lobby ${lobbyCode}`);
      const lobby = lobbies[lobbyCode];
      const players = lobby.users;
      if (players.length === 0) return;
      
      // Seleziona un giocatore casuale per la Room2
      const randomIndex = Math.floor(Math.random() * players.length);
      const room2Players = [ players[randomIndex] ];
      // Tutti gli altri vanno in Room4
      const room4Players = players.filter((player, index) => index !== randomIndex);
      
      lobby.roomAssignments = {
        room2: room2Players,
        room4: room4Players
      };
  
      io.to(lobbyCode).emit('roomAssignment', {
        room2: room2Players,
        room4: room4Players
      });
  
      console.log(`Assegnazione: Room2 -> ${room2Players}, Room4 -> ${room4Players}`);
    }
  });
  

  // Evento per verificare la soluzione del quiz inviato da Room2.
  // Il client di Room2 invia { lobbyCode, area, code }
  // L'area corrisponde a: 1 → quizSet[0], 2 → quizSet[1], 3 → quizSet[2]

socket.on('verifyQuiz', (data, callback) => {
  const { lobbyCode, area, code } = data;
  if (lobbies[lobbyCode] && lobbies[lobbyCode].quizSet) {
    // Usare area come indice: area 1 corrisponde a quizSet[0], ecc.
    const index = area - 1;
    const quiz = lobbies[lobbyCode].quizSet[index];
    console.log(`Verifying quiz for area ${area} using quiz id ${quiz ? quiz.id : 'undefined'}`);
    if (quiz && quiz.solution && String(quiz.solution).toLowerCase().trim() === String(code).toLowerCase().trim()) {
      // Salviamo la soluzione verificata nella lobby
      if (!lobbies[lobbyCode].verifiedQuizSolutions) {
        lobbies[lobbyCode].verifiedQuizSolutions = {};
      }
      lobbies[lobbyCode].verifiedQuizSolutions[area] = code;
      // Se tutte e 3 le aree sono corrette, invia l'evento "gameWon"
      if (Object.keys(lobbies[lobbyCode].verifiedQuizSolutions).length === 3) {
        io.to(lobbyCode).emit('gameWon', { message: 'Congratulations. You won the game' });
        console.log(`Game won for lobby ${lobbyCode}`);
      }
      callback({ success: true });
    } else {
      callback({ success: false });
    }
  } else {
    callback({ success: false, message: 'Quiz set not found in lobby' });
  }
});


  // Evento per la richiesta del quiz set per Room4.
  // Genera un set di 3 quiz casuali e lo salva nella lobby per verifica successiva.
  socket.on('requestQuizSet', (data) => {
    const { lobbyCode } = data;
   /* const quizIndices = [];
    while (quizIndices.length < 3 && quizIndices.length < quizImages.length) {
      const rand = Math.floor(Math.random() * quizImages.length);
      if (!quizIndices.includes(rand)) {
        quizIndices.push(rand);
      }
    }
    const quizSet = quizIndices.map(index => ({
      id: index,
      image: quizImages[index],
      solution: quizSolutions[index]
    }));*/

    const quizSet = getRandomQuizSet();
    if (lobbies[lobbyCode]) {
      lobbies[lobbyCode].quizSet = quizSet;
      console.log(`Quiz set saved for lobby ${lobbyCode}:`, quizSet);
    }
    socket.emit('quizSet', quizSet);
  });

  socket.on('enterRoom', (data) => {
    console.log('Evento enterRoom ricevuto:', data);
    // Eventuali logiche aggiuntive per il passaggio tra stanze
  });

  socket.on('GameLost', (data) => {
    const { lobbyCode } = data;
    if (lobbyCode && lobbies[lobbyCode]) {

      // Imposta tutti i giocatori come non pronti, se la proprietà playerReadyStatus esiste
    if (lobbies[lobbyCode].playerReadyStatus) {
      for (const player in lobbies[lobbyCode].playerReadyStatus) {
        lobbies[lobbyCode].playerReadyStatus[player] = false;
      }
    }

      // Invia i dati della lobby a tutti i membri
      io.to(lobbyCode).emit('lobbyData', lobbies[lobbyCode]);
      console.log(`GameLost processed: sent lobby data for lobby ${lobbyCode}`);
    } else {
      console.log(`GameLost received but lobby ${lobbyCode} not found.`);
    }
  });


  socket.on('initPuzzle', (data) => {
    const { lobbyCode } = data;
    // Se nella lobby non esiste ancora la board, creala
    if (!lobbies[lobbyCode].boardState) {
      let boardState = generateSolvedBoard();
      boardState = shuffleBoard(boardState);
      lobbies[lobbyCode].boardState = boardState;
    }
    // Invia lo stato del puzzle a tutti i membri della lobby
    io.to(lobbyCode).emit("initGame", lobbies[lobbyCode].boardState);
  });

  socket.on("tileMoved", (data) => {
    const { lobbyCode } = data;
    // Aggiorna la board centralizzata per la lobby
    lobbies[lobbyCode].boardState[data.oldGridY][data.oldGridX] = lobbies[lobbyCode].boardState[data.newGridY][data.newGridX];
    lobbies[lobbyCode].boardState[data.newGridY][data.newGridX] = data.tileNumber;
    
    // Inoltra la mossa a tutti i client della stessa lobby
    socket.broadcast.to(lobbyCode).emit("tileMoved", data);
  });


  

socket.on("puzzleSolved", (data) => {
  const { lobbyCode, message } = data;
  // Inoltra l'evento a tutti gli utenti della lobby
  io.to(lobbyCode).emit("puzzleVictory", { message });
  console.log(`Puzzle solved in lobby ${lobbyCode}: ${message}`);
});


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
