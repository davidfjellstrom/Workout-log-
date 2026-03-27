import axios from 'axios';

// Skapar en axios-instans med grundkonfiguration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true, // Viktigt! Skickar cookies automatiskt med varje anrop
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor som hanterar fel globalt
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Inte inloggad — omdirigera till login?');
    }
    return Promise.reject(error);
  }
);

export default api;
