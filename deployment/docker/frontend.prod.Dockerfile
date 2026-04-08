# Dockerfile para el frontend React + Vite (Producción)
# Uso: docker build -f deployment/docker/frontend.prod.Dockerfile .

# Stage 1: Build
FROM node:20-slim as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine as runtime

# Copiamos el build estático al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración básica de Nginx para SPA (Single Page Application)
# Esto redirige todas las peticiones al index.html para que React Router funcione
RUN echo "server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files \$uri \$uri/ /index.html; \
    } \
    }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
