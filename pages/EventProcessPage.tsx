
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, AlertCircle, FileText, Plus, Save, Clock, Edit2, File, AlertTriangle, Info, Video, ChevronRight, Share2, Loader2, X } from 'lucide-react';
import { EXTRA_STEPS } from '../constants';
import { Step, UserRole, FormTemplate, EventType, ProtocolAlert } from '../types';
import { getEvents, updateEventStep, getForms } from '../services/dataService';

const EventProcessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [currentSteps, setCurrentSteps] = useState<Step[]>([]);
  const [downloadedItems, setDownloadedItems] = useState<Set<string>>(new Set());
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('USER');
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([]);
  const [activeForm, setActiveForm] = useState<FormTemplate | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
        const storedRole = localStorage.getItem('sepri_user_role') as UserRole;
        if (storedRole) setUserRole(storedRole);
        if (id) {
            const allEvents = await getEvents();
            const foundEvent = allEvents.find(e => e.id === id);
            setEvent(foundEvent || null);
            const allForms = await getForms();
            setAvailableForms(allForms.filter(f => f.eventId === id));
        }
        setLoading(false);
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (!event) return;
    let steps = [...event.baseSteps];
    Object.keys(answers).forEach((questionId) => {
      if (answers[questionId]) {
        const question = event.questions.find(q => q.id === questionId);
        if (question) {
          question.triggerSteps.forEach(stepId => {
            if (EXTRA_STEPS[stepId] && !steps.find(s => s.id === stepId)) {
              const extraStep = { ...EXTRA_STEPS[stepId], order: 99 } as Step;
              steps.push(extraStep);
            }
          });
        }
      }
    });
    steps.sort((a, b) => (a.order || 0) - (b.order || 0));
    setCurrentSteps(steps);
  }, [answers, event]);

  if (loading) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center gap-4">
          <Loader2 className="animate-spin text-sepri-medium" size={48} />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando Protocolo...</p>
        </div>
      );
  }

  const canManage = userRole === 'ADMIN' || userRole === 'CREATOR';

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
    if (url && url.trim() !== '') {
      const newDownloads = new Set(downloadedItems);
      newDownloads.add(stepId);
      setDownloadedItems(newDownloads);
      window.open(url, '_blank');
    } else {
      alert("No hay un formato configurado para este paso.");
    }
  };

  const handleOpenVideo = (url: string) => {
    if (url && url.match(/^https?:\/\//)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else { alert("URL de video inválida."); }
  };

  const handleSaveStep = async (step: Step) => {
    if (!canManage) return;
    if (!step.title) { alert("El título es obligatorio."); return; }
    
    // Video URL validation
    if (step.videoUrl && step.videoUrl.trim() !== '' && !step.videoUrl.match(/^https?:\/\//)) {
      alert("La URL del video debe comenzar con http:// o https://");
      return;
    }

    try {
      await updateEventStep(event.id, step);
      setEditingStep(null);
      const allEvents = await getEvents();
      setEvent(allEvents.find(e => e.id === id) || null);
    } catch (e) { alert("Error al guardar."); }
  };

  const handleOpenForm = (form: FormTemplate) => {
    setActiveForm(form);
    setFormResponses({});
  };

  const handleDownloadForm = () => {
    if (!activeForm) return;
    let content = `FORMULARIO: ${activeForm.title}\nEVENTO: ${event.title}\n\nRESPUESTAS:\n`;
    activeForm.fields.forEach(field => { content += `${field.label}: ${formResponses[field.id] || 'N/A'}\n`; });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(new Blob([content], {type: 'text/plain'}));
    element.download = `${activeForm.title.replace(/\s+/g, '_')}.txt`;
    element.click();
    setActiveForm(null);
  };

  return (
    <div className="min-h-screen bg-sepri-bg pb-20">
      <div className="bg-sepri-dark text-white pt-16 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10"><FileText size={200} /></div>
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-flex items-center text-blue-300 hover:text-white mb-6 font-bold"><ArrowLeft size={18} className="mr-2" /> VOLVER AL PANEL</Link>
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{event.title}</h1>
              <p className="text-lg text-blue-100/80 leading-relaxed">{event.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <h2 className="text-lg font-black text-sepri-dark mb-6 flex items-center gap-2"><AlertCircle className="text-sepri-yellow" size={24} /> CONTEXTO DEL EVENTO</h2>
              <div className="space-y-6">
                {event.questions.map((q) => {
                  const answered = answers[q.id] !== undefined;
                  const value = answers[q.id];
                  const rama = value === true ? 'yes' : 'no';
                  const content = value === true ? q.yesContent : q.noContent;
                  const formats = value === true ? q.yesFormats : q.noFormats;

                  return (
                    <div key={q.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4">
                      <p className="font-bold text-gray-700 text-sm leading-snug">{q.text}</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleAnswer(q.id, true)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${value === true ? 'bg-sepri-medium text-white shadow-lg' : 'bg-white border text-gray-500'}`}>SÍ</button>
                        <button onClick={() => handleAnswer(q.id, false)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${value === false ? 'bg-sepri-dark text-white shadow-lg' : 'bg-white border text-gray-500'}`}>NO</button>
                      </div>
                      {answered && (content || (formats && formats.length > 0)) && (
                        <div className="pt-4 border-t border-gray-200 mt-2 animate-fade-in space-y-3">
                          {content && <p className="text-xs text-gray-600 leading-relaxed italic">{content}</p>}
                          {formats && formats.length > 0 && (
                            <div className="space-y-2">
                              {formats.map(f => (
                                <button key={f.id} onClick={() => window.open(f.url, '_blank')} className="w-full flex items-center justify-between p-3 bg-white border border-sepri-medium/20 rounded-xl text-[10px] font-black uppercase text-sepri-medium hover:bg-sepri-medium hover:text-white transition-all">
                                  {f.name || 'DESCARGAR FORMATO'} <Download size={14}/>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {availableForms.length > 0 && (
              <div className="bg-sepri-medium text-white rounded-3xl shadow-2xl p-8">
                 <h2 className="text-lg font-black mb-6 flex items-center gap-2"><FileText className="text-sepri-yellow" size={24} /> FORMULARIOS</h2>
                 <div className="space-y-3">
                   {availableForms.map(form => (
                     <button key={form.id} onClick={() => handleOpenForm(form)} className="w-full text-left p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">
                       <p className="font-bold text-sm mb-1 flex justify-between items-center">{form.title}<ChevronRight size={16} /></p>
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-sepri-dark uppercase tracking-tight">Ruta de Cumplimiento</h2>
                {canManage && <button onClick={() => setEditingStep({ id: `new-${Date.now()}`, title: '', description: '', order: currentSteps.length } as Step)} className="bg-sepri-dark text-white p-2 rounded-full"><Plus size={20} /></button>}
              </div>
              <div className="divide-y divide-gray-100">
                {currentSteps.map((step, index) => (
                  <div key={step.id} className="p-8 hover:bg-gray-50 transition-colors relative group">
                    {canManage && <button onClick={() => setEditingStep(step)} className="absolute top-8 right-8 text-sepri-medium bg-white p-2 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>}
                    <div className="flex items-start gap-6">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${downloadedItems.has(step.id) ? 'bg-sepri-green text-white shadow-lg' : 'bg-sepri-bg text-sepri-medium'}`}>{downloadedItems.has(step.id) ? <CheckCircle size={24} /> : (index + 1).toString().padStart(2, '0')}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-sepri-dark mb-2">{step.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">{step.description}</p>
                        <div className="flex flex-wrap gap-3">
                          {step.isDownloadable && step.downloadUrl && (
                            <button onClick={() => handleDownload(step.id, step.downloadUrl)} className={`inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${downloadedItems.has(step.id) ? 'bg-sepri-green text-white' : 'bg-sepri-medium/10 text-sepri-medium hover:bg-sepri-medium hover:text-white'}`}>
                              <Download size={16} className="mr-2" /> OBTENER FORMATO
                            </button>
                          )}
                          {step.videoUrl && (
                            <button 
                              onClick={() => handleOpenVideo(step.videoUrl!)} 
                              className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-black uppercase bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                            >
                              <Video size={16} className="mr-2" /> Ver video
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingStep && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-black">Editar Paso</h3><button onClick={() => setEditingStep(null)}><X size={24}/></button></div>
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400">Título</label><input type="text" className="w-full border p-3 rounded-xl outline-none" value={editingStep.title} onChange={e => setEditingStep({...editingStep, title: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400">Descripción</label><textarea className="w-full border p-3 rounded-xl outline-none" rows={3} value={editingStep.description} onChange={e => setEditingStep({...editingStep, description: e.target.value})} /></div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                 <input type="checkbox" className="w-5 h-5" id="step-dl" checked={editingStep.isDownloadable} onChange={e => setEditingStep({...editingStep, isDownloadable: e.target.checked})} />
                 <label htmlFor="step-dl" className="text-sm font-bold text-gray-700">Habilitar descarga de formato</label>
              </div>
              {editingStep.isDownloadable && (
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400">URL del Formato</label><input type="text" placeholder="https://..." className="w-full border p-3 rounded-xl outline-none" value={editingStep.downloadUrl || ''} onChange={e => setEditingStep({...editingStep, downloadUrl: e.target.value})} /></div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Video (URL)</label>
                <input type="text" placeholder="https://youtube.com/..." className="w-full border p-3 rounded-xl outline-none" value={editingStep.videoUrl || ''} onChange={e => setEditingStep({...editingStep, videoUrl: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 pt-4"><button onClick={() => handleSaveStep(editingStep)} className="flex-1 bg-sepri-medium text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Guardar Cambios</button><button onClick={() => setEditingStep(null)} className="flex-1 text-gray-400 font-bold uppercase text-xs">Cancelar</button></div>
          </div>
        </div>
      )}

      {activeForm && (
        <div className="fixed inset-0 bg-sepri-dark/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-sepri-dark">{activeForm.title}</h3><button onClick={() => setActiveForm(null)}><X size={24}/></button></div>
             <div className="space-y-6">
               {activeForm.fields.map(field => (
                 <div key={field.id} className="space-y-2">
                   <label className="block text-xs font-black uppercase tracking-widest text-gray-400">{field.label}</label>
                   {field.type === 'textarea' ? <textarea className="w-full bg-gray-50 border p-4 rounded-2xl outline-none" rows={4} onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})} /> : <input type="text" className="w-full bg-gray-50 border p-4 rounded-2xl outline-none" onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})} />}
                 </div>
               ))}
             </div>
             <div className="mt-10 flex gap-4"><button onClick={handleDownloadForm} className="w-full bg-sepri-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">GENERAR Y DESCARGAR</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventProcessPage;
