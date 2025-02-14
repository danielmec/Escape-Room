// client/src/components/Lobby.jsx
import React, { use, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Logo from './Logo';
import './Lobby.css';
import socket from '../socket';
import bongsong from '../assets/count.mp3';
import { useRef } from 'react';

const Lobby = () => {
  const location = useLocation();
  // Estrarre i dati dallo state della navigazione
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
  const [isReady, setIsReady] = useState(false); // Aggiunto per gestire il ready
  const [counter, setCounter] = useState(null);
  const bongRef = useRef(null);
  
  // Inizializza il socket una sola volta
  useEffect(() => {

      // Rimosso perche gia effetuato in Create o Join Lobby
     /* if (lobbyCode && nickname) {
        console.log(`Joining lobby ${lobbyCode} as ${nickname}`);
        socket.emit('joinLobby', { lobbyCode, nickname });
      }*/
   

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

    // Altri eventi di debugging
    socket.on('lobbyJoined', (data) => {
      console.log('Received lobbyJoined event:', data);
    });

    socket.on('gameStarted', (data) => {
      console.log('Received gameStarted event:', data);
      setCounter(5);
    });

    socket.on('gameStartError', (data) => {
      console.log('Received gameStartError event:', data);
    });

    socket.on('gameStartUpdate', (data) => {
      console.log('Received gameStartUpdate:', data);
      // Aggiorna lo stato del componente con il numero di giocatori pronti e il numero totale di giocatori
      setReadyPlayers(data.readyPlayers);
      setTotalPlayers(data.totalPlayers);
    });
  
      // Cleanup: rimuovi i listener al dismount
      return () => {
        socket.off('lobbyUsers');
        socket.off('lobbyChatMessage');
        socket.off('lobbyJoined');
        socket.off('gameStarted');
        socket.off('gameStartError');
        socket.off('gameStartUpdate');
        socket.offAny();
      };
    }, [socket]);


    useEffect(() => {
      let timer;
      if (counter !== null && counter > 0) {
        // Decrementa il counter ogni secondo
        timer = setTimeout(() => {
          setCounter(prev => prev - 1);
          // Riproduci il suono "bong"
          if (bongRef.current) {
            bongRef.current.play();
          }
        }, 1000);
      } else if (counter === 0) {
        // Quando il conto arriva a 0, puoi inserire qui la logica per avviare il gioco
        console.log("Il gioco è iniziato!");
      }
      return () => clearTimeout(timer);
    }, [counter]);


  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() !== '' ) {
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
    socket.emit('playerReady', { ready: !isReady,lobbyCode });//Invia al server il ready
  }

  return (
    <div className="lobby-container">
    <audio ref={bongRef} src={bongsong} preload='auto'/>
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
            <p>Giocatori pronti: {readyPlayers}/{totalPlayers}</p>
          </div>
          </div>
          {counter !== null && (
          <div className="countdown">
            {counter > 0 ? counter :'GO!'}
            </div>
        )}
          <div className="chat-section">
            <h2>Lobby Chat</h2>
            <div className="chat-log">
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
