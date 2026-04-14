import axios from 'axios';

/**
 * Cliente HTTP base para conectarse con el Backend.
 * Utiliza Axios para gestionar interceptores, tokens y la URL base
 * asignada en las variables de entorno de Vite.
 */
export const apiClient = axios.create({
    // VITE_API_URL debe ser definida en el archivo .env (ej: http://localhost:8080/api)
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Peticiones: Adjuntar el token JWT si existe
apiClient.interceptors.request.use(
    (config) => {
        // En este ejemplo buscamos el token guardado en el localStorage.
        // También puede integrarse más adelante directamente con el authStore
        // si se persiste el token en Zustand.
        const token = localStorage.getItem('jwt_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Respuestas: Manejo genérico de errores (ej: Sesión vencida)
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            const method = error.config?.method?.toUpperCase();
            // Solo desloguear en GETs (token vencido).
            // En mutaciones (POST/PATCH/PUT/DELETE) el 401 indica permisos insuficientes:
            // en ese caso rechazamos el error para que el componente muestre un toast,
            // sin cerrar la sesión del usuario.
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
