const RAZORPAY_KEY = import.meta.env.RAZORPAY_KEY || 'rzp_live_Rtx4A2tX75DWgt';
const RAZORPAY_SECRET = import.meta.env.RAZORPAY_SECRET || 'PjTuWDLoP1s3palYwP20VOdQ';

// Test accounts to ignore in stats and lists
export const IGNORED_CONTACTS = ['+919515235212', '919515235212', 'cherry.workspace.mail@gmail.com'];

export function isIgnoredContact(payment: RazorpayPayment): boolean {
  return IGNORED_CONTACTS.includes(payment.contact) || IGNORED_CONTACTS.includes(payment.email);
}

const auth = typeof Buffer !== 'undefined' 
  ? Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString('base64')
  : btoa(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`);

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'created' | 'authorized' | 'refunded';
  method: string;
  description: string;
  email: string;
  contact: string;
  notes: {
    device_id?: string;
    app?: string;
    platform?: string;
    [key: string]: string | undefined;
  };
  order_id: string;
  invoice_id: string | null;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
  captured: boolean;
  vpa: string | null;
  bank: string | null;
  wallet: string | null;
}

export interface PaymentWithDevice extends RazorpayPayment {
  deviceInfo?: {
    device_id: string;
    user_type: string;
    images_limit: number;
    created_at: number;
  } | null;
}

// Date range options (matching db.ts)
export type DateRange = 'today' | '7days' | '14days' | '30days' | 'all';

// Payment status filter
export type PaymentStatus = 'all' | 'captured' | 'failed' | 'created' | 'authorized' | 'refunded';

export interface PaymentQueryParams {
  page?: number;
  pageSize?: number;
  dateRange?: DateRange;
  status?: PaymentStatus;
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
function getDateRangeTimestamp(range: DateRange): number | null {
  switch (range) {
    case 'today': return getStartOfDayIST(0); // Start of today IST
    case '7days': return getStartOfDayIST(7); // Start of 7 days ago IST
    case '14days': return getStartOfDayIST(14); // Start of 14 days ago IST
    case '30days': return getStartOfDayIST(30); // Start of 30 days ago IST
    case 'all': return null;
    default: return null;
  }
}

export async function getPayments(count = 50, skip = 0, fromTimestamp?: number): Promise<{ items: RazorpayPayment[]; count: number }> {
  let url = `https://api.razorpay.com/v1/payments?count=${count}&skip=${skip}`;
  if (fromTimestamp) {
    url += `&from=${fromTimestamp}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Razorpay API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Cache for all payments per date range (since we need client-side filtering for status)
const paymentsCache = new Map<string, { payments: RazorpayPayment[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Clear the payments cache (call this when data changes)
export function clearPaymentsCache(): void {
  paymentsCache.clear();
}

// Fetch all payments for a date range (with caching)
export async function getAllPayments(fromTimestamp?: number, forceRefresh = false): Promise<RazorpayPayment[]> {
  const cacheKey = fromTimestamp?.toString() || 'all';
  const cached = paymentsCache.get(cacheKey);
  const now = Date.now();
  
  if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.payments;
  }
  
  // Fetch all payments in batches
  const allPayments: RazorpayPayment[] = [];
  let skip = 0;
  const batchSize = 100;
  
  while (true) {
    const response = await getPayments(batchSize, skip, fromTimestamp || undefined);
    allPayments.push(...response.items);
    
    if (response.items.length < batchSize) break;
    skip += batchSize;
    if (skip >= 10000) break; // Safety limit
  }
  
  paymentsCache.set(cacheKey, { payments: allPayments, timestamp: now });
  return allPayments;
}

// Server-side paginated payments with status filtering
export async function getPaymentsPaginated(params: PaymentQueryParams = {}): Promise<{
  data: RazorpayPayment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 100));
  const fromTimestamp = getDateRangeTimestamp(params.dateRange || 'all');
  const statusFilter = params.status || 'all';
  
  // Fetch all payments for the date range
  const allPayments = await getAllPayments(fromTimestamp || undefined);
  
  // Filter by status if needed
  const filteredPayments = statusFilter === 'all' 
    ? allPayments 
    : allPayments.filter(p => p.status === statusFilter);
  
  // Apply pagination to filtered results
  const total = filteredPayments.length;
  const skip = (page - 1) * pageSize;
  const paginatedData = filteredPayments.slice(skip, skip + pageSize);
  
  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getPaymentById(paymentId: string): Promise<RazorpayPayment> {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Razorpay API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getOrders(count = 50, skip = 0): Promise<{ items: any[]; count: number }> {
  const response = await fetch(`https://api.razorpay.com/v1/orders?count=${count}&skip=${skip}`, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Razorpay API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getPaymentStats(dateRange: DateRange = 'all'): Promise<{
  totalPayments: number;
  capturedPayments: number;
  failedPayments: number;
  totalRevenue: number;
}> {
  const fromTimestamp = getDateRangeTimestamp(dateRange);
  
  // Fetch all payments for the date range to calculate accurate stats
  const allPayments: RazorpayPayment[] = [];
  let skip = 0;
  const batchSize = 100;
  
  while (true) {
    const response = await getPayments(batchSize, skip, fromTimestamp || undefined);
    allPayments.push(...response.items);
    
    if (response.items.length < batchSize) break;
    skip += batchSize;
    if (skip >= 10000) break; // Safety limit
  }
  
  // Filter out ignored test contacts
  const validPayments = allPayments.filter(p => !isIgnoredContact(p));
  
  const captured = validPayments.filter(p => p.status === 'captured');
  const failed = validPayments.filter(p => p.status === 'failed');
  const totalRevenue = captured.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalPayments: validPayments.length,
    capturedPayments: captured.length,
    failedPayments: failed.length,
    totalRevenue: totalRevenue / 100 // Convert paise to rupees
  };
}

export function formatAmount(amountInPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amountInPaise / 100);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'captured':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'failed':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'authorized':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'refunded':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
}

// Get daily payment stats for graphs (last N days)
export async function getDailyPaymentStats(days: number = 14): Promise<{
  dates: string[];
  captured: number[];
  failed: number[];
  revenue: number[];
}> {
  // Fetch all payments for the period
  const fromTimestamp = getStartOfDayIST(days);
  const allPayments = await getAllPayments(fromTimestamp);
  
  // Filter out ignored contacts
  const validPayments = allPayments.filter(p => !isIgnoredContact(p));
  
  const results: { dates: string[]; captured: number[]; failed: number[]; revenue: number[] } = {
    dates: [],
    captured: [],
    failed: [],
    revenue: []
  };

  // Process each day
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

    // Filter payments for this day
    const dayPayments = validPayments.filter(p => p.created_at >= dayStart && p.created_at < dayEnd);
    
    const captured = dayPayments.filter(p => p.status === 'captured');
    const failed = dayPayments.filter(p => p.status === 'failed');
    const revenue = captured.reduce((sum, p) => sum + p.amount, 0);

    results.captured.push(captured.length);
    results.failed.push(failed.length);
    results.revenue.push(revenue / 100); // Convert paise to rupees
  }

  return results;
}

