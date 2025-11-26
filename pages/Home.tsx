import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ChevronRight } from 'lucide-react';
import { getNews, getEvents } from '../services/dataService';
import { NewsItem, EventType } from '../types';
import * as Icons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.FileText;
  return <IconComponent className={className} />;
};

const Home: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  
  // Carousel State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const fetchedNews = await getNews();
        setNews(fetchedNews.slice(0, 8));
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
    };
    fetchData();
  }, []);

  // Animation Loop for Carousel
  useEffect(() => {
    let animationFrameId: number;

    const scroll = () => {
      if (isHovering && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += 1.5; // Adjust speed here
        
        // Loop back logic (optional, for infinite feeling, we'd need to clone items, 
        // but for now simple reset when end is reached)
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft >= (scrollWidth - clientWidth)) {
           scrollContainerRef.current.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isHovering) {
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovering]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-sepri-medium pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

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

      {/* News Teaser Carousel */}
      <section className="container mx-auto px-4 -mt-20 relative z-20 mb-16">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-t-4 border-sepri-yellow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-sepri-dark flex items-center">
              <Calendar className="mr-2 text-sepri-yellow" /> Novedades y Noticias
            </h2>
            <Link to="/noticias" className="text-sepri-medium hover:text-sepri-dark font-medium flex items-center text-sm">
              Ver todas <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ scrollBehavior: 'auto' }} // Ensure smooth javascript scroll
          >
            {news.map((n) => (
              <div key={n.id} className="min-w-[300px] md:min-w-[400px] bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow border border-gray-100 flex flex-col md:flex-row gap-4 flex-shrink-0">
                <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                   {n.imageUrl ? (
                     <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                       Sin Imagen
                     </div>
                   )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      n.category === 'Importante' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {n.category}
                    </span>
                    <span className="text-xs text-gray-400">{n.date}</span>
                  </div>
                  <h3 className="font-bold text-sepri-dark mb-2 text-sm md:text-base line-clamp-2">{n.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{n.summary}</p>
                </div>
              </div>
            ))}
            {news.length === 0 && <p className="text-gray-500 w-full text-center py-4">No hay noticias recientes.</p>}
          </div>
        </div>
      </section>

      {/* Event Grid */}
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