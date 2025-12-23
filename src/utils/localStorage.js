const SETS_KEY = 'vocab_sets';
const CURRENT_SET_KEY = 'current_set_id';

export const storage = {
    // ==================== SETS MANAGEMENT ====================

    // Get all sets
    getSets: () => {
        try {
            const data = localStorage.getItem(SETS_KEY);
            const sets = data ? JSON.parse(data) : [];

            // Create default set if none exists
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

    // Save all sets
    saveSets: (sets) => {
        try {
            localStorage.setItem(SETS_KEY, JSON.stringify(sets));
            return true;
        } catch (error) {
            console.error('Error saving sets:', error);
            return false;
        }
    },

    // Get current set ID
    getCurrentSetId: () => {
        return localStorage.getItem(CURRENT_SET_KEY);
    },

    // Set current set
    setCurrentSet: (setId) => {
        localStorage.setItem(CURRENT_SET_KEY, setId);
    },

    // Get current set
    getCurrentSet: () => {
        const sets = storage.getSets();
        const currentId = storage.getCurrentSetId();
        return sets.find(s => s.id === currentId) || sets[0];
    },

    // Create new set
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

    // Update set
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

    // Delete set
    deleteSet: (setId) => {
        const sets = storage.getSets();
        const filtered = sets.filter(s => s.id !== setId);

        // Don't allow deleting the last set
        if (filtered.length === 0) {
            return false;
        }

        storage.saveSets(filtered);

        // If deleted current set, switch to first available
        if (storage.getCurrentSetId() === setId) {
            storage.setCurrentSet(filtered[0].id);
        }

        return true;
    },

    // ==================== VOCABULARY MANAGEMENT ====================

    // Get vocabulary from current set
    getVocabulary: () => {
        const currentSet = storage.getCurrentSet();
        return currentSet ? currentSet.words : [];
    },

    // Save vocabulary to current set
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

    // Add word to current set
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
            masteryLevel: 0, // 0-5 for spaced repetition
            nextReview: new Date().toISOString(),
            learningStatus: 'not-learned' // 'not-learned', 'learning', 'learned'
        };
        vocabulary.push(newWord);
        storage.saveVocabulary(vocabulary);
        return newWord;
    },

    // Update word
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

    // Delete word
    deleteWord: (id) => {
        const vocabulary = storage.getVocabulary();
        const filtered = vocabulary.filter(word => word.id !== id);
        storage.saveVocabulary(filtered);
        return true;
    },

    // Toggle star
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

    // Update learning stats with spaced repetition and learning status
    updateStats: (id, isCorrect, mode = 'generic') => {
        const vocabulary = storage.getVocabulary();
        const index = vocabulary.findIndex(word => word.id === id);
        if (index !== -1) {
            const word = vocabulary[index];
            word.reviewCount += 1;

            if (isCorrect) {
                word.correctCount += 1;
                // Increase mastery level (max 5)
                word.masteryLevel = Math.min(5, word.masteryLevel + 1);

                // Learning Status logic based on user request
                // Step 1: MCQ -> 'learning'
                // Step 2: Written -> 'learned'
                if (mode === 'learn-mcq' && (!word.learningStatus || word.learningStatus === 'not-learned')) {
                    word.learningStatus = 'learning';
                } else if (mode === 'learn-written' && word.learningStatus === 'learning') {
                    word.learningStatus = 'learned';
                }
            } else {
                // Decrease mastery level (min 0)
                word.masteryLevel = Math.max(0, word.masteryLevel - 1);

                // If wrong in MCQ, it stays 'not-learned'
                // If wrong in Written, it stays 'learning'
            }

            // Calculate next review date based on mastery level
            const intervals = [1, 3, 7, 14, 30, 60]; // days
            const daysUntilNext = intervals[word.masteryLevel];
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + daysUntilNext);

            word.lastReviewed = new Date().toISOString();
            word.nextReview = nextReview.toISOString();

            storage.saveVocabulary(vocabulary);
            return word;
        }
        return null;
    },

    // Import words to current set
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
            masteryLevel: 0,
            nextReview: new Date().toISOString(),
            learningStatus: 'not-learned'
        }));
        const updated = [...vocabulary, ...newWords];
        storage.saveVocabulary(updated);
        return newWords;
    },

    // Get words counts by status
    getStatusCounts: () => {
        const vocabulary = storage.getVocabulary();
        return {
            notLearned: vocabulary.filter(w => !w.learningStatus || w.learningStatus === 'not-learned').length,
            learning: vocabulary.filter(w => w.learningStatus === 'learning').length,
            learned: vocabulary.filter(w => w.learningStatus === 'learned').length
        };
    },

    // Get words due for review
    getDueWords: () => {
        const vocabulary = storage.getVocabulary();
        const now = new Date();
        return vocabulary.filter(word => new Date(word.nextReview) <= now);
    },

    // Get starred words
    getStarredWords: () => {
        const vocabulary = storage.getVocabulary();
        return vocabulary.filter(word => word.starred);
    },

    // Clear all data
    clearAll: () => {
        localStorage.removeItem(SETS_KEY);
        localStorage.removeItem(CURRENT_SET_KEY);
        return true;
    }
};
