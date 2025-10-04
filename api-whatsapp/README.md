# WhatsApp API - Similar to UltraMSG

Una API de WhatsApp potente y fácil de usar, similar a UltraMSG, construida con WPPConnect.

## 🚀 Características

- ✅ Enviar mensajes de texto
- ✅ Enviar archivos (imágenes, documentos, audio)
- ✅ **Recibir mensajes via Webhook** 🆕
- ✅ Múltiples sesiones de WhatsApp
- ✅ API REST completa
- ✅ QR Code para autenticación
- ✅ Estado de conexión en tiempo real
- ✅ Fácil despliegue en DigitalOcean

## 📋 Endpoints Disponibles

### 1. Iniciar Sesión
```bash
POST /api/start
Content-Type: application/json

{
  "sessionId": "mi-sesion"
}
```

### 2. Obtener QR Code
```bash
GET /api/qrcode/mi-sesion
```

### 3. Enviar Mensaje
```bash
POST /api/send-message
Content-Type: application/json

{
  "phone": "5511999999999",
  "message": "Hola mundo!",
  "sessionId": "mi-sesion"
}
```

### 4. Verificar Estado
```bash
GET /api/status/mi-sesion
```

### 5. Health Check
```bash
GET /health
```

### 6. Configurar Webhook
```bash
POST /api/webhook/mi-sesion
Content-Type: application/json

{
  "webhookUrl": "https://tu-servidor.com/webhook"
}
```

### 7. Obtener Webhook
```bash
GET /api/webhook/mi-sesion
```

### 8. Obtener Mensajes Recientes
```bash
GET /api/messages/mi-sesion
```

## 🛠️ Instalación Local

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd wppconnect-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Ejecutar webhook server (opcional)**
```bash
npm run webhook
```

5. **Probar la API**
```bash
npm run test
```

6. **Ejecutar en producción**
```bash
npm start
```

## 🚀 Despliegue en DigitalOcean

### Opción 1: Script Automático

1. **Crear Droplet en DigitalOcean**
   - Ubuntu 22.04
   - Plan Basic ($6/mes)
   - Ubicación cercana a tus usuarios

2. **Conectar por SSH**
```bash
ssh root@TU_IP_SERVIDOR
```

3. **Subir archivos**
```bash
# En tu máquina local
scp -r . root@TU_IP_SERVIDOR:/root/wppconnect-api
```

4. **Ejecutar script de despliegue**
```bash
cd /root/wppconnect-api
chmod +x deploy.sh
./deploy.sh
```

### Opción 2: Manual

1. **Instalar Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Instalar PM2**
```bash
sudo npm install -g pm2
```

3. **Instalar dependencias**
```bash
npm install
```

4. **Iniciar aplicación**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 📱 Uso de la API

### Ejemplo con cURL

1. **Iniciar sesión**
```bash
curl -X POST http://TU_IP:3000/api/start \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "mi-sesion"}'
```

2. **Obtener QR Code**
```bash
curl http://TU_IP:3000/api/qrcode/mi-sesion
```

3. **Enviar mensaje**
```bash
curl -X POST http://TU_IP:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Hola desde mi API!",
    "sessionId": "mi-sesion"
  }'
```

### Ejemplo con JavaScript

```javascript
const axios = require('axios');

const API_BASE = 'http://TU_IP:3000';

// Iniciar sesión con webhook
await axios.post(`${API_BASE}/api/start`, {
  sessionId: 'mi-sesion',
  webhookUrl: 'https://tu-servidor.com/webhook'
});

// Enviar mensaje
await axios.post(`${API_BASE}/api/send-message`, {
  phone: '5511999999999',
  message: 'Hola mundo!',
  sessionId: 'mi-sesion'
});

// Obtener mensajes recientes
const messages = await axios.get(`${API_BASE}/api/messages/mi-sesion`);
console.log('Mensajes:', messages.data);
```

### Ejemplo de Webhook Server

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { sessionId, message } = req.body;
  
  console.log('📨 Nuevo mensaje recibido:');
  console.log('De:', message.from);
  console.log('Mensaje:', message.body);
  console.log('Tipo:', message.type);
  
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env`:

```env
PORT=3000
NODE_ENV=production
```

### Configuración de PM2

El archivo `ecosystem.config.js` ya está configurado para producción.

## 📊 Monitoreo

### Ver logs
```bash
pm2 logs wppconnect-api
```

### Ver estado
```bash
pm2 status
```

### Reiniciar aplicación
```bash
pm2 restart wppconnect-api
```

## 🔒 Seguridad

- Usa HTTPS en producción
- Implementa autenticación API
- Configura firewall
- Mantén actualizado el sistema

## 🐛 Solución de Problemas

### Error: "Session not found"
- Verifica que la sesión esté iniciada
- Usa `/api/start` primero

### Error: "QR code not available"
- La sesión ya está autenticada
- Verifica el estado con `/api/status`

### Error: "Phone number invalid"
- Asegúrate de incluir código de país
- Formato: 5511999999999

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs`
2. Verifica el estado: `pm2 status`
3. Reinicia la aplicación: `pm2 restart all`

## 📄 Licencia

MIT License
