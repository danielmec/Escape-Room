// client/src/components/CreateLobby.jsx
import React, { useState } from 'react';
import Logo from './Logo';
import './CreateLobby.css';

const CreateLobby = () => {
  const [difficulty, setDifficulty] = useState('Easy');
  const [numPlayers, setNumPlayers] = useState(2);
  const [location, setLocation] = useState('');
  const [timer, setTimer] = useState(15);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Per ora, mostriamo i valori in console. In futuro, potrai inviare questi dati al server.
    console.log({
      difficulty,
      numPlayers,
      location,
      timer
    });
  };

  return (
    <div className="create-lobby-container">
      {/* Logo in alto a sinistra */}
      <Logo />

      <div className="create-lobby-form">
        <h1>Create Lobby</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Difficulty:</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
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
            />
          </div>

          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
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
            />
          </div>

          <button type="submit" className="submit-button">Create Lobby</button>
        </form>
      </div>
    </div>
  );
};

export default CreateLobby;
