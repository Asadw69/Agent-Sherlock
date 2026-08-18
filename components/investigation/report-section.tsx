'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Copy, Check, Printer, Loader2, Sparkles } from 'lucide-react';

export interface ReportSectionProps {
  incidentId: string;
  incidentTitle: string;
  report: { content: string | null; summary: string; generatedAt: string | Date } | null;
  investigationCompleted: boolean;
}

export function ReportSection({ incidentId, incidentTitle, report, investigationCompleted }: ReportSectionProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (isGenerating) return; // guard against double-click
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/report`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate report');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to reach the server');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!report?.content) return;
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  }

  function handleDownload() {
    if (!report?.content) return;
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${incidentId}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    if (!report?.content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const escaped = report.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${incidentTitle} - Incident Report</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 820px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #0f172a; }
        h1 { font-size: 1.6rem; } h2 { font-size: 1.2rem; margin-top: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
        @media print { body { margin: 0; } }
      </style>
      </head><body><pre style="white-space: pre-wrap; font-family: inherit;">${escaped}</pre></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  if (!investigationCompleted) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white uppercase">
            <FileText className="h-5 w-5 text-[#ff1053]" />
            <span>Postmortem Incident Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ff1053] mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-white">
              Report Available Post-Investigation
            </p>
            <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
              Automated executive summary and root cause postmortem will unlock when the agent finishes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#ff1053]" />
          <CardTitle className="text-white uppercase font-bold tracking-wider">Postmortem Incident Report</CardTitle>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm" variant="gradient">
            {isGenerating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {isGenerating ? 'Synthesizing...' : report ? 'Regenerate' : 'Generate Report'}
          </Button>

          {report?.content && (
            <>
              <Button onClick={handleDownload} variant="secondary" size="sm" className="uppercase tracking-wider">
                <Download className="mr-1.5 h-3.5 w-3.5 text-[#ff1053]" />
                Markdown
              </Button>
              <Button onClick={handleCopy} variant="secondary" size="sm" className="uppercase tracking-wider">
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Copy className="mr-1.5 h-3.5 w-3.5 text-[#ff1053]" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="uppercase tracking-wider">
                <Printer className="mr-1.5 h-3.5 w-3.5 text-[#ff1053]" />
                PDF
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-xl border border-[#ff1053]/40 bg-[#ff1053]/15 p-3 text-xs text-[#ff1053]">
            {error}
          </div>
        )}

        {report?.content ? (
          <div className="max-h-[34rem] overflow-y-auto rounded-2xl border border-white/10 bg-black/50 p-5 sm:p-6 font-mono text-xs sm:text-sm text-white/90 leading-relaxed shadow-inner">
            <pre className="whitespace-pre-wrap font-sans">
              {report.content}
            </pre>
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ff1053] mb-3 border border-white/10">
              <Sparkles className="h-6 w-6 text-[#ff1053]" />
            </div>
            <p className="font-heading font-bold text-white uppercase">
              Ready to generate structured postmortem
            </p>
            <p className="mt-1 text-xs text-white/60 max-w-sm mx-auto mb-4 font-normal">
              Click &quot;Generate Report&quot; to produce a comprehensive markdown report with timeline, findings, and remediation.
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating} variant="gradient">
              {isGenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Generate Report Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

