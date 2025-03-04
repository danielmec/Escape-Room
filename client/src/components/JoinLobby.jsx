// client/src/components/JoinLobby.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import Logo from './Logo';
import LobbyList from './LobbyList'; // Importa il nuovo componente
import './JoinLobby.css'; 

const JoinLobby = () => {
  const [nickname, setNickname] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('lobbyJoined', (data) => {
      navigate('/lobby', { state: data });
    });

    socket.on('errorName', (data) => {
      setErrorMessage('Nickname già in uso');
    });

    socket.on('capacity_error', (data) => {
      setErrorMessage('Lobby is full');
    });

    return () => {
      socket.off('lobbyJoined');
    };
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim() !== '' && lobbyCode.trim() !== '') {
      socket.emit('joinLobby', { nickname, lobbyCode });
    } else {
      setErrorMessage('Inserisci un nickname e un codice lobby');
    }
  };

  return (
    <div className="joinlobby-container">
      <Logo />
      <div className="joinlobby-form">
        <h1>Join Lobby</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nickname:</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Insert your nickname"
              required
            />
          </div>
          <div className="form-group">
            <label>Lobby Code:</label>
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              placeholder="Insert the lobby code"
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Join Lobby
          </button>
        </form>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {/* Inserisce il componente della lista delle lobby */}
        <LobbyList />
      </div>
    </div>
  );
};

export default JoinLobby;
