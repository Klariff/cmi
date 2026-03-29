# Usa la imagen base de Node.js para construir la aplicación Angular
FROM node:18 as build

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Compila la aplicación para producción
RUN npm run build --prod

# Usa una imagen de servidor web (como Nginx) para servir la aplicación Angular
FROM nginx:stable-alpine

# Copia los archivos compilados desde la etapa anterior
COPY --from=build /app/dist/cmi-front /usr/share/nginx/html

# Copia el archivo de configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto (ajusta según el puerto que quieras usar)
EXPOSE 80

# Nginx se inicia por defecto