import React, { useState, useEffect, useRef } from 'react';
import { parseSRT } from '../utils/srtParser';
import { videoService } from '../utils/videoService';
import { toast } from 'react-hot-toast';

const YoutubeDictation = ({ user, onExit }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState('');
    const [subtitles, setSubtitles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [diffResult, setDiffResult] = useState([]);
    const [hintsShown, setHintsShown] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [savedSessions, setSavedSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [maxProgress, setMaxProgress] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const playerRef = useRef(null);
    const checkInterval = useRef(null);

    const isAdmin = user?.email === 'anhducle4433@gmail.com';

    const loadLibrary = async () => {
        setIsLoading(true);
        try {
            const videos = await videoService.getAllVideos(user?.id);
            setSavedSessions(videos);
        } catch (error) {
            console.error('Error loading library:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLibrary();
    }, [user?.id, videoId]);

    const extractVideoId = (url) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    };

    useEffect(() => {
        const loadAPI = () => {
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                window.onYouTubeIframeAPIReady = () => initPlayer();
            } else if (window.YT && window.YT.Player) {
                initPlayer();
            }
        };

        if (videoId) {
            setTimeout(loadAPI, 100);
        }
    }, [videoId]);

    useEffect(() => {
        const loadVideoContent = async () => {
            if (videoId) {
                const videoData = savedSessions.find(v => v.video_id === videoId);
                if (videoData) {
                    const segments = videoData.segments || [];
                    const progress = videoData.userProgress || 0;

                    setSubtitles(segments);
                    setMaxProgress(progress);

                    if (progress >= segments.length && segments.length > 0) {
                        setIsDone(true);
                        setCurrentIndex(0);
                    } else {
                        setCurrentIndex(progress);
                        setIsDone(false);
                    }
                } else if (!isAdmin) {
                    toast.error('Video này chưa được Admin thêm vào hệ thống!');
                    setVideoId('');
                } else {
                    setSubtitles([]);
                    setCurrentIndex(0);
                    setIsDone(false);
                }
            }
        };
        loadVideoContent();
    }, [videoId, user?.id]);

    const initPlayer = () => {
        if (!videoId) return;
        if (player) player.destroy();

        const newPlayer = new window.YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: {
                controls: 0,
                disablekb: 1,
                modestbranding: 1,
                rel: 0
            },
            events: {
                onReady: (event) => setPlayer(event.target),
                onStateChange: (event) => {
                    if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
                    else setIsPlaying(false);
                }
            }
        });
    };

    const playSegment = (speed = 1) => {
        if (!player || !subtitles[currentIndex]) return;

        const rate = typeof speed === 'number' ? speed : 1;

        const { start, end } = subtitles[currentIndex];

        player.setPlaybackRate(rate);
        player.seekTo(start, true);
        player.playVideo();

        if (checkInterval.current) clearInterval(checkInterval.current);
        checkInterval.current = setInterval(() => {
            const currentTime = player.getCurrentTime();
            if (currentTime >= end) {
                player.pauseVideo();
                if (rate !== 1) player.setPlaybackRate(1);
                clearInterval(checkInterval.current);
            }
        }, 100);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'Control') {
                e.preventDefault();
                if (player && subtitles[currentIndex] && !isDone) {
                    playSegment();
                    toast.success('🔊 Đang phát lại đoạn này');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [player, currentIndex, subtitles, isDone]);

    const handleSrtUpload = async (e) => {
        if (!isAdmin) {
            toast.error('Bạn không có quyền thêm video bài tập!');
            return;
        }
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                let segments = parseSRT(event.target.result);

                const filtered = segments
                    .map(seg => {
                        const cleanedText = seg.text
                            .replace(/\[.*?\]/g, '')
                            .replace(/\(.*?\)/g, '')
                            .trim();
                        return { ...seg, text: cleanedText };
                    })
                    .filter(seg => seg.text.length > 0);

                if (filtered.length === 0) {
                    toast.error('File SRT không chứa nội dung thoại hợp lệ!');
                    return;
                }

                setSubtitles(filtered);
                setIsEditing(true);
                toast.success(`Đã nạp và làm sạch ${filtered.length} câu thoại từ file SRT!`);
            };
            reader.readAsText(file);
        }
    };

    const handleSaveVideo = async () => {
        if (!isAdmin) return;
        if (!videoId || subtitles.length === 0) return;

        const { error } = await videoService.addVideo(videoId, subtitles);
        if (error) {
            toast.error('Có lỗi khi lưu video!');
        } else {
            toast.success('Đã lưu video vào thư viện thành công!');
            setIsEditing(false);
            loadLibrary();
        }
    };

    const handleUpdateSegment = (idx, newText) => {
        const updated = [...subtitles];
        updated[idx] = { ...updated[idx], text: newText };
        setSubtitles(updated);
    };


    const checkAnswer = () => {
        if (!userInput.trim()) return;

        const cleanWord = (w) => w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

        const correctText = subtitles[currentIndex].text;
        const correctWords = correctText.split(/\s+/);
        const userWords = userInput.split(/\s+/);

        const diff = [];
        let uIdx = 0;

        const maskWord = (word) => {
            const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
            return '*'.repeat(clean.length);
        };

        correctWords.forEach((cWord, cIdx) => {
            const cleanC = cleanWord(cWord);
            if (!cleanC) {
                diff.push({ word: cWord, status: 'punctuation' });
                return;
            }

            const uWord = userWords[uIdx];
            const cleanU = uWord ? cleanWord(uWord) : null;

            if (cleanU === cleanC) {
                diff.push({ word: cWord, status: 'correct' });
                uIdx++;
            } else {
                const isSkipped = userWords.slice(uIdx, uIdx + 3).some(uw => {
                    const nextC = correctWords.slice(cIdx + 1, cIdx + 4).find(nc => cleanWord(nc) === cleanWord(uw));
                    return !!nextC;
                });

                if (isSkipped && cleanU !== cleanC) {
                    diff.push({
                        word: maskWord(cWord),
                        original: cWord,
                        status: 'missing'
                    });
                } else {
                    diff.push({
                        word: maskWord(cWord),
                        original: cWord,
                        status: 'wrong',
                        userWord: uWord
                    });
                    uIdx++;
                }
            }
        });

        setDiffResult(diff);
        setShowResult(true);

        const spotlightDiff = diff.map((d, idx) => {
            if (d.status === 'punctuation') return d;

            const hasErrorNeighbor =
                (idx > 0 && (diff[idx - 1].status === 'wrong' || diff[idx - 1].status === 'missing')) ||
                (idx < diff.length - 1 && (diff[idx + 1].status === 'wrong' || diff[idx + 1].status === 'missing'));

            const isFuture = idx >= userWords.length;

            if (isFuture) {
                return { ...d, displayWord: maskWord(d.original || d.word), isFuture: true };
            }

            if (d.status === 'correct') {
                return { ...d, displayWord: hasErrorNeighbor ? d.word : '*' };
            } else {
                return { ...d, displayWord: d.original || d.word };
            }
        });

        setDiffResult(spotlightDiff);

        const isAllCorrect = diff.every(d => d.status === 'correct' || d.status === 'punctuation');
        setIsCorrect(isAllCorrect);
    };

    const toggleHint = () => {
        setHintsShown(prev => prev + 1);
        toast.success("Đã mở gợi ý!");
    };

    const handleNext = async (isManual = false) => {
        const nextIdx = currentIndex + 1;

        if (nextIdx < subtitles.length) {
            if (!isManual) {
                if (nextIdx > maxProgress) {
                    setMaxProgress(nextIdx);
                    if (user?.id) {
                        await videoService.updateProgress(user.id, videoId, nextIdx);
                    }
                }
            }

            setCurrentIndex(nextIdx);
            setUserInput('');
            setShowResult(false);
            setIsCorrect(null);
            setDiffResult([]);
            setHintsShown(0);
            setRevealed(false);
        } else if (!isManual) {
            setIsDone(true);
            if (user?.id) {
                await videoService.updateProgress(user.id, videoId, 0);
            }
        }
    };

    const handlePrev = (isManual = true) => {
        if (currentIndex > 0) {
            jumpToSegment(currentIndex - 1);
        }
    };

    const jumpToSegment = (index) => {
        if (index >= 0 && index < subtitles.length) {
            setCurrentIndex(index);
            setUserInput('');
            setShowResult(false);
            setIsCorrect(null);
            setDiffResult([]);
            setHintsShown(0);
            setRevealed(false);
        }
    };

    useEffect(() => {
        if (subtitles.length > 0 && currentIndex < maxProgress) {
            setUserInput(subtitles[currentIndex].text);
            setShowResult(false);
            setIsCorrect(null);
        } else if (currentIndex === maxProgress) {
            setUserInput('');
            setShowResult(false);
            setIsCorrect(null);
        }
    }, [currentIndex, maxProgress, subtitles]);

    useEffect(() => {
        if (videoId && subtitles.length > 0 && player && !isDone) {
            const timer = setTimeout(() => {
                playSegment();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, videoId, !!player]);

    const restartSession = async () => {
        setCurrentIndex(0);
        setUserInput('');
        setShowResult(false);
        setIsCorrect(null);
        setDiffResult([]);
        setHintsShown(0);
        setRevealed(false);
        setIsDone(false);
        if (user?.id) {
            await videoService.updateProgress(user.id, videoId, 0);
        }
    };

    const handleDeleteVideo = async (vid, e) => {
        e.stopPropagation();
        if (!isAdmin) return;
        if (confirm('Bạn có chắc muốn xóa video này khỏi hệ thống chung?')) {
            const success = await videoService.deleteVideo(vid);
            if (success) {
                toast.success('Đã xóa video khỏi thư viện');
                loadLibrary();
                if (videoId === vid) {
                    setVideoId('');
                    setSubtitles([]);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-white p-4 md:p-8 flex flex-col items-center transition-colors duration-300">
            {/* Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-6">
                <button onClick={onExit} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    <span className="hidden sm:inline">Quay lại</span>
                </button>
                <div className="text-center">
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white italic">YOUTUBE DICTATION</h2>
                    <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-indigo-500'} animate-pulse`}></span>
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] leading-none">
                            {isAdmin ? 'Admin Mode' : 'Student Mode'}
                        </p>
                    </div>
                </div>
                <div className="w-10 sm:w-20"></div>
            </div>

            <div className="w-full max-w-4xl space-y-6">
                {/* Admin Area */}
                {isAdmin && (
                    <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-xl space-y-5">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2 pl-1">Link Video YouTube</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Dán link tại đây..."
                                        className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                        value={videoUrl}
                                        onChange={(e) => {
                                            setVideoUrl(e.target.value);
                                            const id = extractVideoId(e.target.value);
                                            if (id) setVideoId(id);
                                        }}
                                    />
                                    {videoId && (
                                        <button onClick={() => { setVideoId(''); setVideoUrl(''); setSubtitles([]); setIsEditing(false); }} className="px-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded-xl text-[9px] font-black uppercase transition-all">Clear</button>
                                    )}
                                </div>
                            </div>

                            {videoId && subtitles.length === 0 && (
                                <div className="md:w-1/3">
                                    <p className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2 pl-1">Phụ đề (.srt)</p>
                                    <label className="flex items-center justify-center w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-lg shadow-indigo-900/20 active:scale-95">
                                        <span>📁 Nạp file SRT</span>
                                        <input type="file" accept=".srt" className="hidden" onChange={handleSrtUpload} />
                                    </label>
                                </div>
                            )}

                            {subtitles.length > 0 && (
                                <div className="md:w-[40%] flex items-end gap-2">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`flex-1 h-[52px] rounded-xl font-black text-[10px] uppercase transition-all border-2 ${isEditing ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white border-gray-200 dark:border-white/10'}`}
                                    >
                                        {isEditing ? '✓ Xong' : '✎ Edit Sub'}
                                    </button>
                                    <button
                                        onClick={handleSaveVideo}
                                        className="flex-1 h-[52px] bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                    >
                                        🚀 Lưu Lại
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing && subtitles.length > 0 && (
                            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-white/10">
                                {subtitles.map((seg, idx) => (
                                    <div key={idx} className="flex gap-2.5 items-start bg-white dark:bg-white/5 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                                        <div className="bg-gray-200 dark:bg-white/10 text-[9px] font-black w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-400">{idx + 1}</div>
                                        <textarea
                                            value={seg.text}
                                            onChange={(e) => handleUpdateSegment(idx, e.target.value)}
                                            className="w-full bg-transparent text-sm outline-none transition-all resize-none h-14"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                {/* Thư viện bài tập */}
                {!videoId && (
                    <div className="space-y-4 animate-fade-in duration-500">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.3em]">Kho bài tập chung</h3>
                            {isLoading && <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                        </div>

                        {savedSessions.length === 0 ? (
                            <div className="text-center py-20 bg-gray-100 dark:bg-gray-900/20 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
                                <span className="text-4xl mb-4 block">📺</span>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">Chưa có video nào được Admin tải lên.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedSessions.map(session => {
                                    const percent = Math.round((session.userProgress / session.segments.length) * 100) || 0;
                                    return (
                                        <div
                                            key={session.id}
                                            onClick={() => {
                                                setVideoId(session.video_id);
                                                setVideoUrl(`https://www.youtube.com/watch?v=${session.video_id}`);
                                                setCurrentIndex(session.userProgress || 0);
                                            }}
                                            className="group relative bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3.5 hover:scale-[1.01] transform duration-300 active:scale-95"
                                        >
                                            <div className="relative w-24 sm:w-28 aspect-video shrink-0">
                                                <img src={`https://img.youtube.com/vi/${session.video_id}/mqdefault.jpg`} className="w-full h-full rounded-lg object-cover shadow-lg" alt="Thumbnail" />
                                                {percent > 0 && (
                                                    <div className="absolute top-1 left-1 bg-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg">
                                                        {percent}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1 truncate tracking-wider">{session.video_id}</p>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className="h-1 flex-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                    <span className="text-[9px] text-gray-600 dark:text-gray-400 font-black">{session.userProgress}/{session.segments.length}</span>
                                                </div>
                                                {isAdmin && (
                                                    <button onClick={(e) => handleDeleteVideo(session.video_id, e)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white dark:bg-white/5 rounded-lg">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Study Arena */}
                {videoId && subtitles.length > 0 && (
                    <div className="animate-slide-up duration-500 space-y-5">
                        {/* Video Layer */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-black group transform transition-all duration-500">
                            <div id="youtube-player" className="w-full h-full"></div>
                            {!isPlaying && (
                                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-all duration-300">
                                    <button onClick={playSegment} className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 p-5 sm:p-7 rounded-full transform hover:scale-110 transition-all shadow-xl border-4 border-white/20 active:scale-90">
                                        <svg className="w-8 h-8 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Control & Input Layer */}
                        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-5 md:p-8 rounded-[2rem] shadow-xl border border-gray-200 dark:border-white/10 space-y-5">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-1.5 order-2 sm:order-1">
                                    <button onClick={() => handlePrev(true)} disabled={currentIndex === 0} className="p-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl disabled:opacity-10 transition-all border border-gray-200 dark:border-white/10">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-400 dark:border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                                        PHÂN ĐOẠN {currentIndex + 1} / {subtitles.length}
                                    </div>
                                    <button onClick={() => handleNext(true)} disabled={currentIndex === subtitles.length - 1} className="p-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl disabled:opacity-10 transition-all border border-gray-200 dark:border-white/10">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                                    <div className="flex bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                        <button onClick={() => playSegment(1)} className="py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border-r border-gray-200 dark:border-white/10" title="Nghe lại tốc độ thường">
                                            <span>🔄 1x</span>
                                        </button>
                                        <button onClick={() => playSegment(0.75)} className="py-2.5 px-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest border-r border-gray-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400" title="Chậm 0.75x">
                                            0.75
                                        </button>
                                        <button onClick={() => playSegment(0.5)} className="py-2.5 px-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400" title="Rất chậm 0.5x">
                                            0.5
                                        </button>
                                    </div>
                                    <button onClick={restartSession} className="py-2.5 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-[9px] font-black uppercase">Restart</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <textarea
                                    autoFocus
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="Lắng nghe & chép lại vào đây..."
                                    className={`w-full bg-white dark:bg-white/5 border rounded-2xl p-5 md:p-6 h-32 md:h-40 outline-none focus:ring-4 text-lg md:text-2xl font-medium resize-none transition-all duration-500 shadow-inner leading-relaxed ${isCorrect === true ? 'border-emerald-500 ring-emerald-500/20' : isCorrect === false ? 'border-rose-500 ring-rose-500/20' : 'border-gray-200 dark:border-white/10 focus:ring-indigo-500/20'
                                        }`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!showResult) checkAnswer();
                                            else if (!isCorrect) { setShowResult(false); setIsCorrect(null); }
                                        }
                                    }}
                                />
                                <div className="flex justify-between items-center px-1">
                                    <button onClick={toggleHint} className="text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest hover:text-amber-500 dark:hover:text-amber-300">💡 Gợi ý ({hintsShown})</button>
                                    <div className="flex gap-3 text-[9px] text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest">
                                        <p>Ctrl = 🔊 Nghe lại</p>
                                        <p>Enter = ✓ CHECK</p>
                                    </div>
                                </div>
                            </div>

                            {hintsShown > 0 && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl flex flex-wrap gap-2 animate-fade-in slide-in-from-top duration-300">
                                    <span className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest w-full mb-1">Gợi ý từ:</span>
                                    {subtitles[currentIndex].text.split(/\s+/).map((word, idx) => (
                                        <span key={idx} className="font-mono text-amber-700 dark:text-amber-500/80 bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 rounded text-base">{idx < hintsShown ? word : word[0] + '...'}</span>
                                    ))}
                                </div>
                            )}

                            {showResult && (
                                <div className={`p-5 md:p-7 rounded-2xl border animate-fade-in zoom-in duration-300 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/20'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {isCorrect ? '✓' : '✗'}
                                        </div>
                                        <p className={`text-xs font-black uppercase tracking-widest ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {isCorrect ? 'Tuyệt vời!' : 'Phân tích lỗi:'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-x-2 gap-y-2 text-lg md:text-2xl font-bold leading-relaxed italic justify-center">
                                        {diffResult.map((d, idx) => (
                                            <span
                                                key={idx}
                                                className={`transition-all duration-300 flex items-center gap-1 ${d.status === 'correct' ? (d.displayWord === '*' ? 'text-gray-600 dark:text-gray-400 font-normal scale-75' : 'text-emerald-600 dark:text-emerald-400') :
                                                    d.status === 'wrong' ? 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/20 px-1 rounded' :
                                                        d.status === 'missing' ? 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-1 rounded' :
                                                            'text-gray-700 dark:text-gray-300'
                                                    } ${d.isFuture ? 'text-gray-500 dark:text-gray-500/40' : ''}`}
                                            >
                                                {revealed ? (d.original || d.word) : d.displayWord}
                                            </span>
                                        ))}
                                    </div>

                                    {!isCorrect && (
                                        <div className="mt-6 p-4 bg-white dark:bg-white/5 rounded-2xl flex flex-col gap-4">
                                            <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium text-center italic">{revealed ? 'Hãy ghi nhớ đáp án này!' : 'Nghe lại đoạn này và thử sửa lỗi xem sao!'}</p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {!revealed ? (
                                                    <>
                                                        <button onClick={() => { setShowResult(false); setIsCorrect(null); }} className="flex-1 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95">Sửa Ngay</button>
                                                        <button onClick={() => setRevealed(true)} className="flex-1 py-3 bg-gray-700 dark:bg-white/10 text-white dark:text-black rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">Đáp Án</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => { setShowResult(false); setIsCorrect(null); }} className="flex-1 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95">Gõ Lại</button>
                                                )}
                                                <button onClick={playSegment} className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-white/5 rounded-xl text-[10px] font-black uppercase border border-gray-200 dark:border-white/10 active:scale-95">Nghe Lại</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-2">
                                {!showResult ? (
                                    <button onClick={checkAnswer} disabled={!userInput.trim()} className="w-full py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-30 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/40 transition-all active:scale-95">Kiểm Tra Ngay</button>
                                ) : (
                                    <button onClick={() => handleNext(false)} className="w-full py-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-3 active:scale-95">
                                        Tiếp Tục <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" /></svg>
                                    </button>
                                )}
                            </div>

                            {/* TIMELINE ĐIỀU HƯỚNG */}
                            <div className="pt-5 border-t border-gray-200 dark:border-white/10">
                                <p className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.3em] mb-4 text-center">Tiến trình bài tập</p>
                                <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                    {subtitles.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => jumpToSegment(idx)}
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border-2 ${idx === currentIndex ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-300 text-white scale-110 shadow-xl' :
                                                idx < maxProgress ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                                    'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-400 hover:border-white/20'
                                                    }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isDone && (
                    <div className="fixed inset-0 bg-gray-950/80 dark:bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="max-w-md w-full bg-white dark:bg-white/5 p-10 rounded-[4rem] border border-white dark:border-white/10 text-center space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="text-7xl animate-bounce">🏆</div>
                            <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">Xuất sắc!</h2>
                            <p className="text-gray-600 dark:text-gray-400">Bạn đã hoàn thành toàn bộ đoạn phim chép chính tả này.</p>
                            <div className="space-y-3 pt-6">
                                <button onClick={restartSession} className="w-full py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-black text-lg hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-all">Luyện tập lại bài này</button>
                                <button onClick={() => { setVideoId(''); setSubtitles([]); }} className="w-full py-4 bg-gray-700 dark:bg-white/10 text-white dark:text-black rounded-2xl font-black text-lg hover:bg-gray-600 dark:hover:bg-white/20 transition-all">Quay về thư viện</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YoutubeDictation;
