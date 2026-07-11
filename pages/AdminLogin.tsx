import React, { useState, useEffect, useMemo } from 'react';
import { Lock, LogOut, Settings, Newspaper, FileText, Plus, Trash2, Edit2, Save, Image as ImageIcon, Briefcase, User, Bell, Phone, Mail, MapPin, ArrowLeft, X, Eye, EyeOff, Shield, MessageSquare, BarChart2, Users, Clock, Download, Map as MapIcon, Calendar, Activity, ChevronDown, ClipboardList, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DEFAULT_CONTACT_INFO } from '../constants';
import { UserRole, NewsItem, EventType, ContactInfo, PopupConfig, QuickLink, TeamMember, Step, FormTemplate, FormField } from '../types';
import { getNews, saveNews, getEvents, saveEvents, addEvent, deleteEvent, getContactInfo, saveContactInfo, authenticateUser, getPopups, savePopups, getQuickLinks, saveQuickLinks, getAnalytics, getForms, saveForms, AnalyticsRecord } from '../services/dataService';
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [showResendApiKey, setShowResendApiKey] = useState(false);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'protocols' | 'forms' | 'config'>('dashboard');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsRecord[]>([]);

  // States for sub-editors
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [currentNews, setCurrentNews] = useState<Partial<NewsItem>>({});
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [currentProtocol, setCurrentProtocol] = useState<Partial<EventType>>({ baseSteps: [], questions: [], alerts: [] });
  const [isEditingPopup, setIsEditingPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Partial<PopupConfig>>({ title: '', content: '', type: 'info', isEnabled: true });
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({ name: '', role: '' });
  const [newQuickLink, setNewQuickLink] = useState<Partial<QuickLink>>({ title: '', url: '', isEnabled: true });

  // --- Form Builder State ---
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [selectedFormEventId, setSelectedFormEventId] = useState<string>('');
  const [editingFormTemplate, setEditingFormTemplate] = useState<Partial<FormTemplate> | null>(null);
  
  // Edit mode tracking states
  const [editingQuickLinkId, setEditingQuickLinkId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Dashboard Filters State
  const [dashboardDateRange, setDashboardDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // REAL DATA FOR DASHBOARD
  const { trafficData, locationData, downloadsData, totals, insight } = useMemo(() => {
    const days = dashboardDateRange === '7d' ? 7 : dashboardDateRange === '30d' ? 30 : dashboardDateRange === '90d' ? 90 : 180;
    const cutoffDate = subDays(new Date(), days);
    
    const filteredRecords = dashboardDateRange === 'all' 
      ? analyticsData 
      : analyticsData.filter(r => new Date(r.date) >= cutoffDate);

    const trafficMap = new Map<string, any>();
    if (dashboardDateRange !== 'all') {
      for (let i = days - 1; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dStr = format(d, 'MMM dd', { locale: es });
        const isoStr = format(d, 'yyyy-MM-dd');
        trafficMap.set(isoStr, { date: dStr, visitas: 0, unicos: 0 });
      }
    }
    
    filteredRecords.forEach(r => {
      const dStr = format(new Date(r.date), 'MMM dd', { locale: es });
      if (trafficMap.has(r.date)) {
        const item = trafficMap.get(r.date);
        item.visitas += r.visits;
        item.unicos += r.uniqueVisitors;
      } else if (dashboardDateRange === 'all') {
        trafficMap.set(r.date, { date: dStr, visitas: r.visits, unicos: r.uniqueVisitors });
      }
    });

    const tData = Array.from(trafficMap.values());
    if (dashboardDateRange === 'all') {
      tData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const locMap: Record<string, number> = {};
    const dlMap: Record<string, number> = {};
    
    let totalVisits = 0;
    let totalUniques = 0;
    let totalTime = 0;

    filteredRecords.forEach(r => {
      totalVisits += r.visits;
      totalUniques += r.uniqueVisitors;
      totalTime += r.timeSpentSeconds;
      Object.entries(r.locations || {}).forEach(([loc, count]) => { locMap[loc] = (locMap[loc] || 0) + count; });
      Object.entries(r.downloads || {}).forEach(([dl, count]) => { dlMap[dl] = (dlMap[dl] || 0) + count; });
    });

    const lData = Object.entries(locMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    const dData = Object.entries(dlMap).map(([name, downloads]) => ({ name, downloads })).sort((a, b) => b.downloads - a.downloads).slice(0, 5);
      
    const avgSeconds = totalUniques > 0 ? Math.floor(totalTime / totalUniques) : 0;
    const mins = Math.floor(avgSeconds / 60).toString().padStart(2, '0');
    const secs = (avgSeconds % 60).toString().padStart(2, '0');

    let insightTitle = "Aún no hay suficientes datos para generar insights";
    let insightDesc = "A medida que los usuarios interactúen con la plataforma y descarguen formatos, el sistema generará recomendaciones automáticas aquí.";

    if (dData.length > 0) {
      const topDownload = dData[0];
      insightTitle = `El documento "${topDownload.name}" es el más solicitado`;
      insightDesc = `Basado en las métricas actuales, los usuarios están descargando frecuentemente este formato (${topDownload.downloads} descargas). Se recomienda mantener su contenido actualizado y publicar noticias relevantes al respecto.`;
    } else if (lData.length > 0) {
      const topLocation = lData[0];
      insightTitle = `La mayoría del tráfico proviene de ${topLocation.name}`;
      insightDesc = `Tus usuarios principales se conectan desde ${topLocation.name} (${topLocation.value} visitas). Podrías considerar redactar noticias o actualizaciones específicas para esta región.`;
    } else if (totalVisits > 0) {
      insightTitle = `El portal está recibiendo tráfico`;
      insightDesc = `Se han registrado ${totalVisits} visitas en el periodo seleccionado. Sigue monitoreando para obtener más recomendaciones automatizadas.`;
    }

    return {
      trafficData: tData,
      locationData: lData,
      downloadsData: dData,
      totals: { visits: totalVisits, uniques: totalUniques, avgTime: `${mins}:${secs}`, totalDownloads: Object.values(dlMap).reduce((a,b)=>a+b,0) },
      insight: { title: insightTitle, description: insightDesc }
    };
  }, [dashboardDateRange, analyticsData]);

  const COLORS = ['#164E87', '#FFB000', '#2ECC71', '#E74C3C', '#9B59B6'];

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
    setAnalyticsData(await getAnalytics());
    setForms(await getForms());
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
    setContactInfo(prev => ({ ...prev })); // Dummy update to trigger rerender if needed, but not actually removing from popups list in this specific function as it should filter local state
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
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><BarChart2 size={18} /> Panel Principal</button>
          <button onClick={() => setActiveTab('news')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'news' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><Newspaper size={18} /> Noticias</button>
          <button onClick={() => setActiveTab('protocols')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'protocols' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><Briefcase size={18} /> Protocolos</button>
          <button onClick={() => setActiveTab('forms')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'forms' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><ClipboardList size={18} /> Formularios</button>
          <button onClick={() => setActiveTab('config')} className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'config' ? 'bg-sepri-medium' : 'hover:bg-gray-800'}`}><Settings size={18} /> Configuración</button>
        </nav>
        <button onClick={handleLogout} className="mt-8 text-red-400 flex items-center gap-2 hover:text-red-300 px-3"><LogOut size={18} /> Salir</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto h-full bg-gray-50">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-sepri-dark">Resumen de Actividad</h2>
                <p className="text-sm text-gray-500">Métricas principales de uso y visitas al portal SEPRI</p>
              </div>
              <div className="flex items-center gap-2 bg-white border rounded-lg p-1 shadow-sm">
                <Calendar size={16} className="text-gray-400 ml-2" />
                <select 
                  className="bg-transparent border-none outline-none text-sm font-medium p-2 text-gray-700 cursor-pointer"
                  value={dashboardDateRange}
                  onChange={(e) => setDashboardDateRange(e.target.value as any)}
                >
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 3 meses</option>
                  <option value="all">Historico Total</option>
                </select>
              </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">Real</span>
                </div>
                <div>
                  <h4 className="text-gray-500 text-sm font-medium">Visitas Totales</h4>
                  <p className="text-3xl font-black text-sepri-dark">{totals.visits.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={24} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">Real</span>
                </div>
                <div>
                  <h4 className="text-gray-500 text-sm font-medium">Usuarios Únicos</h4>
                  <p className="text-3xl font-black text-sepri-dark">{totals.uniques.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Clock size={24} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">Real</span>
                </div>
                <div>
                  <h4 className="text-gray-500 text-sm font-medium">Tiempo Promedio</h4>
                  <p className="text-3xl font-black text-sepri-dark">{totals.avgTime} <span className="text-sm font-medium text-gray-400">min</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Download size={24} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">Real</span>
                </div>
                <div>
                  <h4 className="text-gray-500 text-sm font-medium">Descargas Totales</h4>
                  <p className="text-3xl font-black text-sepri-dark">{totals.totalDownloads.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Traffic Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-6 text-sepri-dark">Tráfico a lo largo del tiempo</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#164E87" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#164E87" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUnicos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFB000" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FFB000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
                      />
                      <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#164E87" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitas)" />
                      <Area type="monotone" dataKey="unicos" name="Usuarios Únicos" stroke="#FFB000" strokeWidth={3} fillOpacity={1} fill="url(#colorUnicos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Locations Pie Chart */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-6 text-sepri-dark flex items-center gap-2"><MapIcon size={20} className="text-sepri-medium"/> Origen del Tráfico</h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {locationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {locationData.length > 0 ? locationData.slice(0,4).map((loc, idx) => (
                    <div key={loc.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-gray-600 font-medium">{loc.name}</span>
                      </div>
                      <span className="font-bold text-sepri-dark">{loc.value.toLocaleString()}</span>
                    </div>
                  )) : <p className="text-center text-sm text-gray-400 mt-6">Sin datos recientes</p>}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Downloads Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-6 text-sepri-dark flex items-center gap-2"><FileText size={20} className="text-sepri-medium"/> Top Documentos Descargados</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={downloadsData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} width={120} />
                      <RechartsTooltip 
                        cursor={{fill: '#F3F4F6'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="downloads" name="Descargas" fill="#164E87" radius={[0, 6, 6, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                  {downloadsData.length === 0 && <p className="text-center text-sm text-gray-400 mt-6 -translate-y-40">Sin datos de descargas recientes</p>}
                </div>
              </div>
              
              {/* Info / Tips Card */}
              <div className="bg-gradient-to-br from-sepri-dark to-sepri-medium p-8 rounded-2xl shadow-sm text-white flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={160} /></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                    <Activity size={14} /> Insights Automáticos
                  </div>
                  <h3 className="text-2xl font-black mb-4">{insight.title}</h3>
                  <p className="text-blue-100 leading-relaxed mb-8">
                    {insight.description}
                  </p>
                  <button onClick={() => setActiveTab('news')} className="bg-white text-sepri-dark px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-gray-50 transition-colors">
                    Ir a Redactar Noticia
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400">Documento General del Protocolo (URL)</label>
                    <input type="text" placeholder="https://drive.google.com/..." className="w-full border p-3 rounded-xl outline-none" value={currentProtocol.documentUrl || ''} onChange={e => setCurrentProtocol({...currentProtocol, documentUrl: e.target.value})} />
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Video (URL)</label>
                                  <input type="text" placeholder="https://youtube.com/..." className="w-full border p-2 rounded text-xs outline-none bg-white" value={step.videoUrl || ''} onChange={e => handleUpdateStep(step.id, 'videoUrl', e.target.value)} />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Documento a Descargar (URL)</label>
                                  <input type="text" placeholder="https://drive.google.com/..." className="w-full border p-2 rounded text-xs outline-none bg-white" value={step.downloadUrl || ''} onChange={e => setCurrentProtocol({ ...currentProtocol, baseSteps: currentProtocol.baseSteps?.map(s => s.id === step.id ? { ...s, downloadUrl: e.target.value, isDownloadable: !!e.target.value.trim() } : s) })} />
                               </div>
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

        {/* ═══════════════ FORMULARIOS ═══════════════ */}
        {activeTab === 'forms' && (
          <div className="max-w-5xl space-y-8 pb-24">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-3xl font-black text-sepri-dark">Constructor de Formularios</h2>
                <p className="text-sm text-gray-500 mt-1">Crea y edita los campos de cada formulario por protocolo. Los usuarios diligencian estos formularios en línea.</p>
              </div>
              <button
                onClick={() => setEditingFormTemplate({ id: `form-${Date.now()}`, eventId: selectedFormEventId, title: '', description: '', fields: [] })}
                className="bg-sepri-medium text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-sepri-dark transition-all"
              >
                <Plus size={16}/> Nueva Plantilla
              </button>
            </div>

            {/* Selector de protocolo */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><Briefcase size={13}/> Filtrar por Protocolo</label>
              <select
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none bg-gray-50 focus:border-sepri-medium"
                value={selectedFormEventId}
                onChange={e => setSelectedFormEventId(e.target.value)}
              >
                <option value="">Todos los protocolos</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>

            {/* Editor de plantilla */}
            {editingFormTemplate && (
              <div className="bg-white rounded-3xl border-2 border-sepri-medium/30 p-8 shadow-xl space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-sepri-dark">{editingFormTemplate.id?.startsWith('form-') ? 'Nueva Plantilla' : 'Editando Plantilla'}</h3>
                  <button onClick={() => setEditingFormTemplate(null)} className="text-gray-400 hover:text-gray-600"><X size={22}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-gray-400">Protocolo Asociado *</label>
                    <select
                      className="w-full border p-3 rounded-xl text-sm outline-none"
                      value={editingFormTemplate.eventId ?? ''}
                      onChange={e => setEditingFormTemplate({...editingFormTemplate, eventId: e.target.value})}
                    >
                      <option value="">Seleccione un protocolo...</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-gray-400">Título del Formulario *</label>
                    <input type="text" placeholder="Ej: Registro de Asistentes" className="w-full border p-3 rounded-xl text-sm outline-none"
                      value={editingFormTemplate.title ?? ''}
                      onChange={e => setEditingFormTemplate({...editingFormTemplate, title: e.target.value})} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-gray-400">Descripción (opcional)</label>
                    <textarea rows={2} placeholder="Instrucciones para el diligenciante..." className="w-full border p-3 rounded-xl text-sm outline-none resize-none"
                      value={editingFormTemplate.description ?? ''}
                      onChange={e => setEditingFormTemplate({...editingFormTemplate, description: e.target.value})} />
                  </div>
                </div>

                {/* Campos del formulario */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-gray-700 text-sm uppercase tracking-wide">Campos del Formulario</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newField: FormField = { id: `field-${Date.now()}`, label: '', type: 'text', required: false, width: 'full' };
                        setEditingFormTemplate(prev => ({...prev!, fields: [...(prev?.fields ?? []), newField]}));
                      }}
                      className="text-sepri-medium font-bold text-xs flex items-center gap-1 hover:text-sepri-dark transition-colors"
                    >
                      <Plus size={14}/> Agregar Campo
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-xl border divide-y">
                    {/* Campos fijos (informativos) */}
                    <div className="flex items-center gap-4 px-4 py-3 opacity-60">
                      <span className="text-xs font-mono text-gray-400 w-4">•</span>
                      <span className="text-sm font-bold text-gray-500 flex-1">Nombre del Responsable</span>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Fijo · text</span>
                      <span className="text-xs text-blue-400">Siempre obligatorio</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-3 opacity-60">
                      <span className="text-xs font-mono text-gray-400 w-4">•</span>
                      <span className="text-sm font-bold text-gray-500 flex-1">Correo Electrónico</span>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Fijo · email</span>
                      <span className="text-xs text-blue-400">Siempre obligatorio</span>
                    </div>

                    {/* Campos configurables */}
                    {(editingFormTemplate.fields ?? []).map((field, idx) => (
                      <div key={field.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white transition-colors">
                        <GripVertical size={16} className="text-gray-300 mt-3.5 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Etiqueta del campo *"
                            className="col-span-2 border p-2.5 rounded-lg text-sm outline-none"
                            value={field.label}
                            onChange={e => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.map((f, i) => i === idx ? {...f, label: e.target.value} : f)}))}
                          />
                          <select className="border p-2.5 rounded-lg text-sm outline-none bg-white"
                            value={field.type}
                            onChange={e => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.map((f, i) => i === idx ? {...f, type: e.target.value as FormField['type']} : f)}))}>
                            <option value="text">Texto corto</option>
                            <option value="email">Email</option>
                            <option value="phone">Teléfono</option>
                            <option value="number">Número</option>
                            <option value="date">Fecha</option>
                            <option value="textarea">Texto largo</option>
                            <option value="select">Selección</option>
                            <option value="checkbox">Casilla (Sí/No)</option>
                            <option value="signature">✍ Firma Digital</option>
                          </select>
                          <select className="border p-2.5 rounded-lg text-sm outline-none bg-white"
                            value={field.width ?? 'full'}
                            onChange={e => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.map((f, i) => i === idx ? {...f, width: e.target.value as 'full' | 'half'} : f)}))}
                          >
                            <option value="full">Ancho completo</option>
                            <option value="half">Mitad</option>
                          </select>
                          {field.type === 'select' && (
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] text-gray-400 font-bold uppercase">Opciones (una por línea)</label>
                              <textarea rows={3} placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                                className="w-full border p-2 rounded-lg text-xs outline-none resize-none"
                                value={(field.options ?? []).join('\n')}
                                onChange={e => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.map((f, i) => i === idx ? {...f, options: e.target.value.split('\n').filter(Boolean)} : f)}))} />
                            </div>
                          )}
                          <input type="text" placeholder="Placeholder (opcional)"
                            className="col-span-2 border p-2.5 rounded-lg text-sm outline-none"
                            value={field.placeholder ?? ''}
                            onChange={e => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.map((f, i) => i === idx ? {...f, placeholder: e.target.value} : f)}))}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 mt-2">
                          <label className="flex items-center gap-1 cursor-pointer" title="Obligatorio">
                            <input type="checkbox" className="w-4 h-4 accent-sepri-medium"
                              checked={field.required ?? false}
                              onChange={e => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.map((f, i) => i === idx ? {...f, required: e.target.checked} : f)}))} />
                            <span className="text-[10px] text-gray-500 font-bold">Req.</span>
                          </label>
                          <button type="button"
                            onClick={() => setEditingFormTemplate(prev => ({...prev!, fields: prev!.fields!.filter((_, i) => i !== idx)}))}
                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                          ><Trash2 size={15}/></button>
                        </div>
                      </div>
                    ))}

                    {(editingFormTemplate.fields ?? []).length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No hay campos configurados. Haz clic en "+ Agregar Campo" para comenzar.
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor de plantilla de carta */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-gray-700 text-sm uppercase tracking-wide">Plantilla de Carta (PDF Adjunto)</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cuerpo de la Carta</label>
                      <textarea 
                        rows={10} 
                        className="w-full border p-4 rounded-xl text-sm outline-none resize-none font-serif leading-relaxed"
                        placeholder="Respetuosamente me dirijo a ustedes con el fin de solicitarles el favor de darnos autorización para el evento {{evento}}, que se va a realizar en la congregación..."
                        value={editingFormTemplate.letterTemplate ?? ''}
                        onChange={e => setEditingFormTemplate({...editingFormTemplate, letterTemplate: e.target.value})}
                      />
                      <p className="text-xs text-gray-400">
                        * Puedes usar etiquetas dinámicas que se reemplazarán con las respuestas del usuario. Las fechas, firmas y el diseño oficial se añadirán automáticamente.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border h-fit space-y-3">
                      <h5 className="text-[11px] font-black text-sepri-dark uppercase tracking-widest border-b pb-2">Variables Disponibles</h5>
                      <p className="text-[10px] text-gray-500 leading-tight">Haz clic para copiar e inserta en tu texto:</p>
                      
                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                        <button 
                          type="button"
                          onClick={(e) => {
                            navigator.clipboard.writeText('{{Nombre del Responsable}}');
                            const btn = e.currentTarget;
                            const original = btn.innerText;
                            btn.innerText = '¡Copiado!';
                            btn.classList.add('bg-sepri-medium', 'text-white');
                            setTimeout(() => {
                              btn.innerText = original;
                              btn.classList.remove('bg-sepri-medium', 'text-white');
                            }, 1000);
                          }}
                          className="w-full text-left bg-white border border-gray-200 p-2 rounded text-xs font-mono text-sepri-medium hover:bg-sepri-medium hover:text-white transition-colors"
                        >
                          {`{{Nombre del Responsable}}`}
                        </button>
                        {(editingFormTemplate.fields ?? []).map(f => (
                          <button 
                            key={f.id}
                            type="button"
                            onClick={(e) => {
                              navigator.clipboard.writeText(`{{${f.label}}}`);
                              const btn = e.currentTarget;
                              const original = btn.innerText;
                              btn.innerText = '¡Copiado!';
                              btn.classList.add('bg-sepri-medium', 'text-white');
                              setTimeout(() => {
                                btn.innerText = original;
                                btn.classList.remove('bg-sepri-medium', 'text-white');
                              }, 1000);
                            }}
                            className="w-full text-left bg-white border border-gray-200 p-2 rounded text-xs font-mono text-sepri-medium hover:bg-sepri-medium hover:text-white transition-colors truncate"
                            title={`Copiar {{${f.label}}}`}
                          >
                            {`{{${f.label}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingFormTemplate.title?.trim() || !editingFormTemplate.eventId) {
                        alert('El protocolo y el título son obligatorios.'); return;
                      }
                      const updated = forms.some(f => f.id === editingFormTemplate.id)
                        ? forms.map(f => f.id === editingFormTemplate.id ? editingFormTemplate as FormTemplate : f)
                        : [...forms, editingFormTemplate as FormTemplate];
                      setForms(updated);
                      await saveForms(updated);
                      setEditingFormTemplate(null);
                    }}
                    className="bg-sepri-medium text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-sepri-dark transition-all"
                  >
                    Guardar Formulario
                  </button>
                  <button type="button" onClick={() => setEditingFormTemplate(null)} className="px-6 py-3 text-gray-500 font-bold text-xs">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de formularios existentes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms
                .filter(f => !selectedFormEventId || f.eventId === selectedFormEventId)
                .map(form => {
                  const eventName = events.find(e => e.id === form.eventId)?.title ?? form.eventId;
                  return (
                    <div key={form.id} className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-bold text-sepri-medium uppercase tracking-wide mb-1">{eventName}</p>
                          <h4 className="font-black text-sepri-dark">{form.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingFormTemplate(form)} className="text-blue-400 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={15}/>
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('¿Eliminar esta plantilla?')) return;
                              const updated = forms.filter(f => f.id !== form.id);
                              setForms(updated);
                              await saveForms(updated);
                            }}
                            className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {form.fields.length} campo{form.fields.length !== 1 ? 's' : ''}
                        </span>
                        {form.fields.filter(f => f.type === 'signature').length > 0 && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">✍ Firma</span>
                        )}
                        {form.fields.some(f => f.required) && (
                          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Campos obligatorios</span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {forms.filter(f => !selectedFormEventId || f.eventId === selectedFormEventId).length === 0 && (
                <div className="col-span-2 text-center py-16 text-gray-400">
                  <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay formularios creados aún.</p>
                  <p className="text-sm">Haz clic en "Nueva Plantilla" para crear el primero.</p>
                </div>
              )}
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
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-gray-400 flex items-center gap-1.5">
                  <Mail size={13} /> Correo Destino para Formularios de Contacto
                </label>
                <input
                  type="email"
                  placeholder="correo-destino@ejemplo.com"
                  className="w-full border p-3 rounded-lg"
                  value={contactInfo.notificationEmail || ''}
                  onChange={e => setContactInfo({...contactInfo, notificationEmail: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 italic font-medium">
                  Los emails enviados desde los formularios de contacto llegarán a esta dirección. Si está vacío, se usará el correo configurado en el servidor.
                </p>
              </div>
              <input type="text" placeholder="Dirección sede" className="w-full border p-3 rounded-lg" value={contactInfo.address || ''} onChange={e => setContactInfo({...contactInfo, address: e.target.value})} />
            </section>

            {/* Chat de IA */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-sepri-medium"><MessageSquare size={20}/> Chat de IA</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Google Gemini API Key</label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"} 
                      className="w-full border p-3 rounded-xl outline-none pr-12" 
                      placeholder="Ingrese la clave de API..." 
                      value={contactInfo.geminiApiKey || ''} 
                      onChange={e => setContactInfo({...contactInfo, geminiApiKey: e.target.value})} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sepri-medium"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Configuración necesaria para el funcionamiento del Asistente Virtual SEPRI.</p>
                </div>

                {/* Configuración de Resend */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Resend API Key</label>
                  <div className="relative">
                    <input 
                      type={showResendApiKey ? "text" : "password"} 
                      className="w-full border p-3 rounded-xl outline-none pr-12" 
                      placeholder="Ingrese la clave de API de Resend..." 
                      value={contactInfo.resendApiKey || ''} 
                      onChange={e => setContactInfo({...contactInfo, resendApiKey: e.target.value})} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowResendApiKey(!showResendApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sepri-medium"
                    >
                      {showResendApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Clave de API necesaria para poder enviar correos institucionales.</p>
                </div>
                <button 
                  onClick={handleSaveConfig} 
                  className="bg-sepri-medium text-white px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-lg hover:bg-sepri-dark transition-colors"
                >
                  Guardar Clave
                </button>
              </div>
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