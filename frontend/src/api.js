// Replace with your Render backend URL
const API_BASE_URL = 'https://studyhub-siol.onrender.com';

const api = {
  // Auth endpoints
  register: (userData) => fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  }),
  
  login: (credentials) => fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }),
  
  getProfile: (token) => fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }),
  
  // Rooms endpoints
  getRooms: () => fetch(`${API_BASE_URL}/api/rooms`),
  
  createRoom: (roomData, token) => fetch(`${API_BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(roomData)
  }),
  
  // Sessions endpoints
  startSession: (sessionData, token) => fetch(`${API_BASE_URL}/api/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  }),
  
  // Health check
  health: () => fetch(`${API_BASE_URL}/api/health`)
};

export default api;
