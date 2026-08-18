import path from 'path';
import { prisma } from '@/lib/prisma';

export const DEMO_INCIDENT_ID = 'demo-incident-001';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Gets or creates the demo incident and registers its real uploaded files
 * (uploads/demo-incident-001/database.log, payment-api.log, repo/).
 *
 * Intentionally does NOT create any fake Investigation/Evidence/Timeline
 * data - the Session 3 AI agent investigates the real files and must reach
 * its own conclusion. This is the single source of truth for demo-incident
 * creation; both the "Try Demo Incident" server action and the /api/demo
 * route call this instead of each hardcoding their own version (the old
 * /api/demo route used to fabricate a fake investigation independently).
 */
export async function getOrCreateDemoIncident() {
  let incident = await prisma.incident.findUnique({ where: { id: DEMO_INCIDENT_ID } });

  if (incident) {
    return incident;
  }

  incident = await prisma.incident.create({
    data: {
      id: DEMO_INCIDENT_ID,
      title: 'Payment API Outage - Deployment v2.4.1',
      description:
        'Payment service deployment v2.4.1 caused API outage starting at 14:02 UTC. Users unable to process payments for 14 minutes. Service recovered after manual intervention.',
      severity: 'CRITICAL',
      serviceName: 'payment-service',
      deploymentVersion: 'v2.4.1',
      deploymentTimestamp: new Date('2026-08-15T14:02:00Z'),
      status: 'READY',
    },
  });

  const incidentDir = path.join(UPLOAD_DIR, DEMO_INCIDENT_ID);
  const repoDir = path.join(incidentDir, 'repo');

  await prisma.uploadedFile.createMany({
    data: [
      {
        incidentId: DEMO_INCIDENT_ID,
        filename: 'database.log',
        originalName: 'database.log',
        filePath: path.join(incidentDir, 'database.log'),
        fileType: 'log',
        mimeType: 'text/plain',
        size: 1854,
      },
      {
        incidentId: DEMO_INCIDENT_ID,
        filename: 'payment-api.log',
        originalName: 'payment-api.log',
        filePath: path.join(incidentDir, 'payment-api.log'),
        fileType: 'log',
        mimeType: 'text/plain',
        size: 1751,
      },
      {
        incidentId: DEMO_INCIDENT_ID,
        filename: 'repository-demo',
        originalName: 'payment-service.zip',
        filePath: repoDir,
        fileType: 'repository',
        mimeType: 'application/zip',
        size: 0,
      },
    ],
  });

  return incident;
}
