
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { getNews, getEvents, getContactInfo } from '../services/dataService';
import { NewsItem, EventType, ContactInfo } from '../types';
import { DEFAULT_CONTACT_INFO, NEWS_CAROUSEL_INTERVAL } from '../constants';
import * as Icons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const fetchedNews = await getNews();
        setNews(fetchedNews.slice(0, 8));
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
        const fetchedContact = await getContactInfo();
        if (fetchedContact) setContactInfo(fetchedContact);
    };
    fetchData();
  }, []);

  // Auto-rotation Logic
  useEffect(() => {
    if (news.length === 0 || isHovering) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, NEWS_CAROUSEL_INTERVAL);

    return () => clearInterval(interval);
  }, [news.length, isHovering]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const nextSlide = () => setCurrentNewsIndex((prev) => (prev + 1) % news.length);
  const prevSlide = () => setCurrentNewsIndex((prev) => (prev - 1 + news.length) % news.length);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-sepri-medium">
        {/* Dynamic Hero Image */}
        {contactInfo.heroImageUrl ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={contactInfo.heroImageUrl} 
              className="w-full h-full object-cover opacity-30" 
              alt="Background Branding" 
            />
            <div className="absolute inset-0 bg-sepri-medium/40"></div>
          </div>
        ) : (
          <div className="absolute inset-0 opacity-10 z-0">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>
        )}

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-block mb-4">
             <Icons.ShieldCheck className="w-24 h-24 text-sepri-yellow mx-auto mb-4 drop-shadow-md" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">
            SEPRI
          </h1>
          <div className="inline-block bg-white px-6 py-2 rounded-full mb-4 shadow-md">
            <span className="text-sepri-medium font-bold tracking-widest uppercase text-sm md:text-base">
              Seguridad y Prevención del Riesgo
            </span>
          </div>
          <div className="mt-2">
            <span className="bg-sepri-yellow text-sepri-dark font-extrabold px-4 py-1 rounded-lg text-sm uppercase tracking-wider">
              Distrito 22
            </span>
          </div>
        </div>
      </section>

      {/* News Teaser Carousel (Auto-rotating discrete slider) */}
      <section className="container mx-auto px-4 -mt-20 relative z-20 mb-16">
        <div 
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-t-4 border-sepri-yellow overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-sepri-dark flex items-center">
              <Calendar className="mr-2 text-sepri-yellow" /> Novedades y Noticias
            </h2>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex gap-2 mr-4">
                 <button onClick={prevSlide} className="p-1 rounded-full hover:bg-gray-100 transition-colors text-sepri-medium">
                   <ChevronLeft size={24} />
                 </button>
                 <button onClick={nextSlide} className="p-1 rounded-full hover:bg-gray-100 transition-colors text-sepri-medium">
                   <ChevronRight size={24} />
                 </button>
               </div>
               <Link to="/noticias" className="text-sepri-medium hover:text-sepri-dark font-medium flex items-center text-sm">
                 Ver todas <ArrowRight size={16} className="ml-1" />
               </Link>
            </div>
          </div>
          
          <div className="relative">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentNewsIndex * 100}%)` }}
            >
              {news.map((n) => (
                <div key={n.id} className="min-w-full flex-shrink-0">
                  <div className="bg-gray-50 rounded-xl p-5 md:p-8 border border-gray-100 flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="w-full md:w-48 h-48 md:h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {n.imageUrl ? (
                        <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                          Sin Imagen
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          n.category === 'Importante' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.category}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{n.date}</span>
                      </div>
                      <h3 className="font-bold text-sepri-dark mb-3 text-lg md:text-xl line-clamp-1">{n.title}</h3>
                      <div className="text-sm md:text-base text-gray-600">
                        <p>{truncateText(n.summary.split('\n')[0], 140)}</p>
                      </div>
                      <Link to="/noticias" className="inline-flex items-center mt-4 text-sepri-medium font-bold text-sm hover:underline">
                        Ver más detalles <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <div className="min-w-full text-gray-500 text-center py-12">No hay noticias recientes.</div>
              )}
            </div>
            
            {/* Dots indicator */}
            {news.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {news.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentNewsIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentNewsIndex === idx ? 'w-8 bg-sepri-yellow' : 'w-2 bg-gray-200'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Grid remains same */}
      <section className="container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-sepri-dark mb-4">Gestión de Protocolos</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selecciona el tipo de evento que vas a realizar para iniciar el proceso de autorización y conocer los requisitos de seguridad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center group overflow-hidden relative">
              
              {/* Image or Icon */}
              <div className="mb-6 relative z-10">
                 {event.imageUrl ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-sepri-bg shadow-md">
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                 ) : (
                    <div className="bg-sepri-bg p-4 rounded-full group-hover:bg-sepri-yellow transition-colors duration-300">
                        <DynamicIcon name={event.iconName} className="w-10 h-10 text-sepri-medium group-hover:text-sepri-dark" />
                    </div>
                 )}
              </div>

              <h3 className="text-xl font-bold text-sepri-dark mb-3 relative z-10">{event.title}</h3>
              <p className="text-gray-500 text-sm mb-8 flex-grow relative z-10">
                {event.description}
              </p>
              <Link 
                to={`/event/${event.id}`} 
                className="w-full bg-sepri-medium hover:bg-sepri-dark text-white font-bold py-3 px-6 rounded-xl transition-colors flex justify-center items-center relative z-10"
              >
                Iniciar Proceso <ChevronRight size={18} className="ml-2" />
              </Link>
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
              {contactInfo.teamMembers.map((member) => (
                <div key={member.id} className="flex flex-col items-center group">
                   <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white mb-8 group-hover:scale-105 transition-transform duration-500 relative bg-gray-100/50">
                      {member.imageUrl ? (
                        <img 
                          key={`${member.id}-${member.updatedAt || '0'}`}
                          src={member.imageUrl + (member.imageUrl.startsWith('data:') ? '' : `?v=${member.updatedAt || ''}`)} 
                          className="w-full h-full object-cover" 
                          alt={member.name} 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Icons.User size={80} />
                        </div>
                      )}
                   </div>
                   <h3 className="font-black text-sepri-dark text-xl uppercase tracking-tight leading-tight">{member.name}</h3>
                   <p className="text-sepri-medium font-bold text-[10px] uppercase tracking-[0.2em] mt-2">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Moto Banner */}
      <section className="bg-sepri-dark py-16 text-center">
        <div className="container mx-auto px-4">
          <Icons.Quote className="w-12 h-12 text-sepri-yellow mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl md:text-4xl font-bold text-white max-w-4xl mx-auto leading-tight">
            "La seguridad se trata de hacer lo correcto, incluso si nadie está mirando"
          </h2>
        </div>
      </section>
    </div>
  );
};

export default Home;