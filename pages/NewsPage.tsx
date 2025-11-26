import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Newspaper } from 'lucide-react';
import { getNews } from '../services/dataService';
import { NewsItem } from '../types';

const NewsPage: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  useEffect(() => {
    const loadNews = async () => {
        const news = await getNews();
        setNewsList(news);
    };
    loadNews();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sepri-medium hover:text-sepri-dark font-medium mb-4 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Volver al inicio
        </Link>
        <h1 className="text-4xl font-bold text-sepri-dark">Noticias y Comunicados</h1>
        <p className="text-gray-600 mt-2">Mantente informado con las últimas actualizaciones del Distrito 22.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {newsList.map((news) => (
          <article key={news.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
            <div className="h-48 bg-sepri-bg flex items-center justify-center overflow-hidden">
                {news.imageUrl ? (
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <Newspaper size={40} className="mb-2 opacity-50" />
                        <span className="font-medium text-sm">Sin Imagen</span>
                    </div>
                )}
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  news.category === 'Importante' ? 'bg-red-100 text-red-700' :
                  news.category === 'Evento' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {news.category}
                </span>
                <div className="flex items-center text-gray-400 text-xs">
                  <Clock size={12} className="mr-1" />
                  {news.date}
                </div>
              </div>
              <h2 className="text-xl font-bold text-sepri-dark mb-3 hover:text-sepri-medium transition-colors cursor-pointer">
                {news.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                {news.summary}
              </p>
              <button className="text-sepri-medium font-semibold text-sm hover:underline mt-auto self-start">
                Leer más
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;