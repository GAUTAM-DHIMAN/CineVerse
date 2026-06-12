// src/context/AuthContext.js
// Global authentication state via React Context + useReducer

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { login as loginApi } from '../services/authService';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'LOADED':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('cv_user');
    const storedToken = localStorage.getItem('cv_token');

    if (storedUser && storedToken) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: JSON.parse(storedUser), token: storedToken },
      });
    } else {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  const login = async (email, password) => {
    const result = await loginApi(email, password);

    if (result.success) {
      const { accessToken, user } = result.data;
      localStorage.setItem('cv_user', JSON.stringify(user));
      localStorage.setItem('cv_token', accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: accessToken } });
    }

    return result;
  };

  const logout = () => {
    localStorage.removeItem('cv_user');
    localStorage.removeItem('cv_token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
