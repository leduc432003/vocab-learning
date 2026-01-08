const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

/**
 * Search for an image on Pexels API
 * @param {string} query - The search term
 * @returns {Promise<string|'RATE_LIMIT'|null>} - The URL of the image or null / error code
 */
const searchPexelsImage = async (query) => {
    if (!query) return null;

    try {
        // Pexels uses standard URL encoding (spaces as %20)
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        });

        if (response.status === 429) {
            console.warn('Pexels Rate Limit Exceeded');
            return 'RATE_LIMIT';
        }

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.medium;
        }

        console.log(`[Pexels] No photos found for query: "${query}"`);
        return null;
    } catch (error) {
        console.error('Error fetching Pexels image:', error);
        return null;
    }
};

/**
 * Search for an image on Unsplash API (Fallback)
 * @param {string} query - The search term
 * @returns {Promise<string|null>} - The URL of the image or null
 */
const searchUnsplashImage = async (query) => {
    if (!query || !UNSPLASH_ACCESS_KEY) return null;

    try {
        // Encode query and replace %20 with + for proper URL formatting
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        // Use random photo endpoint with query as recommended in documentation
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodedQuery}&client_id=${UNSPLASH_ACCESS_KEY}`);

        if (!response.ok) {
            console.warn('Unsplash API Error:', response.status);
            return null;
        }

        const data = await response.json();

        // If data is an array (when count > 1 is requested), but here it should be a single object
        if (data && data.urls) {
            return data.urls.regular;
        }

        return null;
    } catch (error) {
        console.error('Error fetching Unsplash image:', error);
        return null;
    }
};

/**
 * Search for an image on Pixabay API
 * @param {string} query - The search term
 * @returns {Promise<string|null>} - The URL of the image or null
 */
const searchPixabayImage = async (query) => {
    console.log(`[Pixabay] Called with query: "${query}", API Key exists: ${!!PIXABAY_API_KEY}`);

    if (!query || !PIXABAY_API_KEY) {
        console.warn('[Pixabay] Skipped - Missing query or API key');
        return null;
    }

    try {
        // Encode query and replace %20 with + for proper URL formatting
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodedQuery}&image_type=photo&per_page=3&safesearch=true`;
        console.log(`[Pixabay] Fetching: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.warn('[Pixabay] API Error:', response.status);
            return null;
        }

        const data = await response.json();
        console.log(`[Pixabay] Response:`, data);

        if (data.hits && data.hits.length > 0) {
            // Get the first hit's webformatURL (max 640px)
            console.log(`[Pixabay] Found ${data.hits.length} images for "${query}"`);
            return data.hits[0].webformatURL;
        }

        console.log(`[Pixabay] No images found for query: "${query}"`);
        return null;
    } catch (error) {
        console.error('[Pixabay] Error fetching image:', error);
        return null;
    }
};

/**
 * Main search function that calls APIs directly from the client
 * @param {string} term - The word to search
 * @param {string} [topic] - Optional topic
 * @returns {Promise<string|null>} - The URL of the image
 */
export const searchImage = async (term, topic) => {
    if (!term) return null;

    const cleanTerm = (t) => t.trim();
    const t = cleanTerm(term);
    const searchCombined = topic ? `${topic.trim()} ${t}` : t;

    console.log(`[Image] Initiating search for: "${t}" | Topic: "${topic || 'N/A'}"`);

    // Priority 1: Pexels (Term only)
    let url = await searchPexelsImage(t);

    // Priority 2: Unsplash (Topic + Term) if Pexels fails or hits rate limit
    if (!url || url === 'RATE_LIMIT') {
        console.log(`[Image] Pexels skipped or limited, trying Unsplash...`);
        url = await searchUnsplashImage(searchCombined);
    }

    // Priority 3: Pixabay (Topic + Term) as last resort
    if (!url) {
        console.log(`[Image] Unsplash failed, trying Pixabay fallback...`);
        url = await searchPixabayImage(searchCombined);
    }

    return url;
};

/**
 * Automatically find images for a list of words
 */
export const fillMissingImages = async (vocabulary, onProgress) => {
    const updated = [];
    const failed = [];
    const missingWords = vocabulary.filter(w => !w.image && w.term);
    const total = missingWords.length;
    let count = 0;

    const cleanSearchTerm = (term) => {
        return term
            .replace(/\s*\(.*?\)\s*/g, '')
            .replace(/\s*\[.*?\]\s*/g, '')
            .replace(/^to\s+/i, '')
            .replace(/^(a|an|the)\s+/i, '')
            .replace(/[^a-zA-Z0-9\s-]/g, ' ')
            .trim();
    };

    for (const word of missingWords) {
        let searchTerm = cleanSearchTerm(word.term);
        if (!searchTerm) searchTerm = word.term;

        const result = await searchImage(searchTerm, word.topic);

        if (result) {
            updated.push({ id: word.id, image: result });
        } else {
            failed.push(word.term);
        }

        count++;
        if (onProgress) onProgress(count, total);

        // Delay to avoid hitting strict rate limits of free tiers
        await new Promise(r => setTimeout(r, 1200));
    }
    return { updated, failed };
};
