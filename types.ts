
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
  videoUrl?: string;
  requiresUpload?: boolean;
  isCustom?: boolean; 
  order: number;
}

export interface ConditionalFormat {
  id: string;
  name: string;
  url: string;
}

export interface Question {
  id: string;
  text: string;
  triggerSteps: string[]; 
  isEnabled?: boolean;
  yesContent?: string; 
  noContent?: string;  
  yesFormats?: ConditionalFormat[];
  noFormats?: ConditionalFormat[];
}

export interface ProtocolAlert { 
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  active: boolean;
}

export interface EventType {
  id: string;
  title: string;
  iconName: string;
  description: string;
  baseSteps: Step[];
  questions: Question[];
  imageUrl?: string;
  documentUrl?: string;
  alerts?: ProtocolAlert[]; 
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  order: number;
  updatedAt?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type UserRole = 'USER' | 'ADMIN' | 'CREATOR';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface PopupConfig {
  id: string;
  title: string;
  content: string;
  isEnabled: boolean;
  type: 'info' | 'warning' | 'alert';
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
  logoUrl?: string;
  heroImageUrl?: string;
  privacyPolicy?: string; 
  teamMembers?: TeamMember[]; 
  geminiApiKey?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox';
  required?: boolean;
}

export interface FormTemplate {
  id: string;
  eventId: string;
  title: string;
  description: string;
  fields: FormField[];
}