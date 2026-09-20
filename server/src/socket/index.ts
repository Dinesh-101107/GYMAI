import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSocket(server: any, corsOrigin: string): SocketIOServer {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log(`⚡ Client connected to WebSocket: ${socket.id}`);

    // Join staff live feed room
    socket.on('join_staff_feed', () => {
      socket.join('staff_feed');
      console.log(`🏢 Socket ${socket.id} joined 'staff_feed' room`);
    });

    // Leave staff live feed room
    socket.on('leave_staff_feed', () => {
      socket.leave('staff_feed');
      console.log(`🚪 Socket ${socket.id} left 'staff_feed' room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function broadcastCheckIn(checkInData: {
  id: string;
  memberId: string;
  memberName: string;
  checkInTime: Date | string;
  membershipStatus: string;
  phone?: string;
  method: 'QR_SCAN' | 'MANUAL';
}): void {
  if (ioInstance) {
    ioInstance.to('staff_feed').emit('new_checkin', checkInData);
    console.log(`📢 Broadcasted new check-in for: ${checkInData.memberName} (${checkInData.method})`);
  }
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}
