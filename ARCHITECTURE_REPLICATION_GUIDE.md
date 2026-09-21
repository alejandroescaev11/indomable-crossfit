# Blueprint y Guía Maestra de Replicación de Arquitectura
## De: Box INDOMABLE (CrossFit, Musculación & Personalizado)
### Para: Nuevas Aplicaciones Web Progresivas (PWA) de Alto Rendimiento

Esta guía documenta la arquitectura técnica integral desarrollada y optimizada para **INDOMABLE**, diseñada para ser clonada o replicada en nuevos proyectos que requieran:
- **Funcionamiento Offline de Alta Disponibilidad** (PWA móvil instalable).
- **Cero Costos de Infraestructura Inicial** (Firebase Spark tier + Google Apps Script + OneSignal Free).
- **Sincronización en Tiempo Real Multidispositivo** sin servidores dedicados.
- **Autenticación Biométrica Nativa (WebAuthn / Passkeys)**.
- **Control de Concurrencia de Sesión Única de Administrador** sin matar sesiones activas.
- **Temporizadores WOD con Web Audio API y Screen Wake Lock**.

---

## 1. Stack Tecnológico Base

| Capa | Tecnología / Herramienta | Razón de Selección |
|---|---|---|
| **Lenguaje** | TypeScript 5.8+ | Tipado estricto de modelos de dominio y contratos de API. |
| **Framework UI** | React 19 + Vite 8 | Renderizado ultrarrápido, compilación en submilisegundos y soporte moderno de hooks. |
| **Estilos** | Tailwind CSS v4 | Motor CSS compilado en tiempo de compilación con `@theme`, variables nativas y modo oscuro. |
| **Iconografía** | Lucide React | Paquete ligero de iconos vectoriales consistentes. |
| **Base de Datos** | Google Cloud Firestore (Modular SDK v11+) | Base de datos NoSQL con sincronización en tiempo real (`onSnapshot`) y caché local persistente en IndexedDB. |
| **PWA & Caché** | Vite Plugin PWA + Workbox | Generación automática de Service Worker, instalación Standalone y caché offline de assets. |
| **Notificaciones Push** | OneSignal REST API | Envíos push segmentados y directos a navegadores y móviles. |
| **Correos Transaccionales** | Google Apps Script (Webhook `doPost`) | Alternativa gratuita a EmailJS (100 - 1500 correos diarios con Gmail). |
| **APIs del Navegador** | WebAuthn, Screen Wake Lock, Web Audio API | Experiencia nativa en móviles sin necesidad de empaquetar con Cordova/Capacitor. |

---

## 2. Estructura de Directorios del Proyecto

Al replicar esta arquitectura, reproduce la siguiente estructura modular:

```plaintext
├── public/
│   ├── favicon.ico
│   ├── icon-192.png                # Icono PWA para pantalla de inicio móvil (192x192)
│   ├── icon-512.png                # Icono PWA splash screen y tienda (512x512)
│   └── screenshot-mobile.png
├── scripts/
│   ├── google-apps-script-email.gs # Código Google Apps Script para Webhook de correos
│   ├── GOOGLE_APPS_SCRIPT_SETUP.md # Manual de despliegue del Webhook
│   └── run-e2e-tests.ts            # Suite de pruebas integrales de dominio (TSX)
├── src/
│   ├── components/
│   │   ├── athlete/                # Vistas y componentes del perfil Atleta
│   │   │   ├── AthleteBookingsView.tsx
│   │   │   ├── AthleteWODView.tsx
│   │   │   ├── AnthropometryAthleteView.tsx
│   │   │   ├── WODTimerView.tsx    # Reloj / Cronómetro / Tabata independiente
│   │   │   └── WelcomeFeedView.tsx # Feed inicial, accesos rápidos y tarjeta comunitaria
│   │   ├── coach/                  # Vistas y componentes del perfil Coach / Admin
│   │   │   ├── CoachDashboard.tsx  # Panel principal, métricas y configuración
│   │   │   ├── CoachUserManagementView.tsx # Gestión de Atletas, Staff y Roles
│   │   │   ├── AnthropometryCoachView.tsx
│   │   │   └── WODScheduleCoachView.tsx
│   │   ├── auth/                   # Modales de autenticación, biometría y PIN
│   │   │   └── PasskeyPromptModal.tsx
│   │   └── shared/                 # Componentes reutilizables (Modales, Badges, Botones)
│   ├── context/
│   │   └── GymContext.tsx          # Corazón reactivo: estado global, listeners y acciones
│   ├── services/
│   │   ├── firebase.ts             # Inicialización de Firebase con persistencia IndexedDB
│   │   ├── firestoreService.ts     # CRUD y listeners desacoplados de Firestore
│   │   ├── emailService.ts         # Orquestador de correos (Apps Script / EmailJS / Simulación)
│   │   ├── pushService.ts          # Integración directa con OneSignal REST API
│   │   └── webauthnService.ts      # Manejo de Passkeys y biometría nativa
│   ├── types/
│   │   └── index.ts                # Contratos y tipos de datos TypeScript compartidos
│   ├── utils/
│   │   ├── audioUtils.ts           # Sintetizador Web Audio API para alertas audibles
│   │   └── notificationUtils.ts    # Lógica de cálculo de membresías y vigencias
│   ├── App.tsx                     # Orquestador de navegación, tabs y autenticación
│   ├── main.tsx                    # Punto de entrada de React con registro PWA
│   └── index.css                   # Configuración de Tailwind CSS v4 (@import "tailwindcss")
├── package.json
├── tsconfig.json
├── vite.config.ts                  # Configuración de Vite y VitePWA
└── firebase.json                   # Configuración de Firebase Hosting
```

---

## 3. Patrones Clave de Implementación

### 3.1. Firebase Firestore con Caché Persistente Multi-Pestaña
Para lograr una experiencia instantánea y funcionamiento sin conexión, inicializa Firestore con `persistentLocalCache` y `persistentMultipleTabManager`:

```typescript
// src/services/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```
> **Beneficio**: Si el usuario abre la app en el ascensor o sin cobertura móvil, la aplicación lee directamente de IndexedDB sin pantallas de carga en blanco. Cuando recupera la red, Firestore sincroniza automáticamente las escrituras pendientes.

---

### 3.2. Control de Concurrencia de Sesión Única de Administrador
Permite que solo un dispositivo mantenga activa la sesión de un administrador en un momento dado, **sin terminar la sesión activa del primer usuario**:

```
[Dispositivo A - En Uso]               [Firestore: adminSessions/admin]           [Dispositivo B - Intento Login]
         |                                           |                                           |
         |-- Inicia Sesión ------------------------->| (Guarda sessionId A y timestamp actual)    |
         |-- Heartbeat periódico (cada 35s) -------->| (Actualiza lastHeartbeat)                 |
         |                                           |                                           |
         |                                           |<-- Intenta iniciar sesión con 'admin' ----|
         |                                           |-- Comprueba: ¿Hay lock activo (< 3m)? --->|
         |                                           |   Respuesta: SÍ, pertenece a A            |
         |                                           |-- RECHAZA acceso con mensaje de aviso --->|
         |                                           |   (NO SOBREESCRIBE ni mata sesión A)      |
         |                                           |                                           |
         |-- Cierre de sesión voluntario ----------->| (Elimina o libera sessionId A)            |
         |                                           |<-- Reintento de login --------------------|
         |                                           |-- ADMITE acceso y asigna a B ------------>|
```

#### Código del Mecanismo (Firestore Service):
```typescript
// src/services/firestoreService.ts
const ADMIN_SESSION_HEARTBEAT_TIMEOUT_MS = 180000; // 3 minutos

export const checkAdminSessionLock = async (username: string, mySessionId?: string) => {
  const docRef = doc(db, 'adminSessions', username.toLowerCase());
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { isLocked: false };

  const lock = snap.data();
  if (!lock || !lock.activeSessionId || lock.activeSessionId === mySessionId) {
    return { isLocked: false, lock };
  }

  const lastHb = new Date(lock.lastHeartbeat || 0).getTime();
  const isStillActive = Date.now() - lastHb < ADMIN_SESSION_HEARTBEAT_TIMEOUT_MS;

  if (isStillActive) {
    return {
      isLocked: true,
      lock,
      message: 'El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta.',
    };
  }

  return { isLocked: false, lock };
};
```

---

### 3.3. Webhook Gratuito de Correos con Google Apps Script
Para evitar los límites estrictos de proveedores de correo como EmailJS (200 correos/mes en plan gratuito), se utiliza Google Apps Script como un microservicio serverless que aprovecha la cuota de Gmail (100 correos/día para @gmail.com personales y 1500/día para Google Workspace).

#### Código del Webhook (`google-apps-script-email.gs`):
```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to_email;
    var subject = data.subject;
    var htmlBody = data.message_html;
    
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: "INDOMABLE CrossFit"
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

#### Envío desde el Cliente sin Bloqueo CORS:
```typescript
// src/services/emailService.ts
await fetch(appsScriptWebhookUrl, {
  method: 'POST',
  mode: 'no-cors', // Evita preflight OPTIONS bloqueado por redirección de Google
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    to_email: recipientEmail,
    to_name: recipientName,
    subject: emailSubject,
    message_html: emailHtmlBody,
    type: 'welcome'
  }),
});
```

---

### 3.4. Temporizador WOD (Web Audio API + Screen Wake Lock)
Para atletas que entrenan rutinas de Tabata, EMOM, AMRAP o For Time:
1. **Screen Wake Lock**: Mantiene la pantalla encendida para que el teléfono no se suspenda durante una serie.
2. **Web Audio API**: Sintetiza tonos puros (440Hz y 880Hz) directamente en el procesador de audio del dispositivo, eliminando dependencias de archivos `.mp3` que pueden fallar sin conexión.

```typescript
// Sintetizador de tonos puro en memoria
export const playBeep = (freq = 880, durationMs = 150, type: OscillatorType = 'sine') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('AudioContext no soportado:', e);
  }
};
```

---

### 3.5. Autenticación Biométrica (WebAuthn / Passkeys) sin Backend Complejo
Permite a los usuarios acceder tocando el sensor de huella o FaceID sin requerir contraseña o PIN cada vez:

```typescript
// Registro de credencial biométrica local
export const registerBiometricPasskey = async (userId: string, userName: string) => {
  if (!window.PublicKeyCredential) throw new Error('Biometría no soportada');

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Box INDOMABLE', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
      },
      timeout: 60000,
    },
  });

  return credential;
};
```

---

## 4. Guía Paso a Paso para Iniciar un Nuevo Proyecto Replicado

Sigue estos pasos en la terminal para levantar un clon de esta arquitectura en un nuevo directorio:

### Paso 1: Crear proyecto Vite con React 19 y TypeScript
```bash
npm create vite@latest mi-nueva-app -- --template react-ts
cd mi-nueva-app
```

### Paso 2: Instalar dependencias requeridas
```bash
npm install firebase lucide-react
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa tsx
```

### Paso 3: Configurar Tailwind CSS v4
En `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Mi Nueva Aplicación PWA',
        short_name: 'MiApp',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

En `src/index.css`:
```css
@import "tailwindcss";

@layer base {
  body {
    background-color: #09090b;
    color: #f4f4f5;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}
```

### Paso 4: Inicializar Firebase Hosting
```bash
npx firebase login
npx firebase init hosting
# Selecciona "dist" como directorio público
# Configura como Single-Page App (reescribir URLs a /index.html): Sí
```

### Paso 5: Desplegar a Producción
```bash
npm run build
npx firebase deploy --only hosting
```

---

## 5. Pruebas Automatizadas de Dominio

La aplicación incluye un script autónomo en `scripts/run-e2e-tests.ts` que valida 49 reglas de negocio sin requerir navegadores pesados ni emuladores:
- Validación de formatos de documento y PIN.
- Concurrencia de reservas y bloqueos de sobrecupo.
- Regla condicional de revelado de WOD del día (1 hora antes).
- Control de sesión única de administrador con latidos y expiración.
- Validación de payloads para webhooks de correo de Google Apps Script.

Para ejecutar la suite en cualquier momento:
```bash
npx tsx scripts/run-e2e-tests.ts
```

---

## 6. Resumen de Seguridad y Resiliencia

1. **Protección de Datos en Tránsito y Reposo**: Firestore maneja encriptación TLS y AES-256 en reposo.
2. **Sin Fuga de Credenciales**: Las claves maestras se manejan en Firestore bajo documentos con reglas de seguridad restrictivas.
3. **Persistencia Dual**: Si la conexión se interrumpe durante el guardado de una reserva, la mutación se almacena en la cola local de IndexedDB y se sincroniza automáticamente al reconectarse.
4. **Respeto a la Sesión Activa del Administrador**: El bloqueo de concurrencia protege al usuario que está trabajando activamente en caja o control de acceso en el Box, impidiendo que otro usuario cierre su sesión accidentalmente desde otro dispositivo.
