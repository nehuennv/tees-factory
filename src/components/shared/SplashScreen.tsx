import { forwardRef } from 'react';
import LogoTees from '@/assets/logo/LogoTeesFactorynegro.png';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

/**
 * Pantalla de carga ultraligera. Utiliza una animación "Curtain" de subida (y) 
 * 100% acelerada por GPU (sin coste de repaint en cálculos de opacidad masivos).
 */
const SplashScreen = forwardRef<HTMLDivElement, {}>((_props, ref) => {
  return (
    <motion.div
      ref={ref}
      // Transición SaaS Premium: Leve zoom-out in/zoom-in out combinado con Fade. 
      // Totalmente acelerado por GPU, 0 borders oscuros.
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50"
      aria-hidden="true"
    >
      <style>{`
        /* Respiración Suave Infinita super ligera (solo Y axis) */
        @keyframes floatBreathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .animate-float-breathe {
          animation: floatBreathe 3s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {/* 
        El contenido interno hace un leve pop in mientras la cortina principal ya subió,
        dando un feeling "Apple" pero eliminando el segundo eterno del 3D anterior
      */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        className="flex flex-col items-center justify-center"
      >
        {/* Contenedor del Logo */}
        <div className="relative w-28 h-28 md:w-32 md:h-32 mb-10 animate-float-breathe">
          {/* Sombra de suelo genérica super optimizada */}
          <div className="absolute inset-4 bg-zinc-900/5 blur-[15px] rounded-full" />
          <img
            src={LogoTees}
            alt="Tees Factory"
            className="relative w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Loader Minimalista Corporativo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-5 h-5 border-[2px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em]">
            {useAuthStore(state => state.globalLoadingText)}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;