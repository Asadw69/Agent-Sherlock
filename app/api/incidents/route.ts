import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const CreateIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  serviceName: z.string().min(1, 'Service name is required').max(255),
  deploymentVersion: z.string().max(255).optional().nullable(),
  deploymentTimestamp: z.string().datetime().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = CreateIncidentSchema.parse(body);

    // Create incident in database
    const incident = await prisma.incident.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        serviceName: validatedData.serviceName,
        deploymentVersion: validatedData.deploymentVersion || null,
        deploymentTimestamp: validatedData.deploymentTimestamp
          ? new Date(validatedData.deploymentTimestamp)
          : null,
        status: 'READY',
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Failed to create incident:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid incident data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        investigation: {
          select: {
            id: true,
            status: true,
            confidence: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
