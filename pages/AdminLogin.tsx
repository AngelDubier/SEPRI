
import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Settings, Newspaper, FileText, Plus, Trash2, Edit2, Save, Image as ImageIcon, Briefcase, User, Bell, Phone, Mail, MapPin, ArrowLeft, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { DEFAULT_CONTACT_INFO } from '../constants';
import { UserRole, NewsItem, EventType, ContactInfo, PopupConfig, QuickLink, TeamMember, Step } from '../types';
import { getNews, saveNews, getEvents, saveEvents, addEvent, deleteEvent, getContactInfo, saveContactInfo, authenticateUser, getPopups, savePopups, getQuickLinks, saveQuickLinks } from '../services/dataService';
import { Button as MovingBorderButton } from '../components/ui/moving-border';

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
      else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('USER');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'news' | 'protocols' | 'config'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);

  // States for sub-editors
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [currentNews, setCurrentNews] = useState<Partial<NewsItem>>({});
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [currentProtocol, setCurrentProtocol] = useState<Partial<EventType>>({ baseSteps: [], questions: [], alerts: [] });
  const [isEditingPopup, setIsEditingPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Partial<PopupConfig>>({ title: '', content: '', type: 'info', isEnabled: true });
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({ name: '', role: '' });
  const [newQuickLink, setNewQuickLink] = useState<Partial<QuickLink>>({ title: '', url: '', isEnabled: true });
  
  // Edit mode tracking states
  const [editingQuickLinkId, setEditingQuickLinkId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('sepri_user_role');
    if (storedRole && (storedRole === 'ADMIN' || storedRole === 'CREATOR')) {
      setIsLoggedIn(true);
      setCurrentRole(storedRole as UserRole);
      loadData();
    }
  }, []);

  const loadData = async () => {
    setNews(await getNews());
    setEvents(await getEvents());
    setPopups(await getPopups());
    setQuickLinks(await getQuickLinks());
    const contact = await getContactInfo();
    if(contact) setContactInfo(contact);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = await authenticateUser(email, password);
    if (role) {
        localStorage.setItem('sepri_user_role', role);
        setCurrentRole(role);
        setIsLoggedIn(true);
        loadData();
    } else {
        alert("Credenciales incorrectas.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sepri_user_role');
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'news' | 'protocol' | 'logo' | 'hero' | 'member', memberId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result as string;
        const result = await compressImage(rawResult);
        const timestamp = Date.now();

        if (target === 'news') setCurrentNews(prev => ({ ...prev, imageUrl: result }));
        else if (target === 'protocol') setCurrentProtocol(prev => ({ ...prev, imageUrl: result }));
        else if (target === 'logo') setContactInfo(prev => ({ ...prev, logoUrl: result }));
        else if (target === 'hero') setContactInfo(prev => ({ ...prev, heroImageUrl: result }));
        else if (target === 'member' && !memberId) setNewMember(prev => ({ ...prev, imageUrl: result, updatedAt: timestamp }));
        else if (target === 'member' && memberId) {
          setContactInfo(prev => ({
            ...prev,
            teamMembers: prev.teamMembers?.map(m => m.id === memberId ? { ...m, imageUrl: result, updatedAt: timestamp } : m)
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await saveContactInfo(contactInfo);
      await saveQuickLinks(quickLinks);
      await savePopups(popups); 
      alert("Configuración general guardada correctamente.");
    } catch (e) { alert("Error al guardar la configuración."); }
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.role) return;
    const timestamp = Date.now();
    
    if (editingMemberId) {
      setContactInfo(prev => ({
        ...prev,
        teamMembers: prev.teamMembers?.map(m => m.id === editingMemberId ? { ...m, name: newMember.name!, role: newMember.role!, imageUrl: newMember.imageUrl, updatedAt: timestamp } as TeamMember : m)
      }));
      setEditingMemberId(null);
    } else {
      const member: TeamMember = {
        id: `member-${Date.now()}`,
        name: newMember.name!,
        role: newMember.role!,
        imageUrl: newMember.imageUrl,
        order: contactInfo.teamMembers?.length || 0,
        updatedAt: timestamp
      };
      setContactInfo(prev => ({ ...prev, teamMembers: [...(prev.teamMembers || []), member] }));
    }
    setNewMember({ name: '', role: '' });
  };

  const handleStartEditMember = (member: TeamMember) => {
    setNewMember({ name: member.name, role: member.role, imageUrl: member.imageUrl, updatedAt: member.updatedAt });
    setEditingMemberId(member.id);
  };

  const handleRemoveMember = (id: string) => {
    setContactInfo(prev => ({ ...prev, teamMembers: prev.teamMembers?.filter(m => m.id !== id) }));
  };

  const handleSavePopup = async () => {
    if (!currentPopup.title?.trim() || !currentPopup.content?.trim()) {
      alert("El título y contenido del aviso son obligatorios.");
      return;
    }
    try {
      let updatedPopups: PopupConfig[] = [];
      if (currentPopup.id) {
        updatedPopups = popups.map(p => p.id === currentPopup.id ? { ...p, ...currentPopup } as PopupConfig : p);
      } else {
        const newP: PopupConfig = {
          id: `popup-${Date.now()}`,
          title: currentPopup.title!,
          content: currentPopup.content!,
          type: (currentPopup.type as any) || 'info',
          isEnabled: true
        };
        updatedPopups = [newP, ...popups];
      }
      setPopups(updatedPopups);
      setIsEditingPopup(false);
      setCurrentPopup({ title: '', content: '', type: 'info', isEnabled: true });
    } catch (error) { alert("Error local en aviso."); }
  };

  const handleTogglePopup = (id: string) => {
    setPopups(prev => prev.map(p => p.id === id ? { ...p, isEnabled: !p.isEnabled } : p));
  };

  const handleRemovePopup = (id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  const handleAddQuickLink = () => {
    if (!newQuickLink.title || !newQuickLink.url) return;
    
    if (editingQuickLinkId) {
      setQuickLinks(prev => prev.map(l => l.id === editingQuickLinkId ? { ...l, title: newQuickLink.title!, url: newQuickLink.url! } : l));
      setEditingQuickLinkId(null);
    } else {
      const link: QuickLink = {
        id: `ql-${Date.now()}`,
        title: newQuickLink.title!,
        url: newQuickLink.url!,
        isEnabled: true
      };
      setQuickLinks([...quickLinks, link]);
    }
    setNewQuickLink({ title: '', url: '' });
  };

  const handleStartEditQuickLink = (link: QuickLink) => {
    setNewQuickLink({ title: link.title, url: link.url });
    setEditingQuickLinkId(link.id);
  };

  const handleToggleQuickLink = (id: string) => {
    setQuickLinks(quickLinks.map(l => l.id === id ? { ...l, isEnabled: !l.isEnabled } : l));
  };

  const handleRemoveQuickLink = (id: string) => {
    setQuickLinks(quickLinks.filter(l => l.id !== id));
  };

  const handleSaveNews = async () => {
    if (!currentNews.title?.trim() || !currentNews.summary?.trim()) {
      alert("Título y resumen obligatorios.");
      return;
    }
    try {
      let updatedNewsList: NewsItem[] = [];
      if (currentNews.id) {
        updatedNewsList = news.map(n => n.id === currentNews.id ? { ...n, ...currentNews } as NewsItem : n);
      } else {
        const newItem: NewsItem = {
          id: Date.now().toString(),
          title: currentNews.title!,
          summary: currentNews.summary!,
          category: (currentNews.category as any) || 'Novedad',
          date: new Date().toLocaleDateString('es-CO'),
          imageUrl: currentNews.imageUrl
        };
        updatedNewsList = [newItem, ...news];
      }
      await saveNews(updatedNewsList);
      setNews(updatedNewsList);
      setIsEditingNews(false);
      setCurrentNews({});
      alert("Noticia guardada.");
    } catch (error: any) { alert("Error al guardar noticia."); }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("¿Eliminar noticia?")) return;
    const updated = news.filter(n => n.id !== id);
    await saveNews(updated);
    setNews(updated);
  };

  const handleSaveProtocol = async () => {
    if (!currentProtocol.title?.trim() || !currentProtocol.description?.trim()) {
      alert("Título y descripción requeridos");
      return;
    }

    const invalidVideoUrl = currentProtocol.baseSteps?.some(s => s.videoUrl && s.videoUrl.trim() !== '' && !s.videoUrl.match(/^https?:\/\//));
    if (invalidVideoUrl) {
      alert("La URL del video en uno de los pasos no es válida. Debe iniciar con http:// o https://");
      return;
    }

    try {
      const protocolToSave: EventType = {
        id: currentProtocol.id || `evt-${Date.now()}`,
        title: currentProtocol.title!,
        description: currentProtocol.description!,
        iconName: currentProtocol.iconName || 'FileText',
        imageUrl: currentProtocol.imageUrl,
        documentUrl: currentProtocol.documentUrl,
        baseSteps: (currentProtocol.baseSteps || []).map((s, i) => ({ ...s, order: i })),
        questions: currentProtocol.questions || [],
        alerts: currentProtocol.alerts || []
      };
      if (currentProtocol.id) {
        const updatedEvents = events.map(e => e.id === currentProtocol.id ? protocolToSave : e);
        await saveEvents(updatedEvents);
        setEvents(updatedEvents);
      } else {
        await addEvent(protocolToSave);
        setEvents(await getEvents());
      }
      setIsEditingProtocol(false);
      setCurrentProtocol({ baseSteps: [], questions: [], alerts: [] });
      alert("Protocolo guardado.");
    } catch (error) { alert("Error al guardar protocolo."); }
  };

  const handleAddStepToProtocol = () => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      title: 'Nuevo Paso',
      description: '',
      order: currentProtocol.baseSteps?.length || 0,
      isDownloadable: false,
      downloadUrl: '',
      videoUrl: ''
    };
    setCurrentProtocol({ ...currentProtocol, baseSteps: [...(currentProtocol.baseSteps || []), newStep] });
  };

  const handleRemoveStep = (id: string) => {
    setCurrentProtocol({ ...currentProtocol, baseSteps: currentProtocol.baseSteps?.filter(s => s.id !== id) });
  };

  const handleUpdateStep = (id: string, field: keyof Step, value: any) => {
    setCurrentProtocol({
      ...currentProtocol,
      baseSteps: currentProtocol.baseSteps?.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-sepri-dark flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-6 left-6">
          <Link to="/" className="text-white/70 hover:text-white flex items-center gap-2 font-bold transition-colors">
            <ArrowLeft size={20} /> Volver al inicio
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <Settings className="w-12 h-12 text-sepri-yellow mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-sepri-dark">Acceso Administrativo</h1>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full border p-3 rounded-lg outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" className="w-full border p-3 rounded-lg outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="pt-2">
              <MovingBorderButton
                as="button"
                type="submit"
                borderRadius="0.75rem"
                containerClassName="w-full h-14"
                className="bg-sepri-medium text-white font-bold hover:bg-sepri-dark transition-colors"
              >
                ENTRAR AL PANEL
              </MovingBorderButton>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <div className="w-64 bg-sepri-dark text-white p-6 hidden md:block flex-shrink-0 h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-sepri-yellow" />
          <h1 className="font-bold text-lg">Panel SEPRI</h1>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('news')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'news' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><Newspaper size={18} /> Noticias</button>
          <button onClick={() => setActiveTab('protocols')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'protocols' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><Briefcase size={18} /> Protocolos</button>
          <button onClick={() => setActiveTab('config')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'config' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><Settings size={18} /> Configuración</button>
        </nav>
        <button onClick={handleLogout} className="mt-8 text-red-400 flex items-center gap-2 hover:text-red-300 px-3"><LogOut size={18} /> Salir</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto h-full bg-gray-50">
        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold">Gestión de Noticias</h2>
               <button onClick={() => { setCurrentNews({}); setIsEditingNews(true); }} className="bg-sepri-medium text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-sepri-dark"><Plus size={18} /> Nueva Noticia</button>
            </div>
            {isEditingNews && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveNews(); }} className="bg-white p-6 rounded-xl shadow border animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Título" className="w-full border p-2 rounded outline-none" value={currentNews.title || ''} onChange={e => setCurrentNews(prev => ({...prev, title: e.target.value}))} required />
                    <select className="border p-2 rounded" value={currentNews.category || 'Novedad'} onChange={e => setCurrentNews(prev => ({...prev, category: e.target.value as any}))}>
                       <option value="Novedad">Novedad</option><option value="Evento">Evento</option><option value="Importante">Importante</option>
                    </select>
                 </div>
                 <textarea placeholder="Resumen de la noticia..." className="w-full border p-2 rounded mb-4 outline-none" rows={6} value={currentNews.summary || ''} onChange={e => setCurrentNews(prev => ({...prev, summary: e.target.value}))} required />
                 <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg border border-dashed">
                    <div className="w-24 h-24 bg-white border rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                       {currentNews.imageUrl ? <img src={currentNews.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32} />}
                    </div>
                    <label className="bg-white border border-gray-300 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm">
                       {currentNews.imageUrl ? "Cambiar Imagen" : "Subir Imagen"}
                       <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'news')} />
                    </label>
                 </div>
                 <div className="flex gap-4">
                    <button type="submit" className="bg-sepri-medium text-white px-6 py-2 rounded-lg font-bold ml-auto shadow-md hover:bg-sepri-dark transition-all">{currentNews.id ? "Guardar Cambios" : "Publicar Noticia"}</button>
                    <button type="button" onClick={() => { setIsEditingNews(false); setCurrentNews({}); }} className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700">Cancelar</button>
                 </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {news.map(n => (
                 <div key={n.id} className="bg-white p-4 rounded-xl border flex gap-4 items-center group hover:border-sepri-medium transition-colors">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">{n.imageUrl && <img src={n.imageUrl} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1"><h4 className="font-bold text-sm line-clamp-1">{n.title}</h4><p className="text-xs text-gray-400">{n.date}</p></div>
                    <div className="flex gap-1">
                       <button onClick={() => { setCurrentNews(n); setIsEditingNews(true); }} className="text-blue-500 p-2 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                       <button onClick={() => handleDeleteNews(n.id)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold">Gestión de Protocolos</h2>
               <button onClick={() => { setCurrentProtocol({ baseSteps: [], questions: [], alerts: [] }); setIsEditingProtocol(true); }} className="bg-sepri-medium text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-sepri-dark"><Plus size={18} /> Nuevo Protocolo</button>
            </div>
            {isEditingProtocol && (
               <div className="bg-white p-8 rounded-2xl shadow-xl border mb-10 animate-fade-in space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">Título</label>
                        <input type="text" placeholder="Ej: Campamentos" className="w-full border p-3 rounded-xl outline-none" value={currentProtocol.title || ''} onChange={e => setCurrentProtocol({...currentProtocol, title: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">Icono</label>
                        <input type="text" placeholder="Bus, Tent, Users..." className="w-full border p-3 rounded-xl outline-none" value={currentProtocol.iconName || ''} onChange={e => setCurrentProtocol({...currentProtocol, iconName: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400">Descripción</label>
                    <textarea placeholder="Descripción del protocolo..." className="w-full border p-3 rounded-xl outline-none" rows={2} value={currentProtocol.description || ''} onChange={e => setCurrentProtocol({...currentProtocol, description: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="w-24 h-24 bg-white border rounded overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                      {currentProtocol.imageUrl ? <img src={currentProtocol.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Imagen del protocolo (opcional)</p>
                      <div className="flex gap-3">
                        <label className="bg-white border border-gray-300 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm inline-block">
                          {currentProtocol.imageUrl ? "Cambiar Imagen" : "Subir Imagen"}
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'protocol')} />
                        </label>
                        {currentProtocol.imageUrl && (
                          <button type="button" onClick={() => setCurrentProtocol(prev => ({ ...prev, imageUrl: '' }))} className="text-red-500 text-xs font-bold hover:underline">Eliminar Imagen</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-sepri-dark uppercase tracking-tight text-sm">Pasos de Cumplimiento</h3>
                       <button onClick={handleAddStepToProtocol} className="text-sepri-medium flex items-center gap-1 text-xs font-bold"><Plus size={14}/> Agregar Paso</button>
                    </div>
                    <div className="space-y-3">
                       {currentProtocol.baseSteps?.map((step, idx) => (
                         <div key={step.id} className="p-4 border rounded-xl bg-gray-50 flex flex-col gap-3">
                            <div className="flex gap-3">
                               <input type="text" placeholder="Título del paso" className="flex-1 border p-2 rounded text-sm outline-none" value={step.title} onChange={e => handleUpdateStep(step.id, 'title', e.target.value)} />
                               <button onClick={() => handleRemoveStep(step.id)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                            </div>
                            <input type="text" placeholder="Descripción corta" className="w-full border p-2 rounded text-sm outline-none" value={step.description} onChange={e => handleUpdateStep(step.id, 'description', e.target.value)} />
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase text-gray-400">Video (URL)</label>
                               <input type="text" placeholder="https://youtube.com/..." className="w-full border p-2 rounded text-xs outline-none bg-white" value={step.videoUrl || ''} onChange={e => handleUpdateStep(step.id, 'videoUrl', e.target.value)} />
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 border-t">
                     <button onClick={handleSaveProtocol} className="bg-sepri-medium text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Guardar Protocolo</button>
                     <button onClick={() => setIsEditingProtocol(false)} className="px-6 py-3 text-gray-500 font-bold text-xs">Cancelar</button>
                  </div>
               </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {events.map(event => (
                 <div key={event.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h3 className="font-black text-sepri-dark mb-2">{event.title}</h3>
                    <div className="flex justify-end gap-2 border-t pt-4">
                       <button onClick={() => { setCurrentProtocol(event); setIsEditingProtocol(true); }} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                       <button onClick={() => deleteEvent(event.id).then(loadData)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="max-w-4xl space-y-10 pb-24">
            <h2 className="text-3xl font-black text-sepri-dark border-b pb-4">Configuración del Sistema</h2>

            {/* Avisos Emergentes (Popups) */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><Bell size={20}/> Avisos Emergentes (Popups)</h3>
                <button onClick={() => { setCurrentPopup({}); setIsEditingPopup(true); }} className="text-sepri-medium flex items-center gap-1 text-xs font-bold hover:underline"><Plus size={16}/> Nuevo Aviso</button>
              </div>
              
              {isEditingPopup && (
                <div className="p-5 border rounded-2xl bg-gray-50 space-y-4 animate-fade-in">
                  <input type="text" placeholder="Título del aviso" className="w-full border p-3 rounded-xl outline-none" value={currentPopup.title || ''} onChange={e => setCurrentPopup({...currentPopup, title: e.target.value})} />
                  <textarea placeholder="Contenido del mensaje..." className="w-full border p-3 rounded-xl outline-none" rows={3} value={currentPopup.content || ''} onChange={e => setCurrentPopup({...currentPopup, content: e.target.value})} />
                  <div className="flex gap-4">
                    <button onClick={handleSavePopup} className="bg-sepri-medium text-white px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-lg">Guardar Aviso</button>
                    <button onClick={() => setIsEditingPopup(false)} className="text-gray-400 font-bold text-xs uppercase">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popups.map(p => (
                  <div key={p.id} className="p-4 border rounded-xl flex items-center justify-between group">
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${p.isEnabled ? 'text-sepri-dark' : 'text-gray-400'}`}>{p.title}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{p.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleTogglePopup(p.id)} className={`p-1.5 rounded ${p.isEnabled ? 'text-green-500 bg-green-50' : 'text-gray-300 bg-gray-50'}`}><Shield size={16}/></button>
                      <button onClick={() => handleRemovePopup(p.id)} className="text-red-400 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Enlaces Rápidos (Quick Links) */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><Save size={20}/> Enlaces Rápidos (Footer)</h3>
              <div className="flex gap-3">
                <input type="text" placeholder="Título enlace" className="flex-1 border p-3 rounded-xl outline-none" value={newQuickLink.title || ''} onChange={e => setNewQuickLink({...newQuickLink, title: e.target.value})} />
                <input type="text" placeholder="URL (ej: /noticias)" className="flex-1 border p-3 rounded-xl outline-none" value={newQuickLink.url || ''} onChange={e => setNewQuickLink({...newQuickLink, url: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={handleAddQuickLink} className="bg-sepri-bg p-3 rounded-xl text-sepri-medium hover:bg-sepri-medium hover:text-white transition-colors">
                    {editingQuickLinkId ? <Save size={20}/> : <Plus size={20}/>}
                  </button>
                  {editingQuickLinkId && (
                    <button onClick={() => { setEditingQuickLinkId(null); setNewQuickLink({ title: '', url: '' }); }} className="bg-gray-100 p-3 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={20}/>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {quickLinks.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/30 group">
                    <span className="text-sm font-bold text-gray-600">{l.title} <span className="text-[10px] font-normal text-gray-400 ml-2">({l.url})</span></span>
                    <div className="flex gap-2">
                       <button onClick={() => handleStartEditQuickLink(l)} className="text-blue-400 p-1.5 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
                       <button onClick={() => handleToggleQuickLink(l.id)} className={`p-1.5 rounded ${l.isEnabled ? 'text-blue-500' : 'text-gray-300'}`}><Bell size={16}/></button>
                       <button onClick={() => handleRemoveQuickLink(l.id)} className="text-red-400 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Equipo Directivo */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><User size={20}/> Equipo Directivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="text" placeholder="Nombre completo" className="w-full border p-3 rounded-xl outline-none" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                 <input type="text" placeholder="Cargo (ej: Coordinador)" className="w-full border p-3 rounded-xl outline-none" value={newMember.role || ''} onChange={e => setNewMember({...newMember, role: e.target.value})} />
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 border rounded-full overflow-hidden flex items-center justify-center bg-gray-50">{newMember.imageUrl ? <img src={newMember.imageUrl} className="w-full h-full object-cover" /> : <User className="text-gray-300" size={24}/>}</div>
                 <label className="bg-sepri-bg text-sepri-dark px-4 py-2 rounded-xl cursor-pointer font-bold text-xs">Subir Foto<input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'member')} /></label>
                 <div className="ml-auto flex gap-3">
                   {editingMemberId && (
                     <button onClick={() => { setEditingMemberId(null); setNewMember({ name: '', role: '' }); }} className="px-4 py-2 text-gray-400 font-bold text-xs uppercase">Cancelar</button>
                   )}
                   <button onClick={handleAddMember} className="bg-sepri-medium text-white px-6 py-2 rounded-xl font-bold text-xs uppercase">
                     {editingMemberId ? "Guardar Cambios" : "Agregar Miembro"}
                   </button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {contactInfo.teamMembers?.map(m => (
                  <div key={m.id} className="p-4 border rounded-2xl flex flex-col items-center text-center relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEditMember(m)} className="text-blue-400 p-1.5 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                      <button onClick={() => handleRemoveMember(m.id)} className="text-red-400 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </div>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-sepri-bg mb-3">{m.imageUrl && <img src={m.imageUrl + (m.imageUrl.startsWith('data:') ? '' : `?v=${m.updatedAt || ''}`)} className="w-full h-full object-cover" />}</div>
                    <p className="font-bold text-sm text-sepri-dark">{m.name}</p>
                    <p className="text-[10px] text-sepri-medium font-bold uppercase tracking-widest">{m.role}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Identidad Visual */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><ImageIcon size={20}/> Identidad Visual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex items-center gap-4 border-r pr-6">
                    <div className="w-20 h-20 border rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">{contactInfo.logoUrl ? <img src={contactInfo.logoUrl} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="text-gray-300" size={24}/>}</div>
                    <div><p className="text-xs font-bold text-gray-500 mb-2 uppercase">Logo Distrito</p><label className="bg-sepri-bg text-sepri-dark px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs inline-block">Subir Logo<input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} /></label></div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">{contactInfo.heroImageUrl ? <img src={contactInfo.heroImageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={24}/>}</div>
                    <div><p className="text-xs font-bold text-gray-500 mb-2 uppercase">Imagen Hero</p><label className="bg-sepri-bg text-sepri-dark px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs inline-block">Subir Imagen<input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'hero')} /></label></div>
                 </div>
              </div>
            </section>

            {/* Información de Contacto */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><Phone size={20}/> Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="text" placeholder="Coordinador" className="w-full border p-3 rounded-lg" value={contactInfo.coordinatorName || ''} onChange={e => setContactInfo({...contactInfo, coordinatorName: e.target.value})} />
                 <input type="text" placeholder="Teléfono" className="w-full border p-3 rounded-lg" value={contactInfo.coordinatorPhone || ''} onChange={e => setContactInfo({...contactInfo, coordinatorPhone: e.target.value})} />
              </div>
              <input type="email" placeholder="Email institucional" className="w-full border p-3 rounded-lg" value={contactInfo.email || ''} onChange={e => setContactInfo({...contactInfo, email: e.target.value})} />
              <input type="text" placeholder="Dirección sede" className="w-full border p-3 rounded-lg" value={contactInfo.address || ''} onChange={e => setContactInfo({...contactInfo, address: e.target.value})} />
            </section>

            {/* Política de Privacidad */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><Shield size={20}/> Política de Privacidad</h3>
              <textarea 
                className="w-full border p-4 rounded-xl outline-none min-h-[250px] text-sm leading-relaxed" 
                placeholder="Escriba aquí el contenido de la política de privacidad que se mostrará en la página pública..."
                value={contactInfo.privacyPolicy || ''}
                onChange={e => setContactInfo({...contactInfo, privacyPolicy: e.target.value})}
              />
              <p className="text-[10px] text-gray-400 italic font-medium">Este contenido se muestra en la ruta /politicas-privacidad. Use saltos de línea para separar párrafos.</p>
            </section>

            <div className="sticky bottom-6 flex justify-center pt-10">
               <MovingBorderButton as="button" onClick={handleSaveConfig} borderRadius="3rem" containerClassName="w-full max-w-lg h-20" className="bg-green-600 text-white font-black text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-3 shadow-2xl"><Save size={28} /> GUARDAR TODA LA CONFIGURACIÓN</MovingBorderButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;