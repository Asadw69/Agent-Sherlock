import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startInvestigation, runInvestigation, InvestigationAlreadyRunningError } from '@/lib/ai/agent';
import { hasRequiredApiKey, requiredApiKeyEnvVar } from '@/lib/ai/provider';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid incident id' }, { status: 400 });
    }

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (!hasRequiredApiKey()) {
      return NextResponse.json(
        { error: `AI investigation is not configured on the server (missing ${requiredApiKeyEnvVar()}).` },
        { status: 503 }
      );
    }

    const { investigationId } = await startInvestigation(id);

    // Run the agent in the background. This process stays alive for the
    // duration of the local dev/production server, so the client can poll
    // GET /api/incidents/[id] for live status/events while this completes.
    runInvestigation(id, investigationId).catch((error) => {
      console.error('Unhandled investigation error:', error);
    });

    return NextResponse.json({ started: true, investigationId }, { status: 202 });
  } catch (error) {
    if (error instanceof InvestigationAlreadyRunningError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Failed to start investigation:', error);
    return NextResponse.json({ error: 'Failed to start investigation' }, { status: 500 });
  }
}
