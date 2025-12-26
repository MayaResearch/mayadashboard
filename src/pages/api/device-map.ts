import type { APIRoute } from 'astro';
import { getDeviceMap } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const deviceMap = await getDeviceMap();
    return new Response(JSON.stringify(deviceMap), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch device map' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

