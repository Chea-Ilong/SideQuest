// API base URL - uses Vite proxy in dev, direct URL in production
export const API_BASE_URL = import.meta.env['VITE_API_URL'] ?? '';

export const isDev = import.meta.env.DEV;
