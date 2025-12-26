"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"

export interface SupportRequest {
  id: number
  device_id: string
  device_name?: string
  category: string
  message: string
  status: string
  created_at: number
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'bug':
      return 'bg-red-500/10 text-red-600 border-red-500/20'
    case 'feature':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    case 'feedback':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'resolved':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'closed':
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

const columns: ColumnDef<SupportRequest>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <p className="text-sm font-mono">#{row.original.id}</p>
    ),
  },
  {
    accessorKey: "device_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Device" />
    ),
    cell: ({ row }) => {
      const deviceName = row.original.device_name
      return (
        <a href={`/devices/${row.original.device_id}`} className="group">
          <p className="text-sm font-medium group-hover:underline">
            {deviceName || row.original.device_id.slice(0, 12) + "..."}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.device_id.slice(0, 8)}</p>
        </a>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => (
      <span className={cn(
        "inline-flex items-center text-xs px-2 py-1 rounded-full border font-medium capitalize",
        getCategoryColor(row.original.category)
      )}>
        {row.original.category === 'bug' && (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        {row.original.category === 'feature' && (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
        {row.original.category === 'feedback' && (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {row.original.category}
      </span>
    ),
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => (
      <p className="text-sm truncate max-w-[300px]" title={row.original.message}>
        {row.original.message}
      </p>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <span className={cn(
        "inline-flex items-center text-xs px-2 py-1 rounded-full border font-medium capitalize",
        getStatusColor(row.original.status)
      )}>
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm">
          {new Date(row.original.created_at * 1000).toLocaleDateString('en-IN', { dateStyle: 'short', timeZone: 'Asia/Kolkata' })}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(row.original.created_at * 1000).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    ),
  },
]

interface SupportTableProps {
  data: SupportRequest[]
}

export function SupportTable({ data }: SupportTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="message"
      searchPlaceholder="Search messages..."
      pageSize={100}
    />
  )
}

