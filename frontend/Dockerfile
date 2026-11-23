FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_URL VITE_NEGOCIO VITE_LEMA VITE_MONEDA VITE_LOCALE VITE_MODO VITE_STOCK_BAJO VITE_IMAGENES_BASE VITE_DEMO_ADMIN VITE_DEMO_CLIENTE VITE_DEMO_INACTIVO
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
