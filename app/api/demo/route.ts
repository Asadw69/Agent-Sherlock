import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDemoIncident, DEMO_INCIDENT_ID } from '@/lib/demo';

/**
 * GET /api/demo - get (or create) the demo incident.
 *
 * Delegates to lib/demo.ts so this never diverges from the "Try Demo
 * Incident" button's behavior. This route used to fabricate its own fake
 * investigation/evidence/timeline independently of lib/actions.ts - that
 * hardcoded path has been removed; the real AI investigation (Session 3)
 * is the only way this incident gets an investigation now.
 */
export async function GET() {
  try {
    await getOrCreateDemoIncident();

    const incident = await prisma.incident.findUnique({
      where: { id: DEMO_INCIDENT_ID },
      include: {
        investigation: {
          include: {
            events: true,
            evidence: true,
            timelineEvents: true,
            hypotheses: true,
            suspiciousCommits: true,
            recommendedFix: true,
            report: true,
          },
        },
        uploadedFiles: true,
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Failed to get demo incident:', error);
    return NextResponse.json(
      { error: 'Failed to get demo incident' },
      { status: 500 }
    );
  }
}
