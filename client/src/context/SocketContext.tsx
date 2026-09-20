import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.js';

interface CheckInBroadcast {
  id: string;
  memberId: string;
  memberName: string;
  checkInTime: string;
  membershipStatus: string;
  phone?: string;
  method: 'QR_SCAN' | 'MANUAL';
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestCheckIn: CheckInBroadcast | null;
  checkInFeed: CheckInBroadcast[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestCheckIn, setLatestCheckIn] = useState<CheckInBroadcast | null>(null);
  const [checkInFeed, setCheckInFeed] = useState<CheckInBroadcast[]>([]);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // If staff user, join staff live feed room
    if (user?.role === 'STAFF') {
      s.emit('join_staff_feed');
    }

    const onNewCheckIn = (data: CheckInBroadcast) => {
      console.log('⚡ Received live check-in event:', data);
      setLatestCheckIn(data);
      setCheckInFeed((prev) => [data, ...prev.slice(0, 24)]);
    };

    s.on('new_checkin', onNewCheckIn);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('new_checkin', onNewCheckIn);
      if (user?.role === 'STAFF') {
        s.emit('leave_staff_feed');
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestCheckIn,
        checkInFeed,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
