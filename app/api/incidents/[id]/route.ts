import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid incident id' }, { status: 400 });
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        investigation: {
          include: {
            events: {
              orderBy: { timestamp: 'asc' },
            },
            evidence: true,
            timelineEvents: {
              orderBy: { timestamp: 'asc' },
            },
            recommendedFix: true,
            hypotheses: true,
            suspiciousCommits: true,
            report: true,
          },
        },
        uploadedFiles: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Failed to fetch incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}
