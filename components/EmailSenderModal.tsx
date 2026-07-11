import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, AlertCircle, Mail, User, Phone, Building2, FileText, MessageSquare } from 'lucide-react';
import { EmailSendPayload, EmailSendStatus } from '../types';

// --- Tokens de diseño ---
const INPUT_BASE =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-sepri-medium focus:ring-2 focus:ring-sepri-medium/20';

const LABEL_BASE = 'block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5';

// --- Props ---
export interface EmailSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    eventTitle: string;
    formatName?: string;
    formResponses?: Record<string, string>;
  };
}

// --- Valores iniciales del formulario ---
const INITIAL_FORM: EmailSendPayload = {
  senderName: '',
  senderEmail: '',
  congregation: '',
  phone: '',
  subject: '',
  additionalMessage: '',
  context: '',
};

// --- Componente de campo de formulario (Regla 20/1) ---
const FormField: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ id, label, required, children }) => (
  <div className="space-y-1">
    <label htmlFor={id} className={LABEL_BASE}>
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// --- Pantalla de éxito ---
const SuccessScreen: React.FC<{ senderEmail: string; onClose: () => void }> = ({ senderEmail, onClose }) => (
  <motion.div
    key="success"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center text-center py-8 px-4"
  >
    <div className="w-20 h-20 bg-sepri-green/10 rounded-full flex items-center justify-center mb-6">
      <CheckCircle2 size={44} className="text-sepri-green" />
    </div>
    <h3 className="text-2xl font-black text-sepri-dark mb-2">¡Enviado con éxito!</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-1">
      Tu solicitud fue enviada a la coordinación SEPRI D22.
    </p>
    <p className="text-sepri-medium font-bold text-sm mb-8">
      Recibirás una copia en <span className="underline">{senderEmail}</span>
    </p>
    <button
      onClick={onClose}
      className="bg-sepri-medium text-white px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-sepri-dark transition-all shadow-lg"
    >
      Cerrar
    </button>
  </motion.div>
);

// --- Pantalla de error ---
const ErrorScreen: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div
    key="error"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center text-center py-8 px-4"
  >
    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
      <AlertCircle size={44} className="text-red-500" />
    </div>
    <h3 className="text-2xl font-black text-gray-800 mb-2">Error al enviar</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">{message}</p>
    <button
      onClick={onRetry}
      className="bg-sepri-dark text-white px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-sepri-medium transition-all shadow-lg"
    >
      Intentar de Nuevo
    </button>
  </motion.div>
);

// --- Componente principal ---
const EmailSenderModal: React.FC<EmailSenderModalProps> = ({ isOpen, onClose, context }) => {
  const [formData, setFormData] = useState<EmailSendPayload>(INITIAL_FORM);
  const [status, setStatus] = useState<EmailSendStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Rellenar asunto y contexto automáticamente al abrir
  useEffect(() => {
    if (isOpen) {
      const autoSubject = context.formatName
        ? `Solicitud de formato: "${context.formatName}" — ${context.eventTitle}`
        : `Consulta sobre protocolo: ${context.eventTitle}`;

      const autoContext = [
        `Evento / Protocolo: ${context.eventTitle}`,
        context.formatName ? `Formato solicitado: ${context.formatName}` : null,
        context.formResponses && Object.keys(context.formResponses).length > 0
          ? `Respuestas del formulario:\n${Object.entries(context.formResponses)
              .map(([k, v]) => `  - ${k}: ${v}`)
              .join('\n')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      setFormData((prev) => ({ ...prev, subject: autoSubject, context: autoContext }));
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, context]);

  const updateField = <K extends keyof EmailSendPayload>(field: K, value: EmailSendPayload[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación client-side — Early Return pattern
    if (!formData.senderName.trim()) return;
    if (!formData.senderEmail.trim()) return;
    if (!formData.additionalMessage.trim()) return;

    setStatus('loading');

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? 'Error desconocido al enviar el correo.');
      }

      setStatus('success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-sepri-dark/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sepri-dark to-sepri-medium px-8 py-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={18} className="text-sepri-yellow" />
                  <span className="text-xs font-black uppercase tracking-widest text-blue-200">Enviar por Correo</span>
                </div>
                <h2 className="text-xl font-black text-white leading-tight">{context.eventTitle}</h2>
                {context.formatName && (
                  <p className="text-xs text-blue-200 mt-0.5 truncate max-w-xs">
                    Formato: {context.formatName}
                  </p>
                )}
              </div>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="text-blue-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  aria-label="Cerrar modal"
                >
                  <X size={22} />
                </button>
              )}
            </div>

            {/* Body — estados defensivos */}
            <div className="max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {status === 'success' && (
                  <SuccessScreen key="success" senderEmail={formData.senderEmail} onClose={onClose} />
                )}

                {status === 'error' && (
                  <ErrorScreen key="error" message={errorMessage} onRetry={handleRetry} />
                )}

                {(status === 'idle' || status === 'loading') && (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="p-8 space-y-5"
                  >
                    <p className="text-xs text-gray-500 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <span className="font-bold text-sepri-medium">¿Cómo funciona?</span> Completa tus datos y la IA generará un correo profesional
                      que llegará a la coordinación SEPRI. <strong>Recibirás una copia</strong> en el correo que registres.
                    </p>

                    {/* Nombre */}
                    <FormField id="sender-name" label="Nombre Completo" required>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="sender-name"
                          type="text"
                          className={`${INPUT_BASE} pl-10`}
                          placeholder="Tu nombre completo"
                          value={formData.senderName}
                          onChange={(e) => updateField('senderName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    {/* Email */}
                    <FormField id="sender-email" label="Tu Correo Electrónico" required>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="sender-email"
                          type="email"
                          className={`${INPUT_BASE} pl-10`}
                          placeholder="tucorreo@ejemplo.com"
                          value={formData.senderEmail}
                          onChange={(e) => updateField('senderEmail', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    {/* Congregación + Teléfono */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="congregation" label="Congregación">
                        <div className="relative">
                          <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            id="congregation"
                            type="text"
                            className={`${INPUT_BASE} pl-10`}
                            placeholder="Nombre de tu iglesia"
                            value={formData.congregation}
                            onChange={(e) => updateField('congregation', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </FormField>
                      <FormField id="phone" label="Teléfono">
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            id="phone"
                            type="tel"
                            className={`${INPUT_BASE} pl-10`}
                            placeholder="300 000 0000"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </FormField>
                    </div>

                    {/* Asunto (pre-llenado, editable) */}
                    <FormField id="subject" label="Asunto" required>
                      <div className="relative">
                        <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="subject"
                          type="text"
                          className={`${INPUT_BASE} pl-10`}
                          value={formData.subject}
                          onChange={(e) => updateField('subject', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    {/* Mensaje adicional */}
                    <FormField id="additional-message" label="Mensaje / Descripción adicional" required>
                      <div className="relative">
                        <MessageSquare size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                        <textarea
                          id="additional-message"
                          className={`${INPUT_BASE} pl-10 min-h-[110px] resize-none`}
                          placeholder="Describe tu solicitud, dudas o información adicional que quieras compartir con la coordinación..."
                          value={formData.additionalMessage}
                          onChange={(e) => updateField('additionalMessage', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-sepri-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-sepri-medium transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          La IA está generando tu correo...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Enviar a Coordinación SEPRI
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailSenderModal;
