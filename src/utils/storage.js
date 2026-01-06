
const DB_NAME = 'VocabLearningDB';
const DB_VERSION = 1;

/**
 * MỞ DATABASE INDEXEDDB
 */
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('sets')) {
                db.createObjectStore('sets', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * HELPER ĐỌC/GHI TRỰC TIẾP
 */
const dbGet = async (storeName, key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const dbGetAll = async (storeName) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const dbPut = async (storeName, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const dbDelete = async (storeName, key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// ==================== LOGIC LƯU TRỮ ====================

const SETS_KEY = 'vocab_sets';
const CURRENT_SET_KEY = 'current_set_id';

// SRS Constants
const LEARNING_STEPS = [10, 1440];
const REVIEW_INTERVALS = [3, 7, 15, 30, 90, 180, 365];
const DEFAULT_EASE = 2.5;

export const storage = {
    // TỰ ĐỘNG CHUYỂN DỮ LIỆU TỪ LOCALSTORAGE SANG INDEXEDDB
    migrateIfNeeded: async () => {
        const migrated = localStorage.getItem('idb_migrated');
        if (migrated) return;

        const oldSets = localStorage.getItem(SETS_KEY);
        const oldCurrentId = localStorage.getItem(CURRENT_SET_KEY);
        const oldTheme = localStorage.getItem('theme');

        if (oldSets) {
            try {
                const sets = JSON.parse(oldSets);
                for (const set of sets) {
                    await dbPut('sets', set);
                }
            } catch (e) { console.error("Migration error (sets):", e); }
        }

        if (oldCurrentId) await dbPut('settings', { key: 'currentSetId', value: oldCurrentId });
        if (oldTheme) await dbPut('settings', { key: 'theme', value: oldTheme });

        localStorage.setItem('idb_migrated', 'true');
    },

    getSets: async () => {
        await storage.migrateIfNeeded();
        const sets = await dbGetAll('sets');

        if (sets.length === 0) {
            const defaultSet = {
                id: Date.now().toString(),
                name: 'My Vocab Set',
                description: 'Start learning vocabulary',
                createdAt: new Date().toISOString(),
                words: []
            };
            await dbPut('sets', defaultSet);
            await storage.setCurrentSet(defaultSet.id);
            return [defaultSet];
        }

        return sets;
    },

    saveSets: async (sets) => {
        // Trong IndexedDB ta nên save từng set, nhưng để giữ interface cũ:
        for (const set of sets) {
            await dbPut('sets', set);
        }
        return true;
    },

    getCurrentSetId: async () => {
        const result = await dbGet('settings', 'currentSetId');
        return result ? result.value : null;
    },

    setCurrentSet: async (setId) => {
        await dbPut('settings', { key: 'currentSetId', value: setId });
    },

    getCurrentSet: async () => {
        const sets = await storage.getSets();
        const currentId = await storage.getCurrentSetId();
        return sets.find(s => s.id === currentId) || sets[0];
    },

    createSet: async (name, description = '') => {
        const newSet = {
            id: Date.now().toString(),
            name,
            description,
            createdAt: new Date().toISOString(),
            words: []
        };
        await dbPut('sets', newSet);
        return newSet;
    },

    updateSet: async (setId, updates) => {
        const set = await dbGet('sets', setId);
        if (set) {
            const updated = { ...set, ...updates };
            await dbPut('sets', updated);
            return updated;
        }
        return null;
    },

    deleteSet: async (setId) => {
        const sets = await storage.getSets();
        if (sets.length <= 1) return false;

        await dbDelete('sets', setId);
        const currentId = await storage.getCurrentSetId();
        if (currentId === setId) {
            const remaining = await dbGetAll('sets');
            await storage.setCurrentSet(remaining[0].id);
        }
        return true;
    },

    // ==================== VOCABULARY MANAGEMENT ====================

    getVocabulary: async () => {
        const currentSet = await storage.getCurrentSet();
        return currentSet ? currentSet.words : [];
    },

    saveVocabulary: async (words) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (set) {
            set.words = words;
            await dbPut('sets', set);
            return true;
        }
        return false;
    },

    addWord: async (word) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (!set) return null;

        const newWord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...word,
            createdAt: new Date().toISOString(),
            reviewCount: 0,
            correctCount: 0,
            lastReviewed: null,
            starred: false,
            srsStage: 'new',
            srsInterval: 0,
            srsEase: DEFAULT_EASE,
            srsStepIndex: 0,
            nextReview: new Date().toISOString(),
            learningStatus: 'not-learned'
        };

        set.words.push(newWord);
        await dbPut('sets', set);
        return newWord;
    },

    updateWord: async (id, updates) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (!set) return null;

        const index = set.words.findIndex(w => w.id === id);
        if (index !== -1) {
            set.words[index] = { ...set.words[index], ...updates };
            await dbPut('sets', set);
            return set.words[index];
        }
        return null;
    },

    deleteWord: async (id) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (!set) return false;

        set.words = set.words.filter(w => w.id !== id);
        await dbPut('sets', set);
        return true;
    },

    toggleStar: async (id) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (!set) return null;

        const index = set.words.findIndex(w => w.id === id);
        if (index !== -1) {
            set.words[index].starred = !set.words[index].starred;
            await dbPut('sets', set);
            return set.words[index];
        }
        return null;
    },

    updateSRS: async (id, rating) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (!set) return null;

        const index = set.words.findIndex(w => w.id === id);
        if (index === -1) return null;

        const word = set.words[index];
        const now = new Date();
        let nextInterval = 0;

        word.reviewCount += 1;
        word.lastReviewed = now.toISOString();

        // SRS Logic (Anki style)
        switch (word.srsStage) {
            case 'new':
            case 'learning':
            case 'lapse':
                if (rating === 'again') {
                    word.srsStage = (word.srsStage === 'review') ? 'lapse' : word.srsStage;
                    word.srsStepIndex = 0;
                    nextInterval = LEARNING_STEPS[0];
                } else if (rating === 'hard') {
                    nextInterval = (LEARNING_STEPS[word.srsStepIndex] + (LEARNING_STEPS[word.srsStepIndex + 1] || LEARNING_STEPS[word.srsStepIndex])) / 2;
                } else if (rating === 'good') {
                    word.srsStepIndex += 1;
                    if (word.srsStepIndex >= LEARNING_STEPS.length) {
                        word.srsStage = 'review';
                        word.srsInterval = REVIEW_INTERVALS[0];
                        nextInterval = word.srsInterval * 1440;
                        word.learningStatus = 'learned';
                    } else {
                        nextInterval = LEARNING_STEPS[word.srsStepIndex];
                        word.learningStatus = 'learning';
                    }
                } else if (rating === 'easy') {
                    word.srsStage = 'review';
                    word.srsInterval = REVIEW_INTERVALS[1] || 7;
                    nextInterval = word.srsInterval * 1440;
                    word.learningStatus = 'learned';
                }
                break;

            case 'review':
                if (rating === 'again') {
                    word.srsStage = 'lapse';
                    word.srsStepIndex = 0;
                    word.srsEase = Math.max(1.3, word.srsEase - 0.2);
                    nextInterval = LEARNING_STEPS[0];
                    word.learningStatus = 'learning';
                } else if (rating === 'hard') {
                    word.srsEase = Math.max(1.3, word.srsEase - 0.15);
                    word.srsInterval = Math.max(1, Math.round(word.srsInterval * 1.2));
                    nextInterval = word.srsInterval * 1440;
                } else if (rating === 'good') {
                    word.srsInterval = Math.round(word.srsInterval * word.srsEase);
                    nextInterval = word.srsInterval * 1440;
                } else if (rating === 'easy') {
                    word.srsEase += 0.15;
                    word.srsInterval = Math.round(word.srsInterval * word.srsEase * 1.3);
                    nextInterval = word.srsInterval * 1440;
                }
                break;
        }

        const nextReviewDate = new Date(now.getTime() + nextInterval * 60000);
        word.nextReview = nextReviewDate.toISOString();

        await dbPut('sets', set);
        return word;
    },

    updateStats: async (id, isCorrect, mode = 'generic') => {
        return await storage.updateSRS(id, isCorrect ? 'good' : 'again');
    },

    importWords: async (words) => {
        const currentId = await storage.getCurrentSetId();
        const set = await dbGet('sets', currentId);
        if (!set) return [];

        const newWords = words.map(word => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...word,
            createdAt: new Date().toISOString(),
            reviewCount: 0,
            correctCount: 0,
            lastReviewed: null,
            starred: false,
            srsStage: 'new',
            srsInterval: 0,
            srsEase: DEFAULT_EASE,
            srsStepIndex: 0,
            nextReview: new Date().toISOString(),
            learningStatus: 'not-learned'
        }));

        set.words = [...set.words, ...newWords];
        await dbPut('sets', set);
        return newWords;
    },

    getStatusCounts: async () => {
        const vocabulary = await storage.getVocabulary();
        const now = new Date();
        return {
            notLearned: vocabulary.filter(w => w.srsStage === 'new').length,
            learning: vocabulary.filter(w => w.srsStage === 'learning' || w.srsStage === 'lapse').length,
            learned: vocabulary.filter(w => w.srsStage === 'review').length,
            due: vocabulary.filter(w => new Date(w.nextReview) <= now).length
        };
    },

    getDueWords: async () => {
        const vocabulary = await storage.getVocabulary();
        const now = new Date();
        return vocabulary.filter(word => word.srsStage === 'new' || new Date(word.nextReview) <= now)
            .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
    },

    getTheme: async () => {
        const result = await dbGet('settings', 'theme');
        return result ? result.value : 'dark';
    },

    setTheme: async (theme) => {
        await dbPut('settings', { key: 'theme', value: theme });
    }
};
