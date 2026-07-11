import type { Context } from '@netlify/functions';
import { Resend } from 'resend';
import { GoogleGenAI } from '@google/genai';
import { getStore } from '@netlify/blobs';

// --- Tipos ---
interface EmailSendPayload {
  senderName: string;
  senderEmail: string;
  congregation?: string;
  phone?: string;
  subject: string;
  additionalMessage: string;
  context: string;
  // Campos extendidos para formularios dinámicos
  formTitle?: string;
  formResponses?: Record<string, string>;
  signatureBase64?: string;
  prebuiltHtml?: string; // HTML pre-generado por DynamicFormModal (omite la llamada a Gemini)
}

interface ValidationError {
  field: string;
  message: string;
}

// --- Validación backend ---
function validatePayload(body: unknown): { data: EmailSendPayload; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'El cuerpo de la solicitud es inválido.' });
    return { data: {} as EmailSendPayload, errors };
  }

  const raw = body as Record<string, unknown>;

  if (!raw.senderName || typeof raw.senderName !== 'string' || raw.senderName.trim() === '') {
    errors.push({ field: 'senderName', message: 'El nombre del remitente es obligatorio.' });
  }

  if (!raw.senderEmail || typeof raw.senderEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.senderEmail)) {
    errors.push({ field: 'senderEmail', message: 'El correo electrónico del remitente es inválido.' });
  }

  if (!raw.subject || typeof raw.subject !== 'string' || raw.subject.trim() === '') {
    errors.push({ field: 'subject', message: 'El asunto es obligatorio.' });
  }

  if (raw.additionalMessage !== undefined && typeof raw.additionalMessage !== 'string') {
    errors.push({ field: 'additionalMessage', message: 'El mensaje adicional debe ser un texto.' });
  }

  if (!raw.context || typeof raw.context !== 'string') {
    errors.push({ field: 'context', message: 'El contexto del formulario es obligatorio.' });
  }

  return { data: raw as unknown as EmailSendPayload, errors };
}

// --- Generación del cuerpo del email con IA ---
async function generateEmailBodyWithAI(payload: EmailSendPayload): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback si no hay clave de Gemini: cuerpo estándar sin IA
    return buildFallbackEmailBody(payload);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Eres el asistente oficial de SEPRI (Seguridad y Prevención del Riesgo) del Distrito 22 de la Iglesia Pentecostal Unida de Colombia (IPUC).

Un usuario ha completado un formulario en la plataforma web institucional y solicita que se le envíe información o documentación relacionada.

Genera el CUERPO de un correo electrónico institucional, profesional y cálido, en español, con los siguientes datos:

**Datos del Solicitante:**
- Nombre: ${payload.senderName}
- Correo: ${payload.senderEmail}
${payload.congregation ? `- Congregación: ${payload.congregation}` : ''}
${payload.phone ? `- Teléfono: ${payload.phone}` : ''}

**Asunto de la Solicitud:** ${payload.subject}

**Contexto del Formulario / Protocolo:**
${payload.context}

**Mensaje adicional del solicitante:**
${payload.additionalMessage}

**Instrucciones para el correo:**
1. Saluda cordialmente al equipo de coordinación SEPRI D22 mencionando quién hace la solicitud.
2. Explica de forma estructurada y clara cuál es el formato o protocolo que el solicitante está tramitando.
3. Incluye todos los datos del solicitante de forma organizada.
4. Incluye el mensaje adicional del solicitante textualmente en una sección "Observaciones del Solicitante".
5. Cierra con un mensaje indicando que se adjunta copia de esta comunicación al correo del solicitante.
6. Firma como: "Sistema SEPRI D22 - Plataforma Digital Institucional"
7. El tono debe ser formal pero cálido, acorde con una organización religiosa y de seguridad comunitaria.
8. NO incluyas asunto ni encabezados de "De:", "Para:" — solo el cuerpo del correo en HTML limpio con etiquetas básicas (p, strong, br, hr, ul, li).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text ?? buildFallbackEmailBody(payload);
  } catch (error) {
    console.error('[send-email] Error generando cuerpo con IA:', error);
    return buildFallbackEmailBody(payload);
  }
}

// --- Cuerpo de email de respaldo (sin IA) ---
function buildFallbackEmailBody(payload: EmailSendPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #0E2A47; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #FFB000; margin: 0; font-size: 22px;">SEPRI Distrito 22</h1>
        <p style="color: #93c5fd; margin: 4px 0 0; font-size: 13px;">Seguridad y Prevención del Riesgo - IPUC</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #0E2A47; font-size: 18px;">${payload.subject}</h2>
        <hr style="border: none; border-top: 2px solid #FFB000; margin: 16px 0;" />

        <p><strong>Solicitante:</strong> ${payload.senderName}</p>
        <p><strong>Correo:</strong> ${payload.senderEmail}</p>
        ${payload.congregation ? `<p><strong>Congregación:</strong> ${payload.congregation}</p>` : ''}
        ${payload.phone ? `<p><strong>Teléfono:</strong> ${payload.phone}</p>` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

        <h3 style="color: #164E87;">Contexto del Formulario</h3>
        <p style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px;">${payload.context}</p>

        <h3 style="color: #164E87;">Mensaje del Solicitante</h3>
        <p style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px;">${payload.additionalMessage}</p>
      </div>
      <div style="background: #f9fafb; padding: 16px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">Enviado desde la plataforma digital institucional SEPRI D22</p>
      </div>
    </div>
  `;
}

// --- Handler principal ---
export default async (req: Request, context: Context): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Método no permitido.' }),
      { status: 405, headers: corsHeaders }
    );
  }

  // Obtener datos dinámicos de contacto desde Blobs
  const store = getStore('sepri-content');
  let contactData: any = null;
  try {
    contactData = await store.get('contact', { type: 'json' });
  } catch (err) {
    console.error('[send-email] Error leyendo contact de blobs:', err);
  }

  // Resolver API Key de Resend (Dinámica de base de datos o fallback a .env)
  const resendApiKey = contactData?.resendApiKey || process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ success: false, message: 'Configuración de email no disponible. Configura la API Key en el panel administrativo.' }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Parsear y validar body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'El cuerpo de la solicitud no es JSON válido.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { data: payload, errors } = validatePayload(rawBody);

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ success: false, message: 'Datos inválidos.', errors }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Correo destino temporal (se resolverá en la lógica de sandbox inferior)

  console.log(`[send-email] Recibido payload de ${payload.senderName}`);
  console.log(`[send-email] ¿Trae firma?: ${!!payload.signatureBase64}`);

  // Si el cliente ya trajo el HTML pre-generado (formularios dinámicos), úsalo directamente
  const emailBody = payload.prebuiltHtml
    ? payload.prebuiltHtml
    : await generateEmailBodyWithAI(payload);

  // Obtener remitente configurado en variables de entorno (ej: no-reply@tudominio.com)
  // Si no está configurado, usa el de pruebas de Resend
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const isSandbox = fromEmail.includes('onboarding@resend.dev');

  // Correo destino: Dinámico de base de datos o fallback a .env.
  // En sandbox, forzamos sepridistrito@gmail.com como destinatario seguro por defecto de tu nueva cuenta.
  const toEmail = isSandbox 
    ? 'sepridistrito@gmail.com' 
    : (contactData?.notificationEmail || process.env.RESEND_TO_EMAIL || 'sepridistrito@gmail.com');

  // Enviar email con Resend
  try {
    const resend = new Resend(resendApiKey);

    const emailConfig: any = {
      from: `SEPRI D22 <${fromEmail}>`,
      to: [toEmail],
      subject: `[SEPRI D22] ${payload.subject}`,
      html: emailBody,
      attachments: []
    };

    if (payload.signatureBase64) {
      // Remover cabecera base64
      const base64Data = payload.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
      
      emailConfig.attachments.push({
        filename: 'firma.png',
        content: base64Data // Pasamos directamente el string en base64
      });
    }

    // Solo añadimos el CC del solicitante si NO estamos en sandbox de pruebas.
    // En sandbox de Resend, poner un CC no verificado causa error 403.
    if (!isSandbox && payload.senderEmail) {
      emailConfig.cc = [payload.senderEmail];
    }

    const { error } = await resend.emails.send(emailConfig);

    if (error) {
      console.error('[send-email] Error de Resend:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Error al enviar el correo. Intenta de nuevo más tarde.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Correo enviado correctamente. Recibirás una copia en tu email.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[send-email] Error inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor. Intenta de nuevo más tarde.' }),
      { status: 500, headers: corsHeaders }
    );
  }
};
