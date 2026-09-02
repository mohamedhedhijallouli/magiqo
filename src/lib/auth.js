// ---------------------------------------------------------------------------
// MagiQo — local authentication (V22).
// ---------------------------------------------------------------------------

import { Users, getAdminActiveLicenseCode, setAdminActiveLicenseCode, clearAdminActiveLicenseCode, isNewGameMasterLicense } from "@/lib/db";
import { validateAnyLicense } from "@/lib/license";

const NS = "magiqo:v1:";
const SESSION_KEY = NS + "auth_session";
const MASTER_EMAIL = "wasfi.siala@gmail.com";
const MASTER_PASSWORD = "191172Sf@x";

async function hashPassword(pwd) {
  const enc = new TextEncoder().encode(pwd);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isMasterCredentials(email, password) {
  return email.trim().toLowerCase() === MASTER_EMAIL.toLowerCase() && password === MASTER_PASSWORD;
}

// ---------------------------------------------------------------------------
// Suivi du code de licence utilisé pour se connecter en tant que
// Maître du Jeu (/admin). Déplacé dans lib/db.js (pour éviter une
// dépendance circulaire avec le module de synchronisation), réexporté ici
// pour compatibilité avec le reste de l'app qui les importe depuis "@/lib/auth".
// ---------------------------------------------------------------------------
export { getAdminActiveLicenseCode, setAdminActiveLicenseCode, clearAdminActiveLicenseCode, isNewGameMasterLicense };

export function getRememberedEmail() {
  return localStorage.getItem(NS + "remembered_email") || "";
}

function startSession(profile) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getBackDestination() {
  const session = getSession();
  if (!session) return "/";
  return session.role === "master" ? "/masters" : "/dashboard";
}

// Returns { ok: true, role: 'master' | 'user' } or { ok: false, error }
export async function login({ email, password, rememberEmail }) {
  if (!email || !password) return { ok: false, error: "fields" };

  if (isMasterCredentials(email, password)) {
    startSession({ role: "master", email: MASTER_EMAIL });
    return { ok: true, role: "master" };
  }

  const users = await Users.list();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return { ok: false, error: "credentials" };

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) return { ok: false, error: "credentials" };

  if (rememberEmail) localStorage.setItem(NS + "remembered_email", email.trim());
  else localStorage.removeItem(NS + "remembered_email");

  // Re-vérification des règles de la licence rattachée à l'utilisateur
  let licenseMeta = {};
  if (user.license_code) {
    const licCheck = await validateAnyLicense(user.license_code, user.email);
    if (licCheck.valid) {
      licenseMeta = {
        maxPlayers: licCheck.maxPlayers,
        maxTutors: licCheck.maxTutors,
        languages: licCheck.languages,
        expiresAt: licCheck.expiresAt,
      };
    }
  }

  startSession({
    role: "user",
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    id: user.id,
    license_code: user.license_code,
    license: licenseMeta,
  });
  if (user.license_code) setAdminActiveLicenseCode(user.license_code);

  return { ok: true, role: "user" };
}

// Returns { ok: true, role } or { ok: false, error }
export async function signup({ firstName, lastName, licenseCode, email, password, confirmPassword, rememberEmail }) {
  if (!firstName || !lastName || !licenseCode || !email || !password || !confirmPassword) {
    return { ok: false, error: "fields" };
  }
  if (password !== confirmPassword) return { ok: false, error: "mismatch" };

  if (isMasterCredentials(email, password)) {
    startSession({ role: "master", email: MASTER_EMAIL });
    return { ok: true, role: "master" };
  }

  const licenseCheck = await validateAnyLicense(licenseCode, email);
  if (!licenseCheck.valid) {
    return { ok: false, error: licenseCheck.reason === "email_mismatch" ? "license_email" : "license" };
  }

  const users = await Users.list();
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return { ok: false, error: "exists" };
  }

  const password_hash = await hashPassword(password);
  const user = await Users.create({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.trim(),
    password_hash,
    license_code: licenseCode.trim(),
  });

  if (rememberEmail) localStorage.setItem(NS + "remembered_email", email.trim());

  // Stockage des règles de la licence V22 dans la session utilisateur
  startSession({
    role: "user",
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    id: user.id,
    license_code: user.license_code,
    license: {
      maxPlayers: licenseCheck.maxPlayers,
      maxTutors: licenseCheck.maxTutors,
      languages: licenseCheck.languages,
      expiresAt: licenseCheck.expiresAt,
    },
  });
  setAdminActiveLicenseCode(user.license_code);

  return { ok: true, role: "user" };
}
export function getActiveLicense() {
  const session = getSession();

  // Le compte Master n'est soumis à aucun verrouillage de licence
  if (session?.role === "master") return null;

  // 1. Chercher dans la session utilisateur courante
  if (session?.license) return session.license;

  // 2. Sinon, si un Maître du Jeu est connecté via /admin, utiliser le code
  // de licence précisément saisi à la connexion (voir AdminDashboard) —
  // plus fiable que de prendre "la première licence active trouvée", qui
  // pouvait ne pas correspondre au code réellement entré.
  const adminCode = getAdminActiveLicenseCode();
  try {
    const licenses = JSON.parse(localStorage.getItem("magiqo:v1:licenses") || "[]");
    const byCode = adminCode ? licenses.find((l) => l.code === adminCode) : null;
    const active = byCode || licenses.find((l) => l.status === "active");
    if (active) {
      return {
        maxPlayers: Number(active.maxPlayers) || 10,
        maxTutors: Number(active.maxTutors) || 2,
        languages: active.languages || (active.language ? [active.language] : ["FR"]),
        expiresAt: active.expiresAt,
        code: active.code,
        licenseType: active.licenseType || "standard",
      };
    }
  } catch (e) {
    console.error("Erreur lecture licence active", e);
  }

  return null;
}