const SETS_KEY = 'vocab_sets';
const CURRENT_SET_KEY = 'current_set_id';

// SRS Constants
const LEARNING_STEPS = [10, 1440]; // 10 minutes, 1 day (in minutes)
const REVIEW_INTERVALS = [3, 7, 15, 30, 90, 180, 365]; // in days
const DEFAULT_EASE = 2.5;

export const storage = {
    // ==================== SETS MANAGEMENT ====================

    getSets: () => {
        try {
            const data = localStorage.getItem(SETS_KEY);
            const sets = data ? JSON.parse(data) : [];

            if (sets.length === 0) {
                const defaultSet = {
                    id: Date.now().toString(),
                    name: 'My First Set',
                    description: 'Start learning vocabulary',
                    createdAt: new Date().toISOString(),
                    words: []
                };
                sets.push(defaultSet);
                storage.saveSets(sets);
                storage.setCurrentSet(defaultSet.id);
            }

            return sets;
        } catch (error) {
            console.error('Error reading sets:', error);
            return [];
        }
    },

    saveSets: (sets) => {
        try {
            localStorage.setItem(SETS_KEY, JSON.stringify(sets));
            return true;
        } catch (error) {
            console.error('Error saving sets:', error);
            return false;
        }
    },

    getCurrentSetId: () => {
        return localStorage.getItem(CURRENT_SET_KEY);
    },

    setCurrentSet: (setId) => {
        localStorage.setItem(CURRENT_SET_KEY, setId);
    },

    getCurrentSet: () => {
        const sets = storage.getSets();
        const currentId = storage.getCurrentSetId();
        return sets.find(s => s.id === currentId) || sets[0];
    },

    createSet: (name, description = '') => {
        const sets = storage.getSets();
        const newSet = {
            id: Date.now().toString(),
            name,
            description,
            createdAt: new Date().toISOString(),
            words: []
        };
        sets.push(newSet);
        storage.saveSets(sets);
        return newSet;
    },

    updateSet: (setId, updates) => {
        const sets = storage.getSets();
        const index = sets.findIndex(s => s.id === setId);
        if (index !== -1) {
            sets[index] = { ...sets[index], ...updates };
            storage.saveSets(sets);
            return sets[index];
        }
        return null;
    },

    deleteSet: (setId) => {
        const sets = storage.getSets();
        const filtered = sets.filter(s => s.id !== setId);
        if (filtered.length === 0) return false;
        storage.saveSets(filtered);
        if (storage.getCurrentSetId() === setId) {
            storage.setCurrentSet(filtered[0].id);
        }
        return true;
    },

    // ==================== VOCABULARY MANAGEMENT ====================

    getVocabulary: () => {
        const currentSet = storage.getCurrentSet();
        return currentSet ? currentSet.words : [];
    },

    saveVocabulary: (words) => {
        const sets = storage.getSets();
        const currentId = storage.getCurrentSetId();
        const index = sets.findIndex(s => s.id === currentId);

        if (index !== -1) {
            sets[index].words = words;
            storage.saveSets(sets);
            return true;
        }
        return false;
    },

    addWord: (word) => {
        const vocabulary = storage.getVocabulary();
        const newWord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...word,
            createdAt: new Date().toISOString(),
            reviewCount: 0,
            correctCount: 0,
            lastReviewed: null,
            starred: false,
            // SRS properties
            srsStage: 'new', // 'new', 'learning', 'review', 'lapse'
            srsInterval: 0, // current interval in days (or 0 for new)
            srsEase: DEFAULT_EASE,
            srsStepIndex: 0, // for learning/lapse stages
            nextReview: new Date().toISOString(),
            learningStatus: 'not-learned'
        };
        vocabulary.push(newWord);
        storage.saveVocabulary(vocabulary);
        return newWord;
    },

    updateWord: (id, updates) => {
        const vocabulary = storage.getVocabulary();
        const index = vocabulary.findIndex(word => word.id === id);
        if (index !== -1) {
            vocabulary[index] = { ...vocabulary[index], ...updates };
            storage.saveVocabulary(vocabulary);
            return vocabulary[index];
        }
        return null;
    },

    deleteWord: (id) => {
        const vocabulary = storage.getVocabulary();
        const filtered = vocabulary.filter(word => word.id !== id);
        storage.saveVocabulary(filtered);
        return true;
    },

    toggleStar: (id) => {
        const vocabulary = storage.getVocabulary();
        const index = vocabulary.findIndex(word => word.id === id);
        if (index !== -1) {
            vocabulary[index].starred = !vocabulary[index].starred;
            storage.saveVocabulary(vocabulary);
            return vocabulary[index];
        }
        return null;
    },

    // New Anki-style update function
    updateSRS: (id, rating) => {
        const vocabulary = storage.getVocabulary();
        const index = vocabulary.findIndex(word => word.id === id);
        if (index === -1) return null;

        const word = vocabulary[index];
        const now = new Date();
        let nextInterval = 0; // in minutes (if < 1440) or days

        word.reviewCount += 1;
        word.lastReviewed = now.toISOString();

        // SRS Logic
        switch (word.srsStage) {
            case 'new':
            case 'learning':
            case 'lapse':
                if (rating === 'again') {
                    word.srsStage = (word.srsStage === 'review') ? 'lapse' : word.srsStage;
                    word.srsStepIndex = 0;
                    nextInterval = LEARNING_STEPS[0]; // 10m
                } else if (rating === 'hard') {
                    nextInterval = (LEARNING_STEPS[word.srsStepIndex] + (LEARNING_STEPS[word.srsStepIndex + 1] || LEARNING_STEPS[word.srsStepIndex])) / 2;
                } else if (rating === 'good') {
                    word.srsStepIndex += 1;
                    if (word.srsStepIndex >= LEARNING_STEPS.length) {
                        word.srsStage = 'review';
                        word.srsInterval = REVIEW_INTERVALS[0]; // Start matching review intervals
                        nextInterval = word.srsInterval * 1440;
                        word.learningStatus = 'learned';
                    } else {
                        nextInterval = LEARNING_STEPS[word.srsStepIndex];
                        word.learningStatus = 'learning';
                    }
                } else if (rating === 'easy') {
                    word.srsStage = 'review';
                    word.srsInterval = REVIEW_INTERVALS[1] || 7; // Skip a bit
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

        storage.saveVocabulary(vocabulary);
        return word;
    },

    updateStats: (id, isCorrect, mode = 'generic') => {
        // Fallback for non-flashcard modes or simple correct/incorrect
        return storage.updateSRS(id, isCorrect ? 'good' : 'again');
    },

    importWords: (words) => {
        const vocabulary = storage.getVocabulary();
        const newWords = words.map(word => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...word,
            createdAt: new Date().toISOString(),
            reviewCount: 0,
            correctCount: 0,
            lastReviewed: null,
            starred: false,
            // SRS
            srsStage: 'new',
            srsInterval: 0,
            srsEase: DEFAULT_EASE,
            srsStepIndex: 0,
            nextReview: new Date().toISOString(),
            learningStatus: 'not-learned'
        }));
        const updated = [...vocabulary, ...newWords];
        storage.saveVocabulary(updated);
        return newWords;
    },

    getStatusCounts: () => {
        const vocabulary = storage.getVocabulary();
        const now = new Date();
        return {
            notLearned: vocabulary.filter(w => w.srsStage === 'new').length,
            learning: vocabulary.filter(w => w.srsStage === 'learning' || w.srsStage === 'lapse').length,
            learned: vocabulary.filter(w => w.srsStage === 'review').length,
            due: vocabulary.filter(w => new Date(w.nextReview) <= now).length
        };
    },

    getDueWords: () => {
        const vocabulary = storage.getVocabulary();
        const now = new Date();
        // Return words that are either new OR due for review
        return vocabulary.filter(word => word.srsStage === 'new' || new Date(word.nextReview) <= now)
            .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
    },

    getStarredWords: () => {
        const vocabulary = storage.getVocabulary();
        return vocabulary.filter(word => word.starred);
    },

    clearAll: () => {
        localStorage.removeItem(SETS_KEY);
        localStorage.removeItem(CURRENT_SET_KEY);
        return true;
    }
};
