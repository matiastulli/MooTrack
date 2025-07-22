import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getConfidenceLevel(confidence) {
  if (confidence >= 0.9) return "high"
  if (confidence >= 0.8) return "medium"
  return "low"
}

export function getConfidenceColor(confidence) {
  if (confidence >= 0.9) return "text-cow-confirmed border-cow-confirmed bg-cow-confirmed/10"
  if (confidence >= 0.8) return "text-cow-pending border-cow-pending bg-cow-pending/10"
  return "text-cow-rejected border-cow-rejected bg-cow-rejected/10"
}