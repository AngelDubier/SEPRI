import { EventType, NewsItem, PopupConfig, FormTemplate, Step, QuickLink, ContactInfo, UserAccount, UserRole } from '../types';
import { EVENTS_DATA, NEWS_DATA, DEFAULT_POPUPS, DEFAULT_FORMS, DEFAULT_QUICK_LINKS, DEFAULT_CONTACT_INFO, ADMIN_CREDENTIALS, CREATOR_CREDENTIALS } from '../constants';

// Keys for Local Storage
const KEYS = {
  EVENTS: 'sepri_events',
  NEWS: 'sepri_news',
  POPUPS: 'sepri_popups',
  FORMS: 'sepri_forms',
  QUICK_LINKS: 'sepri_quick_links',
  CONTACT: 'sepri_contact',
  USERS: 'sepri_users'
};

// Helper for safe JSON parsing
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage`, e);
    return fallback;
  }
};

// Helper for safe setting
const safeSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
    alert("Error al guardar datos. Es posible que el almacenamiento esté lleno. Intenta usar imágenes más pequeñas o limpiar datos.");
  }
};

// --- SECURITY & USER MANAGEMENT ---

// Simple SHA-256 hash function using Web Crypto API
// Includes fallback for non-secure contexts (http) where crypto.subtle is undefined
async function hashPassword(password: string): Promise<string> {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("Crypto subtle failed, falling back to simple hash", e);
    }
  }
  
  // Fallback for non-secure environments (Development/Preview)
  // NOTE: In production, always use HTTPS.
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "insecure_hash_" + Math.abs(hash).toString(16);
}

// Generate a secure random password
function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const initUsers = async () => {
  const existingUsers = localStorage.getItem(KEYS.USERS);
  if (!existingUsers) {
    const adminHash = await hashPassword(ADMIN_CREDENTIALS.password);
    const creatorHash = await hashPassword(CREATOR_CREDENTIALS.password);

    const initialUsers: UserAccount[] = [
      {
        id: 'user-admin',
        name: 'Administrador SEPRI',
        email: ADMIN_CREDENTIALS.username,
        passwordHash: adminHash,
        role: 'ADMIN'
      },
      {
        id: 'user-creator',
        name: 'Creador del Sistema',
        email: CREATOR_CREDENTIALS.username,
        passwordHash: creatorHash,
        role: 'CREATOR'
      }
    ];
    safeSet(KEYS.USERS, initialUsers);
  }
};

export const getUsers = (): UserAccount[] => {
  return safeParse<UserAccount[]>(KEYS.USERS, []);
};

export const authenticateUser = async (email: string, passwordPlain: string): Promise<UserRole | null> => {
  // Ensure users are initialized
  if (!localStorage.getItem(KEYS.USERS)) {
    await initUsers();
  }
  
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
      const newHash = await hashPassword(newPassword);
      
      users[index].passwordHash = newHash;
      saveUsers(users); // Persist immediately
      
      return newPassword; // Return plain text ONLY ONCE to show to admin
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    return null;
  }
  return null;
};

export const saveUsers = (users: UserAccount[]) => {
  safeSet(KEYS.USERS, users);
};


// --- EVENTS & STEPS ---

export const getEvents = (): EventType[] => {
  return safeParse<EventType[]>(KEYS.EVENTS, EVENTS_DATA);
};

export const saveEvents = (events: EventType[]) => {
  safeSet(KEYS.EVENTS, events);
};

export const addEvent = (event: EventType) => {
  const events = getEvents();
  events.push(event);
  saveEvents(events);
};

export const deleteEvent = (id: string) => {
  const events = getEvents().filter(e => e.id !== id);
  saveEvents(events);
};

export const updateEventStep = (eventId: string, updatedStep: Step) => {
  const events = getEvents();
  const eventIndex = events.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return;

  const steps = events[eventIndex].baseSteps;
  const stepIndex = steps.findIndex(s => s.id === updatedStep.id);

  if (stepIndex !== -1) {
    // Update existing
    steps[stepIndex] = updatedStep;
  } else {
    // Add new (simulated for custom steps if integrated into base)
    steps.push(updatedStep);
  }
  
  events[eventIndex].baseSteps = steps;
  saveEvents(events);
};

// --- NEWS ---

export const getNews = (): NewsItem[] => {
  return safeParse<NewsItem[]>(KEYS.NEWS, NEWS_DATA);
};

export const saveNews = (news: NewsItem[]) => {
  safeSet(KEYS.NEWS, news);
};

// --- POPUPS ---

export const getPopups = (): PopupConfig[] => {
  return safeParse<PopupConfig[]>(KEYS.POPUPS, DEFAULT_POPUPS);
};

export const savePopups = (popups: PopupConfig[]) => {
  safeSet(KEYS.POPUPS, popups);
};

export const togglePopup = (id: string, isEnabled: boolean) => {
  const popups = getPopups();
  const index = popups.findIndex(p => p.id === id);
  if (index !== -1) {
    popups[index].isEnabled = isEnabled;
    savePopups(popups);
  }
};

export const updatePopup = (updatedPopup: PopupConfig) => {
  const popups = getPopups();
  const index = popups.findIndex(p => p.id === updatedPopup.id);
  if (index !== -1) {
    popups[index] = updatedPopup;
    savePopups(popups);
  }
};

// --- FORMS ---

export const getForms = (): FormTemplate[] => {
  return safeParse<FormTemplate[]>(KEYS.FORMS, DEFAULT_FORMS);
};

export const saveForms = (forms: FormTemplate[]) => {
  safeSet(KEYS.FORMS, forms);
};

export const addForm = (form: FormTemplate) => {
  const forms = getForms();
  forms.push(form);
  saveForms(forms);
};

export const deleteForm = (formId: string) => {
  const forms = getForms().filter(f => f.id !== formId);
  saveForms(forms);
};

// --- QUICK LINKS ---

export const getQuickLinks = (): QuickLink[] => {
  return safeParse<QuickLink[]>(KEYS.QUICK_LINKS, DEFAULT_QUICK_LINKS);
};

export const saveQuickLinks = (links: QuickLink[]) => {
  safeSet(KEYS.QUICK_LINKS, links);
};

export const addQuickLink = (link: QuickLink) => {
  const links = getQuickLinks();
  links.push(link);
  saveQuickLinks(links);
};

export const deleteQuickLink = (id: string) => {
  const links = getQuickLinks().filter(l => l.id !== id);
  saveQuickLinks(links);
};

export const updateQuickLink = (link: QuickLink) => {
    const links = getQuickLinks();
    const index = links.findIndex(l => l.id === link.id);
    if (index !== -1) {
        links[index] = link;
        saveQuickLinks(links);
    }
};

// --- CONTACT INFO ---

export const getContactInfo = (): ContactInfo => {
  return safeParse<ContactInfo>(KEYS.CONTACT, DEFAULT_CONTACT_INFO);
};

export const saveContactInfo = (info: ContactInfo) => {
  safeSet(KEYS.CONTACT, info);
};