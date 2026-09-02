import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (!userId) return null;

  if (socket && socket.connected) {
    socket.emit('join_user_room', userId);
    return socket;
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    socket.emit('join_user_room', userId);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Play PhonePe / GPay style payment sound synthesized via Web Audio API
export const playPaymentChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Notes: C6, E6, G6 (cheerful payment success chime)
    const notes = [1046.50, 1318.51, 1567.98];
    const startTime = audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

      gain.gain.setValueAtTime(0.3, startTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime + idx * 0.12);
      osc.stop(startTime + idx * 0.12 + 0.4);
    });
  } catch (_) {
    // AudioContext blocked by browser policy until interaction
  }
};

