# Usa la imagen base de Node
FROM node:20

# Crea el directorio de trabajo
WORKDIR /app/api-whatsapp

# Copia package.json y package-lock.json
COPY api-whatsapp/package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY api-whatsapp/ .

# Expone el puerto (por si lo necesitas)
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]