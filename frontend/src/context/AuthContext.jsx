import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { initSocket, disconnectSocket, playPaymentChime, speakPaymentAlert } from '../services/socket';
import { useToast } from '../components/Toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const toast = useToast();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spay_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('spay_token') || '');
  const [liveBalance, setLiveBalance] = useState(null);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('spay_user', JSON.stringify(userData));
    localStorage.setItem('spay_token', authToken);
    initSocket(userData.id);
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (_) {
      // demo guard
    } finally {
      disconnectSocket();
      setUser(null);
      setToken('');
      localStorage.removeItem('spay_user');
      localStorage.removeItem('spay_token');
    }
  };

  // Connect socket on initial load and listen for real-time payments
  useEffect(() => {
    if (user?.id) {
      const socket = initSocket(user.id);

      if (socket) {
        const handlePaymentReceived = (data) => {
          playPaymentChime();
          speakPaymentAlert(data.amount, data.sender_name);

          if (data.balance !== undefined) {
            setLiveBalance(data.balance);
          }

          if (toast) {
            toast.success(`💰 ₹${Number(data.amount).toLocaleString('en-IN')} Received from ${data.sender_name}! (UTR: ${data.utr_number})`);
          }
        };

        const handlePaymentSent = (data) => {
          if (data.balance !== undefined) {
            setLiveBalance(data.balance);
          }
        };

        socket.on('payment_received', handlePaymentReceived);
        socket.on('payment_sent', handlePaymentSent);

        return () => {
          socket.off('payment_received', handlePaymentReceived);
          socket.off('payment_sent', handlePaymentSent);
        };
      }
    }
  }, [user?.id, toast]);

  const value = useMemo(() => ({
    user,
    token,
    login,
    logout,
    liveBalance,
    setLiveBalance
  }), [user, token, liveBalance]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
