// src/utils/videoStorage.js
const STORAGE_KEY = 'vocation_video_sessions';

export const videoStorage = {
    // Lấy tất cả các session đã lưu
    getAllSessions() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Lỗi khi đọc video sessions:', e);
            return {};
        }
    },

    // Lấy session theo Video ID
    getSession(videoId) {
        const sessions = this.getAllSessions();
        return sessions[videoId] || null;
    },

    // Lưu hoặc cập nhật session
    // Chỉ lưu: videoId, segments (order, start, end, text), và progress (currentIndex)
    saveSession(videoId, segments, currentIndex = 0) {
        const sessions = this.getAllSessions();

        // Tối ưu dữ liệu: chỉ lưu các field cần thiết
        const optimizedSegments = segments.map((s, idx) => ({
            order: idx + 1,
            start: s.start,
            end: s.end,
            text: s.text
        }));

        sessions[videoId] = {
            videoId,
            segments: optimizedSegments,
            currentIndex,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    },

    // Cập nhật chỉ tiến độ
    updateProgress(videoId, currentIndex) {
        const sessions = this.getAllSessions();
        if (sessions[videoId]) {
            sessions[videoId].currentIndex = currentIndex;
            sessions[videoId].lastUpdated = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    },

    // Xóa session
    deleteSession(videoId) {
        const sessions = this.getAllSessions();
        delete sessions[videoId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
};
