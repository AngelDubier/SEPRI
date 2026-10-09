import React, { useState } from 'react';
import { 
  BarChart2, 
  Newspaper, 
  Briefcase, 
  ClipboardList, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { EventType } from '../../types';

export type AdminTab = 'dashboard' | 'news' | 'protocols' | 'forms' | 'config';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  newsCount?: number;
  protocolsCount?: number;
  formsCount?: number;
  protocols?: EventType[];
  onSelectProtocol?: (protocol: EventType) => void;
  onQuickNewProtocol?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  userName = 'SEPRI Admin',
  userRole = 'Distrito 22',
  newsCount = 0,
  protocolsCount = 0,
  formsCount = 0,
  protocols = [],
  onSelectProtocol,
  onQuickNewProtocol
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sepri_sidebar_collapsed') === 'true';
  });
  const [isProtocolsOpen, setIsProtocolsOpen] = useState<boolean>(true);
  const [hoveredTab, setHoveredTab] = useState<AdminTab | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sepri_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    {
      id: 'dashboard' as AdminTab,
      label: 'Panel Principal',
      icon: BarChart2,
      badge: null,
      hasChildren: false
    },
    {
      id: 'news' as AdminTab,
      label: 'Noticias',
      icon: Newspaper,
      badge: newsCount > 0 ? newsCount : null,
      hasChildren: false
    },
    {
      id: 'protocols' as AdminTab,
      label: 'Protocolos',
      icon: Briefcase,
      badge: protocolsCount > 0 ? protocolsCount : null,
      hasChildren: true
    },
    {
      id: 'forms' as AdminTab,
      label: 'Formularios',
      icon: ClipboardList,
      badge: formsCount > 0 ? formsCount : null,
      hasChildren: false
    },
    {
      id: 'config' as AdminTab,
      label: 'Configuración',
      icon: Settings,
      badge: null,
      hasChildren: false
    }
  ];

  return (
    <aside
      className={`relative bg-sepri-dark text-white flex flex-col flex-shrink-0 h-full border-r border-white/5 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* ── BOTÓN TOGGLE FLOTANTE / PILL ── */}
      <button
        type="button"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        className="absolute -right-3.5 top-7 z-40 w-7 h-7 bg-sepri-medium text-white rounded-full flex items-center justify-center shadow-md hover:bg-sepri-light hover:text-sepri-dark transition-all border border-sepri-dark"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* ── HEADER DEL USUARIO / LOGO ── */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sepri-medium to-sepri-dark border border-white/20 flex items-center justify-center text-sepri-yellow font-black text-sm shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-sepri-green rounded-full border-2 border-sepri-dark" />
        </div>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-white truncate leading-tight tracking-tight">
              {userName}
            </h2>
            <p className="text-[11px] font-bold text-sepri-light truncate uppercase tracking-wider">
              {userRole}
            </p>
          </div>
        )}
      </div>

      {/* ── NAVEGACIÓN PRINCIPAL ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 scrollbar-hide">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div 
              key={item.id} 
              className="relative"
              onMouseEnter={() => isCollapsed && setHoveredTab(item.id)}
              onMouseLeave={() => isCollapsed && setHoveredTab(null)}
            >
              {/* Indicador lateral activo (Pill verde) */}
              {isActive && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-sepri-green shadow-sm" />
              )}

              <button
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (item.hasChildren && !isCollapsed) {
                    setIsProtocolsOpen(prev => !prev);
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Icon size={19} className={isActive ? 'text-sepri-yellow' : 'text-gray-400'} />
                    {/* Badge en modo colapsado */}
                    {isCollapsed && item.badge !== null && (
                      <span className="absolute -top-1.5 -right-2 bg-sepri-yellow text-sepri-dark text-[9px] font-black rounded-full px-1.5 py-0.2 shadow">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.badge !== null && (
                      <span className="bg-sepri-yellow text-sepri-dark text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    {item.hasChildren && (
                      <span className={`text-gray-400 transition-transform duration-200 ${isProtocolsOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* ── SUBMENÚ EN ÁRBOL (TREE LINES) PARA PROTOCOLOS EN MODO EXPANDIDO ── */}
              {!isCollapsed && item.hasChildren && isProtocolsOpen && (
                <div className="ml-5 mt-1 pl-3 border-l-2 border-white/10 space-y-1 animate-fade-in">
                  {protocols.map((proto) => (
                    <button
                      key={proto.id}
                      type="button"
                      onClick={() => {
                        onSelectTab('protocols');
                        if (onSelectProtocol) onSelectProtocol(proto);
                      }}
                      className="group w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 truncate relative"
                    >
                      {/* Curva conector en árbol */}
                      <span className="w-2 h-px bg-white/20 -ml-5 group-hover:bg-sepri-yellow transition-colors" />
                      <span className="truncate">{proto.title}</span>
                    </button>
                  ))}
                  {protocols.length === 0 && (
                    <p className="text-[10px] text-gray-500 py-1 italic">Sin protocolos creados</p>
                  )}
                </div>
              )}

              {/* ── FLYOUT EN MODO COLAPSADO ── */}
              {isCollapsed && hoveredTab === item.id && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-sepri-dark/95 backdrop-blur-md border border-white/15 text-white rounded-2xl py-2 px-3 shadow-2xl z-50 min-w-[160px] animate-fade-in pointer-events-auto">
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10 mb-1">
                    <span className="text-xs font-black">{item.label}</span>
                    {item.badge !== null && (
                      <span className="bg-sepri-yellow text-sepri-dark text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.hasChildren && protocols.length > 0 && (
                    <div className="space-y-1 pt-1 max-h-48 overflow-y-auto scrollbar-hide">
                      {protocols.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectTab('protocols');
                            if (onSelectProtocol) onSelectProtocol(p);
                            setHoveredTab(null);
                          }}
                          className="w-full text-left py-1 px-1.5 rounded text-[11px] text-gray-300 hover:text-white hover:bg-white/10 truncate block"
                        >
                          • {p.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── BOTÓN ACCESO RÁPIDO / CREAR (BOTTOM CARD) ── */}
      <div className="p-3 border-t border-white/10">
        {!isCollapsed ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-3 flex flex-col items-center text-center space-y-2">
            <button
              type="button"
              onClick={onQuickNewProtocol}
              className="w-10 h-10 rounded-full bg-sepri-medium text-white flex items-center justify-center shadow-lg shadow-sepri-medium/30 hover:scale-105 hover:bg-sepri-light hover:text-sepri-dark transition-all"
              title="Crear Nuevo Protocolo"
            >
              <Plus size={20} />
            </button>
            <span className="text-[11px] font-bold text-gray-300">Nuevo Protocolo</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onQuickNewProtocol}
              className="w-10 h-10 rounded-full bg-sepri-medium text-white flex items-center justify-center shadow-lg shadow-sepri-medium/30 hover:scale-105 hover:bg-sepri-light hover:text-sepri-dark transition-all"
              title="Crear Nuevo Protocolo"
            >
              <Plus size={20} />
            </button>
          </div>
        )}

        {/* ── BOTÓN CERRAR SESIÓN ── */}
        <button
          type="button"
          onClick={onLogout}
          className={`w-full mt-3 flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
