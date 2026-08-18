import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    LOW: 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30',
    MEDIUM: 'text-amber-400 bg-amber-500/15 border border-amber-500/30',
    HIGH: 'text-rose-400 bg-rose-500/15 border border-rose-500/30',
    CRITICAL: 'text-[#ff1053] bg-[#ff1053]/20 border border-[#ff1053]/40 font-bold',
  };
  return colors[severity?.toUpperCase()] || colors.LOW;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-white/60 bg-white/10 border border-white/10',
    in_progress: 'text-[#ff1053] bg-[#ff1053]/15 border border-[#ff1053]/30',
    completed: 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30',
    failed: 'text-[#ff1053] bg-[#ff1053]/20 border border-[#ff1053]/40',
  };
  return colors[status?.toLowerCase()] || colors.pending;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence)}%`;
}
