import type { APIRoute } from 'astro';
import { getDeviceUserTypes } from '../../lib/db';
import { getAllPayments, IGNORED_CONTACTS, clearPaymentsCache } from '../../lib/razorpay';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // Check if force refresh is requested
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    if (forceRefresh) {
      clearPaymentsCache();
    }

    const [allPayments, deviceUserTypes] = await Promise.all([
      getAllPayments(undefined, forceRefresh),
      getDeviceUserTypes()
    ]);

    // Filter: Captured payments from FREE users (not premium), excluding ignored contacts
    const paidFreeUsers = allPayments
      .filter(p => {
        if (p.status !== 'captured') return false;
        if (IGNORED_CONTACTS.includes(p.contact) || IGNORED_CONTACTS.includes(p.email)) return false;
        const deviceId = p.notes?.device_id;
        if (!deviceId) return true; // Show payments without device_id
        const userType = deviceUserTypes.get(deviceId);
        return userType !== 'premium_user';
      });

    return new Response(JSON.stringify(paidFreeUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching paid free users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch paid free users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

