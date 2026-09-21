# INDOMABLE CrossFit — App de Gestión de Box 🏋️

PWA de gestión completa para el box **INDOMABLE CrossFit**, construida con React 19, TypeScript, Firebase y Tailwind CSS.

**🌐 App en producción:** https://app-crossfit-c66a5.web.app

---

## 🚀 Funcionalidades Principales

- **Atletas:** Feed de novedades, estado de membresía, check-in al torniquete, reserva de clases WOD, marcas personales (RM), cronómetro Box, pizarra de resultados.
- **Admin:** Gestión de atletas, planes y membresías, módulo de contabilidad, control de modo mantenimiento, configuración de cuentas de pago, Google Sheets sync.
- **Coach:** Visualización de atletas y membresías, clases y cronómetros.
- **PWA:** Instalable en iOS y Android, notificaciones push (OneSignal).
- **Modo Mantenimiento:** Bloquea el acceso a atletas regulares mientras el admin realiza tareas de configuración.

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | UI y lógica |
| Vite 8 | Bundler + dev server |
| Tailwind CSS v4 | Estilos |
| Firebase Firestore | Base de datos en tiempo real |
| Firebase Hosting | Deploy del sitio |
| Vite Plugin PWA | Service Worker + manifest |
| OneSignal | Notificaciones push |
| Lucide React | Iconografía |

---

## ⚙️ Instalación Local

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd indomable-crossfit

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env
# Editar .env con los valores reales de Firebase y OneSignal

# 4. Correr en desarrollo
npm run dev
# → http://localhost:3000
```

---

## 🚢 Despliegue a Producción

```bash
# Build de producción
npm run build

# Deploy a Firebase Hosting
npx firebase-tools deploy --only hosting
```

---

## 📋 Bitácora de Cambios

Ver [`CHANGELOG.md`](./CHANGELOG.md) para el historial completo de versiones, consideraciones técnicas y pendientes.

---

## 🔒 Seguridad

- Las variables de entorno **nunca** se suben al repositorio (ver `.gitignore`).
- Las Firebase Security Rules de Firestore están pendientes de restringir (ver CHANGELOG).
- Los datos de atletas contienen información personal — manejar con confidencialidad.

---

## 👥 Equipo

| Rol | Nombre |
|---|---|
| Cliente / Product Owner | Alejandro |
| Desarrollo & Arquitectura | Antigravity AI |
