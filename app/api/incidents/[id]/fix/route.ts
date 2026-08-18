import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendedFix, InvestigationNotReadyError } from '@/lib/ai/fix';
import { hasRequiredApiKey, requiredApiKeyEnvVar } from '@/lib/ai/provider';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid incident id' }, { status: 400 });
    }

    if (!hasRequiredApiKey()) {
      return NextResponse.json(
        { error: `AI fix generation is not configured on the server (missing ${requiredApiKeyEnvVar()}).` },
        { status: 503 }
      );
    }

    const fix = await generateRecommendedFix(id);
    return NextResponse.json({ fix }, { status: 200 });
  } catch (error) {
    if (error instanceof InvestigationNotReadyError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // Fix generation failures never touch the Investigation row, so the
    // investigation's own results remain intact regardless of this error.
    console.error('Failed to generate recommended fix:', error);
    return NextResponse.json({ error: 'Failed to generate recommended fix' }, { status: 500 });
  }
}
