import { io } from 'socket.io-client';

const socketUrl = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5000';

const socket = io(socketUrl, {
  autoConnect: false,
});

export default socket;
