import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gymmate_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('gymmate_refresh_token');

      if (refreshToken) {
        try {
          const refreshEndpoint = API_URL ? `${API_URL}/api/auth/refresh` : '/api/auth/refresh';
          const res = await axios.post(refreshEndpoint, { refreshToken });
          const newAccessToken = res.data.accessToken;

          localStorage.setItem('gymmate_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('gymmate_access_token');
          localStorage.removeItem('gymmate_refresh_token');
          localStorage.removeItem('gymmate_user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
