import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { initSocket, disconnectSocket, playPaymentChime } from '../services/socket';
import { useToast } from '../components/Toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const toast = useToast();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spay_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('spay_token') || '');

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

  // Connect socket on initial load if user exists
  useEffect(() => {
    if (user?.id) {
      const socket = initSocket(user.id);

      if (socket) {
        const handlePaymentReceived = (data) => {
          playPaymentChime();
          if (toast) {
            toast.success(`🎉 Received ₹${Number(data.amount).toLocaleString('en-IN')} from ${data.sender_name}! (UTR: ${data.utr_number})`);
          }
        };

        socket.on('payment_received', handlePaymentReceived);

        return () => {
          socket.off('payment_received', handlePaymentReceived);
        };
      }
    }
  }, [user?.id, toast]);

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
