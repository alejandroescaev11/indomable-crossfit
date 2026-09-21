import { AccountingTransaction, GymSettings } from '../types';
import { getFirebaseDb } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';

const TRANSACTIONS_COL = 'accounting_transactions';
const STORAGE_KEY = 'indomable_accounting_transactions_v1';

// Google Apps Script template for the user
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * INDOMABLE CROSSFIT - Webhook de Google Sheets para Contabilidad
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En tu Google Drive, crea una hoja de cálculo llamada "INDOMABLE_CONTABILIDAD".
 * 2. En la Fila 1 (Cabecera), coloca:
 *    [ID, Fecha, Hora, Atleta, Cédula, Plan, Disciplina, Valor COP, Método de Pago, Tipo, Aprobado Por, Notas]
 * 3. En la barra superior de Google Sheets, ve a: Extensiones > Apps Script.
 * 4. Pega este código completo reemplazando cualquier contenido anterior.
 * 5. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 6. Selecciona tipo: "Aplicación web".
 * 7. En "Quién tiene acceso", selecciona obligatoriamente: "Cualquier usuario" (Anyone).
 * 8. Haz clic en "Implementar", autoriza los permisos con tu cuenta de Google y COPIA la URL de la aplicación web.
 * 9. Pega esa URL en el panel de Contabilidad de la app INDOMABLE. ¡Listo!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Si la hoja está totalmente vacía, insertar cabeceras
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID Transacción",
        "Fecha",
        "Hora",
        "Atleta",
        "Cédula",
        "Plan",
        "Disciplina",
        "Valor (COP)",
        "Método de Pago",
        "Tipo Movimiento",
        "Aprobado Por",
        "Notas",
        "Timestamp Registro"
      ]);
      sheet.getRange("A1:M1").setFontWeight("bold").setBackground("#dc2626").setFontColor("#ffffff");
    }

    var contents = JSON.parse(e.postData.contents);
    
    var dateFormatted = contents.date || Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd");
    var timeFormatted = Utilities.formatDate(new Date(contents.timestamp || new Date()), "America/Bogota", "hh:mm:ss a");
    
    sheet.appendRow([
      contents.id || "TX-" + new Date().getTime(),
      dateFormatted,
      timeFormatted,
      contents.athleteName || "N/A",
      contents.athleteDocumentId || "N/A",
      contents.planName || "Plan General",
      contents.discipline || "crossfit",
      contents.amount || 0,
      contents.paymentMethod || "efectivo",
      contents.type || "membership_renewal",
      contents.approvedBy || "Admin",
      contents.notes || "",
      contents.timestamp || new Date().toISOString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Transacción registrada exitosamente en Google Sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Suscripción en tiempo real a transacciones contables en Firestore
 */
export const subscribeTransactionsLive = (
  callback: (transactions: AccountingTransaction[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) callback(JSON.parse(saved));
    } catch {}
    return null;
  }

  try {
    const colRef = collection(db, TRANSACTIONS_COL);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AccountingTransaction[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<AccountingTransaction, 'id'>) });
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {}
        callback(list);
      },
      (err) => {
        console.warn('[Accounting] Error suscribiendo a transacciones:', err);
      }
    );
  } catch (err) {
    console.warn('[Accounting] Error inicializando suscripción:', err);
    return null;
  }
};

/**
 * Guarda una transacción en Firestore y localStorage
 */
export const saveTransactionInFirestore = async (
  transaction: AccountingTransaction
): Promise<void> => {
  const db = getFirebaseDb();
  if (db) {
    try {
      const docRef = doc(db, TRANSACTIONS_COL, transaction.id);
      await setDoc(docRef, transaction);
    } catch (err) {
      console.warn('[Accounting] Error guardando en Firestore:', err);
    }
  }

  // Backup en localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const list: AccountingTransaction[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) {
      list[idx] = transaction;
    } else {
      list.unshift(transaction);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
};

/**
 * Elimina una transacción en Firestore y localStorage
 */
export const deleteTransactionInFirestore = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (db) {
    try {
      await deleteDoc(doc(db, TRANSACTIONS_COL, id));
    } catch (err) {
      console.warn('[Accounting] Error eliminando en Firestore:', err);
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const list: AccountingTransaction[] = JSON.parse(saved);
      const filtered = list.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {}
};

/**
 * Envía la transacción al webhook de Google Sheets
 */
export const sendTransactionToGoogleSheets = async (
  transaction: AccountingTransaction,
  webhookUrl?: string
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'No hay URL de Google Apps Script configurada.',
    };
  }

  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(transaction),
    });

    return {
      success: true,
      message: 'Transacción sincronizada con Google Sheets exitosamente.',
    };
  } catch (err: any) {
    console.error('[Accounting] Error despachando a Google Sheets:', err);
    return {
      success: false,
      message: err?.message || 'Error de conexión con Google Sheets.',
    };
  }
};

/**
 * Helper para formatear dinero en pesos colombianos ($ COP)
 */
export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};
