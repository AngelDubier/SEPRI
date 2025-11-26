import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import PopupSystem from './components/PopupSystem';
import Home from './pages/Home';
import NewsPage from './pages/NewsPage';
import EventProcessPage from './pages/EventProcessPage';
import AdminLogin from './pages/AdminLogin';
import { FormatsPage, ReportIncidentPage, DirectoryPage, PrivacyPage } from './pages/FooterPages';

// Layout component to conditionally render Header/Footer
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <PopupSystem />
      <main className="flex-grow">
        {children}
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes wrapped in Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/noticias" element={<Layout><NewsPage /></Layout>} />
        <Route path="/event/:id" element={<Layout><EventProcessPage /></Layout>} />
        
        {/* Footer Routes */}
        <Route path="/formatos" element={<Layout><FormatsPage /></Layout>} />
        <Route path="/reportar-incidente" element={<Layout><ReportIncidentPage /></Layout>} />
        <Route path="/directorio-emergencia" element={<Layout><DirectoryPage /></Layout>} />
        <Route path="/politicas-privacidad" element={<Layout><PrivacyPage /></Layout>} />
        
        {/* Admin Route (Independent layout) */}
        <Route path="/admin" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
};

export default App;