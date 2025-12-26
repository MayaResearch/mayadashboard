"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  status: string
  email: string
  contact: string
  created_at: number
  notes?: {
    device_id?: string
  }
}

function formatAmount(amountInPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amountInPaise / 100)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  })
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
      <div className="p-4 border-b border-border">
        <div className="h-5 w-64 bg-muted rounded" />
        <div className="h-3 w-48 bg-muted rounded mt-2" />
      </div>
      <div className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="pl-10 space-y-1">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PaidFreeUsers() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingDevices, setUpdatingDevices] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      // Use force refresh when manually refreshing to bypass cache
      const url = isRefresh ? '/api/paid-free-users?refresh=true' : '/api/paid-free-users'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Failed to fetch paid free users:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const markAsPremium = async (deviceId: string, paymentId: string) => {
    setUpdatingDevices(prev => new Set(prev).add(paymentId))
    
    try {
      const res = await fetch('/api/update-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      })
      
      if (res.ok) {
        // Remove the payment from the list
        setPayments(prev => prev.filter(p => p.id !== paymentId))
      } else {
        const error = await res.json()
        alert(`Failed to update: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to mark as premium:', error)
      alert('Failed to update device')
    } finally {
      setUpdatingDevices(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchData(true) // Always fetch fresh data on mount
  }, [fetchData])

  if (loading) {
    return <Skeleton />
  }

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-amber-600">🔄 Paid Users Need to Move to Premium</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {payments.length} user{payments.length !== 1 ? 's' : ''} who paid but are still on free tier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => fetchData(true)} loading={refreshing} />
        </div>
      </div>
      {payments.length > 0 ? (
        <div className="divide-y divide-border max-h-[600px] overflow-auto">
          {payments.map((payment) => {
            const isUpdating = updatingDevices.has(payment.id)
            const hasDeviceId = !!payment.notes?.device_id
            
            return (
              <div key={payment.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{formatAmount(payment.amount)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Needs Upgrade
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                    {hasDeviceId && (
                      <button
                        onClick={() => markAsPremium(payment.notes!.device_id!, payment.id)}
                        disabled={isUpdating}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                          "bg-emerald-600 text-white hover:bg-emerald-700",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isUpdating ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Updating...
                          </span>
                        ) : (
                          '✓ Mark Premium'
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs pl-10">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20">Device ID:</span>
                    {payment.notes?.device_id ? (
                      <a href={`/devices/${payment.notes.device_id}`} className="font-mono hover:underline text-blue-600">{payment.notes.device_id}</a>
                    ) : (
                      <span className="text-red-500 font-medium">No device ID attached</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20">Contact:</span>
                    <span>{payment.email && payment.email !== 'user@maya.ai' ? payment.email : ''} {payment.contact || ''}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-muted-foreground">All paid users are on premium! 🎉</p>
        </div>
      )}
    </div>
  )
}

