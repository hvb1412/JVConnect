// API Configuration
const rawApiUrl = import.meta.env.VITE_API_URL;
const normalizedApiUrl = rawApiUrl
    ? rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://")
        ? rawApiUrl
        : `https://${rawApiUrl}`
    : "";
export const API_BASE_URL = normalizedApiUrl;
export const API_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api` : "/api";
export const SOCKET_URL = API_BASE_URL || undefined;
