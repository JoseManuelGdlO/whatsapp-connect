# WhatsApp API Framework - Frontend

Sistema visual completo para gestionar la API de WhatsApp con una interfaz moderna y fácil de usar.

## 🚀 Características del Sistema

### Backend (API WhatsApp)
- ✅ Gestión de múltiples sesiones de WhatsApp
- ✅ Envío y recepción de mensajes
- ✅ Códigos QR para autenticación
- ✅ Webhooks para mensajes entrantes
- ✅ Persistencia de sesiones
- ✅ Integración con Railway Framework

### Frontend (Angular)
- ✅ **Dashboard** - Vista general del sistema
- ✅ **Gestión de Sesiones** - Crear, configurar y eliminar sesiones
- ✅ **Códigos QR** - Visualización interactiva de códigos QR
- ✅ **Envío de Mensajes** - Interfaz intuitiva para enviar mensajes
- ✅ **Historial de Mensajes** - Visualización de mensajes recientes
- ✅ **Tiempo Real** - Actualización automática de datos
- ✅ **Diseño Responsivo** - Funciona en desktop y móvil
- ✅ **Material Design** - Interfaz moderna y profesional

## 🏗️ Arquitectura

```
framework-api-connect/
├── api-whatsapp/              # Backend API
│   ├── src/
│   │   ├── routes/api.js      # Endpoints de la API
│   │   ├── services/          # Servicios (sessionManager, etc.)
│   │   └── server.js          # Servidor principal
│   └── package.json
└── front-office/              # Frontend Angular
    └── whatsapp-frontend/
        ├── src/
        │   ├── app/
        │   │   ├── components/    # Componentes de la UI
        │   │   └── services/      # Servicios de Angular
        │   └── environments/      # Configuración
        └── package.json
```

## 🚀 Inicio Rápido

### Opción 1: Scripts Automáticos

**Windows:**
```bash
cd front-office
start-dev.bat
```

**Linux/Mac:**
```bash
cd front-office
./start-dev.sh
```

### Opción 2: Manual

1. **Iniciar la API Backend:**
```bash
cd api-whatsapp
npm install
npm start
```

2. **Iniciar el Frontend:**
```bash
cd front-office/whatsapp-frontend
npm install
npm start
```

3. **Abrir en el navegador:**
- Frontend: http://localhost:4200
- API: http://localhost:3000

## 📱 Uso del Sistema

### 1. Dashboard
- Vista general de todas las sesiones activas
- Estadísticas de conexiones
- Acciones rápidas para gestionar el sistema

### 2. Crear Nueva Sesión
1. Ve a "Sessions" en el menú
2. Completa el formulario:
   - **Session ID**: Nombre único para la sesión
   - **Webhook URL**: (Opcional) URL para recibir mensajes
3. Haz clic en "Create Session"
4. Escanea el código QR con WhatsApp Business

### 3. Enviar Mensajes
1. Ve a "Messages" desde una sesión activa
2. Pestaña "Send Message":
   - Ingresa el número (con código de país)
   - Escribe tu mensaje
   - Haz clic en "Send Message"

### 4. Ver Historial
1. Pestaña "Message History"
2. Los mensajes se actualizan automáticamente
3. Puedes refrescar manualmente

## 🔧 Configuración

### Variables de Entorno

**Backend (api-whatsapp/.env):**
```env
PORT=3000
NODE_ENV=development
RAILWAY_API_URL=https://your-railway-app.railway.app/api/process-message
RAILWAY_API_KEY=your-api-key
```

**Frontend (whatsapp-frontend/src/environments/environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### Proxy de Desarrollo
El frontend está configurado con un proxy para evitar problemas de CORS:
```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

## 🎨 Personalización

### Temas y Estilos
- **Material Design**: Tema Indigo-Pink por defecto
- **Responsive**: Adaptable a móviles y tablets
- **Customizable**: Fácil modificación de colores y estilos

### Componentes
- **Modulares**: Cada funcionalidad es un componente independiente
- **Reutilizables**: Componentes diseñados para reutilización
- **Extensibles**: Fácil agregar nuevas funcionalidades

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
cd api-whatsapp
npm run dev

# Frontend
cd front-office/whatsapp-frontend
npm start
```

### Producción
```bash
# Backend
cd api-whatsapp
npm run build
npm start

# Frontend
cd front-office/whatsapp-frontend
npm run build
# Servir archivos estáticos
```

### Docker (Opcional)
```bash
# Backend
cd api-whatsapp
docker build -t whatsapp-api .

# Frontend
cd front-office/whatsapp-frontend
docker build -t whatsapp-frontend .
```

## 📊 Monitoreo

### Logs
- **Backend**: Logs detallados en consola
- **Frontend**: Logs en consola del navegador (F12)

### Estado del Sistema
- **Dashboard**: Estadísticas en tiempo real
- **Sessions**: Estado de cada sesión
- **Health Check**: Endpoint `/health` en la API

## 🔍 Solución de Problemas

### Problemas Comunes

1. **CORS Error**
   - Verifica que el proxy esté configurado
   - Asegúrate de que la API esté en el puerto 3000

2. **QR Code no aparece**
   - Espera unos segundos después de crear la sesión
   - Refresca el diálogo del QR
   - Verifica que la sesión esté creada correctamente

3. **Mensajes no se envían**
   - Verifica que la sesión esté conectada
   - Incluye el código de país en el número
   - Revisa la consola para errores

4. **Sesiones no persisten**
   - Verifica que el directorio `.wwebjs_auth` exista
   - Revisa los permisos de escritura
   - Usa el botón "Restore Sessions"

### Logs Útiles
```bash
# Backend logs
cd api-whatsapp
npm run dev

# Frontend logs (en navegador)
F12 -> Console
```

## 📚 Documentación Adicional

- [API Documentation](../api-whatsapp/README.md)
- [Frontend Documentation](./whatsapp-frontend/README.md)
- [Setup Instructions](../api-whatsapp/SETUP-INSTRUCTIONS.md)
- [Webhook Setup](../api-whatsapp/WEBHOOK-SETUP.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 🆘 Soporte

Si tienes problemas:
1. Revisa la documentación
2. Verifica los logs
3. Comprueba la configuración
4. Abre un issue en GitHub

---

**¡Disfruta usando el sistema de gestión de WhatsApp API!** 🚀
