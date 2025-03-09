// client/src/socket.js
import { io } from 'socket.io-client';

const URL =
  process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'
    ? '/'  // Usa indirizzo relativo in produzione
    : 'http://localhost:3001'; // Usa localhost durante lo sviluppo

const socket = io(URL);

export default socket;