import React, { useState, useEffect } from 'react';
import socket from '../socket';
import './Chat.css';

const Chat = ({ lobbyCode, initialNickname }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Ascolto messaggi chat dal server
  useEffect(() => {
    socket.on('lobbyChatMessage', (data) => {
      console.log('Chat message received:', data);
      setChatMessages(prev => [...prev, data]);
    });
    return () => {
      socket.off('lobbyChatMessage');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    console.log('sendMessage triggered:', newMessage);
    if (newMessage.trim() !== '') {
      const messageData = { lobbyCode, nickname: initialNickname, message: newMessage };
      socket.emit('lobbyChatMessage', messageData);
      setNewMessage('');
    }
  };

  return (
    <div className="game-chat-section">
      <h2>Game Chat</h2>
      <div className="game-chat-log">
        {chatMessages.map((msg, index) => (
          <div key={index} className="game-chat-message">
            <strong>{msg.nickname || 'Anonimo'}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="game-chat-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); console.log('Chat input:', e.target.value); }}
          placeholder="Type your message"
        />
        <button type="submit" onClick={() => console.log('Chat message sent')}>Send</button>
      </form>
    </div>
  );
};

export default Chat;