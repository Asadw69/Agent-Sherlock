'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ParticleCanvas } from '@/components/landing/particle-canvas';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { useRevealOnScroll, reveal } from '@/hooks/use-reveal';
import { 
  ArrowUpRight, 
  GitBranch, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Cpu, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const heroRef = useRevealOnScroll<HTMLDivElement>();
  const featuresRef = useRevealOnScroll<HTMLDivElement>();
  const ctaRef = useRevealOnScroll<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-[#080104] text-white flex flex-col selection:bg-[#ff1053]/30 selection:text-[#ff1053]">
      
      {/* Red 3D Wavy Ball Hero Section */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden pt-28 pb-16">
        
        {/* Background Video Layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
        >
          <source src="https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/bg-red-ball.mp4" type="video/mp4" />
        </video>

        {/* Organic Radial Vignette Lighting Layer */}
        <div className="absolute inset-0 z-10 radial-vignette pointer-events-none" />

        {/* Particle Canvas Overlay */}
        <ParticleCanvas />

        {/* Hero Content Grid (12-Column Layout) */}
        <div ref={heroRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 w-full my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div 
                data-reveal 
                style={reveal(0, '12px')}
                className="inline-flex items-center gap-2"
              >
                <span className="text-xs sm:text-sm font-bold tracking-[0.3em] text-[#ff1053] uppercase">
                  WE INVESTIGATE
                </span>
              </div>

              <h1 
                data-reveal 
                style={reveal(80, '16px')}
                className="font-heading text-4xl sm:text-6xl lg:text-[76px] font-black text-white leading-[0.96] uppercase tracking-tight"
              >
                AUTONOMOUS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#ff1053]">
                  ROOT CAUSE
                </span> <br />
                ANALYSIS
              </h1>

              <p 
                data-reveal 
                style={reveal(160, '14px')}
                className="text-sm sm:text-base text-white/75 leading-relaxed max-w-md font-normal"
              >
                We craft immersive, agentic incident investigation workflows that correlate telemetry, Git commits, and code diffs to pinpoint system outages in seconds.
              </p>

              <div 
                data-reveal 
                style={reveal(240, '16px')}
                className="pt-2"
              >
                <Link href="/dashboard">
                  <button className="group relative inline-flex items-center gap-3 rounded-full border border-white/30 bg-black/40 px-7 py-3.5 text-xs sm:text-sm font-bold text-white uppercase tracking-wider backdrop-blur-md transition-all duration-300 hover:border-[#ff1053] hover:bg-[#ff1053]/20 hover:shadow-[0_0_30px_rgba(255,16,83,0.4)] active:scale-95">
                    <span>EXPLORE INCIDENTS</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Center Spacer (3 Cols) for 3D Morphing Ball visibility */}
            <div className="hidden lg:block lg:col-span-3 h-full pointer-events-none" />

            {/* Right Column (4 Cols) - Feature Card Stack */}
            <div className="lg:col-span-4 space-y-6">
              <div 
                data-reveal 
                style={reveal(320, '20px')}
                className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl space-y-6 shadow-2xl"
              >
                {/* Feature 01 */}
                <div className="group space-y-1.5 pb-5 border-b border-white/10 transition-all hover:border-[#ff1053]/50">
                  <div className="flex items-center justify-between text-xs font-bold font-mono">
                    <span className="text-[#ff1053]">01</span>
                    <span className="text-white/40 uppercase tracking-widest">INGEST &amp; CLUSTER</span>
                  </div>
                  <h4 className="font-heading font-extrabold text-base text-white uppercase group-hover:text-[#ff1053] transition-colors">
                    LOG CORRELATION
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed font-normal">
                    Filtering noise across thousands of server logs to isolate critical error signatures.
                  </p>
                </div>

                {/* Feature 02 */}
                <div className="group space-y-1.5 pb-5 border-b border-white/10 transition-all hover:border-[#ff1053]/50">
                  <div className="flex items-center justify-between text-xs font-bold font-mono">
                    <span className="text-[#ff1053]">02</span>
                    <span className="text-white/40 uppercase tracking-widest">GIT DIFF ANALYSIS</span>
                  </div>
                  <h4 className="font-heading font-extrabold text-base text-white uppercase group-hover:text-[#ff1053] transition-colors">
                    COMMIT MATCHING
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed font-normal">
                    Matching deployment timestamps directly to recent Git commits and code changes.
                  </p>
                </div>

                {/* Feature 03 */}
                <div className="group space-y-1.5 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold font-mono">
                    <span className="text-[#ff1053]">03</span>
                    <span className="text-white/40 uppercase tracking-widest">POSTMORTEM GENERATION</span>
                  </div>
                  <h4 className="font-heading font-extrabold text-base text-white uppercase group-hover:text-[#ff1053] transition-colors">
                    AUTOMATED FIXES
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed font-normal">
                    Delivering 3-tier remediation strategies and instant postmortem reports.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-20 md:py-32 bg-[#0c0307] border-t border-white/10 relative z-20">
        <div ref={featuresRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mx-auto max-w-3xl text-center mb-16 md:mb-20">
            <div 
              data-reveal 
              style={reveal(0, '12px')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff1053]/10 border border-[#ff1053]/30 text-[#ff1053] text-xs font-bold uppercase tracking-wider mb-5"
            >
              <Zap className="w-3.5 h-3.5" />
              Engineered for SREs &amp; Developers
            </div>
            <h2 
              data-reveal 
              style={reveal(80, '16px')}
              className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase leading-tight"
            >
              Everything you need to triage faster
            </h2>
            <p 
              data-reveal 
              style={reveal(160, '14px')}
              className="mt-4 text-base sm:text-lg text-white/70 font-normal"
            >
              Stop context switching between Datadog, GitHub, and Slack during an outage.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 - Big Span 2 */}
            <div 
              data-reveal 
              style={reveal(100, '20px')}
              className="md:col-span-2 group rounded-3xl border border-white/10 bg-black/50 p-8 sm:p-10 flex flex-col justify-between backdrop-blur-md shadow-2xl hover:border-[#ff1053]/40 transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#ff1053]/10 text-[#ff1053] flex items-center justify-center mb-6 border border-[#ff1053]/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase mb-3">
                  Intelligent Log Parsing &amp; Timeline Reconstruction
                </h3>
                <p className="text-white/70 text-base leading-relaxed font-normal">
                  Upload raw stack traces, web server logs, or JSON payloads. AgentSherlock filters noise, clusters error signatures, and plots a chronological event timeline automatically.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#ff1053] uppercase tracking-wider">
                <span>Multi-format support: .log, .txt, .json, .csv</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div 
              data-reveal 
              style={reveal(180, '20px')}
              className="md:col-span-1 group rounded-3xl border border-white/10 bg-black/50 p-8 sm:p-10 flex flex-col justify-between backdrop-blur-md shadow-2xl hover:border-[#ff1053]/40 transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#ff1053]/10 text-[#ff1053] flex items-center justify-center mb-6 border border-[#ff1053]/20 group-hover:scale-110 transition-transform">
                  <GitBranch className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase mb-3">
                  Git History Correlation
                </h3>
                <p className="text-white/70 text-sm leading-relaxed font-normal">
                  Inspects commits, author tags, and diff changes deployed right before the incident window to find the exact code change responsible.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#ff1053] uppercase tracking-wider">
                <span>Diff inspection</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 3 */}
            <div 
              data-reveal 
              style={reveal(260, '20px')}
              className="md:col-span-1 group rounded-3xl border border-white/10 bg-black/50 p-8 sm:p-10 flex flex-col justify-between backdrop-blur-md shadow-2xl hover:border-[#ff1053]/40 transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#ff1053]/10 text-[#ff1053] flex items-center justify-center mb-6 border border-[#ff1053]/20 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase mb-3">
                  Hypothesis Testing
                </h3>
                <p className="text-white/70 text-sm leading-relaxed font-normal">
                  The agent doesn&apos;t guess—it forms competing hypotheses and tests them against log lines, code traces, and timing evidence.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#ff1053] uppercase tracking-wider">
                <span>Multi-agent verification</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 4 - Big Span 2 */}
            <div 
              data-reveal 
              style={reveal(340, '20px')}
              className="md:col-span-2 group rounded-3xl border border-white/10 bg-black/50 p-8 sm:p-10 flex flex-col justify-between backdrop-blur-md shadow-2xl hover:border-[#ff1053]/40 transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#ff1053]/10 text-[#ff1053] flex items-center justify-center mb-6 border border-[#ff1053]/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase mb-3">
                  Actionable Fixes &amp; Automated Reports
                </h3>
                <p className="text-white/70 text-base leading-relaxed font-normal">
                  Get three-tier recommendations (Immediate mitigation, Long-term fix, and Monitoring metrics) plus one-click postmortem generation ready to export.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#ff1053] uppercase tracking-wider">
                <span>Export ready for Jira &amp; Notion</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-[#080104] relative z-20">
        <div ref={ctaRef} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div 
            data-reveal 
            style={reveal(0, '24px')}
            className="rounded-3xl bg-gradient-to-r from-[#ff1053] via-[#e6004c] to-rose-700 p-8 sm:p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="font-heading text-3xl sm:text-5xl font-black tracking-tight uppercase text-white">
                Ready to solve your next incident faster?
              </h2>
              <p className="text-base sm:text-lg text-white/90 font-normal leading-relaxed">
                Test AgentSherlock with our realistic built-in demo incident or upload your own logs right now.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" variant="white" className="w-full sm:w-auto font-black uppercase tracking-wider rounded-full hover:scale-105 transition-transform shadow-xl">
                    Open Dashboard
                  </Button>
                </Link>
                <Link href="/incidents/new" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white bg-black/20 hover:bg-black/40 font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
                    Create Incident
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080104] py-10 relative z-20 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="AgentSherlock" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
            <span className="font-heading font-bold text-white uppercase tracking-wider">AgentSherlock</span>
            <span>— AI Incident Root Cause Analysis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}




