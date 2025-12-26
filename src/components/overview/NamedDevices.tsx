"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface DeviceMapEntry {
  id: number
  device_id: string
  device_name: string
  created_at: number
  updated_at: number
}

function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
      title="Refresh"
    >
      <svg 
        className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    </button>
  )
}

function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-xl animate-pulse">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function NamedDevices() {
  const [devices, setDevices] = useState<DeviceMapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const res = await fetch('/api/device-map')
      if (res.ok) {
        const data = await res.json()
        setDevices(data)
      }
    } catch (error) {
      console.error('Failed to fetch device map:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <Skeleton />
  }

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold">Named Devices</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{devices.length} devices</span>
          <RefreshButton onClick={() => fetchData(true)} loading={refreshing} />
        </div>
      </div>
      <div className="p-4">
        {devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {devices.map((device) => (
              <a 
                key={device.id}
                href={`/devices/${device.device_id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">{device.device_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{device.device_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{device.device_id.slice(0, 12)}...</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No named devices found</p>
          </div>
        )}
      </div>
    </div>
  )
}

