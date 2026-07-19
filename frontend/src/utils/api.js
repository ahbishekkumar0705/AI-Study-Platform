import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refreshing on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token, logout
        clearTokensAndRedirect();
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('Refresh token expired or invalid:', refreshErr.message);
        clearTokensAndRedirect();
        return Promise.reject(refreshErr);
      }
    }
    
    return Promise.reject(error);
  }
);

function clearTokensAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth/login';
  }
}

export default api;
