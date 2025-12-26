import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { deviceId } = await request.json();
    
    if (!deviceId) {
      return new Response(JSON.stringify({ error: 'Device ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the device's user_type to premium_user
    const result = await db.execute({
      sql: `UPDATE devices SET user_type = 'premium_user', updated_at = ? WHERE device_id = ?`,
      args: [Math.floor(Date.now() / 1000), deviceId]
    });

    if (result.rowsAffected === 0) {
      return new Response(JSON.stringify({ error: 'Device not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, deviceId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to update device to premium:', error);
    return new Response(JSON.stringify({ error: 'Failed to update device' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

