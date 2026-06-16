import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json(
        { error: 'Missing word parameter' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const term = word.trim().toLowerCase();
    const dictUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(term);
    const dictResponse = await fetch(dictUrl);

    if (!dictResponse.ok) {
      return NextResponse.json({
        found: false,
        term,
        phonetic: '',
        meanings: [],
        synonyms: [],
        antonyms: [],
        examples: [],
      }, { headers: CORS_HEADERS });
    }

    const data = await dictResponse.json();
    const entry = Array.isArray(data) ? data[0] : data;

    let phonetic = '';
    if (entry.phonetic) {
      phonetic = entry.phonetic;
    } else if (entry.phonetics) {
      for (const p of entry.phonetics) {
        if (p.text) { phonetic = p.text; break; }
      }
    }

    const meanings = [];
    const allSynonyms = new Set();
    const allAntonyms = new Set();
    const examples = [];
    let type = '';

    if (entry.meanings) {
      for (const m of entry.meanings) {
        if (!type && m.partOfSpeech) type = m.partOfSpeech;
        if (m.definitions) {
          for (const d of m.definitions) {
            if (d.definition) {
              meanings.push({ type: m.partOfSpeech || '', definition: d.definition });
            }
            if (d.example) examples.push(d.example);
            if (d.synonyms) d.synonyms.forEach(s => allSynonyms.add(s));
            if (d.antonyms) d.antonyms.forEach(a => allAntonyms.add(a));
          }
        }
        if (m.synonyms) m.synonyms.forEach(s => allSynonyms.add(s));
        if (m.antonyms) m.antonyms.forEach(a => allAntonyms.add(a));
      }
    }

    return NextResponse.json({
      found: true,
      term,
      phonetic,
      type,
      definition: meanings.length > 0 ? meanings[0].definition : '',
      meanings,
      examples,
      example: examples.length > 0 ? examples[0] : '',
      synonyms: [...allSynonyms].slice(0, 8),
      antonyms: [...allAntonyms].slice(0, 8),
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Dictionary API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
