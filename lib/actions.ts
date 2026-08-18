'use server';

import { redirect } from 'next/navigation';
import { getOrCreateDemoIncident } from '@/lib/demo';

/**
 * Get or create the demo incident and redirect to it. See lib/demo.ts for
 * the shared creation logic (also used by GET /api/demo).
 */
export async function loadDemoIncident() {
  const incident = await getOrCreateDemoIncident();
  redirect(`/investigations/${incident.id}`);
}
