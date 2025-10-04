# Railway Webhook Integration Setup

Este sistema está configurado para integrar WhatsApp con tu webhook de Railway:

1. **Webhook Server** - Recibe mensajes entrantes de WhatsApp y los envía a tu webhook de Railway
2. **Main Server** - Envía mensajes salientes y los envía a tu webhook de Railway

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# URL de tu webhook de Railway para procesar mensajes
RAILWAY_WEBHOOK_URL=http://localhost:3005/webhook

# API Key de Railway (opcional, si tu webhook la requiere)
RAILWAY_API_KEY=tu_api_key_aqui

# Puerto del servidor principal de WhatsApp
PORT=3000

# Puerto del servidor webhook (para mensajes entrantes)
WEBHOOK_PORT=3001
```

### 2. Flujo de Datos

#### A. Mensajes Entrantes (Webhook)
Cuando alguien te escribe en WhatsApp, el webhook recibe el mensaje y lo envía a tu webhook de Railway:

```json
{
  "sessionId": "session_id_del_whatsapp",
  "message": {
    "id": "message_id",
    "from": "1234567890@c.us",
    "body": "Hola, ¿cómo estás?",
    "type": "chat",
    "timestamp": 1640995200,
    "notifyName": "Juan Pérez"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "whatsapp-webhook",
  "type": "incoming"
}
```

#### B. Mensajes Salientes (Main Server)
Cuando envías un mensaje a través de `/api/send-message`, se envía a tu webhook de Railway:

```json
{
  "sessionId": "session_id_del_whatsapp",
  "phone": "1234567890",
  "message": "Hola, este es un mensaje saliente",
  "messageId": "message_id_generado",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "type": "outgoing",
  "source": "whatsapp-api"
}
```

### 3. Servidores y Endpoints

#### Servidor Principal (WhatsApp API)
- `POST /api/send-message` - Envía mensaje y lo procesa en Railway
- `POST /api/start` - Inicia sesión de WhatsApp
- `GET /api/status/:sessionId` - Verifica estado de la sesión
- `GET /api/sessions` - Lista todas las sesiones
- `GET /api/messages/:sessionId` - Obtiene mensajes recientes

#### Servidor Webhook (Mensajes Entrantes)
- `POST /webhook` - Recibe mensajes entrantes de WhatsApp y los envía a Railway
- `GET /messages` - Ver todos los mensajes recibidos
- `DELETE /messages` - Limpiar historial de mensajes
- `GET /health` - Verificar estado del webhook

### 4. Ejecutar los Servidores

```bash
# Instalar dependencias
npm install

# Terminal 1: Ejecutar el servidor principal de WhatsApp
npm start

# Terminal 2: Ejecutar el servidor webhook (para mensajes entrantes)
npm run webhook

# O en desarrollo con auto-reload:
npm run dev          # Servidor principal
npm run dev:webhook  # Servidor webhook
```

### 5. Configurar en tu Webhook de Railway

Asegúrate de que tu webhook de Railway esté ejecutándose en `localhost:3005/webhook` y reciba peticiones POST con los datos en el formato especificado arriba.

### 6. Logs y Monitoreo

#### Servidor Principal
- Mensajes enviados
- Estado del envío a Railway webhook
- Errores de conexión
- Respuestas del webhook de Railway

#### Servidor Webhook
- Mensajes entrantes recibidos
- Estado del envío a Railway webhook
- Errores de conexión
- Respuestas del webhook de Railway

## Troubleshooting

### Error de Conexión a Railway
- Verifica que la URL del webhook sea correcta (`http://localhost:3005/webhook`)
- Asegúrate de que tu webhook esté funcionando en el puerto 3005
- Revisa los logs para más detalles

### Error de Autenticación
- Verifica que el API_KEY sea correcto
- Asegúrate de que tu webhook acepte el formato de autenticación Bearer

### Mensajes No Se Procesan
- Verifica que el servidor esté ejecutándose
- Revisa los logs del servidor
- Confirma que tu webhook esté respondiendo correctamente
- Verifica que el endpoint `/webhook` exista en tu aplicación en el puerto 3005

## Ejemplo de Uso

### Enviar Mensaje Saliente
```bash
# Enviar mensaje (se enviará automáticamente a tu webhook de Railway)
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "message": "Hola, este mensaje se enviará a tu webhook de Railway",
    "sessionId": "default"
  }'
```

### Configurar Webhook para Mensajes Entrantes
```bash
# Configurar webhook URL en el servidor principal
curl -X POST http://localhost:3000/api/webhook/default \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "http://localhost:3001/webhook"
  }'
```

### Verificar Estado
```bash
# Verificar estado del servidor principal
curl http://localhost:3000/api/status/default

# Verificar estado del webhook
curl http://localhost:3001/health
```

### Respuestas Esperadas

#### Mensaje Saliente Enviado:
```json
{
  "success": true,
  "messageId": "message_id_generado",
  "phone": "1234567890",
  "note": "Message sent via WhatsApp",
  "railwayProcessed": true,
  "railwayResponse": {
    "processed": true,
    "result": "datos_procesados_del_webhook"
  }
}
```

#### Mensaje Entrante Recibido:
```json
{
  "success": true,
  "message": "Webhook received and sent to Railway webhook",
  "sentToRailway": true,
  "railwayResponse": {
    "processed": true,
    "result": "datos_procesados_del_webhook"
  }
}
```
