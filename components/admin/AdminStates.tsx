import React from 'react';
import { AlertCircle, RefreshCw, FolderOpen, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const AdminLoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Cargando información del panel...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-16 space-y-4 animate-fade-in text-center">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-sepri-medium/20 border-t-sepri-medium animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-sepri-yellow" />
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-sepri-dark/60">{message}</p>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const AdminErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error al cargar los datos',
  message = 'No fue posible sincronizar la información con el servidor. Revisa tu conexión a internet.',
  onRetry
}) => {
  return (
    <div className="p-8 bg-red-50/70 border border-red-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8 animate-fade-in">
      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <AlertCircle size={28} />
      </div>
      <div className="space-y-1">
        <h3 className="font-black text-sepri-dark text-base">{title}</h3>
        <p className="text-xs text-red-700/80 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sepri-dark text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sepri-medium transition-all shadow-md active:scale-95"
        >
          <RefreshCw size={14} /> Reintentar Conexión
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const AdminEmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 text-center space-y-4 my-6 animate-fade-in">
      <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
        {icon || <FolderOpen size={28} />}
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="font-black text-sepri-dark text-base">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sepri-medium text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sepri-dark transition-all shadow-md active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
