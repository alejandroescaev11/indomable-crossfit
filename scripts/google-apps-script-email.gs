/**
 * ============================================================================
 * INDOMABLE CROSSFIT - SERVICIO DE ENVÍO DE CORREOS (GOOGLE APPS SCRIPT)
 * ============================================================================
 * 
 * Este script actúa como un Webhook Web App serverless gratuito utilizando la cuota
 * diaria oficial de Gmail (100 a 1500 correos diarios sin costo).
 * Reemplaza a EmailJS para evitar cuotas mensuales restrictivas.
 * 
 * INSTRUCCIONES DE DESPLIEGUE EN 3 PASOS:
 * 1. Abre https://script.google.com con la cuenta de Google/Gmail del Box.
 * 2. Crea un nuevo proyecto, pega este código completo y guarda (Ctrl + S).
 * 3. Haz clic en "Implementar" (Deploy) > "Nueva implementación" (New deployment):
 *    - Tipo: Aplicación web (Web app)
 *    - Ejecutar como: Yo (tu cuenta de correo)
 *    - Quién tiene acceso: Cualquier persona (Anyone)
 * 4. Copia la URL de la aplicación web (termina en /exec) y pégala en los ajustes
 *    de correo de INDOMABLE en el panel del Administrador/Coach.
 */

/**
 * Endpoint POST: Procesa el envío de correos transaccionales desde la App
 */
function doPost(e) {
  try {
    var rawData = e && e.postData ? e.postData.contents : null;
    if (!rawData) {
      return createJsonResponse({
        status: "error",
        message: "No se recibieron datos en el cuerpo de la petición (POST vacío)."
      });
    }

    var data = JSON.parse(rawData);
    var to = data.to ? String(data.to).trim() : "";
    var subject = data.subject ? String(data.subject).trim() : "Notificación Oficial INDOMABLE CrossFit";
    var htmlBody = data.htmlBody || "";
    var textBody = data.textBody || "";
    var senderName = "INDOMABLE CrossFit";

    if (!to || to.indexOf("@") === -1) {
      return createJsonResponse({
        status: "error",
        message: "Dirección de correo de destino no válida: " + to
      });
    }

    // Si no se proporcionó texto plano, generar uno a partir del HTML
    if (!textBody && htmlBody) {
      textBody = htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }

    // Enviar el correo electrónico con MailApp
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: senderName
    });

    return createJsonResponse({
      status: "success",
      message: "Correo enviado exitosamente a " + to,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Error al despachar correo: " + err.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Endpoint GET: Permite probar la URL del Webhook directamente en el navegador
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "INDOMABLE CrossFit Email Webhook",
    message: "El Webhook está activo y listo para recibir peticiones POST.",
    timestamp: new Date().toISOString(),
    quotaRemaining: MailApp.getRemainingDailyQuota()
  });
}

/**
 * Función auxiliar para retornar respuestas JSON formateadas
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Función para probar el envío directo desde el editor de Google Apps Script
 */
function testSendFromEditor() {
  var myEmail = Session.getActiveUser().getEmail();
  var res = doPost({
    postData: {
      contents: JSON.stringify({
        to: myEmail,
        subject: "🔥 Prueba de Conexión - Webhook INDOMABLE",
        textBody: "¡Hola! Si recibes este correo, tu Webhook de Google Apps Script está funcionando a la perfección.",
        htmlBody: "<div style='font-family: Arial; padding: 20px; background: #09090b; color: #fff; border-radius: 12px; border: 1px solid #dc2626;'>" +
                  "<h1 style='color: #ef4444;'>INDOMABLE CrossFit</h1>" +
                  "<p>¡Tu Webhook de Google Apps Script está 100% activo y configurado con éxito!</p>" +
                  "</div>"
      })
    }
  });
  Logger.log(res.getContent());
}
