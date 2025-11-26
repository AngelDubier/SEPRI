import { EventType, NewsItem, PopupConfig, FormTemplate, Step, QuickLink, ContactInfo, UserAccount, UserRole } from '../types';
import { 
  ADMIN_CREDENTIALS, 
  CREATOR_CREDENTIALS,
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
  localStorage.setItem(key, JSON.stringify(val));
};

export const initUsers = async () => {
  const existingUsers = localStorage.getItem(KEYS.USERS);
  if (!existingUsers) {
    const adminHash = await hashPassword(ADMIN_CREDENTIALS.password);
    const creatorHash = await hashPassword(CREATOR_CREDENTIALS.password);
    const initialUsers: UserAccount[] = [
      { id: 'user-admin', name: 'Administrador SEPRI', email: ADMIN_CREDENTIALS.username, passwordHash: adminHash, role: 'ADMIN' },
      { id: 'user-creator', name: 'Creador del Sistema', email: CREATOR_CREDENTIALS.username, passwordHash: creatorHash, role: 'CREATOR' }
    ];
    setLocal(KEYS.USERS, initialUsers);
  }
};

export const getUsers = (): UserAccount[] => getLocal(KEYS.USERS, []);

export const authenticateUser = async (email: string, passwordPlain: string): Promise<UserRole | null> => {
  if (!localStorage.getItem(KEYS.USERS)) await initUsers();
  const users = getUsers();
  const inputHash = await hashPassword(passwordPlain);
  const user = users.find(u => u.email === email && u.passwordHash === inputHash);
  return user ? user.role : null;
};

export const resetUserPassword = async (userId: string): Promise<string | null> => {
  try {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const newPassword = generateSecurePassword();
      users[index].passwordHash = await hashPassword(newPassword);
      setLocal(KEYS.USERS, users);
      return newPassword;
    }
  } catch (error) { console.error(error); }
  return null;
};

export const saveUsers = (users: UserAccount[]) => setLocal(KEYS.USERS, users);

// --- HYBRID DATA MANAGEMENT (BACKEND + LOCAL FALLBACK) ---

async function getHybridData<T>(endpoint: string, key: string, defaultData: T): Promise<T> {
  try {
    const response = await fetch(`/.netlify/functions/${endpoint}`);
    if (response.ok) {
      const data = await response.json();
      return data as T;
    }
  } catch (e) {
    console.warn(`Backend no disponible para ${endpoint}`, e);
  }
  // Si el backend falla, usamos SOLO los defaults, NO el localStorage
  return defaultData;
}

async function saveHybridData<T>(endpoint: string, key: string, data: T): Promise<void> {
  try {
    const res = await fetch(`/.netlify/functions/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      alert(`No se pudo guardar ${endpoint} en el servidor.`);
    }
  } catch (e) {
    console.warn(`Error al sincronizar ${endpoint} con el backend`, e);
    alert(`No se pudo guardar ${endpoint}. Revisa tu conexión.`);
  }
}

// EVENTS
export const getEvents = () => getHybridData('events', KEYS.EVENTS, EVENTS_DATA);
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
    if (idx !== -1) event.baseSteps[idx] = updatedStep;
    else event.baseSteps.push(updatedStep);
    await saveEvents(events);
  }
};

// NEWS
export const getNews = () => getHybridData('news', KEYS.NEWS, NEWS_DATA);
export const saveNews = (data: NewsItem[]) => saveHybridData('news', KEYS.NEWS, data);

// POPUPS
export const getPopups = () => getHybridData('popups', KEYS.POPUPS, DEFAULT_POPUPS);
export const savePopups = (data: PopupConfig[]) => saveHybridData('popups', KEYS.POPUPS, data);
export const togglePopup = async (id: string, isEnabled: boolean) => {
  const items = await getPopups();
  const item = items.find(i => i.id === id);
  if (item) { item.isEnabled = isEnabled; await savePopups(items); }
};
export const updatePopup = async (updated: PopupConfig) => {
  const items = await getPopups();
  const idx = items.findIndex(i => i.id === updated.id);
  if (idx !== -1) { items[idx] = updated; await savePopups(items); }
};

// FORMS
export const getForms = () => getHybridData('forms', KEYS.FORMS, DEFAULT_FORMS);
export const saveForms = (data: FormTemplate[]) => saveHybridData('forms', KEYS.FORMS, data);
export const addForm = async (form: FormTemplate) => {
  const items = await getForms();
  items.push(form);
  await saveForms(items);
};
export const deleteForm = async (id: string) => {
  const items = await getForms();
  await saveForms(items.filter(i => i.id !== id));
};

// QUICK LINKS
export const getQuickLinks = () => getHybridData('quickLinks', KEYS.QUICK_LINKS, DEFAULT_QUICK_LINKS);
export const saveQuickLinks = (data: QuickLink[]) => saveHybridData('quickLinks', KEYS.QUICK_LINKS, data);
export const addQuickLink = async (link: QuickLink) => {
  const items = await getQuickLinks();
  items.push(link);
  await saveQuickLinks(items);
};
export const deleteQuickLink = async (id: string) => {
  const items = await getQuickLinks();
  await saveQuickLinks(items.filter(i => i.id !== id));
};
export const updateQuickLink = async (link: QuickLink) => {
  const items = await getQuickLinks();
  const idx = items.findIndex(i => i.id === link.id);
  if (idx !== -1) { items[idx] = link; await saveQuickLinks(items); }
};

// CONTACT
export const getContactInfo = () => getHybridData('contact', KEYS.CONTACT, DEFAULT_CONTACT_INFO);
export const saveContactInfo = (data: ContactInfo) => saveHybridData('contact', KEYS.CONTACT, data);