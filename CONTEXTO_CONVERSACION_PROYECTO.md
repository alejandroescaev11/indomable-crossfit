# CONTEXTO INTEGRAL DEL PROYECTO: INDOMABLE CROSSFIT & TESTIDEA

> **Fecha de Actualización**: Septiembre 2026  
> **Ubicación del Proyecto**: `C:\Users\HP\Desktop\Alejandro\Desarrollos\Antigravity\TestIdea\indomable-crossfit`  
> **Proyecto Firebase**: `app-crossfit-c66a5`  
> **URL Producción Activa**: [https://app-crossfit-c66a5.web.app](https://app-crossfit-c66a5.web.app)  
> **Stack Técnico**: React 18, TypeScript, Tailwind CSS, Vite, PWA (Workbox Service Worker), Firebase Firestore (Live Sync & Offline), OneSignal (Push Web), Google Apps Script / EmailJS (Mailing).

---

## 1. RESUMEN EJECUTIVO Y OBJETIVO

**INDOMABLE** es una Progressive Web App (PWA) de alto rendimiento para la gestión integral de boxes y gimnasios multimodales (CrossFit, Musculación y Entrenamiento Personalizado). Permite el autoservicio de atletas (reservas, historial de marcas RM, cronómetro WOD/Tabata, seguimiento antropométrico, autenticación biométrica) y un panel administrativo completo para entrenadores y administradores con sincronización en tiempo real en la nube.

---

## 2. HISTORIAL COMPLETO DE REQUERIMIENTOS Y CAMBIOS IMPLEMENTADOS

A continuación se detalla cronológicamente todo el trabajo desarrollado en las sesiones:

### 2.1 Estabilidad de Recarga, Marca y Feed de Inicio
- **Corrección de bucle de recarga**: Se eliminó un ciclo infinito de recargas automáticas que afectaba navegadores web y móviles, estabilizando el montaje del Service Worker y el listener de autenticación.
- **Identidad visual general**: Se sustituyeron los logos internos y el icono de la aplicación móvil PWA (`manifest.webmanifest`) por el logo oficial de la marca.
- **Marca INDOMABLE**: Se renombraron los textos y banners de "INDOMABLE CrossFit" a "INDOMABLE" general para abarcar las tres modalidades (CrossFit, Musculación, Personalizado).
- **Tarjeta de Comunidad**: Se ubicó la tarjeta de invitación al grupo de WhatsApp al inicio del feed de bienvenida en formato compacto.

### 2.2 Experiencia Móvil PWA e Instalación
- **Botón de Instalación en Login**: Se añadió el botón para instalar la aplicación directamente desde la pantalla de inicio de sesión (`beforeinstallprompt`).
- **Guía Asistida para iOS / Safari**: Se integró un asistente dinámico que guía al usuario en iPhone/iPad para añadir la app a la pantalla de inicio ("Agregar a pantalla de inicio") para habilitar las notificaciones push de Apple.

### 2.3 Suite de Pruebas Integrales y Limpieza de UI
- **Suite Automatizada E2E (`scripts/run-e2e-tests.ts`)**: Se creó un script ejecutable que valida el 100% de la lógica de dominio sin dependencias de navegador (registro, membresías, aforos, desbloqueo de WOD, notificaciones, purgas, IMC, concurrencia de admin y planes). Cuenta actualmente con **60/60 pruebas superadas**.
- **Limpieza de interfaz**: Se retiraron los botones de prueba/simulación que estaban visibles en el panel de usuario final.
- **Depuración del Historial de Notificaciones**: En el panel de administración se agregó la capacidad de purgar las notificaciones del historial filtrando por:
  - Último día (> 24 horas)
  - Última semana (> 7 días)
  - Último mes (> 30 días)
  - Vaciado total de registros
- **Retiro de botón "Reiniciar Datos"**: Se removió el botón de reseteo a datos de fábrica para proteger los datos reales de atletas y reservas en Firestore.

### 2.4 Sistema de Plantillas y Envío de Correos
- **Plantillas Transaccionales HTML Responsive**:
  1. *Bienvenida al Atleta*: Con número de documento, PIN generado y pasos para completar el pago y activar su plan.
  2. *Activación / Renovación de Membresía*: Con detalles del plan activado, disciplina, fechas de inicio y vencimiento, y saldo de clases si es tiquetera.
- **Servicio Híbrido de Correos (`src/services/emailService.ts`)**:
  - Soporte para **Google Apps Script Webhook** (proveedor recomendado e ilimitado mediante la cuota diaria gratuita de Gmail).
  - Soporte para **EmailJS** como respaldo.
  - Sincronización en la nube de la configuración de correo en Firestore (`config/email_config`).

### 2.5 Temporizador WOD & Reloj Tabata Independiente
- Se implementó un cronómetro profesional completo en [WODTimerView.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/athlete/WODTimerView.tsx) accesible para todos los atletas:
  - **TABATA**: Intervalos configurables de trabajo (work), descanso (rest) y número de rondas.
  - **EMOM**: Every Minute on the Minute con pitidos auditivos en cuenta regresiva.
  - **AMRAP**: As Many Rounds as Possible con cuenta atrás configurable.
  - **FOR TIME**: Cronómetro progresivo con control de Time Cap.
  - Totalmente desacoplado del WOD del día para uso libre en open box o musculación.
  - **Acceso exclusivo**: Retirado del feed de inicio; su acceso se realiza exclusivamente a través de la barra de navegación inferior (`Reloj`).

### 2.6 Concurrencia de Administrador y Seguridad Multi-Admin
- **Control de Sesión Única (Single-Session Lock)**:
  - Si un usuario administrador tiene la sesión activa en un dispositivo y alguien intenta iniciar sesión con ese mismo usuario en otro dispositivo, el sistema le notifica:  
    *"El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta."*
  - **Protección de sesión previa**: El intento no mata ni interrumpe la sesión del usuario original para prevenir pérdida de datos o procesos en marcha.
  - **Detección de inactividad / Heartbeat**: Si una sesión permanece inactiva por más de 3 minutos sin latido, se desbloquea de forma segura.
  - **Liberación forzada**: Se incluye la opción de liberación de cuenta desde el panel de control.
- **Soporte Multi-Admin**: La base de datos y la vista de Staff permiten crear múltiples administradores independientes para delegar responsabilidades sin compartir credenciales.

### 2.7 Visualización de Participantes de Clases sin Reserva Previa
- En [UnifiedWODBookingView.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/athlete/UnifiedWODBookingView.tsx), cualquier atleta puede pulsar sobre `"Atletas: X / Y"` en cualquier franja (mañana o tarde/noche) para consultar en un modal la lista completa de atletas inscritos con sus nombres, avatares y disciplinas, aun sin tener reserva en esa franja.
- Si el usuario consultante ya reservó, se le resalta con una insignia `"Tú"`.

### 2.8 Tarjeta de Membresía del Atleta en Grande
- En [WelcomeFeedView.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/athlete/WelcomeFeedView.tsx), el contador de días restantes del plan se presenta con números gigantes (`font-teko text-4xl sm:text-5xl`), bordes luminosos degradados y estados de color (verde esmeralda si está activo, ámbar si está por vencer en 3 días o menos, rojo si está vencido).

### 2.9 Desglose de Atletas por Disciplina para el Administrador
- En [AthleteManagementView.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/coach/AthleteManagementView.tsx), se añadieron tarjetas de métricas en la parte superior con el conteo exacto de atletas en:
  - **CrossFit**: Conteo en tiempo real e icono de llama.
  - **Musculación**: Conteo en tiempo real e icono de mancuerna.
  - **Personalizado**: Conteo en tiempo real e icono de actividad física.
- Al pulsar cualquiera de estas tarjetas, el listado de atletas se filtra instantáneamente por dicha modalidad.

### 2.10 Gestión Dinámica de Planes y Tarifas (CRUD con Firestore)
- Se creó la colección `membershipPlans` en Firestore.
- Se implementó el componente [PlanManagementModal.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/coach/PlanManagementModal.tsx) que permite al administrador:
  - Crear nuevos planes y tarifas (nombre, disciplina, precio en COP, vigencia en días, tipo tiquetera por clases, descripción, estado activo/inactivo).
  - Modificar tarifas, duración o condiciones de planes existentes.
  - Activar/desactivar o eliminar planes.
- Los selectores de planes en los modales de **Registrar Atleta** y **Renovar Membresía** leen dinámicamente de estos planes.

### 2.11 Limpieza y Renombramiento de Pestañas
- Se eliminó el texto explicativo de "¿Cómo funciona la gestión de usuarios en INDOMABLE CrossFit?".
- Se renombró la pestaña administrativa de **"Gestión Coaches"** a **"Gestión Coaches y Admins"** en [CoachDashboard.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/coach/CoachDashboard.tsx).
- Se simplificó el menú desplegable del Header para el Administrador en [Header.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/common/Header.tsx):
  - Se retiraron los accesos duplicados de WhatsApp y cambio de clave.
  - El botón de **"Cambiar Clave de Admin"** y su modal se reubicaron en [CoachUserManagementView.tsx](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/src/components/coach/CoachUserManagementView.tsx).

---

## 3. ARQUITECTURA DE DATOS Y FLUJOS PRINCIPALES

### 3.1 Colecciones en Firebase Firestore

| Colección | Descripción | Sincronización |
| :--- | :--- | :--- |
| `athletes` | Directorio de atletas (cédula, PIN, disciplina, membresía, vigencia, saldo de clases). | En vivo (`onSnapshot`) |
| `membershipPlans` | Planes y tarifas de CrossFit, Musculación y Personalizado creados por el admin. | En vivo (`onSnapshot`) |
| `slots` | Franjas horarias de clases (aforos, cupos reservados, IDs de inscritos). | En vivo (`onSnapshot`) |
| `wods` | WODs programados por fecha con calentamiento, fuerza, metcon y notas. | En vivo (`onSnapshot`) |
| `coaches` | Cuentas de staff, entrenadores y administradores secundarios. | En vivo (`onSnapshot`) |
| `rms` | Récords máximos de levantamientos por atleta (PRs). | En vivo (`onSnapshot`) |
| `wodLogs` | Registros de marcas y tiempos de entrenamientos completados por atletas. | En vivo (`onSnapshot`) |
| `anthropometry` | Mediciones corporales e IMC histórico de atletas. | En vivo (`onSnapshot`) |
| `flyers` | Banners de anuncios y novedades para la pantalla de inicio. | En vivo (`onSnapshot`) |
| `config` | Documentos: `admin_config`, `admin_session`, `coach_config`, `email_config`, `gym_settings`. | En vivo (`onSnapshot`) |

### 3.2 Roles de Acceso en el Sistema

1. **Atleta (`role: 'athlete'`)**:
   - Acceso con Cédula (Documento) y PIN de 4 dígitos (o huella / Face ID).
   - Reserva de cupos en clases, visualización de participantes, cronómetro WOD/Tabata, registro de marcas, visualización del WOD (desbloqueado 1 hora antes de la clase si tiene reserva confirmada).
2. **Entrenador / Coach (`role: 'coach'`)**:
   - Acceso con usuario y contraseña (o PIN rápido de coach).
   - Creación y edición del WOD diario, pase de lista de asistencia en clases, consulta de atletas, reseteo de PIN de atletas.
3. **Administrador (`role: 'admin'`)**:
   - Acceso con credenciales maestras protegidas por control de sesión única.
   - Aprobación y activación de membresías, gestión de tarifas y planes, gestión de equipo de coaches y administradores, configuración de correo y WhatsApp, auditoría y purga de historiales.

---

## 4. COMANDOS DEL PROYECTO

Todos los comandos se ejecutan desde el directorio raíz del proyecto:  
`C:\Users\HP\Desktop\Alejandro\Desarrollos\Antigravity\TestIdea\indomable-crossfit`

```bash
# 1. Iniciar servidor de desarrollo local
npm run dev

# 2. Verificación estricta de TypeScript (sin emitir código)
npx tsc --noEmit

# 3. Ejecutar la suite completa de pruebas integrales (60/60 tests)
npx tsx scripts/run-e2e-tests.ts

# 4. Compilar versión para producción (HTML, CSS, JS, PWA Service Worker)
npm run build

# 5. Desplegar en Firebase Hosting en vivo
npx firebase-tools deploy --only hosting
```

---

## 5. GUÍA PARA CAMBIO DE CUENTA DE GOOGLE APPS SCRIPT (CORREOS)

Cuando se desee cambiar la cuenta de Gmail que despacha los correos automáticos:

1. Iniciar sesión en el navegador con la **NUEVA cuenta de Google**.
2. Ir a [https://script.google.com](https://script.google.com) y crear un **Nuevo proyecto**.
3. Pegar el código contenido en `scripts/google-apps-script-email.gs`.
4. Guardar (`Ctrl + S`) y hacer clic en **Implementar > Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
5. Autorizar los permisos en la cuenta de Google.
6. Copiar la URL generada (la que termina en `/exec`).
7. Pegar la nueva URL en el panel de INDOMABLE (**Ajustes de Notificaciones y Correos > URL de la Aplicación Web**) o suministrarla al asistente para que la guarde en la configuración global de Firestore.

---

## 6. ARCHIVOS CLAVE DEL PROYECTO

- `src/types/index.ts`: Definición de interfaces TypeScript (`MembershipPlan`, `AthleteProfile`, `ClassSlot`, etc.).
- `src/context/GymContext.tsx`: Estado global de la app, autenticación, control de sesiones y llamadas a Firestore.
- `src/services/firestoreService.ts`: Suscripciones en vivo y mutaciones con la base de datos Firestore.
- `src/services/emailService.ts`: Generación de plantillas y despacho de correos vía Apps Script / EmailJS.
- `src/components/athlete/UnifiedWODBookingView.tsx`: Calendario de reservas y visualización de participantes de clases.
- `src/components/athlete/WelcomeFeedView.tsx`: Pantalla de inicio de atletas con tarjeta destacada de membresía.
- `src/components/athlete/WODTimerView.tsx`: Temporizador WOD (Tabata, EMOM, AMRAP, For Time).
- `src/components/coach/AthleteManagementView.tsx`: Directorio de atletas y desglose por disciplina.
- `src/components/coach/PlanManagementModal.tsx`: Modal CRUD de planes y tarifas.
- `src/components/coach/CoachUserManagementView.tsx`: Gestión de staff, administradores y cambio de clave maestra.
- `scripts/google-apps-script-email.gs`: Código fuente del Webhook de Apps Script para Google.
- `scripts/run-e2e-tests.ts`: Suite de pruebas unitarias e integrales del box.
- `ARCHITECTURE_REPLICATION_GUIDE.md`: Guía de replicación de esta arquitectura para futuros proyectos.
