import axios from 'axios';

const api = axios.create({
 baseURL:
  'https://task-orchestrator-backend.onrender.com/api'
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response handling
api.interceptors.response.use(
  (response) => response,

  (error) => {
    // Auto logout on unauthorized
    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );

      // Prevent infinite reload loop
      if (
        window.location.pathname !==
        '/'
      ) {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;