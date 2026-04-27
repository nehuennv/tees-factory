import axios from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // When sending FormData, remove the default Content-Type so the browser
        // sets it automatically with the correct multipart/form-data boundary.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            const method = error.config?.method?.toUpperCase();
            // Only logout on GET (expired token).
            // On mutations (POST/PATCH/PUT/DELETE) a 401 means insufficient permissions —
            // reject so the component can show a toast without logging the user out.
            const isReadRequest = method === 'GET' || method === undefined;
            if (isReadRequest) {
                localStorage.removeItem('jwt_token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
