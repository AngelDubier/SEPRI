import React, { useEffect, useState } from 'react';
import { FileText, AlertTriangle, Phone, Shield } from 'lucide-react';
import { getEvents, getContactInfo } from '../services/dataService';
import { ContactInfo } from '../types';
import { DEFAULT_CONTACT_INFO } from '../constants';

export const FormatsPage: React.FC = () => {
  const events = getEvents();

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-bold text-sepri-dark mb-6 flex items-center">
        <FileText className="mr-3 text-sepri-yellow" /> Formatos y Documentos
      </h1>
      <p className="text-gray-600 mb-8">Repositorio central de todos los formatos requeridos para la gestión de protocolos.</p>
      
      <div className="grid gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-sepri-medium mb-4 border-b pb-2">{event.title}</h2>
            <div className="space-y-3">
              {event.documentUrl && (
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700">Protocolo General</span>
                  <a 
                    href={event.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm bg-sepri-medium text-white px-3 py-1 rounded hover:bg-sepri-dark transition-colors"
                  >
                    Descargar
                  </a>
                </div>
              )}
              {event.baseSteps.filter(step => step.downloadUrl).map(step => (
                <div key={step.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{step.title}</span>
                  <a 
                    href={step.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                  >
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReportIncidentPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full text-center">
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-sepri-dark mb-4">Reportar Incidente</h1>
        <p className="text-gray-600 mb-8">
          Utilice este formulario para reportar cualquier accidente, incidente o condición insegura presentada durante un evento distrital o local.
        </p>
        
        <form className="text-left space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Reportante</label>
            <input type="text" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="Su nombre completo" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Lugar del Suceso</label>
            <input type="text" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="Congregación / Lugar del evento" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del Incidente</label>
            <textarea className="w-full border p-3 rounded-lg bg-gray-50" rows={4} placeholder="Describa qué sucedió..." />
          </div>
          <button type="button" onClick={() => alert("Reporte enviado correctamente (Simulación)")} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">
            Enviar Reporte
          </button>
        </form>
      </div>
    </div>
  );
};

export const DirectoryPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
  
  useEffect(() => {
    setContactInfo(getContactInfo());
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-bold text-sepri-dark mb-8 flex items-center">
        <Phone className="mr-3 text-sepri-yellow" /> Directorio de Emergencia
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Coordinadores */}
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-sepri-medium">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Coordinación Distrital</h2>
          <ul className="space-y-4">
            <li className="flex flex-col">
              <span className="font-bold text-gray-700">{contactInfo.coordinatorName}</span>
              <span className="text-sm text-gray-500">Coordinador</span>
              <a href={`tel:${contactInfo.coordinatorPhone}`} className="text-sepri-medium font-bold">{contactInfo.coordinatorPhone}</a>
            </li>
            <li className="flex flex-col">
              <span className="font-bold text-gray-700">{contactInfo.assistantName}</span>
              <span className="text-sm text-gray-500">Asistente Coordinación</span>
              <a href={`tel:${contactInfo.assistantPhone}`} className="text-sepri-medium font-bold">{contactInfo.assistantPhone}</a>
            </li>
          </ul>
        </div>

        {/* Emergencias Nacionales */}
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Líneas de Emergencia</h2>
          <ul className="space-y-3">
            <li className="flex justify-between border-b pb-2">
              <span>Policía Nacional</span>
              <span className="font-bold text-red-600">123</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Bomberos</span>
              <span className="font-bold text-red-600">119</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Cruz Roja</span>
              <span className="font-bold text-red-600">132</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Defensa Civil</span>
              <span className="font-bold text-red-600">144</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 min-h-screen max-w-4xl">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-sepri-dark mb-6 flex items-center">
          <Shield className="mr-3 text-sepri-yellow" /> Política de Privacidad y Tratamiento de Datos
        </h1>
        <div className="prose text-gray-600 space-y-4">
          <p>
            La Iglesia Pentecostal Unida de Colombia - Distrito 22, a través de su área SEPRI (Seguridad y Prevención del Riesgo), está comprometida con la protección de sus datos personales.
          </p>
          <h3 className="text-lg font-bold text-gray-800">1. Responsable del Tratamiento</h3>
          <p>
            El responsable del tratamiento de sus datos es la administración del Distrito 22 de la IPUC.
          </p>
          <h3 className="text-lg font-bold text-gray-800">2. Finalidad</h3>
          <p>
            Los datos recolectados en esta plataforma (nombres, teléfonos, correos, información de eventos) se utilizan exclusivamente para:
          </p>
          <ul className="list-disc pl-5">
            <li>Gestión y autorización de protocolos de seguridad.</li>
            <li>Contacto en caso de emergencia.</li>
            <li>Generación de estadísticas de prevención.</li>
          </ul>
          <h3 className="text-lg font-bold text-gray-800">3. Derechos del Titular</h3>
          <p>
            Usted tiene derecho a conocer, actualizar y rectificar sus datos personales, así como a revocar la autorización de uso.
          </p>
          <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200 text-sm">
            Para ejercer sus derechos, puede contactarnos al correo: <span className="font-bold text-sepri-medium">distrito22a@ipuc.org.co</span>
          </div>
        </div>
      </div>
    </div>
  );
};