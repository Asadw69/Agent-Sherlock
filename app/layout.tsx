import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgentSherlock - AI Incident Investigation',
  description: 'Autonomous AI-powered root cause investigation for production incidents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-500/20 selection:text-blue-600 flex flex-col">
        <Navbar />
        <div className="flex-1 w-full flex flex-col">{children}</div>
      </body>
    </html>
  );
}

