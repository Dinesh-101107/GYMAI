import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Connect to current origin in dev/prod
    socket = io('/', {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to GymMate real-time WebSocket server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
    });
  }

  return socket;
}
