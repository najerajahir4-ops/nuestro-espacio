import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://postgres.bdfadhxgcypxuqsnscqc:Elnajera2005%24%24_@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
process.env.DIRECT_URL = "postgresql://postgres.bdfadhxgcypxuqsnscqc:Elnajera2005%24%24_@aws-1-ca-central-1.pooler.supabase.com:5432/postgres";
process.env.FOOTBALL_DATA_API_KEY = "a9fbedca70844899803461999d1ad199";

const prisma = new PrismaClient();

async function main() {
  console.log('Querying raw database cache...');
  // We query the "FifeCache" table directly using raw SQL
  const cache: any = await prisma.$queryRaw`SELECT * FROM "FifeCache"`;
  console.log('Cache items count:', cache.length);
  for (const c of cache) {
    console.log(`KEY: ${c.key}, LENGTH: ${c.value.length}, UPDATED: ${c.updatedAt}`);
    if (c.key === 'matches') {
      const parsed = JSON.parse(c.value);
      console.log('MATCHES COUNT IN CACHE:', parsed.length);
      console.log('STAGES IN CACHE:', Array.from(new Set(parsed.map((m: any) => m.stage))));
      console.log('SAMPLE MATCH:', JSON.stringify(parsed[0], null, 2));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
