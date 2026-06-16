import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering so this route is never statically exported
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        }
      }
    }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, defaultSetName = 'Extension Saved Words' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const term = text.trim().slice(0, 200);
    const supabase = createSupabaseServer();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to the Vocab Learning app first.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const userId = session.user.id;

    const { data: existingSet } = await supabase
      .from('sets')
      .select('id')
      .eq('user_id', userId)
      .eq('name', defaultSetName)
      .single();

    let setId = existingSet?.id;

    if (!setId) {
      const { data: newSet, error: createError } = await supabase
        .from('sets')
        .insert([{
          user_id: userId,
          name: defaultSetName,
          description: 'Words saved from browser extension'
        }])
        .select()
        .single();

      if (createError || !newSet) {
        console.error('[API] Failed to create set:', createError?.message);
        return NextResponse.json(
          { error: 'Failed to create vocabulary set' },
          { status: 500, headers: CORS_HEADERS }
        );
      }
      setId = newSet.id;
    }

    const { data: existingWord } = await supabase
      .from('words')
      .select('id, term')
      .eq('set_id', setId)
      .eq('user_id', userId)
      .ilike('term', term)
      .single();

    if (existingWord) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        word: existingWord,
        message: `"${term}" is already in your vocabulary.`
      }, { headers: CORS_HEADERS });
    }

    const { data: newWord, error: insertError } = await supabase
      .from('words')
      .insert([{
        user_id: userId,
        set_id: setId,
        term,
        definition: '',
        phonetic: '',
        type: '',
        example: '',
        note: 'Added via browser extension',
        level: '',
        topic: ''
      }])
      .select()
      .single();

    if (insertError) {
      console.error('[API] Insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to save word' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      success: true,
      word: newWord,
      message: `"${term}" saved to "${defaultSetName}"`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.user.email,
        id: session.user.id
      }
    }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
