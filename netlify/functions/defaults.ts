// Default data to seed the backend if the database (Blobs) is empty.
// Duplicated from constants.ts to ensure backend isolation.

export const NEWS_DATA = [
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

export const DEFAULT_POPUPS = [
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

export const DEFAULT_QUICK_LINKS = [
  { id: 'ql-1', title: 'Descargar Formatos', url: '/formatos', isEnabled: true },
  { id: 'ql-2', title: 'Reportar Incidente', url: '/reportar-incidente', isEnabled: true },
  { id: 'ql-3', title: 'Directorio de Emergencia', url: '/directorio-emergencia', isEnabled: true },
  { id: 'ql-4', title: 'Política de Privacidad', url: '/politicas-privacidad', isEnabled: true },
];

export const DEFAULT_CONTACT_INFO = {
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

export const EVENTS_DATA = [
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
        downloadUrl: '' 
      },
      {
        id: 'doc-conductor',
        title: 'Documentación del Conductor',
        description: 'Copia de Cédula y Licencia de Conducción vigente categoría apropiada.',
        deadline: '15 días antes',
        isDownloadable: true,
        downloadUrl: ''
      }
    ],
    questions: [
      {
        id: 'is-public-transport',
        text: '¿El transporte es contratado con una empresa pública?',
        triggerSteps: ['rut-empresa', 'poliza-contractual'],
        isEnabled: true
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
        downloadUrl: ''
      },
      {
        id: 'plan-contingencia',
        title: 'Plan de Contingencia',
        description: 'Documento de ruta de evacuación y emergencias del lugar.',
        requiresUpload: true,
        isDownloadable: true,
        downloadUrl: ''
      },
      {
        id: 'listado-asistentes',
        title: 'Listado de Asistentes',
        description: 'Formato Excel con datos de contacto y EPS de todos los participantes.',
        isDownloadable: true,
        downloadUrl: ''
      }
    ],
    questions: [
      {
        id: 'has-food',
        text: '¿Se manipularán alimentos en el sitio?',
        triggerSteps: ['cert-manipulacion'],
        isEnabled: true
      },
      {
        id: 'has-pool',
        text: '¿El lugar cuenta con piscina o zonas húmedas?',
        triggerSteps: ['salvavidas'],
        isEnabled: true
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
        downloadUrl: ''
      },
      {
        id: 'organismos',
        title: 'Notificación Organismos de Socorro',
        description: 'Carta a Bomberos, Defensa Civil o Cruz Roja.',
        deadline: '1 Mes antes',
        isDownloadable: true,
        downloadUrl: ''
      }
    ],
    questions: [
      {
        id: 'over-500',
        text: '¿El aforo supera las 500 personas?',
        triggerSteps: ['poliza-extra'],
        isEnabled: true
      }
    ]
  }
];

export const DEFAULT_FORMS = [
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