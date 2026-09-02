import { io } from 'socket.io-client';

let socket = null;

const getNormalizedSocketUrl = () => {
  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket) return envSocket.trim().replace(/\/+$/, '');

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    let clean = envApi.trim().replace(/\/+$/, '');
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4);
    }
    return clean;
  }

  return 'http://localhost:5000';
};

export const initSocket = (userId) => {
  if (!userId) return null;

  if (socket && socket.connected) {
    socket.emit('join_user_room', userId);
    return socket;
  }

  const socketUrl = getNormalizedSocketUrl();

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

// 1. Synthesize Melodic Payment Success Chime via Web Audio API
export const playPaymentChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Notes: C6, E6, G6 (authentic upbeat payment chime)
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
    // AudioContext policy
  }
};

// 2. SoundBox Smart Speaker Voice Alert (Like PhonePe / Paytm Speaker)
export const speakPaymentAlert = (amount, senderName) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const formattedAmt = Number(amount).toLocaleString('en-IN');
      const text = `Payment of rupees ${formattedAmt} received on S-Pay from ${senderName || 'user'}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-IN';
      
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 450);
    }
  } catch (_) {}
};
