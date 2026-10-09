import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

interface SessionData {
  email: string;
  role: 'ADMIN' | 'CREATOR';
  createdAt: number;
  expiresAt: number;
}

// Credenciales seguras gestionadas en el servidor (nunca expuestas al navegador)
const AUTH_USERS = [
  {
    email: 'distrito22a@ipuc.org.co',
    password: process.env.ADMIN_PASSWORD || 'S3cur3#Admin!2025',
    role: 'ADMIN' as const,
    name: 'Administrador SEPRI'
  },
  {
    email: 'sepri.creator@ipuc.org.co',
    password: process.env.CREATOR_PASSWORD || 'System#Creator!2025',
    role: 'CREATOR' as const,
    name: 'Creador del Sistema'
  }
];

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

export default async (req: Request, context: Context) => {
  const store = getStore('sepri-auth');

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { action, email, password, token } = body;

    // 1. INICIAR SESIÓN (Genera token nuevo e independiente)
    if (action === 'login') {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const user = AUTH_USERS.find(
        u => u.email.toLowerCase() === normalizedEmail && u.password === password
      );

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, message: 'Credenciales incorrectas' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Generar token criptográfico único
      const sessionToken = `sepri_tok_${crypto.randomUUID()}`;
      const now = Date.now();
      const sessionData: SessionData = {
        email: user.email,
        role: user.role,
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS
      };

      // Almacenar token en base de datos segura de Blobs
      await store.setJSON(sessionToken, sessionData);

      return new Response(
        JSON.stringify({
          success: true,
          token: sessionToken,
          role: user.role,
          name: user.name,
          email: user.email
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. VERIFICAR TOKEN ACTIVO
    if (action === 'verify') {
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, valid: false }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const session = await store.get(token, { type: 'json' }) as SessionData | null;
      if (!session || Date.now() > session.expiresAt) {
        if (session) {
          // Token expirado: limpiarlo
          await store.delete(token);
        }
        return new Response(
          JSON.stringify({ success: false, valid: false, message: 'Token expirado o revocado' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          valid: true,
          role: session.role,
          email: session.email
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. CERRAR SESIÓN (Invalida el token para que jamás vuelva a servir)
    if (action === 'logout') {
      if (token) {
        try {
          await store.delete(token);
        } catch (e) {
          console.warn('Error eliminando token de sesión:', e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Sesión invalidada en el servidor' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no reconocida' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err?.message || 'Error del servidor de autenticación' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
