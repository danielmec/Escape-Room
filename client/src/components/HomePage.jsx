// client/src/components/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleCreateLobby = () => {
    navigate('createlobby');
  };

  const handleJoinLobby = () => {
    navigate('/join');
  };

  const handleOptions = () => {
    navigate('/options');
  };

  return (
    <div className="home-container">
      <div className="overlay">
        <h1>Escape Room</h1>
       
        <div className="buttons-container">
          <button className="home-button" onClick={handleCreateLobby}>
            Create Lobby
          </button>
          <button className="home-button" onClick={handleJoinLobby}>
            Join Lobby
          </button>
          <button className="home-button" onClick={handleOptions}>
            Options
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
