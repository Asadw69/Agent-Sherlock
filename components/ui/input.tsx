import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-white/20 bg-black/90 px-4 py-2.5 text-sm font-medium text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:border-[#ff1053] focus-visible:ring-1 focus-visible:ring-[#ff1053] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 [color-scheme:dark]',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
