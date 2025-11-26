export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: 'Importante' | 'Evento' | 'Novedad';
  imageUrl?: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  isDownloadable?: boolean;
  downloadUrl?: string;
  requiresUpload?: boolean;
  // Admin management fields
  isCustom?: boolean; 
  order?: number;
}

export interface Question {
  id: string;
  text: string;
  triggerSteps: string[]; // IDs of steps that this question activates if YES
  isEnabled?: boolean; // New: Allow admin to toggle visibility
}

export interface EventType {
  id: string;
  title: string;
  iconName: string;
  description: string;
  baseSteps: Step[];
  questions: Question[];
  imageUrl?: string; // New: Custom image for the event card
  documentUrl?: string; // New: General document attached to the protocol
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type UserRole = 'USER' | 'ADMIN' | 'CREATOR';

export interface User {
  username: string;
  role: UserRole;
}

// --- NEW TYPES FOR ADMIN FEATURES ---

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Stored securely
  role: UserRole;
}

export interface PopupConfig {
  id: string;
  title: string;
  content: string;
  isEnabled: boolean;
  type: 'info' | 'warning' | 'alert';
}

export type FormFieldType = 'text' | 'textarea' | 'checkbox' | 'select';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  options?: string[]; // For select type
  required?: boolean;
}

export interface FormTemplate {
  id: string;
  eventId: string; // The event this form belongs to
  title: string;
  description?: string;
  fields: FormField[];
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  isEnabled: boolean;
}

export interface ContactInfo {
  coordinatorName: string;
  coordinatorPhone: string;
  assistantName: string;
  assistantPhone: string;
  email: string;
  address: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}