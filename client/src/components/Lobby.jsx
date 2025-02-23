// client/src/components/Lobby.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import './Lobby.css';
import socket from '../socket';
import bongsong from '../assets/count.mp3';

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Corretto: useNavigate restituisce una funzione

  // 1) Crea un ref
  const chatLogRef = useRef(null);

  // Estrai i dati dallo state della navigazione
  const {
    lobbyCode,
    difficulty,
    numPlayers,
    timer,
    users: initialUsers = [],
    nickname: initialNickname = ''
  } = location.state || {};

  const [users, setUsers] = useState(initialUsers);
  const [nickname] = useState(initialNickname);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [readyPlayers, setReadyPlayers] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [counter, setCounter] = useState(null);
  const bongRef = useRef(null);

  // Inizializza i listener del socket una sola volta
  useEffect(() => {
    // Ascolta gli aggiornamenti della lista degli utenti
    socket.on('lobbyUsers', (data) => {
      console.log('Received lobbyUsers on client:', data);
      setUsers(data.users);
    });

    // Ascolta i messaggi della chat
    socket.on('lobbyChatMessage', (data) => {
      console.log('Received lobbyChatMessage on client:', data);
      setChatMessages(prev => [...prev, data]);
    });

    // Eventi di debug
    socket.on('lobbyJoined', (data) => {
      console.log('Received lobbyJoined event:', data);
    });

    // Quando riceviamo l'evento gameStarted, avvia il countdown
    socket.on('gameStarted', (data) => {
      console.log('Received gameStarted event:', data);
      setCounter(5);
    });

    socket.on('gameStartError', (data) => {
      console.log('Received gameStartError event:', data);
    });

    socket.on('gameStartUpdate', (data) => {
      console.log('Received gameStartUpdate:', data);
      setReadyPlayers(data.readyPlayers);
      setTotalPlayers(data.totalPlayers);
    });

    // Pulizia dei listener al dismount del componente
    return () => {
      socket.off('lobbyUsers');
      socket.off('lobbyChatMessage');
      socket.off('lobbyJoined');
      socket.off('gameStarted');
      socket.off('gameStartError');
      socket.off('gameStartUpdate');
      socket.offAny();
    };
  }, []);

  // Effettua l’auto-scroll
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    let timerId;
    // Flag per indicare se il componente è smontato
    let isCancelled = false;
  
    if (counter !== null && counter > 0) {
      timerId = setTimeout(() => {
        if (!isCancelled) {
          setCounter(prev => prev - 1);
          if (bongRef.current) {
            bongRef.current
              .play()
              .catch((err) => console.log("Audio play error (non critico):", err));
          }
        }
      }, 1000);
    } else if (counter === 0) {
      console.log("Il gioco è iniziato!");
      socket.emit('gameStarted', { lobbyCode });
      navigate('/game', { 
        state: { 
          lobbyCode, 
          difficulty, 
          numPlayers, 
          timer, 
          users,
          nickname
        } 
      });
    }
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [counter, navigate, lobbyCode, difficulty, numPlayers, timer, users]);
  
  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() !== '') {
      const messageData = { lobbyCode, nickname, message: newMessage };
      console.log('Sending message:', messageData);
      socket.emit('lobbyChatMessage', messageData);
      setNewMessage('');
    } else {
      console.log('Empty message, not sent.');
    }
  };

  const toggleReady = () => {
    setIsReady(!isReady);
    socket.emit('playerReady', { ready: !isReady, lobbyCode });
  };

  return (
    <div className="lobby-container">
      <audio ref={bongRef} src={bongsong} preload="auto" />
      <Logo />
      <div className="lobby-overlay">
        <h1>Lobby</h1>
        <div className="lobby-info">
          <p><strong>Lobby Code:</strong> {lobbyCode}</p>
          <p><strong>Difficulty:</strong> {difficulty}</p>
          <p><strong>Number of Players:</strong> {numPlayers}</p>
          <p><strong>Timer:</strong> {timer} minutes</p>
        </div>
        <div className="lobby-content">
          <div className="users-list">
            <h2>Connected Users</h2>
            <ul>
              {users.map((user, index) => (
                <li key={index}>{user}</li>
              ))}
            </ul>
            <div>
              <p>Ready Players: {readyPlayers}/{totalPlayers}</p>
            </div>
          </div>
          {counter !== null && (
            <div className="countdown">
              {counter > 0 ? counter : 'GO!'}
            </div>
          )}
          <div className="chat-section">
            <h2>Lobby Chat</h2>
            <div className="chat-log" ref={chatLogRef}>
              {chatMessages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{msg.nickname}:</strong> {msg.message}
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message"
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
        <div className="start-game">
          <button onClick={toggleReady} disabled={users.length < 2}>
            {isReady ? 'Not Ready' : 'Ready'}
          </button>
          {users.length < 2 && <p>At least 2 players are required to start the game.</p>}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
