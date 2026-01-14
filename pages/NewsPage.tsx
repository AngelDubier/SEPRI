
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Newspaper, X, Calendar } from 'lucide-react';
import { getNews } from '../services/dataService';
import { NewsItem } from '../types';

const NewsPage: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const loadNews = async () => {
        const news = await getNews();
        setNewsList(news);
    };
    loadNews();
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, pIdx) => (
      <p key={pIdx} className="mb-4 last:mb-0">
        {paragraph.split('\n').map((line, lIdx, lines) => (
          <React.Fragment key={lIdx}>
            {line}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="mb-10">
        <Link to="/" className="inline-flex items-center text-sepri-medium hover:text-sepri-dark font-bold mb-4 transition-colors group">
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al inicio
        </Link>
        <h1 className="text-4xl font-extrabold text-sepri-dark tracking-tight">Noticias y Comunicados</h1>
        <p className="text-gray-600 mt-2 text-lg">Actualizaciones, novedades e información importante del Distrito 22.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {newsList.map((news) => (
          <article key={news.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col group">
            <div className="h-56 bg-sepri-bg flex items-center justify-center overflow-hidden relative">
                {news.imageUrl ? (
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <Newspaper size={50} className="mb-2 opacity-30" />
                        <span className="font-bold text-xs uppercase tracking-widest">Sin Imagen</span>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    news.category === 'Importante' ? 'bg-red-600 text-white' :
                    news.category === 'Evento' ? 'bg-sepri-medium text-white' :
                    'bg-sepri-yellow text-sepri-dark'
                  }`}>
                    {news.category}
                  </span>
                </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center text-gray-400 text-xs font-bold mb-4">
                <Clock size={14} className="mr-1.5" />
                {news.date.toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-sepri-dark mb-4 group-hover:text-sepri-medium transition-colors line-clamp-2 leading-tight">
                {news.title}
              </h2>
              <div className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
                {truncateText(news.summary.split('\n')[0], 120)}
              </div>
              <button 
                onClick={() => setSelectedNews(news)}
                className="inline-flex items-center text-sepri-medium font-black text-xs uppercase tracking-widest hover:text-sepri-dark mt-auto self-start group/btn transition-colors"
              >
                Seguir leyendo <ArrowLeft className="ml-2 rotate-180 group-hover/btn:translate-x-1 transition-transform" size={14} />
              </button>
            </div>
          </article>
        ))}
        {newsList.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500 italic bg-white rounded-2xl border border-dashed">No hay comunicados publicados recientemente.</div>
        )}
      </div>

      {/* Modal de Detalle de Noticia */}
      {selectedNews && (
        <div className="fixed inset-0 bg-sepri-dark/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setSelectedNews(null)}>
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 bg-sepri-dark flex-shrink-0">
              {selectedNews.imageUrl ? (
                <img src={selectedNews.imageUrl} className="w-full h-full object-cover opacity-90" alt={selectedNews.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-sepri-medium text-white/20">
                  <Newspaper size={100} />
                </div>
              )}
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 bg-white/10 text-white p-2.5 rounded-full hover:bg-white/30 transition-all border border-white/20 shadow-xl backdrop-blur-md"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-sepri-dark to-transparent">
                <span className="text-sepri-yellow text-[10px] font-black uppercase tracking-[0.2em]">{selectedNews.category}</span>
                <h2 className="text-white text-3xl font-black mt-2 leading-tight drop-shadow-md">{selectedNews.title}</h2>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
              <div className="flex items-center text-gray-400 text-xs font-black uppercase tracking-widest mb-8 pb-4 border-b border-gray-100">
                <Calendar size={14} className="mr-2 text-sepri-yellow" /> {selectedNews.date}
              </div>
              <div className="text-gray-700 leading-relaxed text-base">
                {renderFormattedText(selectedNews.summary)}
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedNews(null)}
                className="bg-sepri-dark text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sepri-medium transition-all shadow-lg active:scale-95"
              >
                Cerrar lectura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
