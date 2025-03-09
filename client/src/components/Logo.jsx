// client/src/components/Logo.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import socket from '../socket';
import './Logo.css';

const Logo = () => {
  const handleLogoClick = () => {
    socket.emit('leaveLobby');
  };

  return (
    <div className="logo-container">
      <Link to="/" className="logo-text" onClick={handleLogoClick}>
        Escape Room
      </Link>
    </div>
  );
};

export default Logo;