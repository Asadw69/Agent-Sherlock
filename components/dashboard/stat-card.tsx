'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: string;
  colorScheme?: 'blue' | 'indigo' | 'amber' | 'emerald' | 'rose';
}

const colorMaps = {
  blue: 'bg-[#ff1053]/10 text-[#ff1053] border-[#ff1053]/30',
  indigo: 'bg-[#ff1053]/10 text-[#ff1053] border-[#ff1053]/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rose: 'bg-[#ff1053]/10 text-[#ff1053] border-[#ff1053]/30',
};

export function StatCard({ 
  label, 
  value, 
  icon, 
  description,
  colorScheme = 'rose'
}: StatCardProps) {
  const iconStyle = colorMaps[colorScheme] || colorMaps.rose;

  return (
    <Card className="group relative overflow-hidden border border-white/10 bg-[#0c0307] backdrop-blur-xl shadow-2xl hover:border-[#ff1053]/40 hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">
              {label}
            </p>
            <p className="mt-2.5 font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
              {value}
            </p>
            {description && (
              <p className="mt-2 text-xs font-medium text-white/60">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-2xl border ${iconStyle} transition-transform duration-200 group-hover:scale-110`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

