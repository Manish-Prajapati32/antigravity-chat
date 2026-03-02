// Automatically match the backend protocol (http/https) to
// whatever protocol the frontend page is served on.
// This prevents the OpenSSL TLS error when mixing http:// and https://.

const protocol = window.location.protocol; // 'http:' or 'https:'

export const BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : (window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : `${protocol}//` + window.location.hostname + ':5000');

export const API_URL = `${BASE_URL}/api`;
