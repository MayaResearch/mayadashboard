"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

interface ChartData {
  dates: string[]
  devices: number[]
  sessions: number[]
  generations: number[]
  payments: number[]
  revenue: number[]
}

declare global {
  interface Window {
    Chart: any
  }
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

function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-48 bg-muted rounded" />
      </div>
      <div className="h-64 bg-muted rounded" />
    </div>
  )
}

export function ChartsSection() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const chartsRef = useRef<{ [key: string]: any }>({})

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const res = await fetch('/api/daily-stats?days=14')
      if (res.ok) {
        const chartData = await res.json()
        setData(chartData)
      }
    } catch (error) {
      console.error('Failed to fetch daily stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!data || typeof window === 'undefined' || !window.Chart) return

    // Common chart options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { family: 'Manrope', size: 12 }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Manrope', size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: 'Manrope', size: 11 } }
        }
      }
    }

    // Destroy existing charts
    Object.values(chartsRef.current).forEach((chart: any) => chart?.destroy())

    // Sessions Chart
    const sessionsCanvas = document.getElementById('sessionsChart') as HTMLCanvasElement
    if (sessionsCanvas) {
      chartsRef.current.sessions = new window.Chart(sessionsCanvas, {
        type: 'line',
        data: {
          labels: data.dates,
          datasets: [
            {
              label: 'Sessions',
              data: data.sessions,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { display: false }
          }
        }
      })
    }

    // Generations Chart
    const generationsCanvas = document.getElementById('generationsChart') as HTMLCanvasElement
    if (generationsCanvas) {
      chartsRef.current.generations = new window.Chart(generationsCanvas, {
        type: 'bar',
        data: {
          labels: data.dates,
          datasets: [{
            label: 'Generations',
            data: data.generations,
            backgroundColor: '#10b981',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { display: false }
          }
        }
      })
    }

    // Payments Chart
    const paymentsCanvas = document.getElementById('paymentsChart') as HTMLCanvasElement
    if (paymentsCanvas) {
      chartsRef.current.payments = new window.Chart(paymentsCanvas, {
        type: 'bar',
        data: {
          labels: data.dates,
          datasets: [{
            label: 'Successful Payments',
            data: data.payments,
            backgroundColor: '#6366f1',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { display: false }
          }
        }
      })
    }

    // Revenue Chart
    const revenueCanvas = document.getElementById('revenueChart') as HTMLCanvasElement
    if (revenueCanvas) {
      chartsRef.current.revenue = new window.Chart(revenueCanvas, {
        type: 'line',
        data: {
          labels: data.dates,
          datasets: [{
            label: 'Revenue (₹)',
            data: data.revenue,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              ticks: {
                ...commonOptions.scales.y.ticks,
                callback: (value: number) => '₹' + value.toLocaleString('en-IN')
              }
            }
          }
        }
      })
    }

    return () => {
      Object.values(chartsRef.current).forEach((chart: any) => chart?.destroy())
    }
  }, [data])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton title="Sessions" />
        <ChartSkeleton title="Image Generations" />
        <ChartSkeleton title="Payments" />
        <ChartSkeleton title="Revenue" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Charts (Last 14 Days)</h2>
        <RefreshButton onClick={() => fetchData(true)} loading={refreshing} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Sessions</h3>
          <div className="h-64">
            <canvas id="sessionsChart"></canvas>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Image Generations</h3>
          <div className="h-64">
            <canvas id="generationsChart"></canvas>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Payments</h3>
          <div className="h-64">
            <canvas id="paymentsChart"></canvas>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Revenue</h3>
          <div className="h-64">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  )
}

