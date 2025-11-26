import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { NEWS_DATA } from './defaults';

export default async (req: Request, context: Context) => {
  const store = getStore('sepri-content');
  const KEY = 'news';

  if (req.method === 'GET') {
    let data = await store.get(KEY, { type: 'json' });
    if (!data) {
      data = NEWS_DATA;
      // Seed if empty
      await store.setJSON(KEY, data);
    }
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    await store.setJSON(KEY, body);
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response("Method not allowed", { status: 405 });
};