import React, { useState, useEffect } from 'react';
import socket from '../socket';
import './LobbyList.css';

const LobbyList = () => {
  const [lobbies, setLobbies] = useState([]);

  useEffect(() => {
    // Ascolta l'evento aggiornato della lista delle lobby
    socket.on('lobbiesList', (data) => {
      setLobbies(data);
    });

    // In alternativa, ascolta anche l'evento "lobbyCreated" e richiedi la lista aggiornata
    socket.on('lobbyCreated', () => {
      socket.emit('getLobbies');
    });

    // Richiedi la lista iniziale delle lobby
    socket.emit('getLobbies');

    return () => {
      socket.off('lobbiesList');
      socket.off('lobbyCreated');
    };
  }, []);

  return (
    <div className="lobby-list">
      <h2>Lobbies</h2>
      <ul>
        {lobbies.map((lobby, index) => (
          <li key={lobby.lobbyCode || index} className="lobby-item">
            <div className="lobby-header">
              <span className="lobby-name">{lobby.name || `Lobby ${index + 1}`}</span>
              <span className="lobby-privacy">{lobby.isPublic ? 'Public' : 'Private'}</span>
            </div>
            <div className="lobby-details">
              {lobby.isPublic && (
                <span className="lobby-code">Code: {lobby.lobbyCode}</span>
              )}
              <span className="lobby-users">{lobby.currentUsers}/{lobby.maxUsers}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LobbyList;