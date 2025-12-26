"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"

// Define the payment type
export interface Payment {
  id: string
  order_id?: string
  device_id?: string
  device_name?: string
  email?: string
  contact?: string
  amount: number
  currency: string
  method: string
  vpa?: string
  status: string
  error_description?: string
  created_at: number
}

// Status color helper
function getStatusColor(status: string): string {
  switch (status) {
    case 'captured':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'refunded':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

// Format amount
function formatAmount(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

// Format date in IST
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

// Define columns
const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment ID" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-mono">{row.original.id.slice(4, 20)}</p>
        {row.original.order_id && (
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.order_id.slice(6, 18)}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "device_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Device" />
    ),
    cell: ({ row }) => {
      const deviceId = row.original.device_id
      const deviceName = row.original.device_name
      
      if (!deviceId) {
        return <span className="text-sm text-muted-foreground">No device linked</span>
      }
      
      return (
        <a href={`/devices/${deviceId}`} className="group">
          <p className="text-sm font-medium group-hover:underline">
            {deviceName || deviceId.slice(0, 12) + "..."}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{deviceId.slice(0, 8)}</p>
        </a>
      )
    },
    filterFn: (row, id, value) => {
      const deviceName = row.original.device_name?.toLowerCase() || ""
      const deviceId = row.original.device_id?.toLowerCase() || ""
      const searchValue = value.toLowerCase()
      return deviceName.includes(searchValue) || deviceId.includes(searchValue)
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.email || "—"}</p>
        <p className="text-xs text-muted-foreground">{row.original.contact || "—"}</p>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-semibold">{formatAmount(row.original.amount)}</p>
        <p className="text-xs text-muted-foreground">{row.original.currency}</p>
      </div>
    ),
  },
  {
    accessorKey: "method",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Method" />
    ),
    cell: ({ row }) => (
      <div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            {row.original.method === 'upi' && (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09l-6.9-3.46L12 4.18zM4 8.27l7 3.5v7.96l-7-3.5V8.27zm9 11.46v-7.96l7-3.5v7.96l-7 3.5z"/>
              </svg>
            )}
            {row.original.method === 'card' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3" />
              </svg>
            )}
            {!['upi', 'card'].includes(row.original.method) && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <span className="text-sm capitalize">{row.original.method}</span>
        </div>
        {row.original.vpa && (
          <p className="text-xs text-muted-foreground mt-0.5">{row.original.vpa}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <div>
        <span className={cn(
          "inline-flex items-center text-xs px-2 py-1 rounded-full border font-medium",
          getStatusColor(row.original.status)
        )}>
          {row.original.status}
        </span>
        {row.original.error_description && (
          <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={row.original.error_description}>
            {row.original.error_description}
          </p>
        )}
      </div>
    ),
    filterFn: (row, id, value) => {
      return row.original.status === value
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <p className="text-sm">{formatDate(row.original.created_at)}</p>
    ),
  },
]

interface PaymentsTableProps {
  data: Payment[]
}

export function PaymentsTable({ data }: PaymentsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="device_name"
      searchPlaceholder="Search by device..."
      pageSize={100}
    />
  )
}

