// client/src/components/Game.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Game.css';
import socket from '../socket';
import Chat from './Chat';
import room1Image from '../assets/room11.jpg';
import room2Image from '../assets/room22.jpg';
import room4Image from '../assets/room44.jpg';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    lobbyCode,
    difficulty,
    numPlayers,
    timer: initialTimerInMinutes ,
    users: initialUsers = [],
    nickname: initialNickname = '',
    currentRoom: initialCurrentRoom = 'room1',
    remainingTime,
    quizSet: initialQuizSet,
    roomAssignment: initialRoomAssignment
  } = location.state || {};

  // Timer (in secondi)
  const [timer, setTimer] =  useState(
    remainingTime !== undefined ? remainingTime : initialTimerInMinutes * 60
  );

  // Modal di benvenuto (Room1)
  const [showWelcome, setShowWelcome] = useState(initialCurrentRoom === 'room1');
  // Modal di istruzioni (appare dopo il click sulla porta)
  const [showInstructions, setShowInstructions] = useState(false);
  // Hover sulla porta
  const [hoverDoor, setHoverDoor] = useState(false);
  // Stanza corrente: "room1", "room2" o "room4"
  const [currentRoom, setCurrentRoom] = useState(initialCurrentRoom);
  // Assegnazione ricevuta dal server
  const [roomAssignment, setRoomAssignment] = useState(null);

  // Per Room2: Modal per inserire la solution (safe PIN)
  const [solutionModalVisible, setSolutionModalVisible] = useState(false);
  const [activeArea, setActiveArea] = useState(null);
  const [inputSolution, setInputSolution] = useState("");
  const [correctSolutions, setCorrectSolutions] = useState({});

  // Per Room4: Modal per visualizzare il quiz (solo immagine)
  const [quizSet, setQuizSet] = useState(initialQuizSet || []); // Array di 3 quiz: { id, image, solution }
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);

  const [winModalVisible, setWinModalVisible] = useState(false);
  const [winMessage, setWinMessage] = useState("");

  const [timeUpModalVisible, setTimeUpModalVisible] = useState(false);

  const [insufficientPlayersVisible, setInsufficientPlayersVisible] = useState(false);
  
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [showPuzzleWarning, setShowPuzzleWarning] = useState(false);


  // Ascolto roomAssignment
  useEffect(() => {
    socket.on('roomAssignment', (data) => {
      console.log('Room assignment received:', data);
      setRoomAssignment(data);
    });
    return () => {
      socket.off('roomAssignment');
    };
  }, []);

  // Quando currentRoom diventa "room4", richiede il quiz set
  useEffect(() => {
    if (currentRoom === 'room4' && quizSet.length === 0) {
      console.log('Requesting quiz set for room4');
      socket.emit('requestQuizSet', { lobbyCode });
    }
  }, [currentRoom, lobbyCode, quizSet]);

  // Ascolto quizSet dal server
  useEffect(() => {
    socket.on('quizSet', (data) => {
      //console.log('Quiz set received:', data);
      setQuizSet(data);
    });
    return () => {
      socket.off('quizSet');
    };
  }, []);

  useEffect(() => {
    socket.on('puzzleVictory', () => {
      console.log('ok-puzzle event received');
      setPuzzleCompleted(true);
    });
    return () => {
      socket.off('puzzleVictory');
    };
  }, []);

// Ascolto dell'evento "gameWon" dal server:
useEffect(() => {
  socket.on('gameWon', (data) => {
    console.log('Game won event received:', data);
    setWinMessage(data.message);
    setWinModalVisible(true);
    setTimeout(() => {
      navigate('/lobby', { 
        state: { 
          lobbyCode, 
          nickname: initialNickname, 
          users: data.users,      // Usa la lista degli utenti ricevuta dal server
          difficulty, 
          numPlayers, 
          timer: data.timer       // Usa il timer ricevuto dal server
        } 
      });
    }, 7000);
  });
  return () => {
    socket.off('gameWon');
  };
}, [navigate, lobbyCode, initialNickname, difficulty, numPlayers]);

// Ascolto dell'evento "InsufficientPlayers" dal server:
useEffect(() => {
  socket.on('InsufficientPlayers', (data) => {
    console.log('InsufficientPlayers event received:', data);
    setInsufficientPlayersVisible(true);
    setTimeout(() => {
      navigate('/lobby', { 
        state: { 
          lobbyCode, 
          nickname: initialNickname, 
          users: data.users, 
          difficulty, 
          numPlayers, 
          timer: initialTimerInMinutes 
        } 
      });
    }, 5000);
  });
  return () => {
    socket.off('InsufficientPlayers');
  };
}, [navigate, lobbyCode, initialNickname, initialUsers, difficulty, numPlayers, initialTimerInMinutes]);




  // Timer decrementa ogni secondo
 useEffect(() => {
  if (timer > 0) {
    const intervalId = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  } else if (timer === 0) {
    setTimeUpModalVisible(true);
    setTimeout(() => {
      navigate('/lobby', { state: { lobbyCode, nickname: initialNickname, users: initialUsers, difficulty, numPlayers, timer: initialTimerInMinutes } });
    }, 8000); // Reindirizza alla lobby dopo 5 secondi
  }
}, [timer, navigate, lobbyCode, initialNickname]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Chiusura modal di benvenuto
  const handleContinue = () => {
    console.log('handleContinue: closing welcome modal');
    setShowWelcome(false);
  };

  // Click sulla porta in Room1: controlla assegnazione e imposta la stanza corrente
  const handleDoorClick = () => {
    console.log('handleDoorClick triggered');
    if (roomAssignment) {
      let nextRoom;
      if (roomAssignment.room2 && roomAssignment.room2.includes(initialNickname)) {
        console.log(`${initialNickname} is assigned to room2`);
        nextRoom = 'room2';
      } else if (roomAssignment.room4 && roomAssignment.room4.includes(initialNickname)) {
        console.log(`${initialNickname} is assigned to room4`);
        nextRoom = 'room4';
      } else {
        console.warn('Nickname not assigned to any room:', initialNickname);
        return;
      }
      setCurrentRoom(nextRoom);
      socket.emit('enterRoom', { lobbyCode, nickname: initialNickname, nextRoom });
      console.log('enterRoom event emitted with nextRoom:', nextRoom);
      setShowInstructions(true);
    } else {
      console.warn('No roomAssignment received');
    }
  };

  // Seleziona l'immagine della stanza in base a currentRoom
  const getRoomImage = () => {
    if (currentRoom === 'room1') return room1Image;
    if (currentRoom === 'room2') return room2Image;
    if (currentRoom === 'room4') return room4Image;
    return room1Image;
  };

  // Chiusura modal di istruzioni
  const handleInstructionsClose = () => {
    console.log('handleInstructionsClose: closing instructions modal');
    setShowInstructions(false);
  };

  // ROOM2: Click su area per inserire la solution.
  // La mappatura è: area 1 verifica il quiz in posizione 0, area 2 -> posizione 1, area 3 -> posizione 2.
  const handleAreaClick = (areaIndex) => {
    console.log(`handleAreaClick: area ${areaIndex} clicked`);
    if (puzzleCompleted) {
      setActiveArea(areaIndex);
      setSolutionModalVisible(true);
    } else {
      setShowPuzzleWarning(true);
    }
  };

  // ROOM2: Invia la solution al server per verifica.
  // Nota: il client in Room2 non ha il quizSet; il server usa il quizSet salvato nella lobby per la verifica.
  const handleSolutionSubmit = (e) => {
    e.preventDefault();
    console.log(`handleSolutionSubmit: submitted solution "${inputSolution}" for area ${activeArea}`);
    socket.emit('verifyQuiz', { lobbyCode, area: activeArea, code: inputSolution }, (response) => {
      console.log('verifyQuiz response:', response);
      if (response.success) {
        setCorrectSolutions(prev => ({ ...prev, [activeArea]: inputSolution }));
        alert(`Solution for area ${activeArea} correct!`);
      } else {
        alert("Solution incorrect, please try again.");
      }
      setSolutionModalVisible(false);
      setInputSolution("");
      setActiveArea(null);
    });
  };

  // ROOM4: Click su area quiz per visualizzare il quiz (solo immagine)
  const handleQuizAreaClick = (index) => {
    console.log(`handleQuizAreaClick: area ${index} clicked`);
    if (quizSet.length > index && quizSet[index]) {
      setActiveQuiz(quizSet[index]);
      setQuizModalVisible(true);
    } else {
      console.warn(`No quiz found for area ${index}`);
    }
  };

  const handleQuizModalClose = () => {
    console.log('handleQuizModalClose: closing quiz modal');
    setQuizModalVisible(false);
    setActiveQuiz(null);
  };

  const handlePuzzleClick = () => {
    navigate('/puzzle', {
       state: { 
       lobbyCode,
       nickname: initialNickname,
       difficulty, 
       numPlayers,
       remainingTime: timer,
       quizSet,
       roomAssignment, 
       currentRoom: 'room4'
      }
     });
  };

  return (
    <div className="game-container">
      <div className="game-board">
        <img 
          src={getRoomImage()} 
          alt="Stanza del livello" 
          className="game-background"
        />
        <div className="game-timer">
          {timer > 0 ? formatTime(timer) : 'Time up!'}
        </div>

        {/* Modal di benvenuto (Room1) */}
        {showWelcome && (
          <div className="game-welcome-modal">
            <div className="game-welcome-content">
              <p>Welcome!</p>
              <p>To continue the game, enter the room.</p>
              <button onClick={handleContinue}>OK</button>
            </div>
          </div>
        )}

        {/* Area interattiva per la porta in Room1 */}
        {(!showWelcome && currentRoom === 'room1') && (
          <div 
            className="game-door"
            onMouseEnter={() => { setHoverDoor(true); console.log('Door hover on'); }}
            onMouseLeave={() => { setHoverDoor(false); console.log('Door hover off'); }}
            onClick={handleDoorClick}
          >
            {hoverDoor && <span className="game-door-tooltip">Enter</span>}
          </div>
        )}

        {/* Modal di istruzioni */}
        {showInstructions && (
          <div className="game-welcome-modal">
            <div className="game-welcome-content">
              {currentRoom === 'room2' ? (
                <>
                  <p>This is a cooperative game.</p>
                  <p>Find the 3 solutions to open the safe and go to the next level.</p>
                </>
              ) : (
                <p>In Room4, view each quiz image and share the code via chat.</p>
              )}
              <button onClick={handleInstructionsClose}>OK</button>
            </div>
          </div>
        )}

        {/* Modal per insufficient players */}
        {insufficientPlayersVisible && (
          <div className="game-welcome-modal">
            <div className="game-welcome-content">
              <p>Insufficient players</p>
              <p>The game cannot continue due to missing players.</p>
              <p>Redirecting to the lobby...</p>
            </div>
          </div>
        )}

        {winModalVisible && (
          <div className="game-welcome-modal">
            <div className="game-welcome-content">
              <p>{winMessage}</p>
              <button onClick={() => setWinModalVisible(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Modal di tempo scaduto */}
      {timeUpModalVisible && (
        <div className="game-welcome-modal">
          <div className="game-welcome-content">
            <p>Time's up!</p>
            <p>You have lost the game.</p>
            <p>Redirecting to the lobby...</p>
          </div>
        </div>
      )}

    {showPuzzleWarning && (
      <div className="game-welcome-modal">
        <div className="game-welcome-content">
          <p>Complete the puzzle in the other room first</p>
          <button onClick={() => setShowPuzzleWarning(false)}>OK</button>
        </div>
      </div>
    )}

        {/* In Room2: Aree interattive per inserire le soluzioni (safe PIN areas) */}
        {(!showWelcome && currentRoom === 'room2' && !showInstructions) && (
          <div className="safe-pin-container">
            <div className="pin-area" onClick={() => handleAreaClick(1)}></div>
            <div className="pin-area" onClick={() => handleAreaClick(2)}></div>
            <div className="pin-area" onClick={() => handleAreaClick(3)}></div>
          </div>
        )}

        {/* In Room4: Aree interattive per visualizzare i quiz */}
        {(!showWelcome && currentRoom === 'room4' && !showInstructions) && (
        <>
          <div className="quiz-pin-container">
            {quizSet.length > 0
              ? quizSet.map((quiz, index) => (
                  <div key={index} className="quiz-pin-area" onClick={() => handleQuizAreaClick(index)}>
                    {/* Area trasparente per il quiz */}
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div key={i} className="quiz-pin-area" onClick={() => handleQuizAreaClick(i)}></div>
                ))
            }
          </div>
          <div className="puzzle-pin-area" onClick={handlePuzzleClick}>
            {/* Area trasparente per il puzzle */}
          </div>
        </>
        )}

        {/* Modal per l'inserimento della solution in Room2 */}
        {solutionModalVisible && (
          <div className="code-modal">
            <div className="code-modal-content">
              <p>Insert the solution</p>
              <form onSubmit={handleSolutionSubmit}>
                <input 
                  type="text" 
                  value={inputSolution} 
                  onChange={(e) => { setInputSolution(e.target.value); console.log('Input solution:', e.target.value); }} 
                  placeholder="Type your solution"
                />
                <button type="submit" onClick={() => console.log('Solution submitted')}>Check</button>
              </form>
              <button onClick={() => { setSolutionModalVisible(false); console.log('Solution modal cancelled'); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Modal per il quiz in Room4: visualizza solo l'immagine */}
        {quizModalVisible && currentRoom === 'room4' && (
          <div className="code-modal">
            <div className="code-modal-content">
              {activeQuiz && (
                <>
                  <p>Quiz</p>
                  <img src={activeQuiz.image} alt={`Quiz ${activeQuiz.id}`} style={{ width: '100%', marginBottom: '10px' }} />
                </>
              )}
              <button onClick={handleQuizModalClose}>Close</button>
            </div>
          </div>
        )}
      </div>

      <Chat lobbyCode={lobbyCode} initialNickname={initialNickname} />
    
    </div>
  );
};

export default Game;
