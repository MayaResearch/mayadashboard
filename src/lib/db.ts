import { createClient } from "@libsql/client";

// Date range options
export type DateRange = 'today' | '7days' | '14days' | '30days' | 'all';

// Session status options
export type SessionStatus = 'all' | 'completed' | 'in_progress' | 'failed';

// Query params interface for server-side operations
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  dateRange?: DateRange;
  status?: SessionStatus;
}

// Helper to get start of day in IST (midnight IST) as Unix timestamp
function getStartOfDayIST(daysAgo: number = 0): number {
  // Get current time in IST
  const now = new Date();
  
  // Get current date parts in IST timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const istDateStr = formatter.format(now); // YYYY-MM-DD format
  const [year, month, day] = istDateStr.split('-').map(Number);
  
  // Calculate the target date (subtract daysAgo)
  const targetDate = new Date(year, month - 1, day - daysAgo);
  
  // Get midnight IST for target date
  // IST is UTC+5:30, so we need to subtract 5:30 from midnight local to get UTC
  const midnightISTinUTC = Date.UTC(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    0, 0, 0
  ) - (5 * 60 + 30) * 60 * 1000; // Subtract 5:30 hours
  
  return Math.floor(midnightISTinUTC / 1000);
}

// Helper to get timestamp for date range (IST-based)
export function getDateRangeTimestamp(range: DateRange): number | null {
  switch (range) {
    case 'today': return getStartOfDayIST(0); // Start of today IST
    case '7days': return getStartOfDayIST(7); // Start of 7 days ago IST
    case '14days': return getStartOfDayIST(14); // Start of 14 days ago IST
    case '30days': return getStartOfDayIST(30); // Start of 30 days ago IST
    case 'all': return null;
    default: return null;
  }
}

export const db = createClient({
  url: import.meta.env.TURSO_URL || "libsql://mayaapp-maya.aws-ap-south-1.turso.io",
  authToken: import.meta.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM2NTgwNTYsImlkIjoiM2Y0NjdhYTktZWY1Mi00MzQ0LWI5YjItODViODI4NjMxOWY3IiwicmlkIjoiYmZmMTNmM2UtODkyMC00YTdiLWJmZmQtMjUwNDYxYzM3MDhjIn0.UeuW9r3toa-ZcUWa7xVCySh7ZdM_zEGqNK3112whk4PMy431SFyMJcDCNncvSVDsibsRHNqsGuJJ-ysBtDV2CA"
});

// Types
export interface Device {
  id: number;
  device_id: string;
  expo_notification_id: string | null;
  created_at: number;
  updated_at: number;
  images_limit: number;
  user_type: string;
}

export interface DeviceMap {
  id: number;
  device_id: string;
  device_name: string;
  created_at: number;
  updated_at: number;
}

export interface Session {
  id: number;
  session_id: string;
  device_id: string;
  recording_s3_key: string | null;
  transcription_s3_key: string | null;
  generations: string;
  total_generations: number;
  duration_seconds: number;
  status: string;
  started_at: number;
  ended_at: number;
  created_at: number;
  is_listened: number;
}

export interface SupportRequest {
  id: number;
  device_id: string;
  category: string;
  message: string;
  status: string;
  created_at: number;
  updated_at: number;
}

// Allowed sort columns to prevent SQL injection
const DEVICE_SORT_COLUMNS = ['device_id', 'created_at', 'updated_at', 'images_limit', 'user_type'];
const SESSION_SORT_COLUMNS = ['session_id', 'device_id', 'created_at', 'total_generations', 'duration_seconds', 'status'];
const SUPPORT_SORT_COLUMNS = ['id', 'device_id', 'category', 'status', 'created_at'];

// Server-side paginated queries with sorting and search
export async function getDevicesPaginated(params: QueryParams = {}): Promise<{ 
  data: Device[]; 
  total: number; 
  page: number; 
  pageSize: number; 
  totalPages: number;
}> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 100));
  const offset = (page - 1) * pageSize;
  const sortColumn = DEVICE_SORT_COLUMNS.includes(params.sort || '') ? params.sort : 'created_at';
  const sortOrder = params.order === 'asc' ? 'ASC' : 'DESC';
  const search = params.search?.trim() || '';
  const dateTimestamp = getDateRangeTimestamp(params.dateRange || 'all');

  // Build WHERE clauses
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (search) {
    conditions.push('device_id LIKE ?');
    args.push(`%${search}%`);
  }
  if (dateTimestamp !== null) {
    conditions.push('created_at >= ?');
    args.push(dateTimestamp);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM devices ${whereClause}`,
    args
  });
  const total = countResult.rows[0].count as number;

  // Get paginated data with sorting
  const dataResult = await db.execute({
    sql: `SELECT * FROM devices ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset]
  });

  return {
    data: dataResult.rows as unknown as Device[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

// Legacy functions for backward compatibility
export async function getDevices(limit = 50, offset = 0): Promise<Device[]> {
  const result = await db.execute({
    sql: `SELECT * FROM devices ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [limit, offset]
  });
  return result.rows as unknown as Device[];
}

export async function getDeviceCount(): Promise<number> {
  const result = await db.execute(`SELECT COUNT(*) as count FROM devices`);
  return result.rows[0].count as number;
}

export async function getDeviceById(deviceId: string): Promise<Device | null> {
  const result = await db.execute({
    sql: `SELECT * FROM devices WHERE device_id = ?`,
    args: [deviceId]
  });
  return result.rows[0] as unknown as Device | null;
}

export async function getDeviceMap(): Promise<DeviceMap[]> {
  const result = await db.execute(`SELECT * FROM device_map ORDER BY created_at DESC`);
  return result.rows as unknown as DeviceMap[];
}

// Get all devices as a map for quick lookup (device_id -> user_type)
export async function getDeviceUserTypes(): Promise<Map<string, string>> {
  const result = await db.execute(`SELECT device_id, user_type FROM devices`);
  const map = new Map<string, string>();
  for (const row of result.rows) {
    map.set(row.device_id as string, row.user_type as string);
  }
  return map;
}

export async function getSessionsByDeviceId(deviceId: string, limit = 20): Promise<Session[]> {
  const result = await db.execute({
    sql: `SELECT * FROM sessions WHERE device_id = ? ORDER BY created_at DESC LIMIT ?`,
    args: [deviceId, limit]
  });
  return result.rows as unknown as Session[];
}

export async function getSessionCount(): Promise<number> {
  const result = await db.execute(`SELECT COUNT(*) as count FROM sessions`);
  return result.rows[0].count as number;
}

export async function getSessionsPaginated(params: QueryParams = {}): Promise<{ 
  data: Session[]; 
  total: number; 
  page: number; 
  pageSize: number; 
  totalPages: number;
}> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 100));
  const offset = (page - 1) * pageSize;
  const sortColumn = SESSION_SORT_COLUMNS.includes(params.sort || '') ? params.sort : 'created_at';
  const sortOrder = params.order === 'asc' ? 'ASC' : 'DESC';
  const search = params.search?.trim() || '';
  const dateTimestamp = getDateRangeTimestamp(params.dateRange || 'all');
  const statusFilter = params.status || 'all';

  // Build WHERE clauses
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (search) {
    conditions.push('(device_id LIKE ? OR session_id LIKE ?)');
    args.push(`%${search}%`, `%${search}%`);
  }
  if (dateTimestamp !== null) {
    conditions.push('created_at >= ?');
    args.push(dateTimestamp);
  }
  if (statusFilter !== 'all') {
    conditions.push('status = ?');
    args.push(statusFilter);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM sessions ${whereClause}`,
    args
  });
  const total = countResult.rows[0].count as number;

  const dataResult = await db.execute({
    sql: `SELECT * FROM sessions ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset]
  });

  return {
    data: dataResult.rows as unknown as Session[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getSupportRequestsPaginated(params: QueryParams = {}): Promise<{ 
  data: SupportRequest[]; 
  total: number; 
  page: number; 
  pageSize: number; 
  totalPages: number;
}> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 100));
  const offset = (page - 1) * pageSize;
  const sortColumn = SUPPORT_SORT_COLUMNS.includes(params.sort || '') ? params.sort : 'created_at';
  const sortOrder = params.order === 'asc' ? 'ASC' : 'DESC';
  const search = params.search?.trim() || '';
  const dateTimestamp = getDateRangeTimestamp(params.dateRange || 'all');

  // Build WHERE clauses
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (search) {
    conditions.push('(device_id LIKE ? OR message LIKE ? OR category LIKE ?)');
    args.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (dateTimestamp !== null) {
    conditions.push('created_at >= ?');
    args.push(dateTimestamp);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM support_requests ${whereClause}`,
    args
  });
  const total = countResult.rows[0].count as number;

  const dataResult = await db.execute({
    sql: `SELECT * FROM support_requests ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset]
  });

  return {
    data: dataResult.rows as unknown as SupportRequest[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

// Legacy functions
export async function getRecentSessions(limit = 50, offset = 0): Promise<Session[]> {
  const result = await db.execute({
    sql: `SELECT * FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [limit, offset]
  });
  return result.rows as unknown as Session[];
}

export async function getSupportRequests(limit = 50, offset = 0): Promise<SupportRequest[]> {
  const result = await db.execute({
    sql: `SELECT * FROM support_requests ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [limit, offset]
  });
  return result.rows as unknown as SupportRequest[];
}

export async function getSupportRequestCount(): Promise<number> {
  const result = await db.execute(`SELECT COUNT(*) as count FROM support_requests`);
  return result.rows[0].count as number;
}

export async function getStats(): Promise<{
  totalDevices: number;
  totalSessions: number;
  newDevicesToday: number;
  newSessionsToday: number;
  premiumUsers: number;
  totalGenerations: number;
  todayGenerations: number;
}> {
  const todayStartIST = getStartOfDayIST(0); // Start of today in IST
  
  const [devices, sessions, newDevices, newSessions, premium, totalGens, todayGens] = await Promise.all([
    db.execute(`SELECT COUNT(*) as count FROM devices`),
    db.execute(`SELECT COUNT(*) as count FROM sessions`),
    db.execute({
      sql: `SELECT COUNT(*) as count FROM devices WHERE created_at >= ?`,
      args: [todayStartIST]
    }),
    db.execute({
      sql: `SELECT COUNT(*) as count FROM sessions WHERE created_at >= ?`,
      args: [todayStartIST]
    }),
    db.execute(`SELECT COUNT(*) as count FROM devices WHERE user_type = 'premium_user'`),
    db.execute(`SELECT COALESCE(SUM(total_generations), 0) as total FROM sessions`),
    db.execute({
      sql: `SELECT COALESCE(SUM(total_generations), 0) as total FROM sessions WHERE created_at >= ?`,
      args: [todayStartIST]
    })
  ]);

  return {
    totalDevices: devices.rows[0].count as number,
    totalSessions: sessions.rows[0].count as number,
    newDevicesToday: newDevices.rows[0].count as number,
    newSessionsToday: newSessions.rows[0].count as number,
    premiumUsers: premium.rows[0].count as number,
    totalGenerations: totalGens.rows[0].total as number,
    todayGenerations: todayGens.rows[0].total as number
  };
}

// Get daily stats for graphs (last N days)
export async function getDailyStats(days: number = 14): Promise<{
  dates: string[];
  devices: number[];
  sessions: number[];
  generations: number[];
}> {
  const results: { dates: string[]; devices: number[]; sessions: number[]; generations: number[] } = {
    dates: [],
    devices: [],
    sessions: [],
    generations: []
  };

  // Get stats for each day
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = getStartOfDayIST(i);
    const dayEnd = i === 0 ? Math.floor(Date.now() / 1000) : getStartOfDayIST(i - 1);
    
    // Format date for label
    const date = new Date(dayStart * 1000);
    const dateLabel = date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short',
      timeZone: 'Asia/Kolkata'
    });
    results.dates.push(dateLabel);

    const [deviceCount, sessionCount, genCount] = await Promise.all([
      db.execute({
        sql: `SELECT COUNT(*) as count FROM devices WHERE created_at >= ? AND created_at < ?`,
        args: [dayStart, dayEnd]
      }),
      db.execute({
        sql: `SELECT COUNT(*) as count FROM sessions WHERE created_at >= ? AND created_at < ?`,
        args: [dayStart, dayEnd]
      }),
      db.execute({
        sql: `SELECT COALESCE(SUM(total_generations), 0) as total FROM sessions WHERE created_at >= ? AND created_at < ?`,
        args: [dayStart, dayEnd]
      })
    ]);

    results.devices.push(deviceCount.rows[0].count as number);
    results.sessions.push(sessionCount.rows[0].count as number);
    results.generations.push(genCount.rows[0].total as number);
  }

  return results;
}

