const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In production, VITE_API_URL must be set as an environment variable in Vercel.
// Example: https://your-backend.onrender.com/api
export const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : (isLocalhost
        ? 'http://localhost:5000/api'
        : null); // Will cause a clear network error instead of connecting to wrong host

export const BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

