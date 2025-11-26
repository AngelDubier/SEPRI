import React, { useState, useEffect } from 'react';
import { Lock, User, ChevronRight, Key, LogOut, Settings, Newspaper, MessageSquare, FileText, Plus, Trash2, Edit2, Save, ToggleLeft, ToggleRight, Check, Image as ImageIcon, Briefcase, File, X, List, ExternalLink, Link as LinkIcon, Phone, Share2, ShieldAlert, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_CONTACT_INFO } from '../constants';
import { UserRole, NewsItem, PopupConfig, FormTemplate, FormField, EventType, Question, Step, QuickLink, ContactInfo, UserAccount } from '../types';
import { getNews, saveNews, getPopups, togglePopup, updatePopup, getForms, addForm, deleteForm, getEvents, saveEvents, addEvent, deleteEvent, getQuickLinks, addQuickLink, deleteQuickLink, updateQuickLink, getContactInfo, saveContactInfo, authenticateUser, getUsers, resetUserPassword, initUsers } from '../services/dataService';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('USER');
  const navigate = useNavigate();

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'news' | 'popups' | 'forms' | 'protocols' | 'links' | 'config' | 'creator'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);

  // User Management State (Creator)
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null); // Track ID of user being reset

  // Form Builder State
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newForm, setNewForm] = useState<Partial<FormTemplate>>({ title: '', fields: [] });
  const [newField, setNewField] = useState<Partial<FormField>>({ label: '', type: 'text' });

  // News Editor State
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [currentNews, setCurrentNews] = useState<Partial<NewsItem>>({});

  // Protocol (Event) Editor State
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [currentProtocol, setCurrentProtocol] = useState<Partial<EventType>>({ baseSteps: [], questions: [] });
  const [newQuestionText, setNewQuestionText] = useState('');
  
  // Protocol Steps (Items) State for adding new
  const [newStep, setNewStep] = useState<Partial<Step>>({ title: '', description: '', deadline: '', downloadUrl: '' });

  // Quick Links State
  const [newLink, setNewLink] = useState<Partial<QuickLink>>({ title: '', url: '' });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [tempLinkData, setTempLinkData] = useState<Partial<QuickLink>>({});

  // Popup Editing State
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [tempPopupData, setTempPopupData] = useState<Partial<PopupConfig>>({});

  useEffect(() => {
    // Check login
    const storedRole = localStorage.getItem('sepri_user_role');
    if (storedRole && (storedRole === 'ADMIN' || storedRole === 'CREATOR')) {
      setIsLoggedIn(true);
      setCurrentRole(storedRole as UserRole);
      loadData();
    }
  }, []);

  const loadData = () => {
    setNews(getNews());
    setPopups(getPopups());
    setForms(getForms());
    setEvents(getEvents());
    setQuickLinks(getQuickLinks());
    setContactInfo(getContactInfo());
    if (currentRole === 'CREATOR') {
      setUsers(getUsers());
    }
  };
  
  // Reload users when tab switches to creator
  useEffect(() => {
    if (activeTab === 'creator') {
        setUsers(getUsers());
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const role = await authenticateUser(email, password);
        if (role) {
            localStorage.setItem('sepri_user_role', role);
            setCurrentRole(role);
            setIsLoggedIn(true);
            loadData();
        } else {
            alert("Credenciales incorrectas.");
        }
    } catch (error) {
        console.error(error);
        alert("Error al iniciar sesión.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sepri_user_role');
    setIsLoggedIn(false);
    setCurrentRole('USER');
    navigate('/');
  };

  // --- USER MANAGEMENT (CREATOR) ---
  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de resetear la contraseña para ${userName}? La contraseña anterior dejará de funcionar.`)) {
        return;
    }
    
    setIsResetting(userId);
    try {
        // Add artificial delay for UX and to ensure async operations complete
        await new Promise(resolve => setTimeout(resolve, 800)); 
        const newPwd = await resetUserPassword(userId);
        if (newPwd) {
            setNewGeneratedPassword(newPwd);
        } else {
            alert("Error: No se pudo generar la contraseña.");
        }
    } catch (error) {
        console.error("Reset password failed:", error);
        alert("Ocurrió un error inesperado al resetear la clave.");
    } finally {
        setIsResetting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Contraseña copiada al portapapeles");
  };

  // --- NEWS MANAGEMENT ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'news' | 'protocol_image') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === 'news') {
          setCurrentNews(prev => ({ ...prev, imageUrl: result }));
        } else if (target === 'protocol_image') {
          setCurrentProtocol(prev => ({ ...prev, imageUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNews = () => {
    if (!currentNews.title || !currentNews.summary) return;
    
    let updatedNews = [...news];
    if (currentNews.id) {
      updatedNews = updatedNews.map(n => n.id === currentNews.id ? { ...n, ...currentNews } as NewsItem : n);
    } else {
      const newItem: NewsItem = {
        id: Date.now().toString(),
        title: currentNews.title,
        summary: currentNews.summary,
        category: currentNews.category || 'Novedad',
        date: new Date().toLocaleDateString('es-CO'),
        ...currentNews
      } as NewsItem;
      updatedNews.unshift(newItem);
    }
    
    saveNews(updatedNews);
    setNews(updatedNews);
    setIsEditingNews(false);
    setCurrentNews({});
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('¿Eliminar esta noticia?')) {
      const updated = news.filter(n => n.id !== id);
      saveNews(updated);
      setNews(updated);
    }
  };

  // --- PROTOCOLS (EVENTS) MANAGEMENT ---
  const handleSaveProtocol = () => {
    if (!currentProtocol.title?.trim() || !currentProtocol.description?.trim()) {
      alert("Título y descripción requeridos");
      return;
    }

    try {
      // Ensure iconName defaults if missing
      const protocolToSave: EventType = {
        id: currentProtocol.id || `evt-${Date.now()}`,
        title: currentProtocol.title,
        description: currentProtocol.description,
        iconName: currentProtocol.iconName || 'FileText',
        imageUrl: currentProtocol.imageUrl,
        documentUrl: currentProtocol.documentUrl,
        baseSteps: currentProtocol.baseSteps || [],
        questions: currentProtocol.questions || []
      };

      if (currentProtocol.id) {
        // Update
        const updatedEvents = events.map(e => e.id === currentProtocol.id ? protocolToSave : e);
        saveEvents(updatedEvents);
        setEvents(updatedEvents);
      } else {
        // Create
        addEvent(protocolToSave);
        setEvents(getEvents());
      }
      setIsEditingProtocol(false);
      setCurrentProtocol({ baseSteps: [], questions: [] });
      alert("Protocolo guardado exitosamente.");
    } catch (error) {
      console.error("Error saving protocol:", error);
      alert("Error al guardar: Es posible que la imagen sea muy pesada. Intenta con una imagen más liviana.");
    }
  };

  const handleDeleteProtocol = (id: string) => {
    if (confirm('¿Eliminar este protocolo completo y todos sus datos?')) {
      deleteEvent(id);
      setEvents(getEvents());
    }
  };

  // Protocol Questions Management
  const handleAddQuestion = () => {
    if (!newQuestionText) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: newQuestionText,
      triggerSteps: [], 
      isEnabled: true
    };
    setCurrentProtocol(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQ]
    }));
    setNewQuestionText('');
  };

  const handleToggleQuestion = (qId: string) => {
    setCurrentProtocol(prev => {
      const updatedQs = prev.questions?.map(q => 
        q.id === qId ? { ...q, isEnabled: !q.isEnabled } : q
      ) || [];
      return { ...prev, questions: updatedQs };
    });
  };

  const handleDeleteQuestion = (qId: string) => {
    setCurrentProtocol(prev => {
      const updatedQs = prev.questions?.filter(q => q.id !== qId) || [];
      return { ...prev, questions: updatedQs };
    });
  };

  const handleEditQuestionText = (qId: string, text: string) => {
    setCurrentProtocol(prev => {
      const updatedQs = prev.questions?.map(q => 
        q.id === qId ? { ...q, text } : q
      ) || [];
      return { ...prev, questions: updatedQs };
    });
  };

  // Protocol Steps (Items) Management
  const handleAddStepLocal = () => {
    if (!newStep.title) return;
    
    // Validate URL if present
    if (newStep.downloadUrl && !/^https?:\/\//.test(newStep.downloadUrl)) {
      alert("La URL debe comenzar con http:// o https://");
      return;
    }

    const step: Step = {
      id: `step-${Date.now()}`,
      title: newStep.title!,
      description: newStep.description || '',
      deadline: newStep.deadline,
      downloadUrl: newStep.downloadUrl,
      isDownloadable: !!newStep.downloadUrl
    };

    setCurrentProtocol(prev => ({
      ...prev,
      baseSteps: [...(prev.baseSteps || []), step]
    }));
    setNewStep({ title: '', description: '', deadline: '', downloadUrl: '' });
  };

  const handleUpdateStepLocal = (id: string, field: keyof Step, value: any) => {
    setCurrentProtocol(prev => ({
      ...prev,
      baseSteps: prev.baseSteps?.map(s => {
        if (s.id === id) {
           const updated = { ...s, [field]: value };
           // If updating URL, update isDownloadable flag
           if (field === 'downloadUrl') {
             updated.isDownloadable = !!value;
           }
           return updated;
        }
        return s;
      })
    }));
  };

  const handleDeleteStepLocal = (id: string) => {
    if(confirm("¿Eliminar este ítem?")) {
      setCurrentProtocol(prev => ({
        ...prev,
        baseSteps: prev.baseSteps?.filter(s => s.id !== id)
      }));
    }
  };

  // --- POPUP MANAGEMENT ---
  const handleTogglePopup = (id: string, currentStatus: boolean) => {
    togglePopup(id, !currentStatus);
    setPopups(getPopups()); // Reload
  };

  const startEditingPopup = (popup: PopupConfig) => {
    setEditingPopupId(popup.id);
    setTempPopupData({ ...popup });
  };

  const cancelEditingPopup = () => {
    setEditingPopupId(null);
    setTempPopupData({});
  };

  const saveEditingPopup = () => {
    if (editingPopupId && tempPopupData.title && tempPopupData.content && tempPopupData.type) {
      updatePopup({ ...tempPopupData } as PopupConfig);
      setPopups(getPopups());
      setEditingPopupId(null);
      setTempPopupData({});
    }
  };

  // --- FORM MANAGEMENT ---
  const addFieldToForm = () => {
    if (!newField.label) return;
    const field: FormField = {
      id: `field-${Date.now()}`,
      label: newField.label,
      type: newField.type || 'text',
      required: false
    };
    setNewForm(prev => ({ ...prev, fields: [...(prev.fields || []), field] }));
    setNewField({ label: '', type: 'text' });
  };

  const handleSaveForm = () => {
    if (!newForm.title || !newForm.eventId) {
      alert("Debes asignar un título y un evento al formulario");
      return;
    }
    const template: FormTemplate = {
      id: `form-${Date.now()}`,
      eventId: newForm.eventId,
      title: newForm.title,
      description: newForm.description,
      fields: newForm.fields || []
    };
    addForm(template);
    setForms(getForms());
    setIsCreatingForm(false);
    setNewForm({ title: '', fields: [] });
  };

  const handleDeleteForm = (id: string) => {
    if (confirm('¿Eliminar este formulario?')) {
      deleteForm(id);
      setForms(getForms());
    }
  };

  // --- QUICK LINKS MANAGEMENT ---
  const handleSaveQuickLink = () => {
    if (!newLink.title || !newLink.url) return;
    const link: QuickLink = {
        id: `ql-${Date.now()}`,
        title: newLink.title,
        url: newLink.url,
        isEnabled: true
    };
    addQuickLink(link);
    setQuickLinks(getQuickLinks());
    setNewLink({ title: '', url: '' });
  };

  const handleDeleteQuickLink = (id: string) => {
      if (confirm("¿Eliminar este enlace?")) {
          deleteQuickLink(id);
          setQuickLinks(getQuickLinks());
      }
  };
  
  const handleToggleQuickLink = (id: string) => {
      const link = quickLinks.find(l => l.id === id);
      if (link) {
          updateQuickLink({ ...link, isEnabled: !link.isEnabled });
          setQuickLinks(getQuickLinks());
      }
  };

  // Inline Editing Handlers
  const startEditingLink = (link: QuickLink) => {
    setEditingLinkId(link.id);
    setTempLinkData({ ...link });
  };

  const cancelEditingLink = () => {
    setEditingLinkId(null);
    setTempLinkData({});
  };

  const saveEditingLink = () => {
    if (editingLinkId && tempLinkData.title && tempLinkData.url) {
       updateQuickLink({ ...tempLinkData } as QuickLink);
       setQuickLinks(getQuickLinks());
       setEditingLinkId(null);
       setTempLinkData({});
    }
  };

  // --- CONTACT CONFIG MANAGEMENT ---
  const handleSaveContactInfo = () => {
    saveContactInfo(contactInfo);
    alert("Información de contacto actualizada correctamente.");
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-sepri-dark text-white p-6 hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="text-sepri-yellow" />
            <h1 className="font-bold text-lg">Panel Admin</h1>
          </div>
          
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('news')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'news' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}>
              <Newspaper size={18} /> Noticias
            </button>
            <button onClick={() => setActiveTab('protocols')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'protocols' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}>
              <Briefcase size={18} /> Protocolos
            </button>
            <button onClick={() => setActiveTab('popups')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'popups' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}>
              <MessageSquare size={18} /> Popups
            </button>
            <button onClick={() => setActiveTab('forms')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'forms' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}>
              <FileText size={18} /> Formularios
            </button>
            <button onClick={() => setActiveTab('links')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'links' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}>
              <LinkIcon size={18} /> Enlaces Rápidos
            </button>
            <button onClick={() => setActiveTab('config')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'config' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}>
              <Settings size={18} /> Configuración
            </button>
            {currentRole === 'CREATOR' && (
              <button onClick={() => setActiveTab('creator')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'creator' ? 'bg-purple-700' : 'hover:bg-gray-800'}`}>
                <Key size={18} /> Roles
              </button>
            )}
          </nav>

          <button onClick={handleLogout} className="mt-8 text-red-400 flex items-center gap-2 hover:text-red-300">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
            {activeTab === 'news' && 'Gestión de Noticias'}
            {activeTab === 'protocols' && 'Gestión de Protocolos (Eventos)'}
            {activeTab === 'popups' && 'Gestión de Popups'}
            {activeTab === 'forms' && 'Creador de Formularios'}
            {activeTab === 'links' && 'Gestión de Enlaces Rápidos (Footer)'}
            {activeTab === 'config' && 'Configuración General / Contacto'}
            {activeTab === 'creator' && 'Zona de Creador'}
          </h2>

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div>
               <div className="mb-4">
                 <button onClick={() => { setCurrentNews({}); setIsEditingNews(true); }} className="bg-sepri-medium text-white px-4 py-2 rounded flex items-center gap-2">
                   <Plus size={18} /> Nueva Noticia
                 </button>
               </div>

               {isEditingNews && (
                 <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
                   {/* News Form Content */}
                   <h3 className="font-bold mb-4">{currentNews.id ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
                   <div className="grid grid-cols-1 gap-4">
                     <input 
                        type="text" placeholder="Título" className="border p-2 rounded" 
                        value={currentNews.title || ''} onChange={e => setCurrentNews({...currentNews, title: e.target.value})}
                     />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select 
                            className="border p-2 rounded"
                            value={currentNews.category || 'Novedad'} onChange={e => setCurrentNews({...currentNews, category: e.target.value as any})}
                        >
                        <option value="Novedad">Novedad</option>
                        <option value="Evento">Evento</option>
                        <option value="Importante">Importante</option>
                        </select>
                        <div className="flex items-center gap-2">
                             <div className="flex-1 relative">
                                <label htmlFor="image-upload-news" className="flex items-center justify-center gap-2 border border-dashed border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-50 text-gray-500 text-sm">
                                    <ImageIcon size={16} />
                                    {currentNews.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                                </label>
                                <input id="image-upload-news" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'news')} className="hidden" />
                             </div>
                        </div>
                     </div>
                     {currentNews.imageUrl && (
                         <div className="w-full h-32 bg-gray-100 rounded overflow-hidden relative">
                             <img src={currentNews.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                             <button onClick={() => setCurrentNews({...currentNews, imageUrl: undefined})} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow"><Trash2 size={14} /></button>
                         </div>
                     )}
                     <textarea placeholder="Resumen" className="border p-2 rounded" rows={3} value={currentNews.summary || ''} onChange={e => setCurrentNews({...currentNews, summary: e.target.value})} />
                     <div className="flex justify-end gap-2">
                       <button onClick={() => setIsEditingNews(false)} className="text-gray-500">Cancelar</button>
                       <button onClick={handleSaveNews} className="bg-green-600 text-white px-4 py-2 rounded">Guardar</button>
                     </div>
                   </div>
                 </div>
               )}
               <div className="grid gap-4">
                 {news.map(n => (
                   <div key={n.id} className="bg-white p-4 rounded shadow flex gap-4 items-start">
                     {/* News List */}
                     <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {n.imageUrl ? <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Newspaper size={20} /></div>}
                     </div>
                     <div className="flex-1">
                       <span className={`text-xs font-bold px-2 py-1 rounded ${n.category === 'Importante' ? 'bg-red-100' : 'bg-blue-100'}`}>{n.category}</span>
                       <h3 className="font-bold text-lg leading-tight mt-1">{n.title}</h3>
                     </div>
                     <div className="flex gap-2 flex-col">
                       <button onClick={() => { setCurrentNews(n); setIsEditingNews(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit2 size={18}/></button>
                       <button onClick={() => handleDeleteNews(n.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* PROTOCOLS TAB */}
          {activeTab === 'protocols' && (
             <div>
                 <div className="mb-4">
                 <button onClick={() => { setCurrentProtocol({ baseSteps: [], questions: [] }); setIsEditingProtocol(true); }} className="bg-sepri-medium text-white px-4 py-2 rounded flex items-center gap-2">
                   <Plus size={18} /> Nuevo Protocolo
                 </button>
               </div>
               
               {isEditingProtocol && (
                   <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200 animate-fade-in">
                       {/* Protocol Editor UI */}
                       <h3 className="font-bold mb-4 text-xl text-sepri-dark">{currentProtocol.id ? 'Editar Protocolo' : 'Nuevo Protocolo'}</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Título</label><input type="text" className="border p-2 rounded w-full" value={currentProtocol.title || ''} onChange={e => setCurrentProtocol(prev => ({...prev, title: e.target.value}))} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label><textarea className="border p-2 rounded w-full" rows={3} value={currentProtocol.description || ''} onChange={e => setCurrentProtocol(prev => ({...prev, description: e.target.value}))} /></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Imagen de Tarjeta (Opcional)</label><div className="flex items-center gap-3"><label className="bg-gray-100 border border-gray-300 px-3 py-2 rounded cursor-pointer hover:bg-gray-200 text-sm flex items-center gap-2"><ImageIcon size={16}/> Subir Imagen<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'protocol_image')} /></label>{currentProtocol.imageUrl && <span className="text-xs text-green-600 flex items-center"><Check size={12}/> Cargada</span>}</div>{currentProtocol.imageUrl && <img src={currentProtocol.imageUrl} className="h-20 w-auto mt-2 rounded border" />}</div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Enlace del Documento General (Drive / URL)</label><input type="url" placeholder="https://drive.google.com/..." className="border p-2 rounded w-full" value={currentProtocol.documentUrl || ''} onChange={e => setCurrentProtocol(prev => ({...prev, documentUrl: e.target.value}))} /></div>
                            </div>
                       </div>
                       
                       {/* Questions */}
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                            <h4 className="font-bold text-sepri-dark mb-2 flex items-center"><MessageSquare size={16} className="mr-2"/> Popups de Detalles / Preguntas</h4>
                            <div className="space-y-2 mb-4">
                                {currentProtocol.questions?.map(q => (
                                <div key={q.id} className="bg-white p-3 rounded shadow-sm flex items-center gap-3">
                                    <button onClick={() => handleToggleQuestion(q.id)} className="text-2xl">{q.isEnabled ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-300" />}</button>
                                    <input type="text" value={q.text} onChange={(e) => handleEditQuestionText(q.id, e.target.value)} className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-sepri-medium outline-none bg-transparent"/>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                                </div>
                                ))}
                            </div>
                            <div className="flex gap-2"><input type="text" placeholder="Nueva pregunta..." className="flex-1 border p-2 rounded text-sm" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} /><button onClick={handleAddQuestion} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">Agregar</button></div>
                       </div>
                       
                       {/* Steps */}
                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                            <h4 className="font-bold text-sepri-dark mb-4 flex items-center"><List size={16} className="mr-2"/> Ítems de la Ruta de Cumplimiento</h4>
                            <div className="space-y-4 mb-6">
                                {currentProtocol.baseSteps?.map((step, idx) => (
                                <div key={step.id} className="bg-white p-4 rounded shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-3"><h5 className="font-bold text-gray-700 text-sm">Ítem {idx + 1}</h5><button onClick={() => handleDeleteStepLocal(step.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500">Título</label><input type="text" className="w-full border-b border-gray-200 focus:border-blue-500 outline-none text-sm" value={step.title} onChange={(e) => handleUpdateStepLocal(step.id, 'title', e.target.value)} /></div>
                                        <div><label className="text-xs font-bold text-gray-500">Días antes</label><input type="text" className="w-full border-b border-gray-200 focus:border-blue-500 outline-none text-sm" value={step.deadline || ''} onChange={(e) => handleUpdateStepLocal(step.id, 'deadline', e.target.value)} /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">Descripción</label><input type="text" className="w-full border-b border-gray-200 focus:border-blue-500 outline-none text-sm" value={step.description} onChange={(e) => handleUpdateStepLocal(step.id, 'description', e.target.value)} /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><ExternalLink size={10}/> Link de Descarga (URL)</label><input type="text" className="w-full border-b border-gray-200 focus:border-blue-500 outline-none text-sm text-blue-600" value={step.downloadUrl || ''} onChange={(e) => handleUpdateStepLocal(step.id, 'downloadUrl', e.target.value)} placeholder="https://..." /></div>
                                    </div>
                                </div>
                                ))}
                            </div>
                            <div className="bg-white p-4 rounded border border-blue-100">
                                <h5 className="font-bold text-sm text-gray-700 mb-3">Agregar Nuevo Ítem</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input type="text" placeholder="Título" className="border p-2 rounded text-sm" value={newStep.title || ''} onChange={(e) => setNewStep({...newStep, title: e.target.value})} />
                                    <input type="text" placeholder="Días antes" className="border p-2 rounded text-sm" value={newStep.deadline || ''} onChange={(e) => setNewStep({...newStep, deadline: e.target.value})} />
                                    <input type="text" placeholder="Descripción" className="border p-2 rounded text-sm md:col-span-2" value={newStep.description || ''} onChange={(e) => setNewStep({...newStep, description: e.target.value})} />
                                    <input type="text" placeholder="URL del Documento" className="border p-2 rounded text-sm md:col-span-2" value={newStep.downloadUrl || ''} onChange={(e) => setNewStep({...newStep, downloadUrl: e.target.value})} />
                                </div>
                                <button onClick={handleAddStepLocal} className="w-full bg-blue-100 text-blue-700 py-2 rounded font-bold text-sm hover:bg-blue-200">Agregar Ítem</button>
                            </div>
                       </div>

                       <div className="flex justify-end gap-2 border-t pt-4">
                           <button onClick={() => setIsEditingProtocol(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                           <button onClick={handleSaveProtocol} className="bg-sepri-medium text-white px-6 py-2 rounded font-bold hover:bg-sepri-dark flex items-center gap-2"><Save size={18}/> Guardar Protocolo</button>
                       </div>
                   </div>
               )}
               
               <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                   {events.map(e => (
                       <div key={e.id} className="bg-white p-4 rounded shadow border border-gray-100 flex flex-col">
                           <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">{e.imageUrl ? <img src={e.imageUrl} className="w-full h-full object-cover" /> : <Briefcase size={20} className="text-gray-400"/>}</div><h3 className="font-bold text-gray-800 line-clamp-1">{e.title}</h3></div>
                           <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{e.description}</p>
                           <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2 mt-2"><span>{e.baseSteps.length} pasos</span><div className="flex gap-2"><button onClick={() => { setCurrentProtocol(e); setIsEditingProtocol(true); }} className="text-blue-500 bg-blue-50 p-1.5 rounded hover:bg-blue-100"><Edit2 size={16}/></button><button onClick={() => handleDeleteProtocol(e.id)} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100"><Trash2 size={16}/></button></div></div>
                       </div>
                   ))}
               </div>
             </div>
          )}

          {/* POPUPS TAB */}
          {activeTab === 'popups' && (
            <div className="grid gap-4">
               {popups.map(p => (
                <div key={p.id} className={`bg-white p-4 rounded shadow border-l-4 ${p.type === 'alert' ? 'border-red-500' : p.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'}`}>
                  {editingPopupId === p.id ? (
                     <div className="space-y-3 w-full">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input type="text" className="border p-2 rounded text-sm w-full font-bold" placeholder="Título" value={tempPopupData.title || ''} onChange={(e) => setTempPopupData({...tempPopupData, title: e.target.value})}/><select className="border p-2 rounded text-sm w-full" value={tempPopupData.type || 'info'} onChange={(e) => setTempPopupData({...tempPopupData, type: e.target.value as any})}><option value="info">INFO</option><option value="warning">WARNING</option><option value="alert">ALERT</option></select></div>
                       <textarea className="border p-2 rounded text-sm w-full" rows={2} placeholder="Mensaje" value={tempPopupData.content || ''} onChange={(e) => setTempPopupData({...tempPopupData, content: e.target.value})}/>
                       <div className="flex justify-end gap-2"><button onClick={saveEditingPopup} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Guardar</button><button onClick={cancelEditingPopup} className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">Cancelar</button></div>
                     </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 mr-4"><h3 className="font-bold flex items-center gap-2">{p.title}<span className={`text-[10px] px-2 py-0.5 rounded uppercase text-white ${p.type === 'alert' ? 'bg-red-500' : p.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}>{p.type}</span></h3><p className="text-gray-600 text-sm">{p.content}</p></div>
                      <div className="flex items-center gap-3"><button onClick={() => startEditingPopup(p)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit2 size={20} /></button><button onClick={() => handleTogglePopup(p.id, p.isEnabled)} className="text-2xl text-sepri-medium">{p.isEnabled ? <ToggleRight className="text-green-500" size={32} /> : <ToggleLeft className="text-gray-300" size={32} />}</button></div>
                    </div>
                  )}
                </div>
               ))}
            </div>
          )}

          {/* FORMS TAB */}
          {activeTab === 'forms' && (
            <div>
               <div className="mb-4"><button onClick={() => setIsCreatingForm(true)} className="bg-sepri-medium text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={18} /> Crear Formulario</button></div>
               {isCreatingForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200 animate-fade-in">
                  <h3 className="font-bold mb-4">Nuevo Formulario</h3>
                  <div className="grid gap-4 mb-4"><input type="text" placeholder="Título del Formulario" className="border p-2 rounded w-full" value={newForm.title} onChange={e => setNewForm({...newForm, title: e.target.value})}/><input type="text" placeholder="Descripción" className="border p-2 rounded w-full" value={newForm.description} onChange={e => setNewForm({...newForm, description: e.target.value})}/><select className="border p-2 rounded w-full" value={newForm.eventId} onChange={e => setNewForm({...newForm, eventId: e.target.value})}><option value="">Seleccionar Evento Asociado</option>{events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}</select></div>
                  <div className="bg-gray-50 p-4 rounded mb-4"><h4 className="text-sm font-bold mb-2">Agregar Campos</h4><div className="flex gap-2"><input type="text" placeholder="Etiqueta del campo" className="border p-2 rounded flex-1" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})}/><select className="border p-2 rounded" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value as any})}><option value="text">Texto Corto</option><option value="textarea">Texto Largo</option><option value="checkbox">Casilla</option></select><button onClick={addFieldToForm} className="bg-gray-200 px-3 rounded hover:bg-gray-300">Agregar</button></div><ul className="mt-2 space-y-1">{newForm.fields?.map((f, i) => (<li key={i} className="text-sm bg-white p-1 px-2 rounded border flex justify-between"><span>{f.label} ({f.type})</span></li>))}</ul></div>
                  <div className="flex justify-end gap-2"><button onClick={() => setIsCreatingForm(false)} className="text-gray-500">Cancelar</button><button onClick={handleSaveForm} className="bg-sepri-medium text-white px-4 py-2 rounded">Guardar Formulario</button></div>
                </div>
               )}
               <div className="grid gap-4">{forms.map(f => (<div key={f.id} className="bg-white p-4 rounded shadow flex justify-between items-center"><div><h3 className="font-bold">{f.title}</h3><p className="text-xs text-gray-500">Evento: {events.find(e => e.id === f.eventId)?.title || f.eventId}</p><p className="text-xs text-gray-400">{f.fields.length} campos</p></div><button onClick={() => handleDeleteForm(f.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button></div>))}{forms.length === 0 && <p className="text-gray-400 text-center">No hay formularios creados.</p>}</div>
            </div>
          )}

          {/* QUICK LINKS TAB */}
          {activeTab === 'links' && (
             <div>
                <div className="mb-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Agregar Nuevo Enlace</h3>
                    <div className="flex gap-3"><input type="text" placeholder="Título" className="border p-2 rounded flex-1" value={newLink.title || ''} onChange={e => setNewLink({...newLink, title: e.target.value})}/><input type="text" placeholder="URL" className="border p-2 rounded flex-1" value={newLink.url || ''} onChange={e => setNewLink({...newLink, url: e.target.value})}/><button onClick={handleSaveQuickLink} className="bg-sepri-medium text-white px-4 py-2 rounded font-bold hover:bg-sepri-dark">Agregar</button></div>
                </div>
                <div className="grid gap-4">
                    {quickLinks.map(link => (
                        <div key={link.id} className="bg-white p-4 rounded shadow flex items-center justify-between border-l-4 border-blue-400">
                            {editingLinkId === link.id ? (
                                <div className="flex-1 mr-4 space-y-2">
                                    <input type="text" value={tempLinkData.title || ''} onChange={(e) => setTempLinkData({...tempLinkData, title: e.target.value})} className="w-full border p-2 rounded" placeholder="Título"/>
                                    <input type="text" value={tempLinkData.url || ''} onChange={(e) => setTempLinkData({...tempLinkData, url: e.target.value})} className="w-full border p-2 rounded" placeholder="URL"/>
                                    <div className="flex gap-2"><button onClick={saveEditingLink} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Guardar</button><button onClick={cancelEditingLink} className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">Cancelar</button></div>
                                </div>
                            ) : (
                                <div className="flex-1 mr-4"><h4 className="font-bold text-gray-800">{link.title}</h4><p className="text-sm text-gray-600 truncate">{link.url}</p></div>
                            )}
                            {!editingLinkId && (
                              <div className="flex items-center gap-4"><button onClick={() => startEditingLink(link)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded"><Edit2 size={18} /></button><button onClick={() => handleToggleQuickLink(link.id)} className="text-2xl" title={link.isEnabled ? "Deshabilitar" : "Habilitar"}>{link.isEnabled ? <ToggleRight className="text-green-500" size={32} /> : <ToggleLeft className="text-gray-300" size={32} />}</button><button onClick={() => handleDeleteQuickLink(link.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded"><Trash2 size={18} /></button></div>
                            )}
                        </div>
                    ))}
                </div>
             </div>
          )}

          {/* CONFIGURATION / CONTACT TAB */}
          {activeTab === 'config' && (
             <div className="max-w-4xl">
               <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                  <h3 className="font-bold text-xl mb-6 text-sepri-dark flex items-center"><Phone className="mr-2"/> Configuración de Contacto (Footer)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Nombre Coordinador</label><input type="text" className="w-full border p-2 rounded" value={contactInfo.coordinatorName} onChange={(e) => setContactInfo({...contactInfo, coordinatorName: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Teléfono Coordinador</label><input type="text" className="w-full border p-2 rounded" value={contactInfo.coordinatorPhone} onChange={(e) => setContactInfo({...contactInfo, coordinatorPhone: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Nombre Asistente</label><input type="text" className="w-full border p-2 rounded" value={contactInfo.assistantName} onChange={(e) => setContactInfo({...contactInfo, assistantName: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Teléfono Asistente</label><input type="text" className="w-full border p-2 rounded" value={contactInfo.assistantPhone} onChange={(e) => setContactInfo({...contactInfo, assistantPhone: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label><input type="text" className="w-full border p-2 rounded" value={contactInfo.email} onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Dirección / Sede</label><input type="text" className="w-full border p-2 rounded" value={contactInfo.address} onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}/></div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                  <h3 className="font-bold text-xl mb-6 text-sepri-dark flex items-center"><Share2 className="mr-2"/> Redes Sociales (Iconos Footer)</h3>
                  <div className="grid grid-cols-1 gap-6 mb-6">
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Facebook URL</label><input type="text" className="w-full border p-2 rounded" placeholder="https://facebook.com/..." value={contactInfo.facebookUrl || ''} onChange={(e) => setContactInfo({...contactInfo, facebookUrl: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">Instagram URL</label><input type="text" className="w-full border p-2 rounded" placeholder="https://instagram.com/..." value={contactInfo.instagramUrl || ''} onChange={(e) => setContactInfo({...contactInfo, instagramUrl: e.target.value})}/></div>
                     <div><label className="block text-sm font-bold text-gray-700 mb-1">YouTube URL</label><input type="text" className="w-full border p-2 rounded" placeholder="https://youtube.com/..." value={contactInfo.youtubeUrl || ''} onChange={(e) => setContactInfo({...contactInfo, youtubeUrl: e.target.value})}/></div>
                  </div>
               </div>
               <div className="flex justify-end"><button onClick={handleSaveContactInfo} className="bg-sepri-medium text-white px-6 py-2 rounded font-bold hover:bg-sepri-dark flex items-center gap-2"><Save size={18} /> Guardar Cambios Generales</button></div>
             </div>
          )}

          {/* CREATOR TAB */}
          {activeTab === 'creator' && currentRole === 'CREATOR' && (
            <div className="bg-purple-50 p-6 rounded border border-purple-200">
               <h3 className="text-purple-900 font-bold mb-6 text-xl flex items-center"><ShieldAlert className="mr-2"/> Gestión de Usuarios y Seguridad</h3>
               
               <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 mb-6">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Correo</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {users.map((user) => (
                       <tr key={user.id}>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'CREATOR' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                              {user.role}
                            </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <button 
                             onClick={() => handleResetPassword(user.id, user.name)} 
                             className={`text-indigo-600 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded transition-all ${isResetting === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                             disabled={isResetting === user.id}
                           >
                              <Key size={14}/> {isResetting === user.id ? 'Procesando...' : 'Resetear Clave'}
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      
      {/* PASSWORD RESET MODAL - MOVED TO ROOT LEVEL & HIGH Z-INDEX */}
      {newGeneratedPassword && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center border-2 border-red-100 relative animate-fade-in-up">
             <div className="bg-red-100 text-red-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Key size={40}/>
             </div>
             <h3 className="text-2xl font-bold text-gray-800 mb-2">Contraseña Reseteada</h3>
             <p className="text-gray-600 mb-6 text-sm">
               La contraseña ha sido actualizada exitosamente.
               <br/>
               <span className="text-red-500 font-bold">Cópiala ahora. No se volverá a mostrar.</span>
             </p>
             
             <div className="bg-gray-50 p-5 rounded-lg border border-gray-300 mb-6 relative group">
               <div className="font-mono text-xl font-bold tracking-widest text-gray-800 break-all select-all">
                 {newGeneratedPassword}
               </div>
             </div>
             
             <div className="flex flex-col gap-3">
                <button onClick={() => copyToClipboard(newGeneratedPassword)} className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-all">
                  <Copy size={18}/> Copiar al portapapeles
                </button>
                <button onClick={() => setNewGeneratedPassword(null)} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 shadow-lg transition-all transform hover:scale-[1.02]">
                  Entendido, cerrar ventana
                </button>
             </div>
           </div>
         </div>
       )}
    </div>
    );
  }
  
  // Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-sepri-bg px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-sepri-medium animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="bg-sepri-medium text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Acceso Administrativo</h1>
          <p className="text-gray-500 text-sm mt-2">SEPRI Distrito 22</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sepri-medium focus:border-transparent outline-none transition-all"
                placeholder="usuario@ipuc.org.co"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sepri-medium focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-sepri-medium text-white font-bold py-3 rounded-lg hover:bg-sepri-dark transition-all transform hover:scale-[1.02] shadow-md flex justify-center items-center group"
          >
            Iniciar Sesión <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-sepri-medium flex items-center justify-center gap-2">
            <LogOut size={16} /> Volver al sitio principal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;