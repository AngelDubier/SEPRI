import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import ChatWidget from './components/ChatWidget.tsx';
import PopupSystem from './components/PopupSystem.tsx';
import Home from './pages/Home.tsx';
import NewsPage from './pages/NewsPage.tsx';
import EventProcessPage from './pages/EventProcessPage.tsx';
import AdminLogin from './pages/AdminLogin.tsx';
import { FormatsPage, ReportIncidentPage, DirectoryPage, PrivacyPage } from './pages/FooterPages.tsx';
import { ShaderPlane, EnergyRing } from './components/ui/background-paper-shaders.tsx';

// Layout component to centrally manage global UI elements
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Capa de Fondo Shader Global - Aplicada a toda la aplicación */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.18]">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <ShaderPlane color1="#164E87" color2="#FFB000" />
            <EnergyRing radius={2.8} position={[3, 2, 0]} color="#164E87" />
            <EnergyRing radius={2.0} position={[-4, -3, 0]} color="#FFB000" />
          </Suspense>
        </Canvas>
      </div>

      <Header />
      <PopupSystem />
      <main className="flex-grow relative z-10">
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