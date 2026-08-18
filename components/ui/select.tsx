import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-white/20 bg-black/90 px-4 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:border-[#ff1053] focus-visible:ring-1 focus-visible:ring-[#ff1053] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 [color-scheme:dark]',
        className
      )}
      {...props}
    />
  )
);
Select.displayName = 'Select';

export { Select };
