import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// IST Timezone constant
export const IST_TIMEZONE = 'Asia/Kolkata'

// Format date in IST
export function formatDateIST(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options
  })
}

// Format time in IST
export function formatTimeIST(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options
  })
}

// Format date and time in IST
export function formatDateTimeIST(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp * 1000).toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options
  })
}
