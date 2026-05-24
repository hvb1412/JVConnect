// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_ENDPOINT = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
