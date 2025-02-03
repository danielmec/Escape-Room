// client/src/components/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Usa useNavigate invece di useHistory
import './HomePage.css';
import Logo from './Logo';


const HomePage = () => {
  const navigate = useNavigate(); // Crea l'oggetto navigate

  const handleCreateLobby = () => {
    // Naviga alla pagina per la creazione della lobby
    navigate('/lobby');
  };

  const handleJoinLobby = () => {
    // Naviga alla pagina per unirsi a una lobby esistente
    navigate('/join');
  };

  const handleOptions = () => {
    // Naviga alla pagina delle opzioni
    navigate('/options');
  };

  return (
    <div className="home-container">
    <Logo/>
      <h1>Escape Room</h1>
      <p>Select an option to continue:</p>
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
  );
};

export default HomePage;
