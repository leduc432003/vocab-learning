import { NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

const searchPexelsImage = async (query) => {
    if (!query || !PEXELS_API_KEY) return null;
    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.photos?.[0]?.src?.medium || null;
    } catch (e) { return null; }
};

const searchPixabayImage = async (query) => {
    if (!query || !PIXABAY_API_KEY) return null;
    try {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodedQuery}&image_type=photo&per_page=3&safesearch=true`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.hits?.[0]?.webformatURL || null;
    } catch (e) { return null; }
};

const searchUnsplashImage = async (query) => {
    if (!query || !UNSPLASH_ACCESS_KEY) return null;
    try {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodedQuery}&client_id=${UNSPLASH_ACCESS_KEY}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.urls?.regular || null;
    } catch (e) { return null; }
};

export async function POST(request) {
    try {
        const { term, topic } = await request.json();
        if (!term) return NextResponse.json({ error: 'Missing term' }, { status: 400 });

        const searchCombined = topic ? `${topic} ${term}` : term;

        // Priority: Pexels -> Pixabay -> Unsplash
        let url = await searchPexelsImage(term);
        if (!url) url = await searchPixabayImage(searchCombined);
        if (!url) url = await searchUnsplashImage(searchCombined);

        return NextResponse.json({ url });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
