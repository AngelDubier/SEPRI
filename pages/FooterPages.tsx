import React, { useEffect, useState } from 'react';
import { FileText, Shield, Loader2, Phone, Mail, MapPin, Send, AlertTriangle, User, ExternalLink, LifeBuoy } from 'lucide-react';
import { getEvents, getContactInfo } from '../services/dataService';
import { ContactInfo, EventType } from '../types';
import { DEFAULT_CONTACT_INFO } from '../constants';

export const PrivacyPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      const info = await getContactInfo();
      setContactInfo(info || DEFAULT_CONTACT_INFO);
      setLoading(false);
    };
    loadInfo();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-sepri-medium" /></div>;

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen max-w-4xl">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <h1 className="text-4xl font-black text-sepri-dark mb-8 flex items-center">
          <Shield className="mr-4 text-sepri-yellow" size={40} /> Política de Privacidad
        </h1>
        <div className="prose prose-blue max-w-none text-gray-700 leading-loose text-lg whitespace-pre-wrap">
          {contactInfo?.privacyPolicy || DEFAULT_CONTACT_INFO.privacyPolicy}
        </div>
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-200 text-sm">
           <p className="font-bold mb-2">Responsable del Tratamiento:</p>
           <p>Iglesia Pentecostal Unida de Colombia - Distrito 22</p>
           <p>Área: Seguridad y Prevención del Riesgo (SEPRI)</p>
           <p>Email: <span className="font-bold text-sepri-medium">{contactInfo?.email}</span></p>
        </div>
      </div>
    </div>
  );
};

export const FormatsPage: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      setEvents(await getEvents());
    };
    loadEvents();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-sepri-dark mb-8 flex items-center">
          <FileText className="mr-3 text-sepri-yellow" size={36} /> Formatos y Documentos
        </h1>
        <div className="grid gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 group hover:border-sepri-medium transition-colors">
              <h2 className="text-xl font-bold text-sepri-medium mb-4 flex items-center">
                <div className="w-2 h-8 bg-sepri-yellow mr-3 rounded-full"></div>
                {event.title}
              </h2>
              <div className="space-y-3">
                {event.documentUrl && (
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                    <div>
                      <span className="font-bold text-gray-700 text-sm block">Protocolo General de Seguridad</span>
                      <span className="text-xs text-gray-500">Documento PDF Institucional</span>
                    </div>
                    <a href={event.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-sepri-medium text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-sepri-dark transition-all shadow-md">
                      Descargar <ExternalLink size={14}/>
                    </a>
                  </div>
                )}
                {event.baseSteps.filter(s => s.isDownloadable).map(step => (
                  <div key={step.id} className="flex justify-between items-center bg-white border p-4 rounded-xl">
                    <div>
                      <span className="font-bold text-gray-700 text-sm block">{step.title}</span>
                      <span className="text-xs text-gray-500">Formato de cumplimiento</span>
                    </div>
                    <a href={step.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sepri-medium hover:text-sepri-dark font-black text-xs uppercase tracking-widest">
                      Obtener <FileText size={14}/>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReportIncidentPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    congregation: '',
    incidentType: 'menor',
    description: '',
    location: ''
  });

  const handleSend = () => {
    const message = `REPORTE DE INCIDENTE SEPRI D22\n\nNombre: ${formData.name}\nCongregación: ${formData.congregation}\nTipo: ${formData.incidentType}\nUbicación: ${formData.location}\nDescripción: ${formData.description}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/3233589608?text=${encoded}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen max-w-2xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <AlertTriangle className="w-16 h-16 text-sepri-yellow mx-auto mb-4" />
          <h1 className="text-3xl font-black text-sepri-dark">Reportar Incidente</h1>
          <p className="text-gray-500 mt-2">Diligencia este formulario para notificar a la coordinación distrital.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Nombre del Reportante</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-gray-200 border p-4 rounded-xl focus:ring-2 focus:ring-sepri-medium outline-none transition-all"
              placeholder="Escribe tu nombre completo"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Congregación</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border-gray-200 border p-4 rounded-xl outline-none"
                placeholder="Nombre de tu iglesia"
                value={formData.congregation}
                onChange={e => setFormData({...formData, congregation: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Gravedad</label>
              <select 
                className="w-full bg-gray-50 border-gray-200 border p-4 rounded-xl outline-none"
                value={formData.incidentType}
                onChange={e => setFormData({...formData, incidentType: e.target.value})}
              >
                <option value="menor">Incidente Menor</option>
                <option value="moderado">Moderado</option>
                <option value="grave">Grave / Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Lugar del Suceso</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-gray-200 border p-4 rounded-xl outline-none"
              placeholder="Dirección o descripción del sitio"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Descripción del Incidente</label>
            <textarea 
              className="w-full bg-gray-50 border-gray-200 border p-4 rounded-xl outline-none min-h-[150px]"
              placeholder="Describe detalladamente lo ocurrido y qué medidas se han tomado..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            onClick={handleSend}
            className="w-full bg-sepri-dark text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-sepri-medium transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <Send size={18} /> Enviar Reporte a Coordinación
          </button>
        </div>
      </div>
    </div>
  );
};

export const DirectoryPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);

  useEffect(() => {
    getContactInfo().then(info => info && setContactInfo(info));
  }, []);

  const emergencyNumbers = [
    { title: 'Emergencias Nacional', number: '123', icon: <LifeBuoy size={24}/> },
    { title: 'Policía Nacional', number: '112', icon: <Shield size={24}/> },
    { title: 'Bomberos', number: '119', icon: <AlertTriangle size={24}/> },
    { title: 'Cruz Roja', number: '132', icon: <User size={24}/> }
  ];

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black text-sepri-dark mb-10 flex items-center">
          <Phone className="mr-4 text-sepri-yellow" size={36} /> Directorio de Emergencia
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* SEPRI CONTACTS */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-sepri-medium uppercase tracking-widest flex items-center gap-2">
              <Shield size={20}/> Equipo SEPRI D22
            </h2>
            <div className="grid gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-sepri-medium flex items-center gap-5">
                <div className="bg-sepri-bg p-4 rounded-full text-sepri-medium">
                  <User size={30} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-sepri-dark">{contactInfo.coordinatorName}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Coordinador Distrital</p>
                  <a href={`tel:${contactInfo.coordinatorPhone}`} className="text-sepri-medium font-black mt-2 inline-block hover:underline">{contactInfo.coordinatorPhone}</a>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-sepri-medium flex items-center gap-5">
                <div className="bg-sepri-bg p-4 rounded-full text-sepri-medium">
                  <User size={30} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-sepri-dark">{contactInfo.assistantName}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Asistente de Coordinación</p>
                  <a href={`tel:${contactInfo.assistantPhone}`} className="text-sepri-medium font-black mt-2 inline-block hover:underline">{contactInfo.assistantPhone}</a>
                </div>
              </div>
            </div>
          </section>

          {/* PUBLIC EMERGENCY */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={20}/> Líneas de Emergencia Nacional
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {emergencyNumbers.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border hover:border-red-200 transition-colors shadow-md flex flex-col items-center text-center">
                  <div className="text-red-500 mb-3">{item.icon}</div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h4>
                  <a href={`tel:${item.number}`} className="text-2xl font-black text-sepri-dark hover:text-red-600 transition-colors">{item.number}</a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* OFFICE INFO */}
        <section className="mt-12 bg-sepri-dark text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-8">
           <div className="bg-white/10 p-5 rounded-2xl">
              <MapPin size={40} className="text-sepri-yellow" />
           </div>
           <div>
              <h3 className="text-xl font-bold mb-2">Sede Administrativa Distrito 22</h3>
              <p className="text-blue-200">{contactInfo.address}</p>
              <div className="flex gap-6 mt-4">
                 <div className="flex items-center gap-2">
                   <Mail size={16} className="text-sepri-yellow" />
                   <span className="text-sm font-medium">{contactInfo.email}</span>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};