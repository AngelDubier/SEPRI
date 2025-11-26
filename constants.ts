import { EventType, NewsItem, Step, PopupConfig, FormTemplate, QuickLink, ContactInfo } from './types';

export const CONTACT_EMAIL = "distrito22a@ipuc.org.co";
export const COORDINATOR_PHONE = "3233589608";
export const ASSISTANT_PHONE = "3103922530";

// --- SECURITY CONFIGURATION ---
export const ADMIN_CREDENTIALS = {
  username: 'distrito22a@ipuc.org.co', // Updated to official email per user request context
  password: 'S3cur3#Admin!2025', 
  role: 'ADMIN' as const
};

export const CREATOR_CREDENTIALS = {
  username: 'creator.master@ipuc.org.co',
  password: 'M@st3r#Univ3rs3$99', 
  role: 'CREATOR' as const
};

// --- INITIAL DATA (Will be loaded by DataService if LocalStorage is empty) ---

export const NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    title: 'Actualización de Protocolos 2025',
    date: '22 de Agosto, 2024',
    category: 'Importante',
    summary: 'Se han actualizado las guías para eventos masivos y campamentos. Es obligatorio el uso de los nuevos formatos de pólizas.'
  },
  {
    id: '2',
    title: 'Mejora en Extintores Sede Distrital',
    date: '15 de Julio, 2024',
    category: 'Novedad',
    summary: 'Se realizó la recarga y mantenimiento certificado de todos los extintores de la sede administrativa, cumpliendo con la norma NTC.'
  },
  {
    id: '3',
    title: 'Capacitación de Primeros Auxilios',
    date: '10 de Septiembre, 2024',
    category: 'Evento',
    summary: 'Jornada de capacitación con la Cruz Roja para líderes locales de SEPRI. Inscripciones abiertas.'
  }
];

export const EVENTS_DATA: EventType[] = [
  {
    id: 'transporte',
    title: 'Transporte y Logística',
    iconName: 'Bus',
    description: 'Protocolos para caravanas, rutas y contratación de vehículos.',
    baseSteps: [
      {
        id: 'doc-vehiculo',
        title: 'Documentación del Vehículo',
        description: 'Recopilar Tarjeta de Propiedad, SOAT vigente y Revisión Tecnomecánica.',
        deadline: '15 días antes',
        isDownloadable: true,
        downloadUrl: '/files/formato_vehiculo.pdf' 
      },
      {
        id: 'doc-conductor',
        title: 'Documentación del Conductor',
        description: 'Copia de Cédula y Licencia de Conducción vigente categoría apropiada.',
        deadline: '15 días antes',
        isDownloadable: true,
        downloadUrl: '/files/formato_conductor.pdf'
      }
    ],
    questions: [
      {
        id: 'is-public-transport',
        text: '¿El transporte es contratado con una empresa pública?',
        triggerSteps: ['rut-empresa', 'poliza-contractual']
      }
    ]
  },
  {
    id: 'campamentos',
    title: 'Campamentos y Retiros',
    iconName: 'Tent',
    description: 'Gestión de seguridad para eventos fuera del templo, fincas y hoteles.',
    baseSteps: [
      {
        id: 'auth-directivos',
        title: 'Autorización Directivos',
        description: 'Enviar solicitud al correo del distrito.',
        deadline: '2 Meses antes',
        isDownloadable: true,
        downloadUrl: '/files/solicitud_directivos.pdf'
      },
      {
        id: 'plan-contingencia',
        title: 'Plan de Contingencia',
        description: 'Documento de ruta de evacuación y emergencias del lugar.',
        requiresUpload: true,
        isDownloadable: true,
        downloadUrl: '/files/guia_plan_contingencia.pdf'
      },
      {
        id: 'listado-asistentes',
        title: 'Listado de Asistentes',
        description: 'Formato Excel con datos de contacto y EPS de todos los participantes.',
        isDownloadable: true,
        downloadUrl: '/files/plantilla_asistentes.xlsx'
      }
    ],
    questions: [
      {
        id: 'has-food',
        text: '¿Se manipularán alimentos en el sitio?',
        triggerSteps: ['cert-manipulacion']
      },
      {
        id: 'has-pool',
        text: '¿El lugar cuenta con piscina o zonas húmedas?',
        triggerSteps: ['salvavidas']
      }
    ]
  },
  {
    id: 'masivos',
    title: 'Eventos Masivos (>500)',
    iconName: 'Users',
    description: 'Convenciones, confraternidades y conciertos con alto aforo.',
    baseSteps: [
      {
        id: 'viabilidad',
        title: 'Formato de Viabilidad',
        description: 'Diligenciar formato diseñado por jurídica nacional.',
        deadline: '2 Meses antes',
        isDownloadable: true,
        downloadUrl: '/files/formato_viabilidad.pdf'
      },
      {
        id: 'organismos',
        title: 'Notificación Organismos de Socorro',
        description: 'Carta a Bomberos, Defensa Civil o Cruz Roja.',
        deadline: '1 Mes antes',
        isDownloadable: true,
        downloadUrl: '/files/carta_organismos.docx'
      }
    ],
    questions: [
      {
        id: 'over-500',
        text: '¿El aforo supera las 500 personas?',
        triggerSteps: ['poliza-extra']
      }
    ]
  }
];

export const EXTRA_STEPS: Record<string, Step> = {
  'rut-empresa': {
    id: 'rut-empresa',
    title: 'RUT de la Empresa',
    description: 'Certificado donde conste la actividad económica de transporte público.',
    isDownloadable: false
  },
  'poliza-contractual': {
    id: 'poliza-contractual',
    title: 'Pólizas de Seguro',
    description: 'Pólizas de responsabilidad civil contractual y extracontractual de la empresa.',
    isDownloadable: false
  },
  'cert-manipulacion': {
    id: 'cert-manipulacion',
    title: 'Certificado Manipulación Alimentos',
    description: 'Carnet o certificado vigente de las personas encargadas de cocina.',
    isDownloadable: false
  },
  'salvavidas': {
    id: 'salvavidas',
    title: 'Certificado Salvavidas',
    description: 'Documentación que acredite idoneidad del personal de rescate acuático.',
    isDownloadable: false
  },
  'poliza-extra': {
    id: 'poliza-extra',
    title: 'Póliza Extracontractual Eventos',
    description: 'Se requiere póliza adicional solicitada al departamento jurídico nacional.',
    deadline: '1 Mes antes',
    isDownloadable: true,
    downloadUrl: '/files/instructivo_poliza.pdf'
  }
};

// --- POPUPS ---
export const DEFAULT_POPUPS: PopupConfig[] = [
  {
    id: 'welcome-alert',
    title: '¡Aviso Importante!',
    content: 'Recuerda enviar las pólizas con 30 días de anticipación para eventos masivos.',
    isEnabled: true,
    type: 'info'
  },
  {
    id: 'weather-alert',
    title: 'Alerta Climática',
    content: 'Por temporada de lluvias, revisa el estado de techos y carpas antes de tu evento.',
    isEnabled: false,
    type: 'warning'
  }
];

// --- FORMS ---
export const DEFAULT_FORMS: FormTemplate[] = [
  {
    id: 'form-reporte-incidente',
    eventId: 'campamentos',
    title: 'Reporte de Novedades',
    description: 'Formulario para reportar incidentes menores durante el campamento.',
    fields: [
      { id: 'f1', label: 'Nombre del Responsable', type: 'text', required: true },
      { id: 'f2', label: 'Descripción del suceso', type: 'textarea', required: true },
      { id: 'f3', label: '¿Hubo lesionados?', type: 'checkbox' }
    ]
  }
];

// --- QUICK LINKS ---
export const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: 'ql-1', title: 'Descargar Formatos', url: '/formatos', isEnabled: true },
  { id: 'ql-2', title: 'Reportar Incidente', url: '/reportar-incidente', isEnabled: true },
  { id: 'ql-3', title: 'Directorio de Emergencia', url: '/directorio-emergencia', isEnabled: true },
  { id: 'ql-4', title: 'Política de Privacidad', url: '/politicas-privacidad', isEnabled: true },
];

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  coordinatorName: "Juan Felipe Vera Gómez",
  coordinatorPhone: "3233589608",
  assistantName: "Dubanier Medina Ruíz",
  assistantPhone: "3103922530",
  email: "distrito22a@ipuc.org.co",
  address: "Sede Administrativa Distrito 22, Colombia",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com"
};

export const SYSTEM_INSTRUCTION = `
Eres "SEPRI", el asistente virtual de Seguridad y Prevención del Riesgo del Distrito 22 de la Iglesia Pentecostal Unida de Colombia.
Tu misión es ayudar a pastores y líderes a gestionar la seguridad de sus eventos.

Reglas y Datos Clave:
1.  **Plazos**: Las solicitudes a directivos deben hacerse con 2 meses de anticipación. Documentos a alcaldía: 15 días antes.
2.  **Contactos**: Coordinador Juan Felipe Vera (${COORDINATOR_PHONE}), Asistente Dubanier Medina (${ASSISTANT_PHONE}). Correo: ${CONTACT_EMAIL}.
3.  **Eventos Masivos**: Si supera 500 personas, es OBLIGATORIA la póliza extracontractual tramitada con jurídica nacional.
4.  **Transporte**: Siempre exigir SOAT, Tecnomecánica, Licencia y Tarjeta de Propiedad. Si es empresa, pedir RUT y Pólizas.
5.  **Lema**: "La seguridad se trata de hacer lo correcto, incluso si nadie está mirando".
6.  **Tono**: Amable, servicial, institucional y serio pero cercano.
7.  **Formatos**: Menciona siempre que los formatos se pueden descargar en esta plataforma.

Si te preguntan algo fuera de seguridad/eventos, responde amablemente que tu función es asistir en temas de prevención del riesgo SEPRI.
`;