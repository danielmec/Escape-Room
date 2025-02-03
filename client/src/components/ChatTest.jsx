// client/src/components/ChatTest.jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // Assicurati che la porta corrisponda a quella del server

const ChatTest = () => {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    // Ascolta un evento di test dal server
    socket.on('testResponse', (data) => {
      setChatLog((prev) => [...prev, data.message]);
    });

    return () => {
      socket.off('testResponse');
    };
  }, []);

  const handleSend = () => {
    // Invia un messaggio di test al server
    socket.emit('testEvent', { nickname, message });
    setMessage('');
  };

  return (
    <div>
      <h1>Enter your nickname:</h1>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
      />
      <h2>Chat</h2>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={handleSend}>Send</button>
      <div>
        <h3>Chat Log:</h3>
        <ul>
          {chatLog.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChatTest;
