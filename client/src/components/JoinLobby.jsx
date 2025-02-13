// client/src/components/JoinLobby.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import Logo from './Logo';
import './JoinLobby.css'; 


const JoinLobby = () => {
  const [nickname, setNickname] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Listen for the 'lobbyJoined' event from the server
  useEffect(() => {
    socket.on('lobbyJoined', (data) => {
      // 'data' should contain lobby details (e.g., lobbyCode, difficulty, numPlayers, timer, users)
      navigate('/lobby', { state: data });
    });

    socket.on('errorName', (data) => {
      setErrorMessage('Nickname already in use');
      //alert(data.message || 'Nickname already in use');
    });

    socket.on('capacity_error', (data) => {
      setErrorMessage('Lobby is full');
    });


    return () => {
      socket.off('lobbyJoined');
    };
  }, [navigate, setErrorMessage]);

  // Handle the form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim() !== '' && lobbyCode.trim() !== '') {
      // Emit the joinLobby event with the user's nickname and the lobby code
      socket.emit('joinLobby', { nickname, lobbyCode });
    }
  };

  return (
    <div className="joinlobby-container">
      {/* Logo in the top left */}
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
              placeholder="Enter your nickname"
              required
            />
          </div>
          <div className="form-group">
            <label>Lobby Code:</label>
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              placeholder="Enter lobby code"
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Join Lobby
          </button>
        </form>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default JoinLobby;
