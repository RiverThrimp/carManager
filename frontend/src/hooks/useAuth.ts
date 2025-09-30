import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api/client';

export const useAuth = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    navigate('/monitor');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  return { token, login, logout };
};
