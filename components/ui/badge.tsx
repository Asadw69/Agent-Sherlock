import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
      default: 'border-transparent bg-[#ff1053] text-white shadow-md shadow-[#ff1053]/25 uppercase font-bold tracking-wider',
      secondary: 'border-white/10 bg-white/10 text-white/90 uppercase font-semibold tracking-wider',
      destructive:
        'border-[#ff1053]/40 bg-[#ff1053]/20 text-[#ff1053] font-bold uppercase tracking-wider',
      success:
        'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider',
      warning:
        'border-amber-500/40 bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider',
      outline: 'border-white/20 text-white/90 uppercase tracking-wider',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-all duration-150',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

