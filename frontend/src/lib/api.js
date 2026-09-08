import { io } from 'socket.io-client';
import axios from 'axios';

// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || '/api';
export const socket = io(window.location.origin);

// API Helper
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
