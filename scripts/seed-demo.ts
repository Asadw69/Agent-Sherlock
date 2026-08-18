import { prisma } from '@/lib/prisma';
import { getOrCreateDemoIncident, DEMO_INCIDENT_ID } from '@/lib/demo';

/**
 * Seeds the demo incident via the same shared logic used by the "Try Demo
 * Incident" button and GET /api/demo (lib/demo.ts). No fake Investigation,
 * Evidence, or Timeline data is created - run an investigation via the
 * "Start AI Investigation" button (or POST
 * /api/incidents/demo-incident-001/investigate) after seeding.
 */
async function seedDemoIncident() {
  try {
    const existing = await prisma.incident.findUnique({ where: { id: DEMO_INCIDENT_ID } });
    if (existing) {
      console.log('Demo incident already exists');
      return;
    }

    const incident = await getOrCreateDemoIncident();

    console.log('✓ Demo incident created:', incident.id);
    console.log('✓ Registered demo log files and repository');
    console.log('\n✅ Demo incident seeded successfully!');
    console.log(`   Incident ID: ${DEMO_INCIDENT_ID}`);
    console.log('   Access at: http://localhost:3000/investigations/' + DEMO_INCIDENT_ID);
    console.log('   Then click "Start AI Investigation" to run the real agent against it.');
  } catch (error) {
    console.error('Failed to seed demo incident:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoIncident();
