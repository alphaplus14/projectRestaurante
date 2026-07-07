# Etapa 1: compilar la app React + Vite
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: servir archivos estáticos con Nginx
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# URL del backend Laravel (mismo nombre de servicio en docker-compose)
ENV BACKEND_URL=http://restaurante_back:80

EXPOSE 80
