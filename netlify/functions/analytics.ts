import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

interface AnalyticsRecord {
  date: string;
  visits: number;
  uniqueVisitors: number;
  timeSpentSeconds: number;
  locations: Record<string, number>;
  downloads: Record<string, number>;
}

export default async (req: Request, context: Context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-sepri-role',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const store = getStore('sepri-content');
  const STORE_KEY = 'analytics';

  // GET: Devuelve todas las analíticas
  if (req.method === 'GET') {
    try {
      const data = await store.get(STORE_KEY, { type: 'json' });
      return new Response(JSON.stringify(data || []), { headers: corsHeaders });
    } catch (err) {
      console.error('[analytics] Error leyendo Blobs:', err);
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }
  }

  // POST: Registra un evento de analíticas
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const action = body.action; // 'visit', 'time', 'download'

      // Evitamos problemas de concurrencia obteniendo la info mas reciente en el momento exacto
      let records: AnalyticsRecord[] = [];
      try {
        records = (await store.get(STORE_KEY, { type: 'json' })) as AnalyticsRecord[] || [];
      } catch (e) {
        records = [];
      }

      // Buscar el registro de hoy (UTC local)
      const today = new Date().toISOString().split('T')[0];
      let todayRecord = records.find(r => r.date === today);

      if (!todayRecord) {
        todayRecord = { date: today, visits: 0, uniqueVisitors: 0, timeSpentSeconds: 0, locations: {}, downloads: {} };
        records.push(todayRecord);
      }

      if (action === 'visit') {
        todayRecord.visits += 1;
        if (body.isUnique) {
          todayRecord.uniqueVisitors += 1;
          const loc = body.location || 'Desconocido';
          todayRecord.locations[loc] = (todayRecord.locations[loc] || 0) + 1;
        }
      } else if (action === 'time') {
        todayRecord.timeSpentSeconds += (body.seconds || 0);
      } else if (action === 'download') {
        const docName = body.documentName || 'Documento';
        todayRecord.downloads[docName] = (todayRecord.downloads[docName] || 0) + 1;
      }

      // Guardar el estado mutado
      await store.setJSON(STORE_KEY, records);

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err) {
      console.error('[analytics] Error procesando POST:', err);
      return new Response(JSON.stringify({ success: false }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
};
