import type { APIRoute } from 'astro';
import { getSubscriptionStatusByDevice, type RazorpaySubscription } from '../../lib/razorpay';

export const GET: APIRoute = async ({ url }) => {
  try {
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const subscriptionMap = await getSubscriptionStatusByDevice(forceRefresh);
    
    // Convert Map to object for JSON serialization
    const subscriptions: Record<string, { status: string; created_at: number }> = {};
    subscriptionMap.forEach((sub, deviceId) => {
      subscriptions[deviceId] = {
        status: sub.status,
        created_at: sub.created_at
      };
    });
    
    return new Response(JSON.stringify({ subscriptions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

