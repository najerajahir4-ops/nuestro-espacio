import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper to parse RSS XML without dependencies
function parseMarcaRSS(xmlText: string) {
  const items: any[] = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
  if (!itemMatches) return items;

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';

    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const link = linkMatch ? linkMatch[1] : '';

    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const pubDate = pubDateMatch ? pubDateMatch[1] : '';

    let descriptionMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    let description = descriptionMatch ? descriptionMatch[1] : '';
    description = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    // Find image url (Marca RSS uses enclosure)
    let imageUrl = '';
    const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]*)"/i);
    if (enclosureMatch) {
      imageUrl = enclosureMatch[1];
    } else {
      const mediaContentMatch = itemXml.match(/<media:content[^>]*url="([^"]*)"/i);
      if (mediaContentMatch) {
        imageUrl = mediaContentMatch[1];
      }
    }

    if (title && link) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        description: description.length > 150 ? description.substring(0, 150) + '...' : description,
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop'
      });
    }
  }
  return items.slice(0, 10); // Return top 10 news items
}

// Mock Scorers in case API key is missing or fails (World Cup Theme)
const mockScorers = [
  { player: { name: 'Kylian Mbappé' }, team: { name: 'Francia', crest: 'https://crests.getfootballapi.com/crest/fra.png' }, goals: 8 },
  { player: { name: 'Lionel Messi' }, team: { name: 'Argentina', crest: 'https://crests.getfootballapi.com/crest/arg.png' }, goals: 7 },
  { player: { name: 'Olivier Giroud' }, team: { name: 'Francia', crest: 'https://crests.getfootballapi.com/crest/fra.png' }, goals: 4 },
  { player: { name: 'Julián Álvarez' }, team: { name: 'Argentina', crest: 'https://crests.getfootballapi.com/crest/arg.png' }, goals: 4 },
  { player: { name: 'Richarlison' }, team: { name: 'Brasil', crest: 'https://crests.getfootballapi.com/crest/bra.png' }, goals: 3 }
];

// Mock Matches in case API key is missing or fails (World Cup Theme)
const mockMatches = [
  {
    id: 1,
    utcDate: '2022-12-18T15:00:00Z',
    status: 'FINISHED',
    homeTeam: { name: 'Argentina', crest: 'https://crests.getfootballapi.com/crest/arg.png' },
    awayTeam: { name: 'Francia', crest: 'https://crests.getfootballapi.com/crest/fra.png' },
    score: { fullTime: { home: 3, away: 3 } } // Final score (went to pens)
  },
  {
    id: 2,
    utcDate: '2022-12-17T15:00:00Z',
    status: 'FINISHED',
    homeTeam: { name: 'Croacia', crest: 'https://crests.getfootballapi.com/crest/cro.png' },
    awayTeam: { name: 'Marruecos', crest: 'https://crests.getfootballapi.com/crest/mar.png' },
    score: { fullTime: { home: 2, away: 1 } }
  },
  {
    id: 3,
    utcDate: '2022-12-14T19:00:00Z',
    status: 'FINISHED',
    homeTeam: { name: 'Francia', crest: 'https://crests.getfootballapi.com/crest/fra.png' },
    awayTeam: { name: 'Marruecos', crest: 'https://crests.getfootballapi.com/crest/mar.png' },
    score: { fullTime: { home: 2, away: 0 } }
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const cacheExpiryTime = 24 * 60 * 60 * 1000; // 24 hours

    // 1. Fetch News (RSS) - We cache this in DB too
    let newsData: any[] = [];
    const newsCache = await prisma.fifeCache.findUnique({ where: { key: 'news' } });
    
    if (newsCache && (now.getTime() - new Date(newsCache.updatedAt).getTime() < cacheExpiryTime)) {
      newsData = JSON.parse(newsCache.value);
    } else {
      try {
        const rssRes = await fetch('https://e00-marca.uecdn.es/rss/futbol/primera-division.xml', { next: { revalidate: 3600 } });
        if (rssRes.ok) {
          const xml = await rssRes.text();
          newsData = parseMarcaRSS(xml);
          await prisma.fifeCache.upsert({
            where: { key: 'news' },
            update: { value: JSON.stringify(newsData) },
            create: { key: 'news', value: JSON.stringify(newsData) }
          });
        }
      } catch (err) {
        console.error('Error fetching RSS news', err);
        if (newsCache) newsData = JSON.parse(newsCache.value);
      }
    }

    // 2. Fetch Scorers & Matches
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    let scorersData = mockScorers;
    let matchesData = mockMatches;
    let usingMockData = !apiKey;

    const scorersCache = await prisma.fifeCache.findUnique({ where: { key: 'scorers' } });
    const matchesCache = await prisma.fifeCache.findUnique({ where: { key: 'matches' } });

    const isScorersValid = scorersCache && (now.getTime() - new Date(scorersCache.updatedAt).getTime() < cacheExpiryTime);
    const isMatchesValid = matchesCache && (now.getTime() - new Date(matchesCache.updatedAt).getTime() < cacheExpiryTime);

    if (isScorersValid && isMatchesValid) {
      scorersData = JSON.parse(scorersCache!.value);
      matchesData = JSON.parse(matchesCache!.value);
      usingMockData = scorersCache!.value.includes('mock') || !apiKey; // Flag if cached was mock
    } else if (apiKey) {
      // Fetch fresh data from API
      try {
        const headers = { 'X-Auth-Token': apiKey };
        
        // Fetch scorers
        const scorersRes = await fetch('https://api.football-data.org/v4/competitions/WC/scorers?limit=10', { headers, next: { revalidate: 3600 } });
        if (scorersRes.ok) {
          const resJson = await scorersRes.json();
          scorersData = resJson.scorers || mockScorers;
          await prisma.fifeCache.upsert({
            where: { key: 'scorers' },
            update: { value: JSON.stringify(scorersData) },
            create: { key: 'scorers', value: JSON.stringify(scorersData) }
          });
        }

        // Fetch matches (limit to World Cup matches)
        const matchesRes = await fetch('https://api.football-data.org/v4/competitions/WC/matches', { headers, next: { revalidate: 3600 } });
        if (matchesRes.ok) {
          const resJson = await matchesRes.json();
          matchesData = resJson.matches ? resJson.matches.slice(0, 15) : mockMatches;
          await prisma.fifeCache.upsert({
            where: { key: 'matches' },
            update: { value: JSON.stringify(matchesData) },
            create: { key: 'matches', value: JSON.stringify(matchesData) }
          });
        }
        usingMockData = false;
      } catch (err) {
        console.error('Error calling football API', err);
        if (scorersCache) scorersData = JSON.parse(scorersCache.value);
        if (matchesCache) matchesData = JSON.parse(matchesCache.value);
      }
    } else {
      // No API Key, write mock to DB to establish cache
      await prisma.fifeCache.upsert({
        where: { key: 'scorers' },
        update: { value: JSON.stringify(mockScorers) },
        create: { key: 'scorers', value: JSON.stringify(mockScorers) }
      });
      await prisma.fifeCache.upsert({
        where: { key: 'matches' },
        update: { value: JSON.stringify(mockMatches) },
        create: { key: 'matches', value: JSON.stringify(mockMatches) }
      });
      usingMockData = true;
    }

    return NextResponse.json({
      success: true,
      news: newsData,
      scorers: scorersData,
      matches: matchesData,
      usingMockData
    });
  } catch (error) {
    console.error('Fife API error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
