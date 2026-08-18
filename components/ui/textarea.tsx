import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[90px] w-full rounded-xl border border-white/20 bg-black/90 px-4 py-2.5 text-sm font-medium text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:border-[#ff1053] focus-visible:ring-1 focus-visible:ring-[#ff1053] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 [color-scheme:dark]',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
