
import { ContactInfo, Step } from './types';

export const CONTACT_EMAIL = "distrito22a@ipuc.org.co";
export const COORDINATOR_PHONE = "3233589608";
export const ASSISTANT_PHONE = "3103922530";

export const NEWS_CAROUSEL_INTERVAL = 5000;

export const ADMIN_CREDENTIALS = {
  username: 'distrito22a@ipuc.org.co',
  password: 'S3cur3#Admin!2025', 
  role: 'ADMIN' as const
};

// CREATOR_CREDENTIALS for the system creator role as used in dataService.ts
export const CREATOR_CREDENTIALS = {
  username: 'sepri.creator@ipuc.org.co',
  password: 'System#Creator!2025',
  role: 'CREATOR' as const
};

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  coordinatorName: "Juan Felipe Vera Gómez",
  coordinatorPhone: "3233589608",
  assistantName: "Dubanier Medina Ruíz",
  assistantPhone: "3103922530",
  email: "distrito22a@ipuc.org.co",
  address: "Sede Administrativa Distrito 22, Colombia",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com",
  logoUrl: "",
  heroImageUrl: "",
  privacyPolicy: "La Iglesia Pentecostal Unida de Colombia - Distrito 22, a través de su área SEPRI, está comprometida con la protección de sus datos personales. Los datos recolectados se utilizan exclusivamente para la gestión de protocolos de seguridad y prevención.",
  teamMembers: [
    { id: '1', name: 'Juan Felipe Vera', role: 'Coordinador SEPRI D22', order: 0 },
    { id: '2', name: 'Dubanier Medina', role: 'Asistente Coordinación', order: 1 }
  ]
};

export const SYSTEM_INSTRUCTION = `
Eres "SEPRI", el asistente virtual de Seguridad y Prevención del Riesgo del Distrito 22 de la Iglesia Pentecostal Unida de Colombia.
Tu misión es ayudar a pastores y líderes a gestionar la seguridad de sus eventos.
Responde de manera profesional, empática y clara. Utiliza la información de protocolos disponibles para guiar a los usuarios.
`;

// NEWS_DATA for initial seeding and fallback
export const NEWS_DATA = [
  {
    id: '1',
    title: 'Actualización de Protocolos 2025',
    date: '22 de Agosto, 2024',
    category: 'Importante' as const,
    summary: 'Se han actualizado las guías para eventos masivos y campamentos. Es obligatorio el uso de los nuevos formatos de pólizas.'
  },
  {
    id: '2',
    title: 'Mejora en Extintores Sede Distrital',
    date: '15 de Julio, 2024',
    category: 'Novedad' as const,
    summary: 'Se realizó la recarga y mantenimiento certificado de todos los extintores de la sede administrativa, cumpliendo con la norma NTC.'
  },
  {
    id: '3',
    title: 'Capacitación de Primeros Auxilios',
    date: '10 de Septiembre, 2024',
    category: 'Evento' as const,
    summary: 'Jornada de capacitación con la Cruz Roja para líderes locales de SEPRI. Inscripciones abiertas.'
  }
];

// EVENTS_DATA for initial seeding of protocol types
export const EVENTS_DATA = [
  {
    id: 'transporte',
    title: 'Transporte y Logística',
    iconName: 'Bus',
    description: 'Protocolos para caravanas, rutas y contratación de vehículos.',
    baseSteps: [
      { id: 'doc-vehiculo', title: 'Documentación del Vehículo', description: 'Recopilar Tarjeta de Propiedad, SOAT vigente y Revisión Tecnomecánica.', deadline: '15 días antes', isDownloadable: true, downloadUrl: '', order: 0 },
      { id: 'doc-conductor', title: 'Documentación del Conductor', description: 'Copia de Cédula y Licencia de Conducción vigente categoría apropiada.', deadline: '15 días antes', isDownloadable: true, downloadUrl: '', order: 1 }
    ],
    questions: [
      { id: 'is-public-transport', text: '¿El transporte es contratado con una empresa pública?', triggerSteps: ['rut-empresa', 'poliza-contractual'], isEnabled: true }
    ]
  },
  {
    id: 'campamentos',
    title: 'Campamentos y Retiros',
    iconName: 'Tent',
    description: 'Gestión de seguridad para eventos fuera del templo, fincas y hoteles.',
    baseSteps: [
      { id: 'auth-directivos', title: 'Autorización Directivos', description: 'Enviar solicitud al correo del distrito.', deadline: '2 Meses antes', isDownloadable: true, downloadUrl: '', order: 0 },
      { id: 'plan-contingencia', title: 'Plan de Contingencia', description: 'Documento de ruta de evacuación y emergencias del lugar.', requiresUpload: true, isDownloadable: true, downloadUrl: '', order: 1 },
      { id: 'listado-asistentes', title: 'Listado de Asistentes', description: 'Formato Excel con datos de contacto y EPS de todos los participantes.', isDownloadable: true, downloadUrl: '', order: 2 }
    ],
    questions: [
      { id: 'has-food', text: '¿Se manipularán alimentos en el sitio?', triggerSteps: ['cert-manipulacion'], isEnabled: true },
      { id: 'has-pool', text: '¿El lugar cuenta con piscina o zonas húmedas?', triggerSteps: ['salvavidas'], isEnabled: true }
    ]
  },
  {
    id: 'masivos',
    title: 'Eventos Masivos (>500)',
    iconName: 'Users',
    description: 'Convenciones, confraternidades y conciertos con alto aforo.',
    baseSteps: [
      { id: 'viabilidad', title: 'Formato de Viabilidad', description: 'Diligenciar formato diseñado por jurídica nacional.', deadline: '2 Meses antes', isDownloadable: true, downloadUrl: '', order: 0 },
      { id: 'organismos', title: 'Notificación Organismos de Socorro', description: 'Carta a Bomberos, Defensa Civil o Cruz Roja.', deadline: '1 Mes antes', isDownloadable: true, downloadUrl: '', order: 1 }
    ],
    questions: [
      { id: 'over-500', text: '¿El aforo supera las 500 personas?', triggerSteps: ['poliza-extra'], isEnabled: true }
    ]
  }
];

// DEFAULT_POPUPS for notification system initialization
export const DEFAULT_POPUPS = [
  { id: 'welcome-alert', title: '¡Aviso Importante!', content: 'Recuerda enviar las pólizas con 30 días de anticipación para eventos masivos.', isEnabled: true, type: 'info' as const },
  { id: 'weather-alert', title: 'Alerta Climática', content: 'Por temporada de lluvias, revisa el estado de techos y carpas antes de tu evento.', isEnabled: false, type: 'warning' as const }
];

// DEFAULT_FORMS for interactive step forms
export const DEFAULT_FORMS = [
  {
    id: 'form-reporte-incidente',
    eventId: 'campamentos',
    title: 'Reporte de Novedades',
    description: 'Formulario para reportar incidentes menores durante el campamento.',
    fields: [
      { id: 'f1', label: 'Nombre del Responsable', type: 'text' as const, required: true },
      { id: 'f2', label: 'Descripción del suceso', type: 'textarea' as const, required: true },
      { id: 'f3', label: '¿Hubo lesionados?', type: 'checkbox' as const }
    ]
  }
];

// DEFAULT_QUICK_LINKS for global footer
export const DEFAULT_QUICK_LINKS = [
  { id: 'ql-1', title: 'Descargar Formatos', url: '/formatos', isEnabled: true },
  { id: 'ql-2', title: 'Reportar Incidente', url: '/reportar-incidente', isEnabled: true },
  { id: 'ql-3', title: 'Directorio de Emergencia', url: '/directorio-emergencia', isEnabled: true },
  { id: 'ql-4', title: 'Política de Privacidad', url: '/politicas-privacidad', isEnabled: true },
];

// EXTRA_STEPS for conditional fulfillment path logic in EventProcessPage
export const EXTRA_STEPS: Record<string, Partial<Step>> = {
  'rut-empresa': { id: 'rut-empresa', title: 'RUT de la Empresa', description: 'Copia del RUT actualizado de la empresa de transporte.', isDownloadable: false },
  'poliza-contractual': { id: 'poliza-contractual', title: 'Póliza Contractual', description: 'Certificado de póliza de responsabilidad civil contractual.', isDownloadable: false },
  'cert-manipulacion': { id: 'cert-manipulacion', title: 'Curso de Manipulación', description: 'Certificado vigente de manipulación de alimentos.', isDownloadable: false },
  'salvavidas': { id: 'salvavidas', title: 'Certificado Salvavidas', description: 'Certificación del personal salvavidas de la piscina.', isDownloadable: false },
  'poliza-extra': { id: 'poliza-extra', title: 'Póliza Extracontractual', description: 'Póliza de responsabilidad civil extracontractual para eventos masivos.', isDownloadable: false }
};
