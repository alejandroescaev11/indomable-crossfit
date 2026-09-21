# 📧 Guía de Configuración de Plantillas en EmailJS - INDOMABLE

Esta carpeta contiene las dos plantillas oficiales optimizadas para EmailJS:
1. [`bienvenida-indomable.html`](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/templates/emailjs/bienvenida-indomable.html) ➔ Para nuevos atletas registrados (cuenta pendiente).
2. [`activacion-plan.html`](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/templates/emailjs/activacion-plan.html) ➔ Para atletas cuya membresía o plan ha sido aprobado y activado.

---

## 🚀 Pasos para Crearlas en EmailJS (dashboard.emailjs.com)

### 1. Iniciar Sesión en EmailJS
1. Ingresa a [https://dashboard.emailjs.com/admin/templates](https://dashboard.emailjs.com/admin/templates).
2. Asegúrate de tener creado tu servicio de correo en la pestaña **Email Services** (ej. Gmail, Outlook u otro). Anota tu **Service ID** (ej: `service_abc123`).

---

### 2. Crear Plantilla 1: Bienvenida a INDOMABLE

1. En la pestaña **Email Templates**, haz clic en **Create New Template**.
2. Configura los campos de la cabecera en el panel derecho o superior:
   - **Template Name**: `Bienvenida INDOMABLE`
   - **Subject (Asunto)**: `🔥 ¡Bienvenido a INDOMABLE CrossFit! Tu cuenta ha sido creada`
   - **To Email (Para)**: `{{to_email}}` *(⚠️ CRÍTICO: Debe ser exactamente `{{to_email}}` para que EmailJS sepa a quién enviar)*
   - **From Name (De parte de)**: `INDOMABLE CrossFit`
   - **Reply-To**: `{{reply_to}}` o el correo del box.
3. En el editor de contenido:
   - Haz clic en la pestaña o botón **Source Code** / **Code Editor** / **HTML Editor** (`</>`).
   - Borra todo el contenido por defecto y pega el código completo del archivo [`bienvenida-indomable.html`](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/templates/emailjs/bienvenida-indomable.html).
4. Haz clic en **Save** (Guardar).
5. Copia el **Template ID** generado (ej: `template_welcome123`).

#### Variables enviadas por la app para Bienvenida:
| Variable EmailJS | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `{{to_email}}` | Correo del atleta (destinatario) | `carlos@gmail.com` |
| `{{name}}` | Nombre del atleta | `Carlos Mendoza` |
| `{{document_id}}` | Cédula / Documento | `1098765432` |
| `{{access_pin}}` | PIN de acceso inicial | `1234` |

---

### 3. Crear Plantilla 2: Activación de Plan de Membresía

1. En **Email Templates**, haz clic en **Create New Template**.
2. Configura los campos:
   - **Template Name**: `Activación Membresía INDOMABLE`
   - **Subject (Asunto)**: `⚡ ¡Tu membresía en INDOMABLE CrossFit ha sido ACTIVADA!`
   - **To Email (Para)**: `{{to_email}}` *(⚠️ CRÍTICO: Debe ser `{{to_email}}`)*
   - **From Name**: `INDOMABLE CrossFit`
   - **Reply-To**: `{{reply_to}}` o el correo del box.
3. En el editor de contenido:
   - Haz clic en **Source Code** / **HTML** (`</>`).
   - Pega el código completo del archivo [`activacion-plan.html`](file:///C:/Users/HP/Desktop/Alejandro/Desarrollos/Antigravity/TestIdea/indomable-crossfit/templates/emailjs/activacion-plan.html).
4. Haz clic en **Save** (Guardar).
5. Copia el **Template ID** generado (ej: `template_activation456`).

#### Variables enviadas por la app para Activación:
| Variable EmailJS | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `{{to_email}}` | Correo del atleta (destinatario) | `carlos@gmail.com` |
| `{{name}}` | Nombre del atleta | `Carlos Mendoza` |
| `{{plan_name}}` | Nombre del plan asignado | `Mensual Ilimitado CrossFit` |
| `{{start_date}}` | Fecha de inicio | `2026-09-20` |
| `{{end_date}}` | Fecha de vencimiento | `2026-10-20` |
| `{{classes_count}}` | Cupos o clases | `Ilimitadas` o `12 Clases` |

---

### 4. Configurar las Llaves en la App INDOMABLE

1. Abre la aplicación como **Administrador** o **Coach**.
2. Ve a la sección **Administración** ➔ Tarjeta **Historial de Notificaciones por Correo** ➔ Haz clic en **Configurar EmailJS**.
3. Rellena los 4 campos:
   - **Proveedor**: Cambia a `EmailJS (Envío real al correo de atletas)`.
   - **Service ID**: Pega tu `service_xxxxx`.
   - **Template ID Bienvenida**: Pega el Template ID de bienvenida (`template_xxxxx`).
   - **Template ID Activación**: Pega el Template ID de activación (`template_xxxxx`).
   - **Public Key**: Tu clave pública de EmailJS (*Account ➔ General ➔ Public Key*).
4. Pulsa **Guardar Configuración**.

¡Listo! A partir de ese momento, cada atleta registrado recibirá su bienvenida oficial y cada activación de membresía enviará su confirmación con diseño Spartan profesional.
