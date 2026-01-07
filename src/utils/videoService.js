// src/utils/videoService.js
import { supabase } from './supabaseClient';

export const videoService = {
    // Lấy danh sách video và đính kèm tiến độ của người dùng này
    async getAllVideos(userId = null) {
        const { data: videos, error: vError } = await supabase
            .from('youtube_videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (vError) return [];

        if (!userId) return videos;

        // Lấy tiến độ của user này
        const { data: progress, error: pError } = await supabase
            .from('youtube_progress')
            .select('*')
            .eq('user_id', userId);

        return videos.map(v => {
            const p = progress?.find(item => item.video_id === v.video_id);
            return {
                ...v,
                userProgress: p?.current_index || 0,
                lastUpdated: p?.updated_at || v.created_at
            };
        });
    },

    // Lấy video cuối cùng người dùng đã học để gợi ý resume
    async getLastSession(userId) {
        const { data, error } = await supabase
            .from('youtube_progress')
            .select('video_id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        return data?.video_id || null;
    },

    // Admin thêm video mới
    async addVideo(videoId, segments) {
        const { data, error } = await supabase
            .from('youtube_videos')
            .upsert([{ video_id: videoId, segments }], { onConflict: 'video_id' })
            .select()
            .single();
        return { data, error };
    },

    // Admin cập nhật video đã có
    async updateVideo(videoId, segments) {
        const { data, error } = await supabase
            .from('youtube_videos')
            .update({ segments })
            .eq('video_id', videoId)
            .select()
            .single();
        return { data, error };
    },

    // Admin xóa video
    async deleteVideo(videoId) {
        const { error } = await supabase
            .from('youtube_videos')
            .delete()
            .eq('video_id', videoId);
        return !error;
    },

    // --- PHẦN TIẾN ĐỘ NGƯỜI DÙNG ---

    async getProgress(userId, videoId) {
        const { data, error } = await supabase
            .from('youtube_progress')
            .select('current_index')
            .eq('user_id', userId)
            .eq('video_id', videoId)
            .single();
        return data?.current_index || 0;
    },

    async updateProgress(userId, videoId, currentIndex) {
        const { error } = await supabase
            .from('youtube_progress')
            .upsert({
                user_id: userId,
                video_id: videoId,
                current_index: currentIndex,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, video_id' });
        return !error;
    }
};
