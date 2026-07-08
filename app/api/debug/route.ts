import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cache = await prisma.fifeCache.findMany();
    const debugInfo: any = {};

    for (const c of cache) {
      if (c.key === 'matches') {
        const parsed = JSON.parse(c.value);
        debugInfo.matches = {
          count: parsed.length,
          stages: Array.from(new Set(parsed.map((m: any) => m.stage))),
          sample: parsed.slice(0, 2)
        };
      } else {
        const parsed = JSON.parse(c.value);
        debugInfo[c.key] = {
          count: parsed.length,
          sample: parsed.slice(0, 1)
        };
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || error });
  }
}
