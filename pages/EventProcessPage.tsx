import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, AlertCircle, FileText, Plus, Save, Clock, Edit2, File } from 'lucide-react';
import { EXTRA_STEPS } from '../constants';
import { Step, UserRole, FormTemplate } from '../types';
import { getEvents, updateEventStep, getForms } from '../services/dataService';

const EventProcessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [currentSteps, setCurrentSteps] = useState<Step[]>([]);
  const [downloadedItems, setDownloadedItems] = useState<Set<string>>(new Set());
  
  // Admin Management State
  const [userRole, setUserRole] = useState<UserRole>('USER');
  const [editingStep, setEditingStep] = useState<Step | null>(null); // For Editing existing steps
  
  // Forms State
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([]);
  const [activeForm, setActiveForm] = useState<FormTemplate | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});

  // Fetch Event Data from Service (to support Admin edits)
  const allEvents = getEvents();
  const event = allEvents.find(e => e.id === id);

  // Load User Role
  useEffect(() => {
    const storedRole = localStorage.getItem('sepri_user_role') as UserRole;
    if (storedRole) setUserRole(storedRole);
    
    // Load available forms for this event
    if (id) {
      const allForms = getForms();
      setAvailableForms(allForms.filter(f => f.eventId === id));
    }
  }, [id]);

  // Logic to calculate steps
  useEffect(() => {
    if (!event) return;

    let steps = [...event.baseSteps];
    
    // Check answers to trigger extra steps
    Object.keys(answers).forEach((questionId) => {
      if (answers[questionId]) {
        const question = event.questions.find(q => q.id === questionId);
        if (question) {
          question.triggerSteps.forEach(stepId => {
            if (EXTRA_STEPS[stepId] && !steps.find(s => s.id === stepId)) {
              steps.push(EXTRA_STEPS[stepId]);
            }
          });
        }
      }
    });

    setCurrentSteps(steps);
  }, [answers, event]);

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Evento no encontrado</h1>
        <Link to="/" className="mt-4 text-sepri-medium hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const handleAnswer = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleDownload = (stepId: string, url?: string) => {
    const newDownloads = new Set(downloadedItems);
    newDownloads.add(stepId);
    setDownloadedItems(newDownloads);

    if (url) {
      window.open(url, '_blank');
    } else {
      alert("Este formato estará disponible pronto o no tiene enlace configurado.");
    }
  };

  const handleDownloadGeneralDoc = () => {
     if (event.documentUrl) {
       window.open(event.documentUrl, '_blank');
     } else {
       alert('No hay documento adjunto.');
     }
  };

  // --- Admin Functions ---

  const handleSaveStep = (step: Step) => {
    if (!step.title) {
        alert("El título del ítem es obligatorio.");
        return;
    }
    
    // Validate URL if present
    if (step.downloadUrl && !step.downloadUrl.match(/^https?:\/\//)) {
        alert("La URL debe comenzar con http:// o https:// (Ejemplo: https://drive.google.com/...)");
        return;
    }

    updateEventStep(event.id, step);
    setEditingStep(null);
    // Force reload handled by the parent/state update via service get
    window.location.reload(); // Simple reload to refresh state from storage for this demo
  };

  const canManage = userRole === 'ADMIN' || userRole === 'CREATOR';

  // --- Form Filling Functions ---
  const handleOpenForm = (form: FormTemplate) => {
    setActiveForm(form);
    setFormResponses({});
  };

  const handleDownloadForm = () => {
    if (!activeForm) return;
    
    let content = `FORMULARIO: ${activeForm.title}\nEVENTO: ${event.title}\nFECHA: ${new Date().toLocaleString()}\n\nRESPUESTAS:\n----------------\n`;
    
    activeForm.fields.forEach(field => {
       content += `${field.label}: ${formResponses[field.id] || 'N/A'}\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${activeForm.title.replace(/\s+/g, '_')}_diligenciado.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    
    setActiveForm(null);
    alert("Formulario descargado correctamente.");
  };

  return (
    <div className="min-h-screen bg-sepri-bg pb-20">
      {/* Header for the process */}
      <div className="bg-sepri-medium text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <Link to="/" className="inline-flex items-center text-blue-200 hover:text-white mb-4 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Volver
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Protocolo: {event.title}</h1>
              <p className="text-blue-100 max-w-2xl">{event.description}</p>
              
              {event.documentUrl && (
                <button onClick={handleDownloadGeneralDoc} className="mt-4 bg-sepri-yellow text-sepri-dark px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center hover:bg-yellow-400 transition-colors shadow-md">
                   <File size={16} className="mr-2"/> Descargar Protocolo General
                </button>
              )}
            </div>
            {canManage && (
              <div className="bg-sepri-yellow text-sepri-dark px-4 py-2 rounded-lg font-bold text-xs shadow-lg">
                MODO EDICIÓN ACTIVO
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Questions & Forms */}
          <div className="lg:w-1/3 space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-sepri-dark mb-6 flex items-center">
                <AlertCircle className="mr-2 text-sepri-yellow" />
                Detalles del Evento
              </h2>
              <div className="space-y-6">
                {/* Only show Enabled questions */}
                {event.questions.filter(q => q.isEnabled !== false).map((q) => (
                  <div key={q.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <p className="font-medium text-gray-700 mb-3 text-sm">{q.text}</p>
                    <div className="flex gap-3">
                      <button onClick={() => handleAnswer(q.id, true)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${answers[q.id] === true ? 'bg-sepri-green text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>SÍ</button>
                      <button onClick={() => handleAnswer(q.id, false)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${answers[q.id] === false ? 'bg-gray-700 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>NO</button>
                    </div>
                  </div>
                ))}
                {event.questions.filter(q => q.isEnabled !== false).length === 0 && (
                   <p className="text-gray-400 text-sm text-center">No hay preguntas adicionales para este protocolo.</p>
                )}
              </div>
            </div>

            {/* Available Forms Section */}
            {availableForms.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                 <h2 className="text-xl font-bold text-sepri-dark mb-4 flex items-center">
                   <FileText className="mr-2 text-blue-500" /> Formularios Disponibles
                 </h2>
                 <ul className="space-y-3">
                   {availableForms.map(form => (
                     <li key={form.id} className="p-3 border rounded hover:bg-gray-50 flex justify-between items-center">
                       <div>
                         <p className="font-bold text-sm text-gray-800">{form.title}</p>
                         <p className="text-xs text-gray-500">{form.description}</p>
                       </div>
                       <button onClick={() => handleOpenForm(form)} className="text-sepri-medium text-sm font-semibold hover:underline">
                         Diligenciar
                       </button>
                     </li>
                   ))}
                 </ul>
              </div>
            )}
          </div>

          {/* Right Column: Steps/Checklist */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-sepri-dark">Ruta de Cumplimiento</h2>
                <div className="flex items-center gap-3">
                  {canManage && (
                    <button onClick={() => { setEditingStep({ id: `new-${Date.now()}`, title: '', description: '', isCustom: true } as Step); }} className="bg-sepri-dark text-white p-2 rounded-full hover:bg-gray-800 transition-colors" title="Agregar Ítem">
                      <Plus size={18} />
                    </button>
                  )}
                  <span className="bg-sepri-medium text-white px-3 py-1 rounded-full text-xs font-bold">
                    {currentSteps.length} Pasos
                  </span>
                </div>
              </div>

              {/* Edit/Add Step Modal (Inline) */}
              {editingStep && (
                <div className="p-6 bg-blue-50 border-b border-blue-100 animate-fade-in">
                  <h3 className="font-bold text-sepri-dark mb-4">{editingStep.id.startsWith('new') ? 'Agregar Ítem' : 'Editar Ítem'}</h3>
                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                        <input type="text" placeholder="Ej: Documentación Vehículo" className="w-full p-2 border rounded" value={editingStep.title} onChange={e => setEditingStep({...editingStep, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                        <input type="text" placeholder="Ej: Copia de SOAT y Tecnomecánica" className="w-full p-2 border rounded" value={editingStep.description} onChange={e => setEditingStep({...editingStep, description: e.target.value})} />
                    </div>
                    
                    <div className="bg-white p-3 border rounded-lg border-blue-200">
                        <label className="block text-sm font-bold text-sepri-dark mb-1">URL del Documento del Ítem (Drive / OneDrive / URL)</label>
                        <input 
                            type="text" 
                            placeholder="https://drive.google.com/..." 
                            className="w-full p-2 border rounded border-gray-300 focus:border-sepri-medium focus:ring-1 focus:ring-sepri-medium outline-none" 
                            value={editingStep.downloadUrl || ''} 
                            onChange={e => setEditingStep({...editingStep, downloadUrl: e.target.value, isDownloadable: !!e.target.value})} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Este enlace se abrirá cuando el usuario haga clic en "Descargar Formato".</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setEditingStep(null)} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded">Cancelar</button>
                      <button onClick={() => handleSaveStep(editingStep)} className="px-4 py-2 bg-sepri-medium text-white rounded text-sm flex items-center hover:bg-sepri-dark shadow-sm">
                        <Save size={16} className="mr-2" /> Guardar Ítem
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps List */}
              <div className="divide-y divide-gray-100">
                {currentSteps.map((step, index) => {
                  const isDownloaded = downloadedItems.has(step.id);
                  return (
                    <div key={step.id} className="p-6 hover:bg-gray-50 transition-colors relative group">
                      {canManage && (
                        <button onClick={() => setEditingStep(step)} className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full shadow-sm" title="Editar Ítem">
                          <Edit2 size={18} />
                        </button>
                      )}

                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${isDownloaded ? 'bg-sepri-green text-white' : 'bg-sepri-medium text-white'}`}>
                          {isDownloaded ? <CheckCircle size={18} /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                              {step.title}
                              {isDownloaded && <span className="ml-2 text-xs text-sepri-green bg-green-50 px-2 py-0.5 rounded border border-green-100">Descargado</span>}
                            </h3>
                            {step.deadline && <span className="inline-flex items-center text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 whitespace-nowrap"><Clock size={12} className="mr-1" /> {step.deadline}</span>}
                          </div>
                          <p className="text-gray-600 text-sm mt-2 mb-4">{step.description}</p>
                          
                          <div className="flex flex-wrap gap-3">
                            {step.isDownloadable && (
                              <button onClick={() => handleDownload(step.id, step.downloadUrl)} className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDownloaded ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-sepri-light/10 text-sepri-medium hover:bg-sepri-light/20'}`}>
                                {isDownloaded ? <><CheckCircle size={16} className="mr-2" /> Descargar Nuevamente</> : <><Download size={16} className="mr-2" /> Descargar Formato</>}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {currentSteps.length === 0 && <p className="p-8 text-center text-gray-500">No hay pasos definidos para este protocolo.</p>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Form Filling Modal */}
      {activeForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-sepri-dark">{activeForm.title}</h3>
               <button onClick={() => setActiveForm(null)} className="text-gray-400 hover:text-gray-600"><Plus className="rotate-45" size={24}/></button>
             </div>
             <p className="text-gray-600 text-sm mb-6">{activeForm.description}</p>
             
             <div className="space-y-4">
               {activeForm.fields.map(field => (
                 <div key={field.id}>
                   <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
                   {field.type === 'textarea' ? (
                     <textarea className="w-full border p-2 rounded" rows={3} onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})} />
                   ) : field.type === 'checkbox' ? (
                     <input type="checkbox" className="h-5 w-5" onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.checked ? 'Si' : 'No'})} />
                   ) : (
                     <input type="text" className="w-full border p-2 rounded" onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})} />
                   )}
                 </div>
               ))}
             </div>

             <div className="mt-8 flex justify-end gap-3">
               <button onClick={() => setActiveForm(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
               <button onClick={handleDownloadForm} className="bg-sepri-medium text-white px-6 py-2 rounded-lg font-bold hover:bg-sepri-dark">
                 Descargar Diligenciado
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventProcessPage;