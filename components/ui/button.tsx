import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = (variant?: string, size?: string) => {
  const baseStyles =
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none';

  const variants: Record<string, string> = {
    default: 'bg-[#ff1053] text-white shadow-sm hover:bg-[#e6004c]',
    gradient: 'bg-gradient-to-r from-[#ff1053] to-rose-700 text-white font-semibold tracking-wide shadow-sm hover:opacity-95',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30',
    destructive: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
    outline: 'border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-[#ff1053]/15 hover:border-[#ff1053]/50 hover:text-white',
    ghost: 'text-white/70 hover:bg-white/10 hover:text-white',
    white: 'bg-white text-black font-semibold hover:bg-slate-100',
  };

  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8.5 rounded-lg px-3 text-xs',
    lg: 'h-12 rounded-xl px-6 text-base font-semibold',
    icon: 'h-10 w-10',
  };

  return cn(
    baseStyles,
    variants[variant || 'default'],
    sizes[size || 'default']
  );
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gradient' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'white';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants(variant, size), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };

