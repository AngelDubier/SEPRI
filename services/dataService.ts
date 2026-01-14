
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
