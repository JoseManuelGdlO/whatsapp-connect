# Usa la imagen base de Node
FROM node:20-slim

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libnss3-dev \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libgconf-2-4 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxtst6 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgdk-pixbuf2.0-0 \
    && rm -rf /var/lib/apt/lists/*

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