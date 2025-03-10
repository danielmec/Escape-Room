// server/server.js
const { log } = require('console');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

//
// Classe che rappresenta un utente connesso
//
class User {
  constructor(socket, nickname) {
    this.socket = socket;
    this.nickname = nickname;
    this.lobbyCode = null;
  }
  
  joinLobby(lobby) {
    this.lobbyCode = lobby.code;
    // Associa il codice e il nickname anche al socket
    this.socket.lobbyCode = lobby.code;
    this.socket.nickname = this.nickname;
    lobby.addUser(this);
    this.socket.join(lobby.code);
  }
  
  send(event, data) {
    this.socket.emit(event, data);
  }
}

//
// Classe per rappresentare un singolo Quiz
//
class Quiz {
  constructor(id, image, solution) {
    this.id = id;
    this.image = image;
    this.solution = solution;
  }
  
  // Metodo per verificare la soluzione inserita
  checkSolution(input) {
    return String(this.solution).toLowerCase().trim() === String(input).toLowerCase().trim();
  }
}

//
// Classe per gestire il Puzzle (es. gioco dello sliding 3x3)
//
class Puzzle {
  constructor(moves = 50) {
    this.boardState = Puzzle.generateSolvedBoard();
    this.shuffle(moves);
  }
  
  // Crea il board risolto
  static generateSolvedBoard() {
    const board = [];
    let count = 1;
    for (let row = 0; row < 3; row++) {
      board[row] = [];
      for (let col = 0; col < 3; col++) {
        board[row][col] = (row === 2 && col === 2) ? 0 : count++;
      }
    }
    return board;
  }
  
  // Mischia il board effettuando un certo numero di mosse valide
  shuffle(moves = 50) {
    let blankPos = { x: 2, y: 2 };
    for (let i = 0; i < moves; i++) {
      const possibleMoves = [];
      if (blankPos.y > 0) possibleMoves.push({ x: blankPos.x, y: blankPos.y - 1 });
      if (blankPos.y < 2) possibleMoves.push({ x: blankPos.x, y: blankPos.y + 1 });
      if (blankPos.x > 0) possibleMoves.push({ x: blankPos.x - 1, y: blankPos.y });
      if (blankPos.x < 2) possibleMoves.push({ x: blankPos.x + 1, y: blankPos.y });
      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      this.boardState[blankPos.y][blankPos.x] = this.boardState[move.y][move.x];
      this.boardState[move.y][move.x] = 0;
      blankPos = move;
    }
  }
}

//
// Classe che gestisce la logica di una partita (match) in una lobby
//
class Game {
  constructor(lobby) {
    this.lobby = lobby;            // Riferimento alla lobby che ospita la partita
    this.readyStatus = {};         // Stato "ready" per ogni giocatore
    this.quizSet = null;           // Array di istanze Quiz
    this.verifiedQuizSolutions = {}; 
    this.puzzle = null;            // Istanza di Puzzle
    this.roomAssignments = null;
  }
  
  updatePlayerReady(nickname, ready) {
    this.readyStatus[nickname] = ready;
    const readyPlayers = Object.values(this.readyStatus).filter(val => val === true).length;
    this.lobby.broadcast('gameStartUpdate', {
      readyPlayers: readyPlayers,
      totalPlayers: this.lobby.numPlayers,
      message: `Giocatori pronti: ${readyPlayers}/${this.lobby.numPlayers}`
    });
    log(`Giocatori pronti: ${readyPlayers}/${this.lobby.numPlayers}`);
    if (readyPlayers == this.lobby.numPlayers) {
      // Reset ready status
      Object.keys(this.readyStatus).forEach(key => {
        this.readyStatus[key] = false;
      });
      this.lobby.broadcast('gameStarted', { message: 'Il gioco sta per iniziare!' });
      this.assignRooms();
    }
  }
  
  assignRooms() {
    const users = this.lobby.users;
    if (users.length === 0) return;
    const randomIndex = Math.floor(Math.random() * users.length);
    const room2Players = [users[randomIndex].nickname];
    const room4Players = users.filter((u, i) => i !== randomIndex).map(u => u.nickname);
    this.roomAssignments = { room2: room2Players, room4: room4Players };
    this.lobby.broadcast('roomAssignment', this.roomAssignments);
  }
  
  verifyQuiz(area, code, callback) {
    // area 1 → quizSet[0], 2 → quizSet[1], etc.
    const index = area - 1;
    const quiz = this.quizSet ? this.quizSet[index] : null;
    if (quiz && quiz.checkSolution(code)) {
      this.verifiedQuizSolutions[area] = code;
      if (Object.keys(this.verifiedQuizSolutions).length === 3) {
        this.lobby.broadcast('gameWon', { 
          message: 'Congratulations. You won the game',
          users: this.lobby.users.map(u => u.nickname),
          timer: this.lobby.timer  // Timer salvato della lobby
        });
      }
      callback({ success: true });
    } else {
      callback({ success: false });
    }
  }
  
  setQuizSet(quizSet) {
    this.quizSet = quizSet;
  }
  
  initPuzzle() {
    if (!this.puzzle) {
      this.puzzle = new Puzzle();
    }
    this.lobby.broadcast("initGame", this.puzzle.boardState);
  }
}

//
// Classe che rappresenta una lobby e la logica di gioco ad essa associata
//
class Lobby {
  constructor({ code, name, difficulty, numPlayers, timer, visibility }) {
    this.code = code;
    this.name = name || `Lobby ${code}`;
    this.difficulty = difficulty;
    this.numPlayers = numPlayers;
    this.timer = timer;
    this.visibility = visibility;
    this.users = []; // Array di istanze User
    // Stato di gioco specifico, ora gestito dalla classe Game
    this.game = new Game(this);
  }
  
  addUser(user) {
    if (this.users.length >= this.numPlayers) {
      user.send('capacity_error', { message: 'La lobby è piena' });
      return false;
    }
    if (this.users.find(u => u.nickname === user.nickname)) {
      user.send('errorName', { message: 'Nickname già usato' });
      return false;
    }
    this.users.push(user);
    this.broadcast('lobbyUsers', { users: this.users.map(u => u.nickname) });
    return true;
  }
  
  removeUser(user) {
    this.users = this.users.filter(u => u.nickname !== user.nickname);
    this.broadcast('lobbyUsers', { users: this.users.map(u => u.nickname) });
  }
  
  broadcast(event, data) {
    // Invia l'evento a tutti gli utenti della lobby
    this.users.forEach(user => user.socket.emit(event, data));
  }
}

//
// Classe manager che gestisce il server e i vari handler
//
class ServerManager {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });
    this.PORT = process.env.PORT || 3001;
    this.lobbies = {}; // Map: codeLobby -> istance of Lobby

    // Quiz data array: each element contains an image and its corresponding solution
    const baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
    this.quizData = [
        { image: `${baseURL}/assets/quiz11.jpg`, solution: '42' },
        { image: `${baseURL}/assets/quiz22.jpg`, solution: '5' },
        { image: `${baseURL}/assets/quiz33.jpg`, solution: '18' },
        { image: `${baseURL}/assets/quiz44.jpg`, solution: '30' },
        { image: `${baseURL}/assets/quiz55.jpg`, solution: '24' },
        { image: `${baseURL}/assets/quiz66.jpg`, solution: 'choices' },
        { image: `${baseURL}/assets/quiz77.jpg`, solution: '10' },
        { image: `${baseURL}/assets/quiz88.jpg`, solution: '21' }
      ];
      
    // Create an array of Quiz instances from the quizData array
    this.quizzes = this.createQuizInstances();

    this.setupRoutes();
    this.setupSocket();
  }

   // Create Quiz instances from the provided data
   createQuizInstances() {
    return this.quizData.map((data, index) => new Quiz(index, data.image, data.solution));
  }
  
  setupRoutes() {
    this.app.use(express.static('public'));
    this.app.get('/', (req, res) => res.send('Server is running'));
  }
  
  setupSocket() {
    this.io.on('connection', (socket) => {
      console.log('Nuovo client connesso');
      socket.emit('welcomeMessage', { message: "Welcome to the Escape Room Server!" });
      
      // Creazione della lobby
      socket.on('createLobby', (data) => {
        const lobbyCode = ServerManager.generateLobbyCode();
        const lobby = new Lobby({
          code: lobbyCode,
          name: `Lobby ${lobbyCode}`,
          difficulty: data.difficulty,
          numPlayers: data.numPlayers,
          timer: data.timer,
          visibility: data.visibility
        });
        this.lobbies[lobbyCode] = lobby;
        
        // Imposta le proprietà sul socket
        socket.lobbyCode = lobbyCode;
        socket.nickname = data.nickname;
        
        const user = new User(socket, data.nickname);
        user.joinLobby(lobby);
        
        socket.emit('lobbyCreated', {
          lobbyCode,
          nickname: data.nickname,
          users: lobby.users.map(u => u.nickname),
          difficulty: data.difficulty,
          numPlayers: data.numPlayers,
          timer: data.timer,
          visibility: data.visibility
        });
      });
      
      // Unione a una lobby esistente
      socket.on('joinLobby', (data) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby) {
          // Imposta le proprietà sul socket
          socket.lobbyCode = data.lobbyCode;
          socket.nickname = data.nickname;
          
          const user = new User(socket, data.nickname);
          user.joinLobby(lobby);
          
          socket.emit('lobbyJoined', {
            lobbyCode: lobby.code,
            nickname: data.nickname,
            users: lobby.users.map(u => u.nickname),
            difficulty: lobby.difficulty,
            numPlayers: lobby.numPlayers,
            timer: lobby.timer,
            visibility: lobby.visibility
          });
          
        } else {
          socket.emit('error', { message: 'Lobby not found' });
        }
      });
      
      socket.on('getLobbies', () => {
        const lobbyList = Object.values(this.lobbies).map((lobby, index) => {
          let isPublic = typeof lobby.visibility === 'string'
            ? lobby.visibility.toLowerCase() === 'public'
            : Boolean(lobby.visibility);
          return {
            name: `Lobby ${index + 1}`,
            lobbyCode: isPublic ? lobby.code : '',
            isPublic: isPublic,
            currentUsers: lobby.users.length,
            maxUsers: lobby.numPlayers
          };
        });
        socket.emit('lobbiesList', lobbyList);
      });
      
      socket.on('lobbyChatMessage', (data) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby) {
          lobby.broadcast('lobbyChatMessage', { nickname: data.nickname, message: data.message });
        }
      });
      
      // Gestione del ready tramite la classe Game
      socket.on('playerReady', (data) => {
        const lobbyCode = socket.lobbyCode;
        const ready = data.ready;
        const nickname = socket.nickname;
        if (lobbyCode && this.lobbies[lobbyCode]) {
          const lobby = this.lobbies[lobbyCode];
          lobby.game.updatePlayerReady(nickname, ready);
        }
      });
      
      socket.on('gameStarted', () => {
        const lobby = this.lobbies[socket.lobbyCode];
        if (lobby) {
          lobby.game.assignRooms();
        }
      });
      
      socket.on('verifyQuiz', (data, callback) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby) {
          lobby.game.verifyQuiz(data.area, data.code, callback);
        } else {
          callback({ success: false, message: 'Quiz set not found in lobby' });
        }
      });
      
      socket.on('requestQuizSet', (data) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby) {
          // Se il quizSet non è ancora stato impostato, lo creiamo
          if (!lobby.game.quizSet) {
            const quizSet = this.getRandomQuizSet();
            lobby.game.setQuizSet(quizSet);
          }
          // Invia il quizSet già presente a tutti i client della lobby
          socket.emit('quizSet', lobby.game.quizSet);
        }
      });
      
      
      socket.on('initPuzzle', (data) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby) {
          lobby.game.initPuzzle();
        }
      });
      
      socket.on("tileMoved", (data) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby && lobby.game && lobby.game.puzzle) {
          lobby.game.puzzle.boardState[data.oldGridY][data.oldGridX] = lobby.game.puzzle.boardState[data.newGridY][data.newGridX];
          lobby.game.puzzle.boardState[data.newGridY][data.newGridX] = data.tileNumber;
          socket.broadcast.to(data.lobbyCode).emit("tileMoved", data);
        }
      });
      
      socket.on("puzzleSolved", (data) => {
        const lobby = this.lobbies[data.lobbyCode];
        if (lobby) {
          lobby.broadcast("puzzleVictory", { message: data.message });
        }
      });

      // Quando l'utente decide di lasciare la lobby (ad esempio, cambiando pagina)
      socket.on('leaveLobby', () => {
        const lobbyCode = socket.lobbyCode;
        if (lobbyCode && this.lobbies[lobbyCode]) {
          const lobby = this.lobbies[lobbyCode];
          lobby.removeUser({ nickname: socket.nickname });
          socket.leave(lobbyCode);
          // Se la lobby non ha più utenti, la rimuoviamo
          if (lobby.users.length === 0) {
            delete this.lobbies[lobbyCode];
          }
          // Aggiorniamo la lista delle lobby per tutti i client
          this.io.emit('lobbiesList', Object.values(this.lobbies).map((lobby, index) => {
            let isPublic = typeof lobby.visibility === 'string'
              ? lobby.visibility.toLowerCase() === 'public'
              : Boolean(lobby.visibility);
            return {
              name: `Lobby ${index + 1}`,
              lobbyCode: isPublic ? lobby.code : '',
              isPublic: isPublic,
              currentUsers: lobby.users.length,
              maxUsers: lobby.numPlayers
            };
          }));
        }
      });
      
      socket.on('disconnect', () => {
        const lobbyCode = socket.lobbyCode;
        if (lobbyCode && this.lobbies[lobbyCode]) {
          const lobby = this.lobbies[lobbyCode];
          lobby.removeUser({ nickname: socket.nickname });
          socket.leave(lobbyCode);
          if (lobby.users.length === 0) {
            delete this.lobbies[lobbyCode];
          }
          // Aggiorna la lista delle lobby per tutti i client
          this.io.emit('lobbiesList', Object.values(this.lobbies).map((lobby, index) => {
            let isPublic = typeof lobby.visibility === 'string'
              ? lobby.visibility.toLowerCase() === 'public'
              : Boolean(lobby.visibility);
            return {
              name: `Lobby ${index + 1}`,
              lobbyCode: isPublic ? lobby.code : '',
              isPublic: isPublic,
              currentUsers: lobby.users.length,
              maxUsers: lobby.numPlayers
            };
          }));

          // Controlla se in game è stato assegnato il roomAssignment
          if (lobby.game && lobby.game.roomAssignments && 
            lobby.game.roomAssignments.room2 && 
            lobby.game.roomAssignments.room2.includes(socket.nickname)) {
                
            lobby.broadcast('InsufficientPlayers', { 
                message: 'Not enough players in room2' ,
                users: lobby.users.map(u => u.nickname)
            });
          }
          // Rimozione del socket.nickname da room4, se presente
          if (
            lobby.game &&
            lobby.game.roomAssignments &&
            lobby.game.roomAssignments.room4
          ) {
            lobby.game.roomAssignments.room4 = lobby.game.roomAssignments.room4.filter(
              user => user !== socket.nickname
            );

            // Se, dopo la rimozione, nella room4 rimane solo un giocatore (o nessuno)
            if (lobby.game.roomAssignments.room4.length < 1) {
              lobby.broadcast('InsufficientPlayers', {
                message: 'Not enough players in room4',
                users: lobby.users.map(u => u.nickname)
              });
            }
          }
        }
      });
    });
  }
  
  static generateLobbyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
 // Randomly select 3 Quiz instances from the pre-created quizzes array
 getRandomQuizSet() {
    const quizIndices = [];
    while (quizIndices.length < 3 && quizIndices.length < this.quizzes.length) {
      const rand = Math.floor(Math.random() * this.quizzes.length);
      if (!quizIndices.includes(rand)) {
        quizIndices.push(rand);
      }
    }
    return quizIndices.map(index => this.quizzes[index]);
  }
  
  listen() {
    this.server.listen(this.PORT, () => {
      console.log(`Server in ascolto sulla porta ${this.PORT}`);
    });
  }
}

//
// Avvio del server
//
const manager = new ServerManager();
manager.listen();
