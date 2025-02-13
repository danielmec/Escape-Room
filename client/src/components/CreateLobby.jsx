// client/src/components/CreateLobby.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import './CreateLobby.css';
import socket from '../socket'; // import the socket central instance



const CreateLobby = () => {
  const [nickname, setNickname] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [numPlayers, setNumPlayers] = useState(2);
  const [timer, setTimer] = useState(15);
  
  // useNavigate hook for routing
  const navigate = useNavigate();

  // Listen for the 'lobbyCreated' event from the server.
  // When received, navigate to the Lobby page with the lobby data.
  useEffect(() => {
    socket.on('lobbyCreated', (data) => {
      // data should include lobbyCode, users, difficulty, numPlayers, timer, etc.
      navigate('/lobby', { state: data });
    });

    // Cleanup the listener when the component unmounts
    return () => {
      socket.off('lobbyCreated');
    };
  }, [navigate]);

  // Complete handleSubmit function that emits the createLobby event to the server
  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim() === '') {
      alert('Please enter a nickname');
    };
    if(numPlayers < 2 || numPlayers > 10) {
      alert('Number of players must be between 2 and 10');
    }
    // Emit 'createLobby' event with the parameters
    socket.emit('createLobby', {
      nickname,
      difficulty,
      numPlayers,
      timer
    });
  };

  return (
    <div className="create-lobby-container">
      {/* Logo appears in the top left via the Logo component */}
      <Logo />
      <div className="create-lobby-form">
        <h1>Create Lobby</h1>
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
            <label>Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="form-group">
            <label>Number of Players:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={numPlayers}
              onChange={(e) => setNumPlayers(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Timer (minutes):</label>
            <input
              type="number"
              min="1"
              max="60"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Create Lobby
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateLobby;
