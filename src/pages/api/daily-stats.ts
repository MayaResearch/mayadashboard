import type { APIRoute } from 'astro';
import { getDailyStats } from '../../lib/db';
import { getDailyPaymentStats } from '../../lib/razorpay';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const days = parseInt(url.searchParams.get('days') || '14');
    
    const [dailyStats, dailyPayments] = await Promise.all([
      getDailyStats(days),
      getDailyPaymentStats(days)
    ]);

    return new Response(JSON.stringify({
      dates: dailyStats.dates,
      devices: dailyStats.devices,
      sessions: dailyStats.sessions,
      generations: dailyStats.generations,
      payments: dailyPayments.captured,
      revenue: dailyPayments.revenue
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch daily stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

