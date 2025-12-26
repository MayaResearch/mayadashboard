import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const result = await db.execute(`SELECT COUNT(*) as count FROM devices WHERE user_type = 'premium_user'`);

    return new Response(JSON.stringify({
      total: result.rows[0].count as number
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch premium stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

