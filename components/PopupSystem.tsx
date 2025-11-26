import React, { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { getPopups } from '../services/dataService';
import { PopupConfig } from '../types';

const PopupSystem: React.FC = () => {
  const [activePopups, setActivePopups] = useState<PopupConfig[]>([]);

  useEffect(() => {
    const loadPopups = async () => {
      // Check for enabled popups
      const allPopups = await getPopups();
      const enabled = allPopups.filter(p => p.isEnabled);
      
      // Filter out ones user has dismissed in this session (optional, using session storage)
      const sessionDismissed = JSON.parse(sessionStorage.getItem('sepri_dismissed_popups') || '[]');
      const toShow = enabled.filter(p => !sessionDismissed.includes(p.id));

      setActivePopups(toShow);
    };
    loadPopups();
  }, []);

  const dismissPopup = (id: string) => {
    setActivePopups(prev => prev.filter(p => p.id !== id));
    
    // Save dismissal
    const sessionDismissed = JSON.parse(sessionStorage.getItem('sepri_dismissed_popups') || '[]');
    sessionDismissed.push(id);
    sessionStorage.setItem('sepri_dismissed_popups', JSON.stringify(sessionDismissed));
  };

  if (activePopups.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col gap-4 w-full max-w-sm">
      {activePopups.map(popup => (
        <div 
          key={popup.id} 
          className={`relative p-4 rounded-xl shadow-2xl border-l-4 animate-fade-in-left bg-white
            ${popup.type === 'alert' ? 'border-red-500' : popup.type === 'warning' ? 'border-sepri-yellow' : 'border-sepri-medium'}
          `}
        >
          <button 
            onClick={() => dismissPopup(popup.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {popup.type === 'alert' && <AlertCircle className="text-red-500" size={24} />}
              {popup.type === 'warning' && <AlertTriangle className="text-sepri-yellow" size={24} />}
              {popup.type === 'info' && <Info className="text-sepri-medium" size={24} />}
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{popup.title}</h4>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                {popup.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopupSystem;