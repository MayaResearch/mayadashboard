"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"

export interface Session {
  id: number
  session_id: string
  device_id: string
  device_name?: string
  total_generations: number
  duration_seconds: number
  status: string
  created_at: number
  is_listened: number
}

const columns: ColumnDef<Session>[] = [
  {
    accessorKey: "session_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Session ID" />
    ),
    cell: ({ row }) => (
      <p className="text-sm font-mono">{row.original.session_id.slice(0, 16)}...</p>
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
    accessorKey: "total_generations",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Generations" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{row.original.total_generations}</span>
        {row.original.total_generations > 0 && (
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        )}
      </div>
    ),
  },
  {
    accessorKey: "duration_seconds",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.duration_seconds}s</p>
        <p className="text-xs text-muted-foreground">{Math.round(row.original.duration_seconds / 60)}m</p>
      </div>
    ),
  },
  {
    accessorKey: "is_listened",
    header: "Listened",
    cell: ({ row }) => (
      row.original.is_listened ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Yes
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">No</span>
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
          {new Date(row.original.created_at * 1000).toLocaleDateString('en-IN', { dateStyle: 'short', timeZone: 'Asia/Kolkata' })}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(row.original.created_at * 1000).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    ),
  },
]

interface SessionsTableProps {
  data: Session[]
}

export function SessionsTable({ data }: SessionsTableProps) {
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

