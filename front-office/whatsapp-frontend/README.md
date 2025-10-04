# WhatsApp API Frontend

Una interfaz visual moderna para gestionar la API de WhatsApp, construida con Angular y Angular Material.

## 🚀 Características

- ✅ **Dashboard** - Vista general de todas las sesiones
- ✅ **Gestión de Sesiones** - Crear, configurar y eliminar sesiones
- ✅ **Códigos QR** - Visualización de códigos QR para autenticación
- ✅ **Envío de Mensajes** - Interfaz para enviar mensajes
- ✅ **Historial de Mensajes** - Ver mensajes recientes
- ✅ **Tiempo Real** - Actualización automática de datos
- ✅ **Diseño Responsivo** - Funciona en desktop y móvil

## 🛠️ Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- La API de WhatsApp ejecutándose en el puerto 3000

### Pasos

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar la API**
Asegúrate de que la API de WhatsApp esté ejecutándose en `http://localhost:3000`

3. **Ejecutar en desarrollo**
```bash
npm start
```

4. **Abrir en el navegador**
```
http://localhost:4200
```

## 📱 Uso

### Dashboard
- Vista general de todas las sesiones activas
- Estadísticas de conexiones
- Acciones rápidas

### Gestión de Sesiones
1. **Crear Nueva Sesión**
   - Ingresa un ID de sesión único
   - Opcionalmente configura un webhook URL
   - Haz clic en "Create Session"

2. **Autenticar con QR**
   - Se mostrará un código QR
   - Escanea con WhatsApp Business
   - La sesión se conectará automáticamente

3. **Gestionar Sesiones**
   - Ver estado de conexión
   - Configurar webhooks
   - Eliminar sesiones

### Envío de Mensajes
1. Ve a la pestaña "Send Message"
2. Ingresa el número de teléfono (con código de país)
3. Escribe tu mensaje
4. Haz clic en "Send Message"

### Historial de Mensajes
- Ve a la pestaña "Message History"
- Los mensajes se actualizan automáticamente cada 10 segundos
- Puedes refrescar manualmente

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

Para producción, actualiza `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com'
};
```

### Proxy de Desarrollo

El archivo `proxy.conf.json` está configurado para redirigir las llamadas a la API:

```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── sessions/           # Gestión de sesiones
│   │   ├── messages/           # Envío y visualización de mensajes
│   │   └── qr-dialog/          # Diálogo para códigos QR
│   ├── services/
│   │   └── whatsapp-api.service.ts  # Servicio para la API
│   ├── app.routes.ts           # Configuración de rutas
│   └── app.config.ts           # Configuración de la app
├── environments/               # Variables de entorno
└── styles.scss                 # Estilos globales
```

## 🎨 Personalización

### Temas
El proyecto usa Angular Material con el tema Indigo-Pink. Puedes cambiar el tema en `src/styles.scss`:

```scss
@import '@angular/material/theming';

$primary: mat-palette($mat-indigo);
$accent: mat-palette($mat-pink, A200, A100, A400);
$warn: mat-palette($mat-red);

$theme: mat-light-theme((
  color: (
    primary: $primary,
    accent: $accent,
    warn: $warn,
  )
));

@include angular-material-theme($theme);
```

### Estilos
Los estilos están organizados en:
- `src/styles.scss` - Estilos globales
- `src/app/app.scss` - Estilos del componente principal
- Cada componente tiene su propio archivo `.scss`

## 🚀 Despliegue

### Build para Producción
```bash
npm run build
```

### Servir Archivos Estáticos
```bash
npm install -g http-server
cd dist/whatsapp-frontend
http-server -p 4200
```

### Docker (Opcional)
```dockerfile
FROM nginx:alpine
COPY dist/whatsapp-frontend /usr/share/nginx/html
EXPOSE 80
```

## 🔍 Solución de Problemas

### Error de CORS
- Asegúrate de que el proxy esté configurado correctamente
- Verifica que la API esté ejecutándose en el puerto correcto

### QR Code no se muestra
- Verifica que la sesión esté creada correctamente
- Espera unos segundos para que se genere el QR
- Refresca el diálogo del QR

### Mensajes no se envían
- Verifica que la sesión esté conectada
- Asegúrate de incluir el código de país en el número
- Revisa la consola del navegador para errores

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que la API esté ejecutándose
3. Comprueba la configuración del proxy
4. Revisa los logs de la API

## 📄 Licencia

MIT License