# Etapa de construcción (Build)
FROM node:22-alpine AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar configuración de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias (usamos ci para instalaciones más rápidas y exactas según lockfile)
RUN npm ci

# Copiar el resto del código fuente y el archivo .env
COPY . .

# Variables de entorno al momento de compilar. 
# Si tu servidor de integración CI tiene la URL, podés inyectarla aquí.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Compilar la aplicación para producción (Vite generará la carpeta /dist)
RUN npm run build

# Etapa de producción (Servidor Web Nginx)
FROM nginx:alpine

# Limpiar configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Añadir nuestra configuración preparada para SPAs (React)
COPY nginx.conf /etc/nginx/conf.d/

# Copiar los archivos construidos de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80 (Interno del contenedor)
EXPOSE 80

# Iniciar NGINX
CMD ["nginx", "-g", "daemon off;"]
