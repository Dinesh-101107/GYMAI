import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Connect to VITE_API_URL in production, or fallback to current origin in dev
    socket = io(SOCKET_URL, {
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
