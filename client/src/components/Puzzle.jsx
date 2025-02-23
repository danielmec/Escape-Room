import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";
import Chat from "./Chat";
import "./Puzzle.css"; // Assicurati che questo file contenga anche la regola per .puzzle-center
import EightPuzzleGame from "./8Multiplayer";

const Puzzle = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Recupera i dati passati tramite lo state
  const {
    lobbyCode,
    nickname: initialNickname,
    difficulty,
    numPlayers,
    timer: initialTimerInMinutes,
    quizSet,
    roomAssignment,
  } = location.state || {};

  // Stato per la chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Se viene passato remainingTime, lo usiamo, altrimenti calcoliamo dal timer iniziale
  const [remainingTime, setRemainingTime] = useState(
    location.state.remainingTime !== undefined
      ? location.state.remainingTime
      : initialTimerInMinutes * 60
  );
  const [timeUpModalVisible, setTimeUpModalVisible] = useState(false);
  const [puzzleVictory, setPuzzleVictory] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (remainingTime > 0) {
      const intervalId = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalId);
    } else if (remainingTime === 0) {
      setTimeUpModalVisible(true);
      socket.emit("GameLost", { lobbyCode });
      const timeoutId = setTimeout(() => {
        navigate("/lobby", { state: { lobbyCode } });
      }, 7000);
      return () => clearTimeout(timeoutId);
    }
  }, [remainingTime, lobbyCode, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Gestione della chat
  useEffect(() => {
    socket.on("lobbyChatMessage", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });
    return () => {
      socket.off("lobbyChatMessage");
    };
  }, []);


  useEffect(() => {
    socket.on("puzzleVictory", (data) => {
      setPuzzleVictory(true);
    });
  }, []);

  // Funzione per tornare indietro
  const handleGoBack = () => {
    navigate("/game", {
      state: {
        lobbyCode,
        nickname: initialNickname,
        difficulty,
        numPlayers,
        remainingTime,
        quizSet,
        roomAssignment,
        currentRoom: "room4",
      },
    });
  };

  return (
    <div className="puzzle-container">
      <div className="puzzle-board-section">
        <div className="puzzle-game-board">
          {/* Wrapper per centrare il puzzle */}
          <div className="puzzle-center">
          <EightPuzzleGame lobbyCode={lobbyCode}  />
          </div>
          <div className="timer-display">{formatTime(remainingTime)}</div>
          <div className="puzzle-arrow" onClick={handleGoBack}>
            <span className="arrow-icon">↓</span>
            <span>Back to Game</span>
          </div>
        </div>
      </div>
      <div className="puzzle-chat-section">
    <Chat lobbyCode={lobbyCode} initialNickname={initialNickname} />
      </div>
      {timeUpModalVisible && (
        <div className="game-welcome-modal">
          <div className="game-welcome-content">
            <p>Time's up! You will be redirected to the lobby.</p>
          </div>
        </div>
      )}
      {puzzleVictory && (
    <div className="game-welcome-modal">
      <div className="game-welcome-content">
        <p>Puzzle Completed!</p>
        <p>Now find the solutions of the quizzes!</p>
        <button onClick={() => setPuzzleVictory(false)}>OK</button>
      </div>
    </div>
  )}
    </div>
  );
};

export default Puzzle;
