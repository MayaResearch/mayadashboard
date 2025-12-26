import type { APIRoute } from 'astro';
import { getStats } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const stats = await getStats();
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

