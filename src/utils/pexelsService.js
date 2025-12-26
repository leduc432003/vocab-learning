const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

/**
 * Search for an image on Pexels API
 * @param {string} query - The search term (e.g. word to learn)
 * @returns {Promise<string|null>} - The URL of the image or null if not found
 */
export const searchPexelsImage = async (query) => {
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
            throw new Error(`Pexels API Error: ${response.status}`);
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
 * Automatically find images for a list of words that strictly don't have an image
 * returns an object { updated: [], failed: [] }
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

        const result = await searchPexelsImage(searchTerm);

        if (result === 'RATE_LIMIT') {
            failed.push(`${word.term} (Rate Limit - Try later)`);
            break;
        } else if (result) {
            updated.push({ id: word.id, image: result });
        } else {
            failed.push(word.term);
        }

        count++;
        if (onProgress) onProgress(count, total);

        // Increased delay to 1.2s to stay safer within rate limits
        await new Promise(r => setTimeout(r, 1200));
    }
    return { updated, failed };
};
