import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ChevronRight, ChevronLeft, Newspaper, ShieldCheck, Quote } from 'lucide-react';
import { getNews, getEvents, getContactInfo } from '../services/dataService';
import { NewsItem, EventType, ContactInfo } from '../types';
import { DEFAULT_CONTACT_INFO, NEWS_CAROUSEL_INTERVAL } from '../constants';
import { Button as MovingBorderButton } from '../components/ui/moving-border';
import * as Icons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (Icons as any)[name] || Icons.FileText;
  return <IconComponent className={className} />;
};

const Home: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        try {
          const fetchedNews = await getNews();
          setNews(fetchedNews.slice(0, 8));
          const fetchedEvents = await getEvents();
          setEvents(fetchedEvents);
          const fetchedContact = await getContactInfo();
          if (fetchedContact) setContactInfo(fetchedContact);
        } catch (error) {
          console.error("Error al cargar datos de inicio:", error);
        }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (news.length === 0 || isHovering) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, NEWS_CAROUSEL_INTERVAL);
    return () => clearInterval(interval);
  }, [news.length, isHovering]);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const nextSlide = () => setCurrentNewsIndex((prev) => (prev + 1) % news.length);
  const prevSlide = () => setCurrentNewsIndex((prev) => (prev - 1 + news.length) % news.length);

  return (
    <div className="relative pb-20">
      <div className="relative z-10">
        {/* Hero Section Institucional */}
        <section className="relative min-h-[75vh] flex flex-col justify-center overflow-hidden bg-sepri-dark/80 backdrop-blur-[2px] group">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-sepri-dark/90 via-sepri-medium/70 to-sepri-dark/90 opacity-90"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10 py-20 flex justify-center text-center">
            <div className="max-w-4xl">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                <ShieldCheck size={16} className="text-sepri-yellow mr-2" />
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Distrito 22 - IPUC</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
                <span 
                  className="block text-white/70 font-light text-2xl md:text-4xl mb-4 italic"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3), 2px 2px 4px rgba(0,0,0,0.2)' }}
                >
                  Seguridad y Prevención del Riesgo
                </span>
                <span 
                  className="text-sepri-yellow"
                  style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2), 3px 3px 6px rgba(0,0,0,0.3), 4px 4px 10px rgba(0,0,0,0.2)' }}
                >
                  SEPRI
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                Herramienta integral para la gestión de protocolos, autorización de eventos y prevención institucional.
              </p>

              <div className="flex flex-wrap gap-6 justify-center">
                <MovingBorderButton
                  as={Link}
                  to="/noticias"
                  borderRadius="1rem"
                  className="bg-white/10 text-white hover:bg-sepri-yellow hover:text-sepri-dark px-8 py-4 font-black text-xs uppercase tracking-widest border-white/20 transition-all duration-300"
                  containerClassName="h-14 w-56 shadow-lg"
                >
                  Ver Novedades
                </MovingBorderButton>
                
                <MovingBorderButton
                  as={Link}
                  to="/directorio-emergencia"
                  borderRadius="1rem"
                  className="bg-white/10 text-white hover:bg-sepri-yellow hover:text-sepri-dark px-8 py-4 font-black text-xs uppercase tracking-widest border-white/20 transition-all duration-300"
                  containerClassName="h-14 w-56 shadow-lg"
                >
                  Directorio Emergencia <ChevronRight size={16} className="ml-2" />
                </MovingBorderButton>
              </div>
            </div>
          </div>
        </section>

        {/* Noticias Carousel */}
        <section className="container mx-auto px-4 -mt-16 relative z-30 mb-16">
          <div 
            className="bg-white/90 rounded-3xl shadow-2xl p-6 md:p-8 border-t-4 border-sepri-yellow overflow-hidden backdrop-blur-md"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-sepri-dark flex items-center uppercase tracking-tight">
                <Calendar className="mr-3 text-sepri-yellow" size={28} /> Últimas Novedades
              </h2>
              <Link to="/noticias" className="text-sepri-medium hover:text-sepri-dark font-black flex items-center text-xs uppercase tracking-widest">
                Ver todas <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>
            
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentNewsIndex * 100}%)` }}
              >
                {news.map((n) => (
                  <div key={n.id} className="min-w-full flex-shrink-0 px-1">
                    <div className="bg-gray-50/30 rounded-2xl p-4 md:p-6 border border-gray-100 flex flex-col md:flex-row gap-6 items-center min-h-[200px]">
                      <div className="w-full md:w-56 h-44 bg-gray-200/50 rounded-2xl overflow-hidden flex-shrink-0">
                        {n.imageUrl ? <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100/50"><Icons.Newspaper size={32} /></div>}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-lg ${n.category === 'Importante' ? 'bg-red-600 text-white' : 'bg-sepri-medium text-white'}`}>{n.category}</span>
                        <h3 className="font-black text-sepri-dark mt-2 mb-2 text-xl leading-tight">{n.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{truncateText(n.summary, 150)}</p>
                        <Link to="/noticias" className="inline-flex items-center text-sepri-medium font-black text-[10px] uppercase tracking-[0.2em] mt-4">Leer más <ArrowRight size={14} className="ml-2" /></Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Protocol Grid */}
        <section className="container mx-auto px-4 mb-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-sepri-dark mb-4 uppercase tracking-tighter">Gestión de Protocolos</h2>
            <div className="w-20 h-1.5 bg-sepri-yellow mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {events.map((event) => (
              <div key={event.id} className="bg-white/80 rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 hover:shadow-2xl">
                <div className="mb-8">
                   {event.imageUrl ? (
                      <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-sepri-bg shadow-lg"><img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" /></div>
                   ) : (
                      <div className="bg-sepri-bg p-6 rounded-3xl group-hover:bg-sepri-yellow transition-colors"><DynamicIcon name={event.iconName} className="w-12 h-12 text-sepri-medium group-hover:text-sepri-dark" /></div>
                   )}
                </div>
                <h3 className="text-2xl font-black text-sepri-dark mb-4">{event.title}</h3>
                <p className="text-gray-500 text-sm mb-10 flex-grow font-medium">{event.description}</p>
                <MovingBorderButton as={Link} to={`/event/${event.id}`} borderRadius="1rem" className="bg-sepri-dark hover:bg-sepri-medium text-white font-black text-[10px] uppercase tracking-[0.2em]" containerClassName="w-full h-14 shadow-lg">Iniciar Protocolo <ChevronRight size={16} className="ml-2" /></MovingBorderButton>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        {contactInfo.teamMembers && contactInfo.teamMembers.length > 0 && (
          <section className="bg-white/70 backdrop-blur-md py-24 relative z-10">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-black text-sepri-dark mb-16 uppercase tracking-tighter">Equipo Directivo</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                {contactInfo.teamMembers.map((member: any) => (
                  <div key={member.id} className="flex flex-col items-center group">
                     <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white mb-8 transition-transform group-hover:scale-105 bg-gray-100/50">
                        {member.imageUrl ? (
                          <img key={`${member.id}-${member.updatedAt || '0'}`} src={member.imageUrl + (member.imageUrl.startsWith('data:') ? '' : `?v=${member.updatedAt || ''}`)} className="w-full h-full object-cover" alt={member.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><Icons.User size={80} /></div>
                        )}
                     </div>
                     <h3 className="font-black text-sepri-dark text-xl uppercase tracking-tight">{member.name}</h3>
                     <p className="text-sepri-medium font-bold text-[10px] uppercase tracking-[0.2em] mt-2">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quote Banner */}
        <section className="bg-sepri-dark/95 py-24 text-center relative overflow-hidden z-10">
          <div className="container mx-auto px-4 relative z-10">
            <Quote className="w-16 h-16 text-sepri-yellow mx-auto mb-10 opacity-40" />
            <h2 className="text-3xl md:text-5xl font-black text-white max-w-5xl mx-auto leading-tight italic tracking-tighter">
              "La seguridad es una cultura de cuidado mutuo, basada en la prevención y el cumplimiento del deber."
            </h2>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;