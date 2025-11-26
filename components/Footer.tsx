import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { getQuickLinks, getContactInfo } from '../services/dataService';
import { QuickLink, ContactInfo } from '../types';
import { DEFAULT_CONTACT_INFO } from '../constants';

const Footer: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);

  useEffect(() => {
    setLinks(getQuickLinks().filter(l => l.isEnabled));
    setContactInfo(getContactInfo());
  }, []);

  return (
    <footer className="bg-sepri-dark text-gray-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Column 1: Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">SEPRI</h3>
            <p className="text-sm mb-4 leading-relaxed">
              Seguridad y Prevención del Riesgo del Distrito 22.
              Velamos por el bienestar de nuestra comunidad en cada evento y actividad.
            </p>
            <div className="flex space-x-4">
              {contactInfo.facebookUrl ? (
                <a href={contactInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sepri-yellow transition-colors">
                  <Facebook size={20} />
                </a>
              ) : (
                <span className="text-gray-600 cursor-not-allowed" title="No disponible">
                  <Facebook size={20} />
                </span>
              )}
              
              {contactInfo.instagramUrl ? (
                <a href={contactInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sepri-yellow transition-colors">
                  <Instagram size={20} />
                </a>
              ) : (
                <span className="text-gray-600 cursor-not-allowed" title="No disponible">
                  <Instagram size={20} />
                </span>
              )}

              {contactInfo.youtubeUrl ? (
                <a href={contactInfo.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sepri-yellow transition-colors">
                  <Youtube size={20} />
                </a>
              ) : (
                <span className="text-gray-600 cursor-not-allowed" title="No disponible">
                  <Youtube size={20} />
                </span>
              )}
            </div>
          </div>

          {/* Column 2: Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              {links.map(link => (
                <li key={link.id}>
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-sepri-yellow transition-colors">
                      {link.title}
                    </a>
                  ) : (
                    <Link to={link.url} className="hover:text-sepri-yellow transition-colors">
                      {link.title}
                    </Link>
                  )}
                </li>
              ))}
              {links.length === 0 && <li className="text-gray-500 italic">No hay enlaces configurados.</li>}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-sepri-yellow" />
                <span>{contactInfo.coordinatorPhone} ({contactInfo.coordinatorName ? 'Coordinador' : 'Contacto'})</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-sepri-yellow" />
                <span>{contactInfo.email}</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin size={16} className="text-sepri-yellow" />
                <span>{contactInfo.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} SEPRI Distrito 22 - IPUC. Todos los derechos reservados.</p>
          <p className="mt-2 italic">"La seguridad se trata de hacer lo correcto, incluso si nadie está mirando"</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;