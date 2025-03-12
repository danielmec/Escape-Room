// client/src/components/HomePage.jsx
import React,  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const oldSocketId = localStorage.getItem('oldSocketId');
    console.log("Old Socket Id from localStorage:", oldSocketId);
    console.log("Current socket id:", socket.id);
    if (oldSocketId) {
      socket.emit('checkActiveGame', { oldSocketId });
    }
    
    socket.on('reconnectAllowed', (data) => {
      console.log("Ricevuto reconnectAllowed:", data);
      localStorage.removeItem('oldSocketId');
      navigate('/game', { state: { 
        lobbyCode: data.lobbyCode,
        nickname: data.nickname,
        users: data.users,
        difficulty: data.difficulty,
        numPlayers: data.numPlayers,
        remainingTime: data.remainingTimer,
        timer: data.timer,
        roomAssignment: data.roomAssignment
      }});
    });
    socket.on('noActiveGame', (data) => {
      console.log("Ricevuto noActiveGame:", data);
      localStorage.removeItem('oldSocketId');
    });
    
    return () => {
      socket.off('reconnectAllowed');
      socket.off('noActiveGame');
    }
  }, [navigate]);

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
