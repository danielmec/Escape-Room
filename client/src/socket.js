// client/src/socket.js
import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';
const socket = io(URL);

export default socket;
