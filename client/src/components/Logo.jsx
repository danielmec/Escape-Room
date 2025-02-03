// client/src/components/Logo.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <Link to="/" className="logo-text">Escape Room</Link>
    </div>
  );
};

export default Logo;
