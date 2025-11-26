import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-sepri-dark text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <ShieldCheck className="w-10 h-10 text-sepri-yellow group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-0 right-0 bg-sepri-green w-3 h-3 rounded-full border-2 border-sepri-dark"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-extrabold tracking-wide">SEPRI</span>
              <span className="text-xs text-gray-300 font-medium">DISTRITO 22 - IPUC</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium hover:text-sepri-yellow transition-colors ${isActive('/') ? 'text-sepri-yellow' : 'text-white'}`}
            >
              INICIO
            </Link>
            <Link 
              to="/noticias" 
              className={`text-sm font-medium hover:text-sepri-yellow transition-colors ${isActive('/noticias') ? 'text-sepri-yellow' : 'text-white'}`}
            >
              NOTICIAS
            </Link>
            <Link 
              to="/admin" 
              className={`text-sm font-medium hover:text-sepri-yellow transition-colors ${isActive('/admin') ? 'text-sepri-yellow' : 'text-white'}`}
            >
              ADMINISTRATIVO
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-700 pt-4 animate-fade-in">
             <Link 
              to="/" 
              className="block text-white hover:text-sepri-yellow font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              INICIO
            </Link>
            <Link 
              to="/noticias" 
              className="block text-white hover:text-sepri-yellow font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              NOTICIAS
            </Link>
            <Link 
              to="/admin" 
              className="block text-white hover:text-sepri-yellow font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              ADMINISTRATIVO
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;