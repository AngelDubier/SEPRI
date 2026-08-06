import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Loader2, CheckCircle2, AlertCircle,
  Mail, PenLine, ImagePlus, XCircle, FileText,
} from 'lucide-react';
import { FormTemplate, FormField, EmailSendStatus } from '../types';

// ─── Tokens de diseño ────────────────────────────────────────────────────────
const INPUT_BASE =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-sepri-medium focus:ring-2 focus:ring-sepri-medium/20 disabled:opacity-60 disabled:cursor-not-allowed';
const LABEL_BASE = 'block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTemplate: FormTemplate;
  eventTitle: string;
}

// ─── No hay campos de correo fijos, todo es dinámico ─────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInputType(fieldType: FormField['type']): string {
  const map: Partial<Record<FormField['type'], string>> = {
    email: 'email', phone: 'tel', date: 'date', number: 'number',
  };
  return map[fieldType] ?? 'text';
}

function buildEmailBody(
  formTemplate: FormTemplate,
  eventTitle: string,
  responses: Record<string, string>,
  signatureBase64: string | null,
): string {
  let text = formTemplate.letterTemplate ?? '';

  // Reemplazar variables de cada campo del formulario por su respuesta
  formTemplate.fields.forEach(f => {
    const safeLabel = f.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`{{\\s*${safeLabel}\\s*}}`, 'gi'), responses[f.id] || '__________________');
  });

  const bodyHtml = text
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p style="margin: 0 0 10px 0;">${line}</p>`)
    .join('\n');

  // Buscar heurísticamente congregación y correo para el encabezado/pie de página
  const congregationField = formTemplate.fields.find(f => f.label.toLowerCase().includes('congregaci'));
  const congregationName = congregationField ? (responses[congregationField.id] || 'NOMBRE DE LA CONGREGACIÓN') : 'NOMBRE DE LA CONGREGACIÓN';

  const emailField = formTemplate.fields.find(f => f.type === 'email');
  const senderEmail = emailField ? responses[emailField.id] : '';

  // La firma ya no impone el nombre ni "Pastor / Directivo" porque el admin lo pone en la plantilla.
  // Solo se inyecta el "Responder a" y el aviso de que hay firma manuscrita.
  const signatureHtml = signatureBase64
    ? `<div style="margin-top: 40px;">
         ${senderEmail ? `<p style="margin: 5px 0 0 0; font-size: 13px; color: #164E87;">Responder a: <strong>${senderEmail}</strong></p>` : ''}
         <p style="margin: 5px 0 0 0; font-size: 11px; color: #888; font-style: italic;">(La firma manuscrita se encuentra adjunta a este correo)</p>
       </div>`
    : (senderEmail ? `<div style="margin-top: 40px;">
         <p style="margin: 5px 0 0 0; font-size: 13px; color: #164E87;">Responder a: <strong>${senderEmail}</strong></p>
       </div>` : '');

  return `
    <div style="font-family: Arial, sans-serif; color: #000; line-height: 1.5; max-width: 700px; margin: 0 auto; background-color: #fff; padding: 20px;">
      
      <!-- Encabezado con Logo y Título -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td width="80" valign="top">
            <div style="width: 70px; height: 70px; background-color: #164E87; border-radius: 50%; color: white; display: table-cell; vertical-align: middle; text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 1px;">
              IPUC
            </div>
          </td>
          <td valign="middle" style="padding-left: 15px;">
            <div style="font-weight: bold; font-size: 18px; margin-top: 5px; color: #164E87;">${congregationName}</div>
            <p style="margin: 0; color: #00A0DF; font-size: 16px; margin-top: 3px;">Distrito 22</p>
          </td>
        </tr>
      </table>

      <!-- Cuerpo de la carta (100% editable por el administrador) -->
      <div style="font-size: 14px; line-height: 1.6; color: #000; text-align: justify;">
        ${bodyHtml || '<p style="color: #999;"><em>(No se configuró una plantilla para este formulario en el panel de administrador).</em></p>'}

        <!-- Extras de Firma -->
        ${signatureHtml}
      </div>
    </div>`;
}


// ─── Sub-componentes ──────────────────────────────────────────────────────────
const FieldWrapper: React.FC<{ field: FormField; children: React.ReactNode }> = ({ field, children }) => (
  <div className={field.width === 'half' ? '' : 'col-span-2'}>
    <label htmlFor={`dyn-${field.id}`} className={LABEL_BASE}>
      {field.label}
      {field.required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const SuccessScreen: React.FC<{ email: string; onClose: () => void }> = ({ email, onClose }) => (
  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center text-center py-10 px-6">
    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
      <CheckCircle2 size={44} className="text-sepri-green" />
    </div>
    <h3 className="text-2xl font-black text-sepri-dark mb-2">¡Formulario enviado!</h3>
    <p className="text-gray-500 text-sm mb-8">El formulario llegó a la coordinación SEPRI D22.</p>
    <button onClick={onClose}
      className="bg-sepri-medium text-white px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-sepri-dark transition-all shadow-lg">
      Cerrar
    </button>
  </motion.div>
);

const ErrorScreen: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center text-center py-10 px-6">
    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
      <AlertCircle size={44} className="text-red-500" />
    </div>
    <h3 className="text-2xl font-black text-gray-800 mb-2">Error al enviar</h3>
    <p className="text-gray-500 text-sm mb-8 max-w-xs">{message}</p>
    <button onClick={onRetry}
      className="bg-sepri-dark text-white px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-sepri-medium transition-all shadow-lg">
      Intentar de Nuevo
    </button>
  </motion.div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────
const DynamicFormModal: React.FC<DynamicFormModalProps> = ({
  isOpen, onClose, formTemplate, eventTitle,
}) => {
  const [responses, setResponses]         = useState<Record<string, string>>({});
  const [signatureBase64, setSignature]   = useState<string | null>(null);
  const [status, setStatus]               = useState<EmailSendStatus>('idle');
  const [errorMessage, setErrorMessage]   = useState('');
  const signatureInputRef                 = useRef<HTMLInputElement>(null);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setResponses({});
      setSignature(null);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  const updateResponse = useCallback((id: string, value: string) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor suba una imagen (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen de la firma no debe superar 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setSignature(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const hasSignatureField = formTemplate.fields.some(f => f.type === 'signature');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailField = formTemplate.fields.find(f => f.type === 'email');
    const senderEmail = emailField ? responses[emailField.id]?.trim() : 'no-reply@sepri.com';
    
    const nameField = formTemplate.fields.find(f => f.label.toLowerCase().includes('nombre') && !f.label.toLowerCase().includes('congregaci'));
    const senderName = nameField ? responses[nameField.id]?.trim() : 'Administrador';

    const congregationField = formTemplate.fields.find(f => f.label.toLowerCase().includes('congregaci'));
    const congregation = congregationField ? responses[congregationField.id]?.trim() : 'IPUC';

    // Validar campos requeridos
    for (const field of formTemplate.fields) {
      if (field.required && field.type !== 'signature' && !responses[field.id]?.trim()) {
        alert(`El campo "${field.label}" es obligatorio.`);
        return;
      }
    }

    setStatus('loading');

    try {
      const emailHtml = buildEmailBody(formTemplate, eventTitle, responses, signatureBase64);

      const payload = {
        senderName,
        senderEmail,
        congregation,
        subject: `Solicitud: ${formTemplate.title} — ${eventTitle} — ${congregation}`,
        additionalMessage: '',
        context: `Protocolo: ${eventTitle}\nFormulario: ${formTemplate.title}`,
        formTitle: formTemplate.title,
        formResponses: responses,
        signatureBase64,
        prebuiltHtml: emailHtml,
      };

      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message ?? 'Error desconocido.');

      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.');
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-sepri-dark/85 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget && !isLoading) onClose(); }}>

          <motion.div key="panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="bg-gradient-to-r from-sepri-dark to-sepri-medium px-8 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <FileText size={15} className="text-sepri-yellow" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                    Formulario en Línea
                  </span>
                </div>
                <h2 className="text-lg font-black text-white leading-tight">{formTemplate.title}</h2>
                <p className="text-xs text-blue-200 mt-0.5">{eventTitle}</p>
              </div>
              {!isLoading && (
                <button onClick={onClose} aria-label="Cerrar"
                  className="text-blue-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                  <X size={22} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              <AnimatePresence mode="wait">

                {status === 'success' && (
                  <SuccessScreen key="s" email={responses[formTemplate.fields.find(f => f.type === 'email')?.id ?? ''] ?? ''} onClose={onClose} />
                )}

                {status === 'error' && (
                  <ErrorScreen key="e" message={errorMessage} onRetry={() => { setStatus('idle'); setErrorMessage(''); }} />
                )}

                {(status === 'idle' || status === 'loading') && (
                  <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} className="p-8 space-y-6">

                    {formTemplate.description && (
                      <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-4 leading-relaxed">
                        {formTemplate.description}
                      </p>
                    )}

                    {/* ── Todos los campos son dinámicos ── */}
                    {formTemplate.fields.filter(f => f.type !== 'signature').length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {formTemplate.fields
                          .filter(f => f.type !== 'signature')
                          .map(field => (
                            <FieldWrapper key={field.id} field={field}>
                              {field.type === 'textarea' ? (
                                <textarea
                                  id={`dyn-${field.id}`}
                                  required={field.required}
                                  disabled={isLoading}
                                  placeholder={field.placeholder ?? ''}
                                  className={`${INPUT_BASE} min-h-[90px] resize-none`}
                                  value={responses[field.id] ?? ''}
                                  onChange={e => updateResponse(field.id, e.target.value)}
                                />
                              ) : field.type === 'checkbox' ? (
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                  <input
                                    id={`dyn-${field.id}`}
                                    type="checkbox"
                                    disabled={isLoading}
                                    className="w-5 h-5 accent-sepri-medium"
                                    checked={responses[field.id] === 'Sí'}
                                    onChange={e => updateResponse(field.id, e.target.checked ? 'Sí' : 'No')}
                                  />
                                  <span className="text-sm text-gray-700 font-medium">{field.label}</span>
                                </label>
                              ) : field.type === 'select' && field.options ? (
                                <select
                                  id={`dyn-${field.id}`}
                                  required={field.required}
                                  disabled={isLoading}
                                  className={INPUT_BASE}
                                  value={responses[field.id] ?? ''}
                                  onChange={e => updateResponse(field.id, e.target.value)}
                                >
                                  <option value="">Seleccione una opción...</option>
                                  {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  id={`dyn-${field.id}`}
                                  type={getInputType(field.type)}
                                  required={field.required}
                                  disabled={isLoading}
                                  placeholder={field.placeholder ?? ''}
                                  className={INPUT_BASE}
                                  value={responses[field.id] ?? ''}
                                  onChange={e => updateResponse(field.id, e.target.value)}
                                />
                              )}
                            </FieldWrapper>
                          ))}
                      </div>
                    )}

                    {/* ── Firma digital (si el admin la habilitó) ── */}
                    {hasSignatureField && (
                      <div className="border-t pt-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <PenLine size={16} className="text-sepri-medium" />
                          <span className={LABEL_BASE} style={{ margin: 0 }}>Firma del pastor</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Suba una fotografía o imagen de su firma manuscrita. Esta imagen se enviará
                          en el correo y <strong>no será almacenada</strong>.
                        </p>

                        {signatureBase64 ? (
                          <div className="relative border-2 border-sepri-medium/20 rounded-2xl p-4 bg-gray-50">
                            <img
                              src={signatureBase64}
                              alt="Firma"
                              className="max-h-28 object-contain mx-auto block"
                            />
                            <div className="border-t-2 border-sepri-dark/30 mt-3 pt-2 text-center">
                              <p className="text-xs font-semibold text-gray-600">
                                Firma registrada
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSignature(null); if (signatureInputRef.current) signatureInputRef.current.value = ''; }}
                              className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
                              title="Eliminar firma"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-sepri-medium hover:bg-blue-50/30 transition-all">
                            <ImagePlus size={28} className="text-gray-400" />
                            <span className="text-sm font-bold text-gray-500">
                              Haz clic para subir la firma
                            </span>
                            <span className="text-xs text-gray-400">JPG, PNG · Máx. 2MB</span>
                            <input
                              ref={signatureInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleSignatureUpload}
                              disabled={isLoading}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* ── Submit ── */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-sepri-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-sepri-medium transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <><Loader2 size={18} className="animate-spin" /> Enviando formulario...</>
                      ) : (
                        <><Send size={18} /> Enviar a Coordinación SEPRI</>
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

export default DynamicFormModal;
