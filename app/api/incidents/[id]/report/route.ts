import { NextRequest, NextResponse } from 'next/server';
import { generateIncidentReport, InvestigationNotCompleteError } from '@/lib/ai/report';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid incident id' }, { status: 400 });
    }

    const report = await generateIncidentReport(id);
    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    if (error instanceof InvestigationNotCompleteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // Report generation reads investigation data but never mutates it, so
    // a failure here never corrupts previously generated investigation or
    // fix results.
    console.error('Failed to generate incident report:', error);
    return NextResponse.json({ error: 'Failed to generate incident report' }, { status: 500 });
  }
}
