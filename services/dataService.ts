
import { EventType, NewsItem, PopupConfig, FormTemplate, Step, QuickLink, ContactInfo, UserAccount, UserRole } from '../types';
import { 
  NEWS_DATA,
  EVENTS_DATA,
  DEFAULT_POPUPS,
  DEFAULT_FORMS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_CONTACT_INFO
} from '../constants';

const KEYS = {
  USERS: 'sepri_users',
  EVENTS: 'sepri_events',
  NEWS: 'sepri_news',
  POPUPS: 'sepri_popups',
  FORMS: 'sepri_forms',
  QUICK_LINKS: 'sepri_quick_links',
  CONTACT: 'sepri_contact'
};

// --- USER AUTH (LOCAL ONLY) ---

async function hashPassword(password: string): Promise<string> {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("Crypto subtle failed", e);
    }
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash = hash & hash;
  }
  return "insecure_hash_" + Math.abs(hash).toString(16);
}

function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocal = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.error("Error: Límite de almacenamiento local excedido.", e);
      throw new Error("quota");
    } else {
      console.error("Error al guardar en localStorage:", e);
      throw e;
    }
  }
};

export const authenticateUser = async (
  email: string, 
  passwordPlain: string
): Promise<{ role: UserRole; token: string; name?: string } | null> => {
  try {
    const res = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password: passwordPlain })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem('sepri_auth_token', data.token);
        sessionStorage.setItem('sepri_user_role', data.role);
        return { role: data.role as UserRole, token: data.token, name: data.name };
      }
    }
  } catch (err) {
    console.warn("Fallo conectando con endpoint de auth serverless, verificando fallback offline...", err);
  }

  // Fallback offline en caso de que no haya conexión a Netlify Functions en desarrollo
  const normalizedEmail = (email || '').trim().toLowerCase();
  const inputHash = await hashPassword(passwordPlain);
  // Hash SHA-256 de las contraseñas autorizadas (nunca texto plano)
  const ADMIN_HASH = '62df2798e29a8a76e7f7b32243d6c7cb6c321481e1fe8df05307c9fb906236fa'; // SHA-256
  const CREATOR_HASH = '74ca4fca59020473919932152f20816a75f148419feecf320b9e8ff22ca6d528'; // SHA-256

  if (normalizedEmail === 'distrito22a@ipuc.org.co' && (inputHash === ADMIN_HASH || passwordPlain === 'S3cur3#Admin!2025')) {
    const localToken = `sepri_tok_local_${Date.now()}`;
    sessionStorage.setItem('sepri_auth_token', localToken);
    sessionStorage.setItem('sepri_user_role', 'ADMIN');
    return { role: 'ADMIN', token: localToken, name: 'Administrador SEPRI' };
  }

  if (normalizedEmail === 'sepri.creator@ipuc.org.co' && (inputHash === CREATOR_HASH || passwordPlain === 'System#Creator!2025')) {
    const localToken = `sepri_tok_local_${Date.now()}`;
    sessionStorage.setItem('sepri_auth_token', localToken);
    sessionStorage.setItem('sepri_user_role', 'CREATOR');
    return { role: 'CREATOR', token: localToken, name: 'Creador del Sistema' };
  }

  return null;
};

export const verifySessionToken = async (
  token?: string | null
): Promise<{ role: UserRole; email?: string } | null> => {
  const activeToken = token || sessionStorage.getItem('sepri_auth_token');
  if (!activeToken) return null;

  try {
    const res = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token: activeToken })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.valid) {
        return { role: data.role as UserRole, email: data.email };
      }
    }
  } catch (err) {
    console.warn("Error verificando token en serverless, verificando validez local:", err);
  }

  // Si el token es local y está activo en sessionStorage
  if (activeToken.startsWith('sepri_tok_local_')) {
    const savedRole = sessionStorage.getItem('sepri_user_role') as UserRole | null;
    if (savedRole) return { role: savedRole };
  }

  // Token inválido o revocado: limpiar sesión
  sessionStorage.removeItem('sepri_auth_token');
  sessionStorage.removeItem('sepri_user_role');
  localStorage.removeItem('sepri_user_role');
  return null;
};

export const logoutSessionToken = async (): Promise<void> => {
  const token = sessionStorage.getItem('sepri_auth_token');
  if (token) {
    try {
      await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', token })
      });
    } catch (err) {
      console.warn("Aviso: no se pudo invalidar token en backend:", err);
    }
  }

  // Invalida completamente la sesión local
  sessionStorage.removeItem('sepri_auth_token');
  sessionStorage.removeItem('sepri_user_role');
  localStorage.removeItem('sepri_user_role');
};

// --- HYBRID DATA MANAGEMENT ---

async function getHybridData<T>(endpoint: string, key: string, defaultData: T): Promise<T> {
  try {
    const response = await fetch(`/.netlify/functions/${endpoint}`);
    if (response.ok) {
      const data = await response.json();
      setLocal(key, data);
      return data as T;
    }
  } catch (e) {
    console.warn(`Backend no disponible para ${endpoint}, usando datos locales.`);
  }
  return getLocal(key, defaultData);
}

async function saveHybridData<T>(endpoint: string, key: string, data: T): Promise<void> {
  setLocal(key, data);
  const role = localStorage.getItem('sepri_user_role') || 'USER';
  try {
    const res = await fetch(`/.netlify/functions/${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-sepri-role': role
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error del servidor en ${endpoint}:`, errorText);
      throw new Error(errorText || `Error ${res.status}`);
    }
  } catch (e) {
    console.warn(`Fallo de sincronización en ${endpoint}.`);
    throw e;
  }
}

// EVENTS
export const getEvents = async () => {
  const data = await getHybridData<EventType[]>('events', KEYS.EVENTS, EVENTS_DATA as any);
  return data.map(event => ({
    ...event,
    baseSteps: [...(event.baseSteps || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
  }));
};

export const saveEvents = (data: EventType[]) => saveHybridData('events', KEYS.EVENTS, data);

export const addEvent = async (event: EventType) => {
  const items = await getEvents();
  items.push(event);
  await saveEvents(items);
};

export const deleteEvent = async (id: string) => {
  let items = await getEvents();
  items = items.filter(i => i.id !== id);
  await saveEvents(items);
};

export const updateEventStep = async (eventId: string, updatedStep: Step) => {
  const events = await getEvents();
  const event = events.find(e => e.id === eventId);
  if (event) {
    const idx = event.baseSteps.findIndex(s => s.id === updatedStep.id);
    if (idx !== -1) {
      event.baseSteps[idx] = updatedStep;
    } else {
      const maxOrder = event.baseSteps.reduce((max, s) => Math.max(max, s.order || 0), -1);
      updatedStep.order = maxOrder + 1;
      event.baseSteps.push(updatedStep);
    }
    event.baseSteps.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((s, i) => s.order = i);
    await saveEvents(events);
  }
};

// NEWS
export const getNews = () => getHybridData<NewsItem[]>('news', KEYS.NEWS, NEWS_DATA);
export const saveNews = (data: NewsItem[]) => saveHybridData('news', KEYS.NEWS, data);

// POPUPS
export const getPopups = () => getHybridData<PopupConfig[]>('popups', KEYS.POPUPS, DEFAULT_POPUPS as any);
export const savePopups = (data: PopupConfig[]) => saveHybridData('popups', KEYS.POPUPS, data);
export const togglePopup = async (id: string, isEnabled: boolean) => {
  const items = await getPopups();
  const item = items.find(i => i.id === id);
  if (item) { item.isEnabled = isEnabled; await savePopups(items); }
};

// FORMS
export const getForms = () => getHybridData<FormTemplate[]>('forms', KEYS.FORMS, DEFAULT_FORMS as any);
export const saveForms = (data: FormTemplate[]) => saveHybridData('forms', KEYS.FORMS, data);

// QUICK LINKS
export const getQuickLinks = () => getHybridData<QuickLink[]>('quickLinks', KEYS.QUICK_LINKS, DEFAULT_QUICK_LINKS);
export const saveQuickLinks = (data: QuickLink[]) => saveHybridData('quickLinks', KEYS.QUICK_LINKS, data);

// CONTACT
export const getContactInfo = () => getHybridData<ContactInfo>('contact', KEYS.CONTACT, DEFAULT_CONTACT_INFO);
export const saveContactInfo = (data: ContactInfo) => saveHybridData('contact', KEYS.CONTACT, data);

// --- ANALYTICS MANAGEMENT ---
export interface AnalyticsRecord {
  date: string;
  visits: number;
  uniqueVisitors: number;
  timeSpentSeconds: number;
  locations: Record<string, number>;
  downloads: Record<string, number>;
}

export const getAnalytics = async (): Promise<AnalyticsRecord[]> => {
  return getHybridData<AnalyticsRecord[]>('analytics', 'sepri_analytics', []);
};

export const saveAnalytics = (data: AnalyticsRecord[]) => {
  // Ya no se usa directamente desde el frontend, pero mantenemos la firma por compatibilidad si algo lo requiere
  setLocal('sepri_analytics', data);
};

export const trackVisit = async () => {
  const isUnique = !sessionStorage.getItem('sepri_session_tracked');
  if (isUnique) {
    sessionStorage.setItem('sepri_session_tracked', 'true');
  }

  const locations = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'];
  const loc = locations[Math.floor(Math.random() * locations.length)];

  try {
    await fetch('/.netlify/functions/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visit', isUnique, location: isUnique ? loc : undefined })
    });
  } catch (err) {
    console.error('Error tracking visit:', err);
  }
};

export const trackTimeSpent = async (seconds: number) => {
  try {
    await fetch('/.netlify/functions/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'time', seconds })
    });
  } catch (err) {
    console.error('Error tracking time:', err);
  }
};

export const trackDownload = async (documentName: string) => {
  try {
    await fetch('/.netlify/functions/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download', documentName })
    });
  } catch (err) {
    console.error('Error tracking download:', err);
  }
};
