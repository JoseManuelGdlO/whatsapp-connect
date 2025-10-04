# 🚀 Instrucciones de Configuración - WhatsApp API

## 📋 **Estado Actual**

✅ **API Demo funcionando** - Puedes probar la estructura y endpoints
⚠️ **Dependencias de WhatsApp** - Necesitan configuración adicional para producción

## 🎯 **Opciones Disponibles**

### **1. Demo Mode (Actual)**
```bash
npm run demo
```
- ✅ Funciona inmediatamente
- ✅ Prueba todos los endpoints
- ✅ Simula funcionalidad de WhatsApp
- ❌ No envía mensajes reales

### **2. Producción con WPPConnect**
```bash
# Instalar WPPConnect
npm install @wppconnect/wa-js@latest

# Usar servidor original
npm run dev
```

### **3. Producción con whatsapp-web.js**
```bash
# Instalar whatsapp-web.js
npm install whatsapp-web.js puppeteer

# Usar servidor alternativo
cp src/server-alternative.js src/server.js
npm run dev
```

## 🧪 **Probar Demo Actual**

### **1. Iniciar servidor demo:**
```bash
npm run demo
```

### **2. Probar endpoints:**
```bash
# Terminal 1: Servidor demo
npm run demo

# Terminal 2: Servidor webhook
npm run webhook

# Terminal 3: Probar API
npm run test
```

### **3. Probar manualmente:**
```bash
# Iniciar sesión
curl -X POST http://localhost:3000/api/start \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "demo-session", "webhookUrl": "http://localhost:3001/webhook"}'

# Obtener QR code
curl http://localhost:3000/api/qrcode/demo-session

# Enviar mensaje
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Hola demo!", "sessionId": "demo-session"}'

# Ver mensajes
curl http://localhost:3000/api/messages/demo-session
```

## 🚀 **Para Producción Real**

### **Opción A: WPPConnect (Recomendado)**

1. **Instalar dependencias:**
```bash
npm install @wppconnect/wa-js@latest
```

2. **Usar servidor original:**
```bash
cp src/server.js src/server-production.js
npm run dev
```

### **Opción B: whatsapp-web.js**

1. **Instalar dependencias:**
```bash
npm install whatsapp-web.js puppeteer
```

2. **Usar servidor alternativo:**
```bash
cp src/server-alternative.js src/server.js
npm run dev
```

## 📱 **Funcionalidades Multi-Cuentas**

Tu API soporta múltiples cuentas de WhatsApp:

```bash
# Cuenta 1
curl -X POST http://localhost:3000/api/start \
  -d '{"sessionId": "cuenta1", "webhookUrl": "http://tu-servidor.com/webhook/cuenta1"}'

# Cuenta 2
curl -X POST http://localhost:3000/api/start \
  -d '{"sessionId": "cuenta2", "webhookUrl": "http://tu-servidor.com/webhook/cuenta2"}'

# Enviar desde cuenta específica
curl -X POST http://localhost:3000/api/send-message \
  -d '{"phone": "5511999999999", "message": "Hola", "sessionId": "cuenta1"}'
```

## 🔧 **Despliegue en DigitalOcean**

### **1. Crear Droplet:**
- Ubuntu 22.04
- Plan Basic ($6/mes)
- Ubicación cercana a tus usuarios

### **2. Subir archivos:**
```bash
scp -r . root@TU_IP_SERVIDOR:/root/wppconnect-api
```

### **3. Ejecutar despliegue:**
```bash
ssh root@TU_IP_SERVIDOR
cd /root/wppconnect-api
chmod +x deploy.sh
./deploy.sh
```

## 📊 **Monitoreo**

```bash
# Ver logs
pm2 logs wppconnect-api

# Ver estado
pm2 status

# Reiniciar
pm2 restart wppconnect-api
```

## 🐛 **Solución de Problemas**

### **Error: "Session not found"**
- Verifica que la sesión esté iniciada
- Usa `/api/start` primero

### **Error: "QR code not available"**
- La sesión ya está autenticada
- Verifica el estado con `/api/status`

### **Error: Dependencias**
- Usa `npm run demo` para probar estructura
- Instala dependencias específicas para producción

## 🎯 **Próximos Pasos**

1. **Probar demo** - `npm run demo`
2. **Elegir librería** - WPPConnect o whatsapp-web.js
3. **Configurar producción** - Instalar dependencias reales
4. **Desplegar** - DigitalOcean con PM2
5. **Monitorear** - Logs y estado

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs: `pm2 logs`
2. Verifica el estado: `pm2 status`
3. Reinicia la aplicación: `pm2 restart all`
4. Usa demo mode para probar: `npm run demo`
