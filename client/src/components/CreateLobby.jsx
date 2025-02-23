import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import './CreateLobby.css';
import socket from '../socket'; // import the central socket instance

const CreateLobby = () => {
  const [nickname, setNickname] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [numPlayers, setNumPlayers] = useState(2);
  const [timer, setTimer] = useState(15);
  const [visibility, setVisibility] = useState('Public'); // Nuovo stato per la visibilità

  const navigate = useNavigate();

  useEffect(() => {
    socket.on('lobbyCreated', (data) => {
      // data dovrebbe includere lobbyCode, users, difficulty, numPlayers, timer, visibility, etc.
      navigate('/lobby', { state: data });
    });

    return () => {
      socket.off('lobbyCreated');
    };
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim() === '') {
      alert('Please enter a nickname');
      return;
    }
    if(numPlayers < 2 || numPlayers > 4) {
      alert('Number of players must be between 2 and 4');
      return;
    }
    // Imposta il timer in base alla difficoltà
    let adjustedTimer;
    if (difficulty === 'Easy') {
      adjustedTimer = 15;
    } else if (difficulty === 'Medium') {
      adjustedTimer = 8;
    } else if (difficulty === 'Hard') {
      adjustedTimer = 6;
    }
    // Emit 'createLobby' event con i parametri, inclusa la visibilità
    socket.emit('createLobby', {
      nickname,
      difficulty,
      numPlayers,
      timer: adjustedTimer,
      visibility
    });
  };

  return (
    <div className="create-lobby-container">
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
              min="2"
              max="4"
              value={numPlayers}
              onChange={(e) => setNumPlayers(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Visibility:</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
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