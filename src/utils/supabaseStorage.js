
import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

const getCurrentUserId = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id;
    } catch (e) {
        return null;
    }
};

// Helper để map dữ liệu từ DB (snake_case) sang UI (camelCase)
const mapWordFromDB = (w) => ({
    ...w,
    nextReview: w.next_review,
    srsStage: w.srs_stage,
    exampleDefinition: w.example_definition
});

export const storage = {
    // ==================== QUẢN LÝ PROFILE ====================
    async getProfile() {
        const id = await getCurrentUserId();
        if (!id) return null;

        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
            if (error) {
                if (error.code === 'PGRST116' || error.status === 406) {
                    const { data: { user } } = await supabase.auth.getUser();
                    const newProfile = {
                        id,
                        username: user?.email?.split('@')[0] || 'User',
                        theme: 'dark'
                    };
                    const { data: inserted } = await supabase.from('profiles').insert([newProfile]).select().single();
                    return inserted || newProfile;
                }
                return { id, username: 'User', theme: 'dark' };
            }
            return data;
        } catch (e) {
            return { id, username: 'User', theme: 'dark' };
        }
    },

    // ==================== QUẢN LÝ BỘ THẺ ====================
    async getSets() {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        try {
            // Tối ưu: Lấy danh sách bộ thẻ kèm theo số lượng từ chỉ trong 1 request duy nhất
            const { data, error } = await supabase
                .from('sets')
                .select('*, words(count)')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Lỗi khi lấy danh sách bộ thẻ:', error.message);
                return [];
            }

            if (!data || data.length === 0) {
                const newSet = await this.createSet('Bộ từ vựng đầu tiên', 'Dữ liệu được lưu trên Cloud');
                return newSet ? [newSet] : [];
            }

            // Map lại dữ liệu để lấy wordCount từ kết quả join
            return data.map(set => ({
                ...set,
                wordCount: set.words?.[0]?.count || 0
            }));
        } catch (e) {
            console.error('Lỗi hệ thống getSets:', e);
            return [];
        }
    },

    async getCurrentSet() {
        const userId = await getCurrentUserId();
        if (!userId) return null;

        const profile = await this.getProfile();
        let currentId = profile?.current_set_id;

        if (currentId && currentId !== 'undefined') {
            const { data: set, error } = await supabase.from('sets').select('*').eq('id', currentId).eq('user_id', userId).single();
            if (set && !error) {
                const { data: words } = await supabase.from('words').select('*').eq('set_id', set.id).order('created_at', { ascending: true });
                set.words = (words || []).map(mapWordFromDB);
                set.wordCount = set.words.length;
                return set;
            } else if (error && error.status !== 406 && error.code !== 'PGRST116') {
                console.error('Lỗi khi lấy bộ thẻ hiện tại:', error.message);
            }
        }

        const all = await this.getSets();
        if (all && all.length > 0) {
            const firstSet = all[0];
            const { data: words } = await supabase.from('words').select('*').eq('set_id', firstSet.id).order('created_at', { ascending: true });
            firstSet.words = (words || []).map(mapWordFromDB);
            firstSet.wordCount = firstSet.words.length;
            await this.setCurrentSet(firstSet.id);
            return firstSet;
        }
        return null;
    },

    async createSet(name, description = '') {
        const userId = await getCurrentUserId();
        if (!userId) return null;
        const { data, error } = await supabase.from('sets').insert([{ user_id: userId, name, description }]).select().single();
        if (error) return null;
        return data;
    },

    async setCurrentSet(setId) {
        const userId = await getCurrentUserId();
        if (userId && setId && setId !== 'undefined') {
            await supabase.from('profiles').update({ current_set_id: setId }).eq('id', userId);
        }
    },

    async deleteSet(setId) {
        const { error } = await supabase.from('sets').delete().eq('id', setId);
        return !error;
    },

    // ==================== QUẢN LÝ TỪ VỰNG ====================

    async saveVocabulary(updates) {
        for (const up of updates) {
            const { id, ...data } = up;
            await this.updateWord(id, data);
        }
        return true;
    },

    async addWord(wordData) {
        const userId = await getCurrentUserId();
        const setId = await this.getCurrentSetId();

        if (!setId) return null;

        const { data, error } = await supabase.from('words').insert([{
            user_id: userId,
            set_id: setId,
            term: wordData.term,
            phonetic: wordData.phonetic,
            definition: wordData.definition,
            type: wordData.type,
            example: wordData.example,
            example_definition: wordData.example_definition || wordData.exampleDefinition,
            synonym: wordData.synonym,
            antonym: wordData.antonym,
            collocation: wordData.collocation,
            note: wordData.note,
            level: wordData.level,
            topic: wordData.topic,
            image: wordData.image
        }]).select().single();

        return data ? mapWordFromDB(data) : null;
    },

    async importWords(words) {
        const userId = await getCurrentUserId();
        const setId = await this.getCurrentSetId();
        if (!setId || !userId) return [];

        const wordsToInsert = words.map(w => ({
            user_id: userId,
            set_id: setId,
            term: w.term,
            phonetic: w.phonetic,
            definition: w.definition,
            type: w.type,
            example: w.example,
            example_definition: w.example_definition || w.exampleDefinition,
            synonym: w.synonym,
            antonym: w.antonym,
            collocation: w.collocation,
            note: w.note,
            level: w.level,
            topic: w.topic,
            image: w.image
        }));

        const { data } = await supabase.from('words').insert(wordsToInsert).select();
        return (data || []).map(mapWordFromDB);
    },

    async updateWord(id, updates) {
        const { data } = await supabase.from('words').update({
            term: updates.term,
            phonetic: updates.phonetic,
            definition: updates.definition,
            type: updates.type,
            example: updates.example,
            example_definition: updates.exampleDefinition || updates.example_definition,
            synonym: updates.synonym,
            antonym: updates.antonym,
            collocation: updates.collocation,
            note: updates.note,
            level: updates.level,
            topic: updates.topic,
            image: updates.image,
            starred: updates.starred,
            srs_stage: updates.srsStage || updates.srs_stage,
            next_review: updates.nextReview || updates.next_review
        }).eq('id', id).select().single();
        return data ? mapWordFromDB(data) : null;
    },

    // Tương thích với FlashcardsMode cũ (Map SRS stages)
    async updateSRS(id, rating) {
        let nextReview = new Date();
        let stage = 'learning';

        switch (rating) {
            case 'again': nextReview.setMinutes(nextReview.getMinutes() + 10); stage = 'learning'; break;
            case 'hard': nextReview.setDate(nextReview.getDate() + 1); stage = 'learning'; break;
            case 'good': nextReview.setDate(nextReview.getDate() + 3); stage = 'review'; break;
            case 'easy': nextReview.setDate(nextReview.getDate() + 7); stage = 'review'; break;
        }

        await supabase.from('words').update({
            srs_stage: stage,
            next_review: nextReview.toISOString()
        }).eq('id', id);
        return true;
    },

    async deleteWord(id) {
        const { error } = await supabase.from('words').delete().eq('id', id);
        return !error;
    },

    async toggleStar(id) {
        const { data: word } = await supabase.from('words').select('starred').eq('id', id).single();
        if (word) {
            const { data } = await supabase.from('words').update({ starred: !word.starred }).eq('id', id).select().single();
            return data ? mapWordFromDB(data) : null;
        }
        return null;
    },

    async updateStats(id, isCorrect) {
        let updates = {};
        if (!isCorrect) {
            updates = { srs_stage: 'learning', next_review: new Date(Date.now() + 10 * 60000).toISOString() };
        } else {
            updates = { srs_stage: 'review', next_review: new Date(Date.now() + 24 * 60 * 60000).toISOString() };
        }
        await supabase.from('words').update(updates).eq('id', id);
        return true;
    },

    async getStatusCounts(setId) {
        const userId = await getCurrentUserId();
        if (!userId) return { notLearned: 0, learning: 0, learned: 0, due: 0 };

        let query = supabase.from('words').select('srs_stage, next_review, set_id').eq('user_id', userId);
        if (setId) query = query.eq('set_id', setId);

        const { data: words } = await query;
        const now = new Date();

        return {
            notLearned: words?.filter(w => w.srs_stage === 'new' || !w.srs_stage).length || 0,
            learning: words?.filter(w => w.srs_stage === 'learning').length || 0,
            learned: words?.filter(w => w.srs_stage === 'review').length || 0,
            due: words?.filter(w => !w.next_review || new Date(w.next_review) <= now).length || 0
        };
    },

    async getDueWords(setId) {
        const userId = await getCurrentUserId();
        if (!userId) return [];
        const now = new Date().toISOString();

        let query = supabase.from('words').select('*').eq('user_id', userId);
        if (setId) query = query.eq('set_id', setId);

        // OR logic: next_review <= now OR next_review IS NULL
        const { data } = await query.or(`next_review.lte.${now},next_review.is.null`);

        return (data || []).map(mapWordFromDB);
    },

    async getCurrentSetId() {
        const profile = await this.getProfile();
        return profile?.current_set_id;
    },

    async getTheme() {
        const profile = await this.getProfile();
        return profile?.theme || 'dark';
    },

    async setTheme(theme) {
        const userId = await getCurrentUserId();
        if (userId) await supabase.from('profiles').update({ theme }).eq('id', userId);
    }
};
