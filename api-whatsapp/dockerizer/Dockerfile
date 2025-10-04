# Base image
FROM node:20

# Create app directory
WORKDIR /app/api-whatsapp

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY api-whatsapp/package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Start the server using the production build
CMD [ "node", "src/server.js" ]

# Exposing server port
EXPOSE 3000