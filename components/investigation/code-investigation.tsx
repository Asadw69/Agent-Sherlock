'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCommit, Lightbulb, Code2, Check, X, FileCode, Sparkles } from 'lucide-react';

export interface SuspiciousCommitDTO {
  id: string;
  commitHash: string;
  message: string;
  author: string | null;
  timestamp: string | null;
  relevance: string;
  changedFiles: string[];
}

export interface HypothesisDTO {
  id: string;
  title: string;
  description: string;
  status: string;
  supportingEvidence: string | null;
  contradictingEvidence: string | null;
}

const statusColor: Record<string, string> = {
  LIKELY: 'border-[#ff1053]/40 bg-[#ff1053]/20 text-[#ff1053] font-bold uppercase tracking-wider',
  POSSIBLE: 'border-amber-500/40 bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider',
  UNLIKELY: 'border-white/10 bg-white/10 text-white/50 font-bold uppercase tracking-wider',
};

export function CodeInvestigationSection({
  commits,
  hypotheses,
}: {
  commits: SuspiciousCommitDTO[];
  hypotheses: HypothesisDTO[];
}) {
  if (commits.length === 0 && hypotheses.length === 0) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white uppercase">
            <Code2 className="h-5 w-5 text-[#ff1053]" />
            <span>Code Diff &amp; Hypotheses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ff1053] mb-3">
              <Code2 className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-white">
              No Code Anomalies Identified Yet
            </p>
            <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
              The agent inspects recent Git commits and verifies hypotheses during active analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-[#ff1053]" />
          <CardTitle className="text-white uppercase font-bold tracking-wider">Code Analysis &amp; Hypotheses</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Suspicious Commits */}
        {commits.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff1053]">
              <GitCommit className="h-4 w-4" />
              <span>Suspicious Commits ({commits.length})</span>
            </div>

            <div className="space-y-3">
              {commits.map((c) => (
                <div 
                  key={c.id} 
                  className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 shadow-xl backdrop-blur-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#ff1053] bg-[#ff1053]/15 px-2 py-0.5 rounded-md border border-[#ff1053]/30">
                        {c.commitHash.slice(0, 10)}
                      </span>
                      {c.author && (
                        <span className="text-xs font-medium text-white/80">
                          by {c.author}
                        </span>
                      )}
                    </div>
                    {c.timestamp && (
                      <span className="text-xs font-mono text-white/40">
                        {c.timestamp}
                      </span>
                    )}
                  </div>

                  <p className="font-heading text-sm font-bold text-white uppercase mb-1">
                    {c.message}
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed mb-3 font-normal">
                    {c.relevance}
                  </p>

                  {c.changedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                      {c.changedFiles.slice(0, 8).map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white border border-white/10"
                        >
                          <FileCode className="h-3 w-3 text-[#ff1053]" />
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hypotheses Matrix */}
        {hypotheses.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff1053]">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>Evaluated Hypotheses ({hypotheses.length})</span>
            </div>

            <div className="space-y-3">
              {hypotheses.map((h) => (
                <div 
                  key={h.id} 
                  className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 shadow-xl backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h5 className="font-heading font-bold text-sm text-white uppercase">
                      {h.title}
                    </h5>
                    <Badge className={statusColor[h.status] || statusColor.POSSIBLE}>
                      {h.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-white/70 mb-3 leading-relaxed">
                    {h.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {h.supportingEvidence && (
                      <div className="flex items-start gap-2 rounded-xl bg-emerald-500/15 p-2.5 border border-emerald-500/30">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-emerald-200 leading-snug">
                          {h.supportingEvidence}
                        </span>
                      </div>
                    )}
                    {h.contradictingEvidence && (
                      <div className="flex items-start gap-2 rounded-xl bg-[#ff1053]/15 p-2.5 border border-[#ff1053]/30">
                        <X className="h-3.5 w-3.5 text-[#ff1053] shrink-0 mt-0.5" />
                        <span className="text-[#ff1053] leading-snug">
                          {h.contradictingEvidence}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

