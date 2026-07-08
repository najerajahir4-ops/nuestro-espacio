import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cache = await prisma.fifeCache.findMany();
  console.log('CACHE KEYS:', cache.map(c => c.key));
  for (const c of cache) {
    console.log(`KEY: ${c.key}, LENGTH: ${c.value.length}`);
    if (c.key === 'matches') {
      const parsed = JSON.parse(c.value);
      console.log('MATCHES COUNT:', parsed.length);
      console.log('FIRST 3 MATCHES:', JSON.stringify(parsed.slice(0, 3), null, 2));
      console.log('MATCH STAGES IN CACHE:', Array.from(new Set(parsed.map((m: any) => m.stage))));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
