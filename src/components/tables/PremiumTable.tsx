"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PremiumUser {
  device_id: string
  device_name: string | null
  created_at: number
  updated_at: number
}

interface SubscriptionData {
  status: string
  created_at: number
}

interface PremiumTableProps {
  users: PremiumUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  sort: string
  order: string
  search: string
  baseUrl: string
  statusFilter: string
}

// Shimmer component for loading state
function Shimmer() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-20 bg-muted rounded-full" />
    </div>
  )
}

// Subscription status badge
function SubscriptionBadge({ status, isLoading }: { status?: string; isLoading: boolean }) {
  if (isLoading) {
    return <Shimmer />
  }

  const getStyle = (s: string): string => {
    switch (s) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'paused':
      case 'halted':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'expired':
      case 'completed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    }
  }

  const getLabel = (s: string): string => {
    switch (s) {
      case 'active': return 'Active'
      case 'cancelled': return 'Cancelled'
      case 'paused': return 'Paused'
      case 'halted': return 'Halted'
      case 'expired': return 'Expired'
      case 'completed': return 'Completed'
      case 'one_time': return 'One-time'
      default: return s
    }
  }

  const displayStatus = status || 'one_time'

  return (
    <span className={cn(
      "inline-flex items-center text-xs px-2 py-1 rounded-full border font-medium",
      getStyle(displayStatus)
    )}>
      {getLabel(displayStatus)}
    </span>
  )
}

function formatDate(timestamp: number): { date: string; time: string } {
  const d = new Date(timestamp * 1000)
  return {
    date: d.toLocaleDateString('en-IN', { dateStyle: 'short', timeZone: 'Asia/Kolkata' }),
    time: d.toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })
  }
}

export function PremiumTable({ 
  users, 
  total, 
  page, 
  pageSize, 
  totalPages,
  sort,
  order,
  search,
  baseUrl,
  statusFilter
}: PremiumTableProps) {
  const [subscriptions, setSubscriptions] = useState<Record<string, SubscriptionData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [cancelledCount, setCancelledCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSubscriptions = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true)
    }
    try {
      const url = forceRefresh ? '/api/subscriptions?refresh=true' : '/api/subscriptions'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || {})
        
        // Count cancelled for the badge
        const cancelled = Object.values(data.subscriptions || {}).filter(
          (s: any) => s.status === 'cancelled'
        ).length
        setCancelledCount(cancelled)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  // Filter users based on status filter (client-side when subscriptions are loaded)
  const filteredUsers = isLoading ? users : users.filter(user => {
    if (statusFilter === 'all') return true
    const sub = subscriptions[user.device_id]
    const status = sub?.status || 'one_time'
    if (statusFilter === 'cancelled') return status === 'cancelled'
    if (statusFilter === 'active') return status === 'active'
    return true
  })

  // Build URL helper
  const buildUrl = (params: Record<string, string | number>) => {
    const url = new URLSearchParams()
    const defaults: Record<string, any> = { sort, order, search, pageSize, status: statusFilter }
    Object.assign(defaults, params)
    
    if (defaults.sort !== 'updated_at') url.set('sort', defaults.sort)
    if (defaults.order !== 'desc') url.set('order', defaults.order)
    if (defaults.search) url.set('search', defaults.search)
    if (defaults.pageSize !== 100) url.set('pageSize', defaults.pageSize.toString())
    if (defaults.page && defaults.page > 1) url.set('page', defaults.page.toString())
    if (defaults.status !== 'all') url.set('status', defaults.status)
    
    const queryString = url.toString()
    return `${baseUrl}${queryString ? '?' + queryString : ''}`
  }

  const buildSortUrl = (column: string) => {
    const newOrder = sort === column && order === 'desc' ? 'asc' : 'desc'
    return buildUrl({ sort: column, order: newOrder, page: 1 })
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sort !== column) return null
    return order === 'asc' ? (
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    )
  }

  // Pagination
  const maxPagesToShow = 5
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => fetchSubscriptions(true)}
          disabled={isRefreshing}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
            "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <svg 
            className={cn("w-4 h-4", isRefreshing && "animate-spin")} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Subscriptions'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left">
                  <a href={buildSortUrl('device_id')} className="flex items-center font-medium text-muted-foreground uppercase tracking-wider text-xs hover:text-foreground">
                    Device ID
                    <SortIcon column="device_id" />
                  </a>
                </th>
                <th className="px-4 py-3 text-left">
                  <a href={buildSortUrl('device_name')} className="flex items-center font-medium text-muted-foreground uppercase tracking-wider text-xs hover:text-foreground">
                    Device Name
                    <SortIcon column="device_name" />
                  </a>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs">
                  Subscription
                </th>
                <th className="px-4 py-3 text-left">
                  <a href={buildSortUrl('created_at')} className="flex items-center font-medium text-muted-foreground uppercase tracking-wider text-xs hover:text-foreground">
                    Created
                    <SortIcon column="created_at" />
                  </a>
                </th>
                <th className="px-4 py-3 text-left">
                  <a href={buildSortUrl('updated_at')} className="flex items-center font-medium text-muted-foreground uppercase tracking-wider text-xs hover:text-foreground">
                    Last Active
                    <SortIcon column="updated_at" />
                  </a>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const created = formatDate(user.created_at)
                  const updated = formatDate(user.updated_at)
                  const subscription = subscriptions[user.device_id]
                  
                  return (
                    <tr key={user.device_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <a 
                          href={`/devices/${user.device_id}`} 
                          className="font-mono text-xs hover:underline text-blue-600 whitespace-nowrap"
                        >
                          {user.device_id}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {user.device_name ? (
                          <span className="text-sm font-medium">{user.device_name}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Unnamed</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SubscriptionBadge 
                          status={subscription?.status} 
                          isLoading={isLoading} 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{created.date}</p>
                        <p className="text-xs text-muted-foreground">{created.time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{updated.date}</p>
                        <p className="text-xs text-muted-foreground">{updated.time}</p>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No premium users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{((page - 1) * pageSize) + 1}</span> to{' '}
          <span className="font-medium text-foreground">{Math.min(page * pageSize, total)}</span> of{' '}
          <span className="font-medium text-foreground">{total.toLocaleString()}</span>
        </div>
        
        {totalPages > 1 && (
          <nav className="flex items-center gap-1">
            <a 
              href={page > 1 ? buildUrl({ page: 1 }) : undefined}
              className={cn(
                "p-2 rounded-lg border text-sm transition-colors",
                page > 1 ? "border-border hover:bg-muted cursor-pointer" : "border-transparent text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </a>
            <a 
              href={page > 1 ? buildUrl({ page: page - 1 }) : undefined}
              className={cn(
                "p-2 rounded-lg border text-sm transition-colors",
                page > 1 ? "border-border hover:bg-muted cursor-pointer" : "border-transparent text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </a>
            
            {startPage > 1 && (
              <a href={buildUrl({ page: 1 })} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">1</a>
            )}
            {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
            
            {pageNumbers.map((p) => (
              <a 
                key={p}
                href={buildUrl({ page: p })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  p === page 
                    ? "bg-foreground text-background font-medium" 
                    : "border border-border hover:bg-muted"
                )}
              >
                {p}
              </a>
            ))}
            
            {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            {endPage < totalPages && (
              <a href={buildUrl({ page: totalPages })} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">{totalPages}</a>
            )}

            <a 
              href={page < totalPages ? buildUrl({ page: page + 1 }) : undefined}
              className={cn(
                "p-2 rounded-lg border text-sm transition-colors",
                page < totalPages ? "border-border hover:bg-muted cursor-pointer" : "border-transparent text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
            <a 
              href={page < totalPages ? buildUrl({ page: totalPages }) : undefined}
              className={cn(
                "p-2 rounded-lg border text-sm transition-colors",
                page < totalPages ? "border-border hover:bg-muted cursor-pointer" : "border-transparent text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          </nav>
        )}
      </div>
    </div>
  )
}

