/**
 * Utilidades para Autenticación Biométrica (WebAuthn / Windows Hello / Face ID / Touch ID / Android Biometrics)
 * Permite a los atletas registrar su huella o reconocimiento facial en el dispositivo
 * para iniciar sesión rápidamente sin digitar cédula ni PIN.
 */

const STORAGE_KEY = 'indomable_biometrics_credential';

export interface BiometricEnrollment {
  enrolled: boolean;
  documentId?: string;
  userName?: string;
  enrolledAt?: string;
}

/**
 * Comprueba si el dispositivo y navegador actual soportan autenticación biométrica de plataforma
 */
export async function isBiometricsSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    return false;
  }

  try {
    const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return isAvailable;
  } catch (err) {
    console.warn('Error verificando soporte de biometría:', err);
    return false;
  }
}

/**
 * Consulta si hay credenciales biométricas registradas en este navegador
 */
export function getBiometricEnrollment(): BiometricEnrollment {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enrolled: false };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.documentId && parsed.pin) {
      return {
        enrolled: true,
        documentId: parsed.documentId,
        userName: parsed.userName,
        enrolledAt: parsed.enrolledAt,
      };
    }
  } catch {
    // ignore
  }
  return { enrolled: false };
}

/**
 * Registra y enlaza la huella/FaceID del dispositivo con la cuenta del atleta
 */
export async function registerBiometrics(
  documentId: string,
  pin: string,
  userName: string
): Promise<{ success: boolean; message: string }> {
  const supported = await isBiometricsSupported();
  if (!supported) {
    return {
      success: false,
      message: 'Este dispositivo o navegador no cuenta con sensor biométrico compatible (Huella o Face ID).',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(documentId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'INDOMABLE CrossFit & Gym',
          id: window.location.hostname || undefined,
        },
        user: {
          id: userIdBytes,
          name: documentId,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, message: 'No se completó la verificación biométrica.' };
    }

    const enrollmentData = {
      documentId,
      pin,
      userName,
      credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
      enrolledAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollmentData));

    return {
      success: true,
      message: '¡Autenticación biométrica habilitada con éxito para este dispositivo!',
    };
  } catch (err: any) {
    console.error('Error al registrar biometría:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Acceso biométrico cancelado o denegado por el usuario.',
      };
    }
    return {
      success: false,
      message: err.message || 'Error al configurar el sensor biométrico.',
    };
  }
}

/**
 * Solicita autenticación biométrica (Huella / Face ID) al usuario y recupera las credenciales
 */
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  documentId?: string;
  pin?: string;
  message?: string;
}> {
  const enrollment = getBiometricEnrollment();
  if (!enrollment.enrolled) {
    return {
      success: false,
      message: 'No hay ninguna cuenta configurada con huella o Face ID en este dispositivo.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname || undefined,
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (!assertion) {
      return { success: false, message: 'Verificación biométrica no completada.' };
    }

    // Biometría validada con éxito por el sistema operativo
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { success: false, message: 'Datos de sesión no encontrados.' };
    }
    const parsed = JSON.parse(raw);
    return {
      success: true,
      documentId: parsed.documentId,
      pin: parsed.pin,
    };
  } catch (err: any) {
    console.warn('Fallo en autenticación biométrica:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, message: 'Autenticación biométrica cancelada.' };
    }
    return {
      success: false,
      message: 'No fue posible validar tu huella o Face ID. Por favor ingresa con tu cédula y PIN.',
    };
  }
}

/**
 * Elimina el registro biométrico de este dispositivo
 */
export function removeBiometrics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
