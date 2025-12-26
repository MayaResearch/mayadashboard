"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

// Individual stat card with its own loading state
function StatCard({ 
  label, 
  endpoint, 
  icon, 
  color, 
  bgColor,
  formatValue,
  formatSubValue
}: {
  label: string
  endpoint: string
  icon: string
  color: string
  bgColor: string
  formatValue: (data: any) => string
  formatSubValue?: (data: any) => string
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error(`Failed to fetch ${label}:`, error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [endpoint, label])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  const subValue = formatSubValue ? formatSubValue(data) : null

  return (
    <div className="bg-card border border-border rounded-xl p-5 group">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all disabled:opacity-50"
              title="Refresh"
            >
              <svg 
                className={cn("w-3 h-3 text-muted-foreground", refreshing && "animate-spin")} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
          <p className="text-3xl font-bold mt-1 tracking-tight">{formatValue(data)}</p>
          {subValue && <p className={`text-xs mt-1 ${color} font-medium`}>{subValue}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            {icon === "smartphone" && <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />}
            {icon === "activity" && <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />}
            {icon === "crown" && <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />}
            {icon === "image" && <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />}
          </svg>
        </div>
      </div>
    </div>
  )
}

export function StatsCards() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Overview Stats</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Devices"
          endpoint="/api/stats/devices"
          icon="smartphone"
          color="text-blue-600"
          bgColor="bg-blue-500/10"
          formatValue={(d) => d?.total?.toLocaleString() || '0'}
          formatSubValue={(d) => d?.today ? `+${d.today} today` : undefined}
        />
        <StatCard
          label="Total Sessions"
          endpoint="/api/stats/sessions"
          icon="activity"
          color="text-violet-600"
          bgColor="bg-violet-500/10"
          formatValue={(d) => d?.total?.toLocaleString() || '0'}
          formatSubValue={(d) => d?.today ? `+${d.today} today` : undefined}
        />
        <StatCard
          label="Premium Users"
          endpoint="/api/stats/premium"
          icon="crown"
          color="text-amber-600"
          bgColor="bg-amber-500/10"
          formatValue={(d) => d?.total?.toLocaleString() || '0'}
        />
        <StatCard
          label="Image Generations"
          endpoint="/api/stats/generations"
          icon="image"
          color="text-emerald-600"
          bgColor="bg-emerald-500/10"
          formatValue={(d) => d?.total?.toLocaleString() || '0'}
          formatSubValue={(d) => d?.today ? `+${d.today.toLocaleString()} today` : undefined}
        />
      </div>
    </div>
  )
}

