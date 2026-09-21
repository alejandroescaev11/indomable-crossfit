# 📧 Guía de Despliegue: Envío de Correos con Google Apps Script

Esta guía te muestra cómo activar el envío de correos 100% gratuito e ilimitado para **INDOMABLE** utilizando tu cuenta de Google/Gmail, reemplazando a EmailJS para evitar las restricciones de cuota mensual.

---

## 🚀 Pasos de Instalación (Toma solo 2 minutos)

### Paso 1: Crear el Proyecto en Google Apps Script
1. Entra en tu navegador a: **[https://script.google.com](https://script.google.com)** (inicia sesión con la cuenta de Gmail desde la que deseas enviar los correos, ej: la cuenta oficial del Box o de administración).
2. Haz clic en el botón azul **"Nuevo proyecto"** (New Project).
3. En la parte superior, ponle un nombre al proyecto, por ejemplo: `Indomable Email Webhook`.

### Paso 2: Pegar el Código
1. Borra el código de muestra `function myFunction() { ... }` que aparece en el editor.
2. Abre el archivo [`scripts/google-apps-script-email.gs`](./google-apps-script-email.gs), copia todo su contenido y pégalo en el editor de Google Apps Script.
3. Guarda los cambios haciendo clic en el icono del disco 💾 o presionando `Ctrl + S`.

### Paso 3: Desplegar como Aplicación Web
1. En la esquina superior derecha, haz clic en el botón azul **"Implementar"** (Deploy) y selecciona **"Nueva implementación"** (New deployment).
2. Haz clic en el icono de engranaje ⚙️ junto a "Seleccionar tipo" y elige **"Aplicación web"** (Web app).
3. Configura los siguientes campos:
   - **Descripción**: `Servidor de Correo Indomable`
   - **Ejecutar como**: `Yo (tu correo de Gmail)`
   - **Quién tiene acceso**: **`Cualquier persona`** *(Importante: debe ser "Cualquier persona" para que la app pueda enviar peticiones HTTP sin pedir login de Google al atleta)*.
4. Haz clic en el botón azul **"Implementar"** (Deploy).
5. Google te pedirá autorizar permisos la primera vez:
   - Haz clic en **"Revisar permisos"**.
   - Selecciona tu cuenta de Google.
   - Si aparece el aviso *"Google no ha verificado esta app"*, haz clic en **"Avanzado"** (Advanced) abajo a la izquierda y luego en **"Ir a Indomable Email Webhook (no seguro)"**.
   - Haz clic en **"Permitir"**.

### Paso 4: Copiar la URL y Activar en Indomable
1. Al finalizar, Google te mostrará la **URL de la aplicación web** (termina en `/exec`). Ejemplo:
   ```
   https://script.google.com/macros/s/AKfycbz_XXXXX.../exec
   ```
2. Copia esa URL.
3. Abre tu plataforma de **INDOMABLE**, entra como **Administrador** o **Coach**, ve a la sección **Notificaciones por Correo** > **Configurar Servicio de Correo**.
4. En **Proveedor de Correo**, selecciona:
   **`Google Apps Script (Recomendado - 100% Gratis, Sin Límites)`**
5. Pega la URL en el campo **URL del Webhook de Apps Script** y haz clic en **Guardar Configuración**.

---

## 🎯 Ventajas de Google Apps Script frente a EmailJS

| Característica | EmailJS (Plan Free) | Google Apps Script (Gmail) |
| :--- | :--- | :--- |
| **Límite de Correos** | 200 correos al **mes** | **100 a 1.500 correos al DÍA** |
| **Costo** | Gratis con límites estrictos | **100% Gratis de por vida** |
| **Remitente** | Servidores compartidos | Tu propia cuenta de Gmail oficial |
| **Plantillas HTML** | Limitadas por interfaz web | HTML dinámico completo con diseño deportivo |
| **Dependencias** | Claves públicas y privadas | URL Webhook segura con token opcional |
