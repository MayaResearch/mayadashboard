"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"

export interface Device {
  id: number
  device_id: string
  device_name?: string
  expo_notification_id: string | null
  created_at: number
  updated_at: number
  images_limit: number
  user_type: string
}

const columns: ColumnDef<Device>[] = [
  {
    accessorKey: "device_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Device ID" />
    ),
    cell: ({ row }) => (
      <p className="text-sm font-mono">{row.original.device_id}</p>
    ),
  },
  {
    accessorKey: "user_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User Type" />
    ),
    cell: ({ row }) => {
      const isPremium = row.original.user_type === 'premium_user'
      return (
        <span className={cn(
          "inline-flex items-center text-xs px-2 py-1 rounded-full border font-medium",
          isPremium 
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : "bg-gray-500/10 text-gray-600 border-gray-500/20"
        )}>
          {row.original.user_type?.replace('_', ' ') || 'unknown'}
        </span>
      )
    },
  },
  {
    accessorKey: "images_limit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Images Limit" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{row.original.images_limit}</span>
        <span className="text-xs text-muted-foreground">images</span>
      </div>
    ),
  },
  {
    accessorKey: "expo_notification_id",
    header: "Notifications",
    cell: ({ row }) => (
      row.original.expo_notification_id ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Enabled
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Not enabled</span>
      )
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
          {new Date(row.original.created_at * 1000).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(row.original.created_at * 1000).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <a 
        href={`/devices/${row.original.device_id}`}
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        View
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    ),
  },
]

interface DevicesTableProps {
  data: Device[]
}

export function DevicesTable({ data }: DevicesTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="device_id"
      searchPlaceholder="Search by device ID..."
      pageSize={100}
    />
  )
}

