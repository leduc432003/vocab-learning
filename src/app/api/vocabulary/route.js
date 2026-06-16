import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Xác thực qua Bearer token (dùng cho extension)
async function getSessionFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Trả về object giống session để dùng chung logic
  return { user, access_token: token, supabase };
}

// Xác thực qua cookie (dùng cho web app)
async function getSessionFromCookie() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return { user: session.user, access_token: session.access_token, supabase };
  } catch {
    return null;
  }
}

// Lấy Supabase client với token để thực hiện query
function getSupabaseWithToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
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

    // Thử token trước (extension), sau đó cookie (web)
    const auth = await getSessionFromToken(request) || await getSessionFromCookie();

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Vui lòng đăng nhập vào app trước.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const { user, access_token } = auth;
    const userId = user.id;
    const supabase = getSupabaseWithToken(access_token);
    const term = text.trim().slice(0, 200);

    // Tìm hoặc tạo set mặc định
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

    // Kiểm tra trùng lặp
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
        message: `"${term}" đã có trong từ vựng của bạn.`
      }, { headers: CORS_HEADERS });
    }

    // Thêm từ mới
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
      message: `"${term}" đã được lưu vào "${defaultSetName}"`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET(request) {
  try {
    const auth = await getSessionFromToken(request) || await getSessionFromCookie();

    if (!auth) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: auth.user.email,
        id: auth.user.id
      }
    }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
