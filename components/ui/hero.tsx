"use client"
import React, { useEffect, useRef, useState } from "react"
import * as Shaders from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { ShieldCheck, AlertTriangle, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

export default function ShaderHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [speed, setSpeed] = useState(0.2)

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true)
    const handleMouseLeave = () => setIsActive(false)

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  // Robust rendering for components that might fail to load from external ESM
  const SafeMeshGradient = (props: any) => {
    try {
      const MeshGradient = Shaders.MeshGradient;
      return MeshGradient ? <MeshGradient {...props} /> : <div className="absolute inset-0 bg-sepri-dark" />;
    } catch (e) {
      return <div className="absolute inset-0 bg-sepri-dark" />;
    }
  };

  const SafeDotOrbit = (props: any) => {
    try {
      const DotOrbit = Shaders.DotOrbit;
      return DotOrbit ? <DotOrbit {...props} /> : null;
    } catch (e) {
      return null;
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-[85vh] md:min-h-screen bg-sepri-dark overflow-hidden flex flex-col">
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.05
                      0 1 0 0 0.16
                      0 0 1 0 0.28
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
        </defs>
      </svg>

      {/* Mesh Gradients - Adapted to SEPRI Institutional Palette */}
      <SafeMeshGradient
        className="absolute inset-0 w-full h-full opacity-80"
        colors={["#0E2A47", "#164E87", "#0B1D33", "#FFB000"]}
        speed={speed}
        backgroundColor="#0E2A47"
      />

      {/* Dot Orbit Overlay - Adapted Colors */}
      <div className="absolute inset-0 opacity-30">
        <SafeDotOrbit
          className="w-full h-full"
          dotColor="#FFB000"
          orbitColor="#164E87"
          speed={speed * 2}
          intensity={1.5}
        />
      </div>
      
      <main className="relative z-20 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-4xl">
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-md mb-8 border border-white/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AlertTriangle size={14} className="text-sepri-yellow mr-2" />
            <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
              Protocolos de Seguridad Actualizados 2025
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.span
              className="block font-light text-white/70 text-3xl md:text-4xl lg:text-5xl mb-4 tracking-normal italic"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #FFB000 50%, #6BA6D8 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              Gestión Inteligente de
            </motion.span>
            <span className="block drop-shadow-2xl">SEGURIDAD Y</span>
            <span className="block text-sepri-yellow drop-shadow-lg">PREVENCIÓN</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl font-medium text-white/60 mb-10 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Protegiendo a nuestra comunidad con protocolos dinámicos, asistencia inmediata y 
            herramientas digitales para la prevención del riesgo en el Distrito 22 - IPUC.
          </motion.p>

          <motion.div
            className="flex items-center gap-6 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link to="/noticias">
              <motion.button
                className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-widest transition-all hover:bg-white/20 backdrop-blur-sm shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver Novedades
              </motion.button>
            </Link>
            
            <Link to="/directorio-emergencia">
              <motion.button
                className="px-8 py-4 rounded-2xl bg-sepri-yellow text-sepri-dark font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Directorio de Emergencia
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Decorative pulse effects - Adapted to sepri-yellow and white */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-32 h-32 bg-sepri-yellow/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: `${3 / speed}s` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: `${2 / speed}s`, animationDelay: "1s" }}
        />
      </div>
    </div>
  )
}