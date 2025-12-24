import { useState, useEffect, useMemo } from 'react';

export default function LearnMode({ vocabulary, onUpdateStats, onExit }) {
    // Session Setup states
    const [showSetup, setShowSetup] = useState(false);
    const [showBatchPreview, setShowBatchPreview] = useState(true);
    const [stats, setStats] = useState({ correct: 0, total: 0 });
    const [completedCount, setCompletedCount] = useState(0);
    const [showSessionComplete, setShowSessionComplete] = useState(false);

    // UI Logic states
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [options, setOptions] = useState([]);
    const [userAnswer, setUserAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isTypo, setIsTypo] = useState(false);
    const [lastUserAnswer, setLastUserAnswer] = useState('');

    const [queue, setQueue] = useState([]);
    const [sessionStats, setSessionStats] = useState({}); // { wordId: { correct: 0, total: 0 } }
    const [initialQueueSize, setInitialQueueSize] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [studyDirection, setStudyDirection] = useState('both');
    const [masteredWords, setMasteredWords] = useState([]);
    const [studiedWords, setStudiedWords] = useState([]); // All unique words studied in this session

    useEffect(() => {
        if (isInitialized || vocabulary.length === 0) return;

        // Sorting logic stays the same...
        const sortedVocab = [...vocabulary].sort((a, b) => {
            const masteryA = a.masteryLevel || 0;
            const masteryB = b.masteryLevel || 0;
            if (masteryA !== masteryB) return masteryA - masteryB;

            const timeA = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
            const timeB = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;

            const statusOrder = { 'learning': 0, 'not-learned': 1, 'learned': 2 };
            const orderA = statusOrder[a.learningStatus] ?? 1;
            const orderB = statusOrder[b.learningStatus] ?? 1;
            if (orderA !== orderB) return orderA - orderB;

            return Math.random() - 0.5;
        });

        // Pick 10 words as requested
        const sessionWords = sortedVocab.slice(0, 10).map(w => ({
            ...w,
            mode: (w.masteryLevel < 2 || w.learningStatus === 'not-learned') ? 'mcq' : 'written'
        }));

        setQueue(sessionWords);
        setInitialQueueSize(sessionWords.length);
        setIsInitialized(true);
    }, [vocabulary, isInitialized]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const generateQuestion = (word) => {
        if (!word) return;

        setShowResult(false);
        setUserAnswer('');
        setSelectedOptionId(null);
        setIsTypo(false);

        if (word.mode === 'mcq') {
            const distractors = vocabulary
                .filter(w => w.id !== word.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            const allOptions = [...distractors, word].sort(() => Math.random() - 0.5);
            setOptions(allOptions);
        } else {
            setOptions([]);
        }
    };

    const handleAnswer = (correct, storageMode, optionId = null, isAlmost = false) => {
        if (showResult) return;

        const currentWord = queue[0];
        setLastUserAnswer(userAnswer);
        const finalCorrect = correct || isAlmost;
        setIsCorrect(finalCorrect);
        setIsTypo(isAlmost);
        setShowResult(true);
        if (optionId) setSelectedOptionId(optionId);

        // Update session tracking
        setSessionStats(prev => ({
            ...prev,
            [currentWord.id]: {
                correct: (prev[currentWord.id]?.correct || 0) + (finalCorrect ? 1 : 0),
                total: (prev[currentWord.id]?.total || 0) + 1
            }
        }));

        onUpdateStats(currentWord.id, finalCorrect, storageMode);

        setStudiedWords(prev => {
            if (prev.find(w => w.id === currentWord.id)) return prev;
            return [...prev, currentWord];
        });

        setStats(prev => ({
            correct: prev.correct + (finalCorrect ? 1 : 0),
            total: prev.total + 1
        }));
    };

    const levenshteinDistance = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    const processWrittenAnswer = () => {
        const currentWord = queue[0];
        const target = (currentWord.qType === 'term-to-def' ? currentWord.definition : currentWord.term).trim().toLowerCase();
        const user = userAnswer.trim().toLowerCase();

        setLastUserAnswer(userAnswer);

        if (user === target) {
            handleAnswer(true, 'learn-written');
            return;
        }

        const distance = levenshteinDistance(user, target);
        const threshold = target.length <= 4 ? 0 : target.length <= 8 ? 1 : 2;

        if (distance <= threshold) {
            handleAnswer(false, 'learn-written', null, true);
        } else {
            handleAnswer(false, 'learn-written');
        }
    };

    const handleOverride = () => {
        setIsCorrect(true);
        const currentWord = queue[0];
        if (!currentWord) return;

        // Update session tracking - increment correct count since it was false before
        setSessionStats(prev => ({
            ...prev,
            [currentWord.id]: {
                ...prev[currentWord.id],
                correct: (prev[currentWord.id]?.correct || 0) + 1
            }
        }));

        // Update overall session stats
        setStats(prev => ({
            ...prev,
            correct: prev.correct + 1
        }));

        // Notify parent that this was actually correct
        onUpdateStats(currentWord.id, true, 'learn-written');
    };

    const renderDiff = (user, target) => {
        const userClean = user.trim().toLowerCase();
        const targetClean = target.trim().toLowerCase();

        return (
            <div className="flex flex-wrap justify-center gap-1 font-mono text-2xl md:text-3xl">
                {targetClean.split('').map((char, i) => {
                    const isMatch = userClean[i] === char;
                    return (
                        <span key={i} className={isMatch ? 'text-white' : 'text-red-500 underline decoration-2 underline-offset-4'}>
                            {char}
                        </span>
                    );
                })}
                {userClean.length > targetClean.length && (
                    <span className="text-red-500 line-through opacity-50">
                        {userClean.slice(targetClean.length)}
                    </span>
                )}
            </div>
        );
    };

    const nextQuestion = () => {
        const [currentWord, ...remainingQueue] = queue;
        const wordStats = sessionStats[currentWord.id] || { correct: 0 };

        let newQueue = [...remainingQueue];

        if (!isCorrect) {
            // Sai -> Reset session correct count for this word and put back in queue
            setSessionStats(prev => ({
                ...prev,
                [currentWord.id]: { ...prev[currentWord.id], correct: 0 }
            }));

            // Re-insert 3 positions away
            const insertPos = Math.min(3, newQueue.length);
            newQueue.splice(insertPos, 0, currentWord);
        } else {
            // Đúng
            const totalCorrect = wordStats.correct;

            if (currentWord.mode === 'mcq') {
                // If passed MCQ, switch to Written and put back in queue to confirm mastery
                const upgradedWord = { ...currentWord, mode: 'written' };
                const insertPos = Math.min(5, newQueue.length);
                newQueue.splice(insertPos, 0, upgradedWord);
            } else if (totalCorrect < 2) {
                // If Written but only 1 correct so far, put back
                newQueue.push(currentWord);
            } else {
                // "Đúng nhiều" (at least 2 times, or passed from MCQ to Written) -> mark as mastered
                setCompletedCount(prev => prev + 1);
                setMasteredWords(prev => [...prev, currentWord]);
            }
        }

        if (stats.total >= 10 || newQueue.length === 0) {
            setShowSessionComplete(true);
        } else {
            setQueue(newQueue);
            generateQuestion(newQueue[0]);
        }
    };

    const startStudy = () => {
        const finalizedQueue = queue.map(word => {
            let qType = 'term-to-def';
            if (studyDirection === 'def-to-term') {
                qType = 'def-to-term';
            } else if (studyDirection === 'both') {
                qType = Math.random() > 0.5 ? 'term-to-def' : 'def-to-term';
            }
            return { ...word, qType };
        });
        setQueue(finalizedQueue);
        setShowBatchPreview(false);
        generateQuestion(finalizedQueue[0]);
    };

    if (queue.length === 0 && !showSessionComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-md glass-effect p-12 rounded-3xl animate-in zoom-in duration-500">
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-bold text-gradient-primary mb-4">
                        Tất cả đã hoàn thành!
                    </h2>
                    <p className="text-gray-400 mb-8 font-medium">
                        Không còn từ nào cần học hoặc ôn tập.
                    </p>
                    <button
                        className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-white hover:shadow-lg transition-all"
                        onClick={onExit}
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (showSessionComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-lg w-full glass-effect p-12 rounded-[2rem] animate-in zoom-in duration-500 shadow-2xl border border-white/5">
                    <div className="w-24 h-24 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-success-500/50">
                        <span className="text-5xl text-white">🏆</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2">Tuyệt vời!</h2>
                    <p className="text-gray-400 text-lg mb-10 font-medium">Bạn đã hoàn thành phiên học này.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-bold text-gradient-success mb-1">{completedCount}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Lượt đúng</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-bold text-gradient-primary mb-1">{stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Độ chính xác</div>
                        </div>
                    </div>

                    <div className="mb-10 text-left">
                        <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-black mb-4 text-center">Từ vựng trong phiên học ({studiedWords.length})</h3>
                        <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {studiedWords.map((word, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <div className="font-black text-white uppercase group-hover:text-primary-400 transition-colors text-base">{word.term}</div>
                                            {word.type && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 uppercase font-bold">{word.type}</span>}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); speak(word.term); }}
                                                className="p-1.5 glass-effect rounded-full hover:bg-white/10 text-primary-400 transition-all active:scale-90"
                                                title="Nghe phát âm"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {word.phonetic && <div className="text-xs text-gray-500 italic mb-1 uppercase tracking-wider">{word.phonetic}</div>}
                                        <div className="text-sm text-gray-300 line-clamp-1">{word.definition}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-xl text-gray-300 hover:bg-white/10 transition-all"
                            onClick={onExit}
                        >
                            Thoát ra
                        </button>
                        <button
                            className="w-full py-5 bg-gradient-primary rounded-2xl font-bold text-xl text-white hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all"
                            onClick={() => {
                                setStats({ correct: 0, total: 0 });
                                setCompletedCount(0);
                                setMasteredWords([]);
                                setStudiedWords([]);
                                setSessionStats({});
                                setShowSessionComplete(false);
                                setShowBatchPreview(true);
                                setIsInitialized(false);
                            }}
                        >
                            Tiếp tục học
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showBatchPreview) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8 font-sans">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <button onClick={onExit} className="w-full md:w-auto px-6 py-3 glass-effect rounded-xl font-bold text-gray-300">← Thoát</button>
                    <div className="glass-effect px-6 py-3 rounded-xl border-primary-500/20 text-center">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1 font-bold">Phiên học hôm nay</span>
                        <span className="text-xl font-black text-white">{queue.length} từ</span>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto glass-effect rounded-[2rem] p-6 md:p-10 border border-white/5 animate-in slide-in-from-bottom-10">
                    <div className="mb-8">
                        <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-black mb-4 text-center">Hướng học tập</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'term-to-def', label: 'Anh → Việt', icon: '🇺🇸' },
                                { id: 'def-to-term', label: 'Việt → Anh', icon: '🇻🇳' },
                                { id: 'both', label: 'Linh hoạt', icon: '🔄' },
                            ].map((dir) => (
                                <button
                                    key={dir.id}
                                    onClick={() => setStudyDirection(dir.id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-1 ${studyDirection === dir.id
                                        ? 'bg-primary-500/20 border-primary-500 text-white shadow-lg shadow-primary-500/10'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-xl">{dir.icon}</span>
                                    <span className="text-[10px] font-bold">{dir.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white mb-6 text-center">Danh sách từ vựng:</h2>
                    <div className="grid gap-3 mb-10 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
                        {queue.map((word, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                <span className={`w-12 h-8 rounded-lg ${word.mode === 'mcq' ? 'bg-primary-500/20 text-primary-400' : 'bg-success-500/20 text-success-400'} flex items-center justify-center font-bold text-[8px]`}>
                                    {word.mode === 'mcq' ? 'MCQ' : 'WRITE'}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-black text-white group-hover:text-primary-400 transition-colors uppercase">{word.term}</div>
                                        {word.type && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 uppercase font-bold">{word.type}</span>}
                                    </div>
                                    <div className="text-xs text-gray-400 italic mb-1">{word.phonetic}</div>
                                    <div className="text-sm text-gray-300 line-clamp-1">{word.definition}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={startStudy}
                        className="w-full py-5 bg-gradient-primary rounded-[1.5rem] font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/40 transform hover:-translate-y-1 transition-all"
                    >
                        Bắt đầu ngay! 🚀
                    </button>
                    <p className="text-center text-gray-500 text-[10px] mt-6 uppercase tracking-widest font-black">
                        {studyDirection === 'both' ? 'Học kết hợp Từ - Nghĩa và Nghĩa - Từ' : studyDirection === 'term-to-def' ? 'Chuyên học Từ sang Nghĩa' : 'Chuyên học Nghĩa sang Từ'}
                    </p>
                </div>
            </div>
        );
    }

    const currentWord = queue[0];
    if (!currentWord) return null;

    const isMCQ = currentWord.mode === 'mcq';
    const isTermToDef = currentWord.qType === 'term-to-def';
    const questionText = isTermToDef ? currentWord.term : currentWord.definition;
    const progressTotal = (stats.total / 10) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8 font-sans">
            {/* Header */}
            <div className="max-w-4xl mx-auto flex justify-between items-center mb-12 flex-wrap gap-4">
                <button
                    onClick={onExit}
                    className="px-6 py-3 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all text-gray-300"
                >
                    ← Thoát
                </button>
                <div className="flex gap-4 flex-1 justify-end">
                    <div className="glass-effect px-4 md:px-6 py-3 rounded-xl border-primary-500/20 flex-1 md:min-w-[180px]">
                        <span className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-wider block mb-1 font-bold italic">
                            Tiến độ phiên học
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-lg md:text-xl font-black text-white">{stats.total}<span className="text-gray-600 text-sm font-normal">/10</span></span>
                            <div className="flex-1 h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${progressTotal}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="glass-effect px-4 md:px-6 py-3 rounded-xl border-success-500/20 text-center">
                        <span className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-wider block mb-1 font-bold">Hình thức</span>
                        <span className={`text-lg md:text-xl font-black ${isMCQ ? 'text-primary-400' : 'text-success-400'}`}>{isMCQ ? 'TRÁC NGHIỆM' : 'VIẾT ĐÁP ÁN'}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="glass-effect rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 border-white/5 shadow-2xl relative overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 blur-[120px] -z-10" />

                    <div className="text-center mb-6 md:mb-10">
                        <div className="flex flex-col items-center gap-2 mb-4 md:mb-6">
                            <span className={`inline-block px-4 py-1.5 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm transition-all ${isMCQ ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-success-500/10 text-success-400 border-success-500/20'}`}>
                                {isTermToDef ? 'Dịch sang Nghĩa tiếng Việt' : 'Tìm từ tiếng Anh tương ứng'}
                            </span>
                            {currentWord.type && (
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    Loại từ: {currentWord.type}
                                </span>
                            )}
                        </div>

                        {currentWord.image && (
                            <div className="flex justify-center mb-4 md:mb-6">
                                <img
                                    src={currentWord.image}
                                    alt={currentWord.term}
                                    className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-[1.5rem] md:rounded-[2rem] border-4 border-white/5 shadow-2xl animate-in zoom-in duration-300"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-3 md:gap-4">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 tracking-tight leading-tight px-4 break-words">
                                {questionText}
                            </h2>
                            {isTermToDef && (
                                <button
                                    onClick={() => speak(currentWord.term)}
                                    className="mb-2 md:mb-4 p-2 md:p-3 glass-effect rounded-full hover:bg-white/10 text-primary-400 transition-all transform active:scale-90 shadow-lg"
                                    title="Nghe phát âm"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {currentWord.phonetic && isTermToDef && (
                            <p className="text-xl md:text-2xl text-gray-500 italic font-medium uppercase">{currentWord.phonetic}</p>
                        )}
                    </div>

                    {!showResult ? (
                        isMCQ ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                {options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option.id === currentWord.id, 'learn-mcq', option.id)}
                                        className="p-5 md:p-7 text-left glass-effect rounded-[1.2rem] md:rounded-[1.5rem] hover:bg-white/[0.08] hover:border-primary-500/50 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 md:gap-5 relative z-10">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs md:text-sm font-black text-gray-500 group-hover:bg-primary-500 group-hover:text-white transition-all transform group-hover:scale-110">
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-lg md:text-xl font-bold text-gray-300 group-hover:text-white transition-colors line-clamp-2">
                                                {isTermToDef ? option.definition : option.term}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6 max-w-md mx-auto w-full">
                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && userAnswer.trim() && processWrittenAnswer()}
                                    placeholder={isTermToDef ? "Gõ nghĩa của từ..." : "Gõ từ tiếng Anh..."}
                                    className="w-full p-4 md:p-6 bg-gray-900 border border-white/10 rounded-2xl text-2xl md:text-3xl font-black text-white text-center focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-700 shadow-inner"
                                    autoFocus
                                />
                                <button
                                    onClick={() => userAnswer.trim() && processWrittenAnswer()}
                                    disabled={!userAnswer.trim()}
                                    className="w-full py-4 md:py-5 bg-gradient-primary rounded-2xl font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
                                >
                                    Kiểm tra
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-600">
                            {isMCQ ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pointer-events-none">
                                    {options.map((option, idx) => {
                                        const isCorrectOption = option.id === currentWord.id;
                                        const isSelectedOption = option.id === selectedOptionId;

                                        let borderClass = 'border-white/5';
                                        let bgClass = 'bg-white/5';
                                        let textClass = 'text-gray-300';
                                        let icon = String.fromCharCode(65 + idx);
                                        let iconBg = 'bg-white/5';

                                        if (isCorrectOption) {
                                            borderClass = 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)] scale-[1.02]';
                                            bgClass = 'bg-green-500/10';
                                            textClass = 'text-green-400 font-bold';
                                            icon = '✓';
                                            iconBg = 'bg-green-500 text-white';
                                        } else if (isSelectedOption && !isCorrectOption) {
                                            borderClass = 'border-red-500/50 opacity-80';
                                            bgClass = 'bg-red-500/10';
                                            textClass = 'text-red-400';
                                            icon = '✕';
                                            iconBg = 'bg-red-500 text-white';
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-7 text-left border rounded-[1.5rem] transition-all flex items-center gap-5 ${bgClass} ${borderClass}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${iconBg} ${!isCorrectOption && !isSelectedOption ? 'text-gray-500' : ''}`}>
                                                    {icon}
                                                </div>
                                                <span className={`text-xl ${textClass}`}>
                                                    {isTermToDef ? option.definition : option.term}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`p-10 rounded-3xl border mb-10 flex flex-col items-center text-center shadow-2xl ${isTypo ? 'bg-orange-500/10 border-orange-500/30' : isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl transform scale-110 ${isTypo ? 'bg-orange-500 text-white shadow-orange-500/50' : isCorrect ? 'bg-green-500 text-white shadow-green-500/50' : 'bg-red-500 text-white shadow-red-500/50'}`}>
                                        <span className="text-5xl">{isTypo ? '✍️' : isCorrect ? '✓' : '✕'}</span>
                                    </div>
                                    <h3 className={`text-3xl font-black mb-4 ${isTypo ? 'text-orange-400' : isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                        {isTypo ? 'Gần đúng rồi!' : isCorrect ? 'Chính xác!' : 'Chưa đúng rồi'}
                                    </h3>
                                    {isTypo && <p className="text-orange-300/70 text-sm mb-4 font-medium italic">Bạn viết nhầm một chút:</p>}
                                    {isTypo && (
                                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                            {renderDiff(lastUserAnswer, isTermToDef ? currentWord.definition : currentWord.term)}
                                        </div>
                                    )}
                                    <div className="mt-4 p-6 bg-black/30 rounded-[1.5rem] w-full border border-white/5">
                                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-3">Đáp án chuẩn là:</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <p className="text-4xl font-black text-white tracking-tight break-words">
                                                {isTermToDef ? currentWord.definition : currentWord.term}
                                            </p>
                                            {!isTermToDef && (
                                                <button
                                                    onClick={() => speak(currentWord.term)}
                                                    className="p-2 glass-effect rounded-full hover:bg-white/10 text-primary-400 transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {!isCorrect && !isTypo && (
                                        <button
                                            onClick={handleOverride}
                                            className="mt-6 text-gray-400 hover:text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                                        >
                                            <span className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black transition-all">✓</span>
                                            Tôi đã trả lời đúng
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={nextQuestion}
                                className={`w-full py-6 rounded-2xl font-black text-2xl text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6 shadow-xl ${isTypo ? 'bg-orange-500 shadow-orange-500/30' : isCorrect ? 'bg-gradient-success shadow-green-500/30' : 'bg-gray-700'}`}
                            >
                                {isTypo ? 'Đã nhớ, tiếp tục →' : 'Tiếp tục (Câu tiếp theo) →'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
