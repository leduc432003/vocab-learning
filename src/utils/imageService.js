const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

/**
 * Search for an image on Pexels API
 * @param {string} query - The search term
 * @returns {Promise<string|'RATE_LIMIT'|null>} - The URL of the image or null / error code
 */
const searchPexelsImage = async (query) => {
    if (!query) return null;

    try {
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
        // Use random photo endpoint with query as recommended in documentation
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`);

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
 * Main search function that tries Pexels then Unsplash
 * @param {string} query - The search term
 * @returns {Promise<string|null>} - The URL of the image
 */
export const searchImage = async (query) => {
    // 1. Try Unsplash first as requested
    let result = await searchUnsplashImage(query);

    // 2. Fallback to Pexels if Unsplash fails
    if (!result) {
        console.log(`Unsplash failed for "${query}", trying Pexels...`);
        result = await searchPexelsImage(query);
    }

    // If Pexels is also rate limited or failed, return null gracefully
    return result === 'RATE_LIMIT' ? null : result;
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

        const result = await searchImage(searchTerm);

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
