import { AccountingTransaction, AthleteProfile, GymSettings } from '../types';
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

// Google Apps Script template for dual-sheet real-time sync (Contabilidad + Usuarios_y_Pagos)
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * INDOMABLE CROSSFIT - Webhook de Google Sheets para Contabilidad & Control de Usuarios
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En tu Google Drive, abre o crea una hoja de cálculo llamada "INDOMABLE_CONTABILIDAD_Y_USUARIOS".
 * 2. En la barra superior de Google Sheets, ve a: Extensiones > Apps Script.
 * 3. Borra todo el código que aparezca por defecto y pega este código completo.
 * 4. Haz clic en el botón azul "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 5. Selecciona el tipo: "Aplicación web".
 * 6. En "Quién tiene acceso" (Who has access), selecciona obligatoriamente: "Cualquier usuario" (Anyone).
 * 7. Haz clic en "Implementar", autoriza los permisos con tu cuenta de Google y COPIA la URL de la aplicación web.
 * 8. Pega esa URL en el panel de Contabilidad de la app INDOMABLE.
 * 
 * El sistema creará y actualizará automáticamente 2 pestañas:
 * - "Contabilidad": Registro de cada transacción o ingreso financiero en tiempo real.
 * - "Usuarios_y_Pagos": Historial de deportistas, planes vigentes, fechas de vencimiento y total pagado.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. HOJA DE CONTABILIDAD
    var sheetContabilidad = ss.getSheetByName("Contabilidad");
    if (!sheetContabilidad) {
      sheetContabilidad = ss.insertSheet("Contabilidad");
    }
    
    if (sheetContabilidad.getLastRow() === 0) {
      sheetContabilidad.appendRow([
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
      sheetContabilidad.getRange("A1:M1").setFontWeight("bold").setBackground("#dc2626").setFontColor("#ffffff");
      sheetContabilidad.setFrozenRows(1);
    }

    // 2. HOJA DE USUARIOS Y PAGOS
    var sheetUsuarios = ss.getSheetByName("Usuarios_y_Pagos");
    if (!sheetUsuarios) {
      sheetUsuarios = ss.insertSheet("Usuarios_y_Pagos");
    }

    if (sheetUsuarios.getLastRow() === 0) {
      sheetUsuarios.appendRow([
        "Cédula / Documento",
        "Nombre Completo",
        "Correo Electrónico",
        "Teléfono",
        "Disciplina",
        "Plan Actual",
        "Estado Membresía",
        "Fecha Inicio Plan",
        "Fecha Vencimiento",
        "Total Pagado Histórico (COP)",
        "Último Pago Fecha",
        "Último Pago Método",
        "Última Actualización"
      ]);
      sheetUsuarios.getRange("A1:M1").setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
      sheetUsuarios.setFrozenRows(1);
    }

    var contents = JSON.parse(e.postData.contents);
    var nowIso = new Date().toISOString();
    var dateFormatted = contents.date || Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd");
    var timeFormatted = Utilities.formatDate(new Date(contents.timestamp || new Date()), "America/Bogota", "hh:mm:ss a");
    var amount = Number(contents.amount || 0);

    // 1. Insertar fila en pestaña Contabilidad
    sheetContabilidad.appendRow([
      contents.id || "TX-" + new Date().getTime(),
      dateFormatted,
      timeFormatted,
      contents.athleteName || "N/A",
      contents.athleteDocumentId || "N/A",
      contents.planName || "Plan General",
      contents.discipline || "crossfit",
      amount,
      contents.paymentMethod || "efectivo",
      contents.type || "membership_renewal",
      contents.approvedBy || "Admin",
      contents.notes || "",
      contents.timestamp || nowIso
    ]);

    // 2. Insertar o actualizar fila en pestaña Usuarios_y_Pagos
    var docId = contents.athleteDocumentId ? String(contents.athleteDocumentId).trim() : "";
    var athleteName = contents.athleteName ? String(contents.athleteName).trim() : "";
    
    if (docId && docId !== "N/A" && docId !== "00000000") {
      var data = sheetUsuarios.getDataRange().getValues();
      var foundRowIndex = -1;
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === docId) {
          foundRowIndex = i + 1; // 1-indexed row en Apps Script
          break;
        }
      }

      var email = contents.email || "";
      var phone = contents.phone || "";
      var discipline = contents.discipline || "crossfit";
      var planName = contents.planName || "Plan General";
      var status = contents.status || "ACTIVO";
      var startDate = contents.startDate || dateFormatted;
      var endDate = contents.endDate || dateFormatted;
      var paymentMethod = contents.paymentMethod || "efectivo";

      if (foundRowIndex > 1) {
        // Usuario existente: actualizar membresía y acumular total invertido
        var currentTotal = Number(sheetUsuarios.getRange(foundRowIndex, 10).getValue() || 0);
        var newTotal = currentTotal + amount;
        
        sheetUsuarios.getRange(foundRowIndex, 2).setValue(athleteName || sheetUsuarios.getRange(foundRowIndex, 2).getValue());
        if (email) sheetUsuarios.getRange(foundRowIndex, 3).setValue(email);
        if (phone) sheetUsuarios.getRange(foundRowIndex, 4).setValue(phone);
        sheetUsuarios.getRange(foundRowIndex, 5).setValue(discipline);
        sheetUsuarios.getRange(foundRowIndex, 6).setValue(planName);
        sheetUsuarios.getRange(foundRowIndex, 7).setValue(status);
        sheetUsuarios.getRange(foundRowIndex, 8).setValue(startDate);
        sheetUsuarios.getRange(foundRowIndex, 9).setValue(endDate);
        sheetUsuarios.getRange(foundRowIndex, 10).setValue(newTotal);
        sheetUsuarios.getRange(foundRowIndex, 11).setValue(dateFormatted);
        sheetUsuarios.getRange(foundRowIndex, 12).setValue(paymentMethod);
        sheetUsuarios.getRange(foundRowIndex, 13).setValue(timeFormatted);
      } else {
        // Nuevo usuario en la pestaña
        sheetUsuarios.appendRow([
          docId,
          athleteName,
          email,
          phone,
          discipline,
          planName,
          status,
          startDate,
          endDate,
          amount,
          dateFormatted,
          paymentMethod,
          timeFormatted
        ]);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Transacción y estado de usuario sincronizados exitosamente en Google Sheets." }))
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

/**
 * Exporta el historial de transacciones contables a archivo CSV (compatible con Excel en español)
 */
export const exportTransactionsToCSV = (
  transactions: AccountingTransaction[],
  filename = `Contabilidad_INDOMABLE_${new Date().toISOString().split('T')[0]}.csv`
) => {
  const headers = [
    'ID Transacción',
    'Fecha',
    'Timestamp',
    'Atleta / Cliente',
    'Cédula / Documento',
    'Plan / Concepto',
    'Disciplina',
    'Valor COP',
    'Método de Pago',
    'Tipo Movimiento',
    'Aprobado Por',
    'Notas de Auditoría',
  ];

  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.timestamp || ''}"`,
    `"${(t.athleteName || '').replace(/"/g, '""')}"`,
    `"${t.athleteDocumentId || ''}"`,
    `"${(t.planName || '').replace(/"/g, '""')}"`,
    `"${t.discipline || 'crossfit'}"`,
    t.amount || 0,
    `"${t.paymentMethod}"`,
    `"${t.type}"`,
    `"${(t.approvedBy || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta el listado y historial de usuarios y pagos a archivo CSV
 */
export const exportUsersToCSV = (
  athletes: AthleteProfile[],
  transactions: AccountingTransaction[],
  filename = `Usuarios_y_Pagos_INDOMABLE_${new Date().toISOString().split('T')[0]}.csv`
) => {
  const headers = [
    'Cédula / Documento',
    'Nombre Completo',
    'Correo Electrónico',
    'Teléfono',
    'Disciplina',
    'Plan Actual',
    'Estado Membresía',
    'Fecha Inicio Plan',
    'Fecha Vencimiento',
    'Total Pagado Histórico (COP)',
    'Número de Transacciones',
    'Último Pago Fecha',
    'Último Pago Método',
  ];

  const rows = athletes.map((a) => {
    const userTxs = transactions.filter(
      (t) =>
        (t.athleteDocumentId && t.athleteDocumentId === a.documentId) ||
        (t.athleteId && t.athleteId === a.id)
    );
    const totalSpent = userTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const sortedTxs = [...userTxs].sort(
      (x, y) =>
        new Date(y.timestamp || y.date).getTime() - new Date(x.timestamp || x.date).getTime()
    );
    const lastTx = sortedTxs[0];

    const isPending = a.membership?.isPendingApproval;
    const isActive = a.membership?.isActive;
    let statusText = 'INACTIVO / VENCIDO';
    if (isPending) statusText = 'PENDIENTE DE APROBACIÓN';
    else if (isActive) statusText = 'ACTIVO / AL DÍA';

    return [
      `"${a.documentId || 'N/A'}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.email || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.discipline || a.membership?.discipline || 'crossfit'}"`,
      `"${(a.membership?.planName || 'Sin Plan').replace(/"/g, '""')}"`,
      `"${statusText}"`,
      `"${a.membership?.startDate || ''}"`,
      `"${a.membership?.endDate || ''}"`,
      totalSpent,
      userTxs.length,
      `"${lastTx?.date || 'N/A'}"`,
      `"${lastTx?.paymentMethod || 'N/A'}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

