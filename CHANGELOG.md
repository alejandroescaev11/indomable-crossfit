# 📋 BITÁCORA DE DESARROLLO — INDOMABLE CrossFit App

> **Propósito:** Este archivo documenta de forma cronológica todos los cambios aplicados a la aplicación, consideraciones técnicas importantes, decisiones de arquitectura y notas para cualquier desarrollador que ingrese al proyecto.
>
> **Regla de oro:** Cada vez que se realice un cambio relevante (feature, bugfix, refactor, deploy), se debe añadir una entrada en este archivo **antes** de hacer el commit.

---

## 🏗️ CONTEXTO DEL PROYECTO

**Aplicación:** INDOMABLE CrossFit — PWA de gestión de Box de CrossFit  
**URL de Producción:** https://app-crossfit-c66a5.web.app  
**Firebase Project:** `app-crossfit-c66a5`  
**Stack:**
- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- Firebase (Firestore + Hosting)
- Vite Plugin PWA (modo `generateSW`)
- OneSignal (push notifications)
- Lucide React (iconografía)

**Arquitectura:** SPA con gestión de estado via `GymContext` (React Context + Firestore realtime). Sin router externo (navegación por `useState`).

---

## ⚠️ CONSIDERACIONES CRÍTICAS PARA DESARROLLADORES

### 1. Variables de Entorno
- **NUNCA** subir el archivo `.env` ni `.env.production` a GitHub. Ya están excluidos en `.gitignore`.
- Copiar `.env.example` como `.env` y completar con los valores reales del panel de Firebase.
- Las variables `VITE_*` son expuestas al cliente (comportamiento normal de Vite); no almacenar datos realmente secretos en ellas.
- La Firebase API Key de este proyecto es de **uso público** (correctamente protegida con reglas de Firestore/Security Rules).

### 2. Despliegue
- El proceso de despliegue es siempre: `npm run build` → `npx firebase-tools deploy --only hosting`.
- El build genera el SW (Service Worker) y los assets en `/dist`.
- **NO** subir la carpeta `dist/` ni `dev-dist/` al repositorio (excluidas en `.gitignore`).

### 3. Firestore Security Rules
- Las reglas actuales (`firestore.rules`) permiten lectura/escritura abierta. **PENDIENTE: Restringir antes de producción masiva.**
- Los datos de atletas incluyen información personal (CC, EPS, contacto de emergencia). Manejar con cuidado de privacidad.

### 4. Usuarios y Roles
El sistema maneja 4 tipos de sesión, todos gestionados por `GymContext`:
| Rol | Acceso |
|---|---|
| `admin` | Panel completo: Atletas, Clases, Contabilidad, Información |
| `coach` | Panel: Atletas (solo lectura membresías), Clases, Timer |
| `athlete` | Feed, Clases (según disciplina), Marcas, Timer |
| `'TEST-001'` | Atleta de demo, accesible desde pantalla de mantenimiento con contraseña |

### 5. Modo Mantenimiento
- Se activa/desactiva desde: **Admin → pestaña INFORMACIÓN → subpestaña Mantenimiento**.
- Solo `admin` y el usuario demo (`documentId === 'TEST-001'`) pueden acceder al sitio en mantenimiento.
- La contraseña del usuario de prueba está en `MaintenanceView.tsx` como lista de valores válidos (no en Firestore).

### 6. Contabilidad & Google Sheets
- Cada renovación/aprobación de membresía genera automáticamente una `AccountingTransaction` en Firestore (`accounting_transactions`).
- Si está configurado el webhook (`gymSettings.googleSheetsAccountingWebhookUrl`), la transacción se envía también a Google Sheets mediante un Google Apps Script (ver `accountingService.ts`).
- El script de Apps Script está embebido en el código como `GOOGLE_APPS_SCRIPT_TEMPLATE` para que el admin lo copie y pegue.

### 7. Pagos
- **No hay pasarela de pagos integrada.** El flujo es: atleta sube comprobante de transferencia → admin aprueba manualmente.
- Las cuentas bancarias del Box se configuran en `gymSettings` (Firestore) desde el panel de admin.
- Métodos soportados: Nequi, Daviplata, Bancolombia, Bre-B.

---

## 📅 HISTORIAL DE CAMBIOS

### v0.9.0 — 2026-09-23
**Rama/Commit:** `feat/google-apps-script-email-and-plan-fixes`

#### ✨ Cambios
- **[emailService.ts]**: Migración total de envío de correos transaccionales a Google Apps Script Webhook (`https://script.google.com/macros/s/AKfycbzsBATTjDU5EMlckuncNPMR-aZ0jsDVgBQ5z3iGJ3Qq6laAQl98q0wXm_stY0mZ_v9m/exec`). Se removió la implementación de EmailJS.
- **[GymContext.tsx]**:
  - **Persistencia de Planes**: Corregida la sincronización de planes para evitar la re-siembra accidental de planes por defecto tras eliminaciones o modificaciones de admin (vía flag `_plans_seeded` en localStorage).
  - **Planes a $0**: Solucionado error en resolución de precios donde `0` se evaluaba como falsy (`matchingPlan.price ?? defaultPrice`). Ahora se registran correctamente renovaciones con monto $0.
  - **Restricción de Cuentas Admin**: Las cuentas adicionales de Staff creadas en "Gestión de Coaches" con rol `admin` ya no tienen acceso al panel de Administrador General. Únicamente la cuenta Maestra tiene acceso Administrador.
  - **Fecha Inicial de Renovación**: Añadido soporte para parámetro `customStartDate` en `renewAthleteMembership` y `approveAthleteMembership`.
- **[App.tsx]**: Renombrada la pestaña **"WOD"** a **"RESERVAS"**, reubicada en el centro de la barra de navegación inferior del atleta con un diseño destacado (gradiente carmesí, elevación e icono `CalendarCheck`).
- **[AthleteManagementView.tsx]**: Añadido campo editable de **Fecha de Inicio** en el modal de renovación/aprobación de membresías con cálculo automático de la fecha de vencimiento final.
- **[ProgressPhotosReelView.tsx]**: Confirmación de borrado de fotografías de progreso de atletas de plan personalizado habilitada.

#### 🗂️ Archivos Modificados
- `src/services/emailService.ts`
- `src/context/GymContext.tsx`
- `src/App.tsx`
- `src/components/coach/AthleteManagementView.tsx`
- `src/components/athlete/ProgressPhotosReelView.tsx`

---

### v0.8.0 — 2026-09-21
**Rama/Commit:** `feat/carrete-fotos-progreso-antes-despues`

#### ✨ Cambios
- **[ProgressPhotosReelView.tsx]** Nuevo componente completo de seguimiento visual para el Plan Personalizado con:
  - **Carrete Cronológico**: Galería organizada por fechas con etiquetas de postura (*Frente, Perfil, Espalda, Libre*), peso de referencia y notas de observación.
  - **Comparador Interactivo Antes / Después**: Selector dinámico de fotografías para visualización lado a lado (Side-by-Side), cálculo automático de días y semanas transcurridos, y variación neta de peso.
  - **Subida Optimizada de Fotos**: Selector de cámara/archivo con compresión client-side automática (`compressImageFile`) para optimizar almacenamiento y velocidad.
  - **Visor Fullscreen**: Modo de pantalla completa de alta resolución para inspección detallada.
- **[AnthropometryView.tsx]** Añadido selector superior de subsecciones: **"Carrete & Antes/Después"** y **"Medidas Antropométricas"**.
- **[GymContext.tsx & firestoreService.ts]** Sincronización en tiempo real de la colección `progress_photos` en Firestore y almacenamiento local en `localStorage`.
- **[types/index.ts]** Definidos tipos `ProgressPhoto` y `ProgressPhotoPose`.

#### 🗂️ Archivos Modificados / Creados
- `src/components/athlete/ProgressPhotosReelView.tsx` [NUEVO]
- `src/components/athlete/AnthropometryView.tsx`
- `src/context/GymContext.tsx`
- `src/services/firestoreService.ts`
- `src/types/index.ts`

---

### v0.7.0 — 2026-09-21
**Rama/Commit:** `feat/ingreso-solo-en-inicio`

#### ✨ Cambios
- **[App.tsx]** Botón flotante de "Ingreso al Box" (torniquete) para atletas ahora solo se muestra en el menú **Inicio** (`athleteTab === 'feed'`). Se oculta automáticamente en las demás pestañas para no obstruir la navegación.

#### 🗂️ Archivos Modificados
- `src/App.tsx`

---

### v0.6.0 — 2026-09-21
**Rama/Commit:** `feat/sesion-6-ajustes`

#### ✨ Cambios
1. **[AthleteCheckInModal.tsx]** Temporizador de torniquete reducido de 10 a **5 segundos**.
2. **[CoachDashboard.tsx]** Barra superior de control de mantenimiento eliminada. El control queda exclusivamente en pestaña **INFORMACIÓN > Mantenimiento & Ajustes**.
3. **[CoachDashboard.tsx]** Añadida confirmación explícita (`window.confirm`) al activar y desactivar el modo mantenimiento.
4. **[MaintenanceView.tsx]** Botón "Explorar como Usuario de Prueba" ahora abre un modal que solicita contraseña antes de otorgar acceso. Contraseñas válidas: `demo123`, `1234`.

#### 🗂️ Archivos Modificados
- `src/components/athlete/AthleteCheckInModal.tsx`
- `src/components/coach/CoachDashboard.tsx`
- `src/components/common/MaintenanceView.tsx`

---

### v0.5.0 — 2026-09-21
**Rama/Commit:** `feat/sesion-5-ajustes`

#### ✨ Cambios
1. **[WelcomeFeedView.tsx]** Botón "Pagar / Renovar Plan" eliminado del feed de bienvenida del atleta.
2. **[Header.tsx]** Añadida opción "💳 Renovar / Pagar Plan" en el menú desplegable del perfil del atleta.
3. **[GymContext.tsx]** Añadidos `isPaymentModalOpen`, `openPaymentModal`, `closePaymentModal` y función `loginAsTestUser()` con perfil demo completo (`TEST-001`).
4. **[App.tsx]** Conectado `PaymentModal` al contexto global. Lógica de bypass de mantenimiento para `admin` y usuario `TEST-001`.
5. **[PaymentModal.tsx]** Eliminada pasarela Wompi y campo de número de aprobación. Conservadas cuentas directas (Nequi, Daviplata, Bancolombia, Bre-B) con copia rápida y carga de comprobante con compresión.

#### 🗂️ Archivos Modificados
- `src/components/athlete/WelcomeFeedView.tsx`
- `src/components/common/Header.tsx`
- `src/context/GymContext.tsx`
- `src/App.tsx`
- `src/components/athlete/PaymentModal.tsx`

---

### v0.4.0 — Sesiones previas
**Rama/Commit:** `feat/modulo-contabilidad`

#### ✨ Cambios
- Módulo de contabilidad para administradores con filtros por período (hoy, 7 días, mes, mes anterior, rango personalizado, todo).
- Integración con Google Sheets via webhook de Google Apps Script (ver `accountingService.ts`).
- Cada renovación/aprobación de plan genera transacción automática en Firestore y opcionalmente en Google Sheets.
- Soporte para registro manual de ingresos y egresos.
- Visualización de ingresos totales y por disciplina (CrossFit, Musculación, Personalizado).

#### 🗂️ Archivos Clave
- `src/components/coach/AdminAccountingView.tsx`
- `src/services/accountingService.ts`
- `src/types/index.ts` — Tipos `AccountingTransaction`, `TransactionType`

---

### v0.3.0 — Sesiones previas
**Rama/Commit:** `feat/coaches-y-atletas`

#### ✨ Cambios
- Los coaches pueden ver listado de atletas y estado de membresías (solo lectura).
- Registro extendido de atletas al crear cuenta: Género, Fecha de nacimiento, Dirección, EPS, Contacto de emergencia, aceptación de Términos y Condiciones.
- Botón flotante de check-in/torniquete añadido a la interfaz del atleta.

---

### v0.2.0 — Sesiones previas
**Rama/Commit:** `feat/modo-mantenimiento`

#### ✨ Cambios
- Modo mantenimiento con pantalla bloqueante para atletas.
- Bypass de emergencia para admin desde la pantalla de mantenimiento.
- Mensaje informativo personalizable desde el panel de admin.
- Estado persistido en Firestore (`gymSettings.isMaintenanceMode`).

---

### v0.1.0 — Inicio del Proyecto
**Rama/Commit:** `initial`

#### ✨ Base del Proyecto
- PWA React + TypeScript + Firebase Firestore.
- Roles: `admin`, `coach`, `athlete`.
- Gestión de atletas, planes de membresía, clases, WODs, marcas personales (RMs), cronómetros.
- Login por PIN de 4 dígitos para atletas; credenciales para admin/coach.
- Notificaciones push vía OneSignal.

---

## 🔮 PENDIENTES / DEUDA TÉCNICA

| Ítem | Prioridad | Descripción |
|---|---|---|
| Firestore Security Rules | 🔴 Alta | Restringir reglas de Firestore. Actualmente abiertas. |
| Code Splitting | 🟡 Media | Bundle JS supera 1.3 MB. Considerar `React.lazy()` por sección. |
| Contraseña demo en código | 🟡 Media | Mover contraseña del usuario de prueba a `gymSettings` en Firestore para que el admin la configure. |
| Autenticación real | 🟡 Media | Migrar sistema de PIN a Firebase Auth para mayor seguridad. |
| Tests automatizados | 🟢 Baja | Cubrir flujos críticos (check-in, renovación de plan) con Playwright o Vitest. |

---

## 👥 EQUIPO

| Rol | Nombre |
|---|---|
| Cliente / Product Owner | Alejandro |
| Desarrollo & Arquitectura | Antigravity AI |

---

*Última actualización: 2026-09-21 — v0.7.0*
