import { NextRequest, NextResponse } from 'next/server';
import { ZIMSEC_SHONA_CURRICULUM } from '@/lib/curriculum/zimsec-framework';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade');

  let data = ZIMSEC_SHONA_CURRICULUM;

  if (grade) {
    const gradeNum = parseInt(grade, 10);
    if (!isNaN(gradeNum)) {
      data = ZIMSEC_SHONA_CURRICULUM.filter((t) => t.gradeLevel === gradeNum);
    }
  }

  // Southern Africa edge optimization:
  // s-maxage=86400 (cache in Vercel Edge for 24h), stale-while-revalidate for 7 days
  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'public, s-maxage=604800',
    },
  });
}
