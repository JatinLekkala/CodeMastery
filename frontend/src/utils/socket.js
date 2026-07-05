import { io } from 'socket.io-client';

// Connect to the backend server (on port 5000)
// We set autoConnect to false so we can connect manually once user logs in
const socket = io('http://localhost:5000', {
  autoConnect: false,
});

export default socket;
