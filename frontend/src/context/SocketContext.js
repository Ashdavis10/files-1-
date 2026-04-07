import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔗 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, user]);

  const joinRoom = (roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { roomId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', { roomId });
    }
  };

  const sendMessage = (roomId, content) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { roomId, content });
    }
  };

  const sendTyping = (roomId, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(isTyping ? 'typing_start' : 'typing_stop', { roomId });
    }
  };

  const syncPomodoro = (roomId, timerState) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('pomodoro_sync', { roomId, timerState });
    }
  };

  const on = (event, handler) => {
    socketRef.current?.on(event, handler);
  };

  const off = (event, handler) => {
    socketRef.current?.off(event, handler);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      joinRoom, leaveRoom, sendMessage, sendTyping, syncPomodoro, on, off
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
