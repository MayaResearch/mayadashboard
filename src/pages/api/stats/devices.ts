import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

export const prerender = false;

// Helper to get start of day in IST as Unix timestamp
function getStartOfDayIST(): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

  const targetDateIST = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const istOffsetMinutes = 5 * 60 + 30;
  targetDateIST.setUTCMinutes(targetDateIST.getUTCMinutes() - istOffsetMinutes);

  return Math.floor(targetDateIST.getTime() / 1000);
}

export const GET: APIRoute = async () => {
  try {
    const todayStart = getStartOfDayIST();
    
    const [total, today] = await Promise.all([
      db.execute(`SELECT COUNT(*) as count FROM devices`),
      db.execute({
        sql: `SELECT COUNT(*) as count FROM devices WHERE created_at >= ?`,
        args: [todayStart]
      })
    ]);

    return new Response(JSON.stringify({
      total: total.rows[0].count as number,
      today: today.rows[0].count as number
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch device stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

