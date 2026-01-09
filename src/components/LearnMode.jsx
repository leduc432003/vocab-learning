import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function LearnMode({ vocabulary, onUpdateStats, onExit, isReview = false }) {
    const { t } = useTranslation();
    // Session Setup states
    const [showSetup, setShowSetup] = useState(true);
    const [setupConfig, setSetupConfig] = useState({ batchSize: 10, limitType: 'mastery' }); // limitType: 'questions' | 'mastery'
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
        // Only safety check, logic moved to handleStartSession
        if (vocabulary.length === 0) return;
    }, [vocabulary]);

    const handleStartSession = () => {
        // Sorting logic for Supabase fields
        const sortedVocab = [...vocabulary].sort((a, b) => {
            const stageOrder = { 'new': 0, 'learning': 1, 'review': 2 };
            const orderA = stageOrder[a.srsStage] ?? 0;
            const orderB = stageOrder[b.srsStage] ?? 0;
            if (orderA !== orderB) return orderA - orderB;

            const timeA = a.nextReview ? new Date(a.nextReview).getTime() : 0;
            const timeB = b.nextReview ? new Date(b.nextReview).getTime() : 0;
            return timeA - timeB;
        });

        // Use batchSize from setup
        const count = Math.min(setupConfig.batchSize, sortedVocab.length);
        const sessionWords = sortedVocab.slice(0, count).map(w => ({
            ...w,
            stage: 'recognition',
            mode: 'mcq',
            qType: 'def-to-term'
        }));

        setQueue(sessionWords);
        setInitialQueueSize(sessionWords.length);
        setIsInitialized(true);
        setShowSetup(false);
        setShowBatchPreview(true);
    };

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
            handleAnswer(true, isReview ? 'review-written' : 'learn-written');
            return;
        }

        const distance = levenshteinDistance(user, target);
        const threshold = target.length <= 4 ? 0 : target.length <= 8 ? 1 : 2;

        if (distance <= threshold) {
            handleAnswer(false, isReview ? 'review-written' : 'learn-written', null, true);
        } else {
            handleAnswer(false, isReview ? 'review-written' : 'learn-written');
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
        onUpdateStats(currentWord.id, true, isReview ? 'review-written' : 'learn-written');
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

        let newQueue = [...remainingQueue];

        if (!isCorrect) {
            // ❌ Wrong Answer
            // Logic: If Wrong -> Go back to Step 1 (Recognition)
            const downgradedWord = {
                ...currentWord,
                stage: 'recognition',
                mode: 'mcq',
                qType: 'def-to-term'
            };

            // Re-insert: at the end of the current queue to repeat later
            newQueue.push(downgradedWord);

        } else {
            // ✅ Correct Answer
            if (currentWord.stage === 'recognition') {
                // Step 1 Passed -> Move to Step 2: Recall (Written)
                const upgradedWord = {
                    ...currentWord,
                    stage: 'recall',
                    mode: 'written',
                    qType: 'def-to-term'
                };

                // Push to the end of the queue - this ensures all MCQs are done first
                // or at least follows the word through the stages sequentially.
                newQueue.push(upgradedWord);

            } else {
                // Step 2 Passed (Recall) -> Mark as Mastered for this session
                setCompletedCount(prev => prev + 1);
                setMasteredWords(prev => [...prev, currentWord]);
                // Word is finished, not added back to queue
            }
        }

        // Check End Condition based on Limit Type
        let shouldEnd = false;

        if (setupConfig.limitType === 'questions') {
            // Stop if Total Questions >= Limit (batchSize used as question limit in this mode)
            // Note: stats.total has just been incremented in handleAnswer -> setStats
            // But here we rely on the state which might not be updated yet in this closure?
            // Actually handleAnswer updates state, but nextQuestion is called afterwards? 
            // Wait, handleAnswer calls nextQuestion? No, user clicks "Continue".
            // So stats.total is fresh.
            if (stats.total >= setupConfig.batchSize) {
                shouldEnd = true;
            }
        } else {
            // 'mastery' mode: Stop when queue is empty (all learned) or hard cap 50?
            // Actually original logic was queue.length === 0
        }

        if (newQueue.length === 0 && !showSessionComplete) {
            shouldEnd = true;
        }

        if (shouldEnd) {
            setShowSessionComplete(true);
        } else {
            setQueue(newQueue);
            generateQuestion(newQueue[0]);
        }
    };

    const startStudy = () => {
        // Just start, the queue is already initialized in useEffect
        setShowBatchPreview(false);
        generateQuestion(queue[0]);
    };

    if (showSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6 font-sans">
                <div className="max-w-md w-full glass-effect p-6 md:p-8 rounded-[2rem] animate-in zoom-in duration-300 border border-white/5 shadow-2xl">
                    <div className="text-center mb-6 md:mb-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-primary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                            <span className="text-2xl md:text-3xl">⚙️</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white">{t('learn.setupTitle')}</h2>
                        <p className="text-gray-400 text-[10px] md:text-sm mt-1 md:mt-2">{t('learn.customGoal')}</p>
                    </div>

                    <div className="space-y-5 md:space-y-6">
                        <div>
                            <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 md:mb-3 text-center md:text-left">{t('learn.targetAmount')}</label>
                            <div className="flex items-center gap-3 md:gap-4">
                                <button
                                    onClick={() => setSetupConfig(p => ({ ...p, batchSize: Math.max(5, p.batchSize - 5) }))}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-lg md:text-xl transition-all"
                                >-</button>
                                <div className="flex-1 h-10 md:h-12 bg-gray-900/50 rounded-lg md:rounded-xl border border-white/10 flex items-center justify-center text-lg md:text-xl font-black text-primary-400">
                                    {setupConfig.batchSize}
                                </div>
                                <button
                                    onClick={() => setSetupConfig(p => ({ ...p, batchSize: p.batchSize + 5 }))}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-lg md:text-xl transition-all"
                                >+</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 md:mb-3 text-center md:text-left">{t('learn.limitMode')}</label>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                <button
                                    onClick={() => setSetupConfig(p => ({ ...p, limitType: 'questions' }))}
                                    className={`p-3 md:p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all ${setupConfig.limitType === 'questions' ? 'bg-primary-500/20 border-primary-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                >
                                    <span className="text-xl md:text-2xl">⚡</span>
                                    <span className="text-[10px] md:text-xs font-bold">{t('learn.questions')}</span>
                                </button>
                                <button
                                    onClick={() => setSetupConfig(p => ({ ...p, limitType: 'mastery' }))}
                                    className={`p-3 md:p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all ${setupConfig.limitType === 'mastery' ? 'bg-success-500/20 border-success-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                >
                                    <span className="text-xl md:text-2xl">🎓</span>
                                    <span className="text-[10px] md:text-xs font-bold">{t('learn.mastery')}</span>
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-gray-500 mt-3 italic">
                                {setupConfig.limitType === 'questions'
                                    ? t('learn.descQuestions', { count: setupConfig.batchSize })
                                    : t('learn.descMastery', { count: setupConfig.batchSize })}
                            </p>
                        </div>

                        <div className="pt-2 md:pt-4">
                            <button
                                onClick={handleStartSession}
                                className="w-full py-3.5 md:py-4 bg-gradient-primary rounded-xl font-black text-base md:text-lg text-white hover:shadow-xl hover:shadow-primary-500/20 transform hover:-translate-y-1 transition-all"
                            >
                                {t('learn.startNow')}
                            </button>
                            <button
                                onClick={onExit}
                                className="w-full py-3 md:py-4 mt-2 text-gray-500 font-bold hover:text-white transition-all text-sm"
                            >
                                {t('common.back')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (queue.length === 0 && !showSessionComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-md glass-effect p-12 rounded-3xl animate-in zoom-in duration-500">
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-bold text-gradient-primary mb-4">
                        {t('learn.allDone')}
                    </h2>
                    <p className="text-gray-400 mb-8 font-medium">
                        {t('learn.noWords')}
                    </p>
                    <button
                        className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-white hover:shadow-lg transition-all"
                        onClick={onExit}
                    >
                        {t('common.back')}
                    </button>
                </div>
            </div>
        );
    }

    if (showSessionComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-lg w-full glass-effect p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] animate-in zoom-in duration-500 shadow-2xl border border-white/5">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-lg shadow-success-500/50">
                        <span className="text-3xl md:text-5xl text-white">🏆</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight">{t('learn.awesome')}</h2>
                    <p className="text-gray-400 text-sm md:text-lg mb-8 md:mb-10 font-medium">{t('learn.sessionFinished')}</p>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                        <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5">
                            <div className="text-2xl md:text-3xl font-bold text-gradient-success mb-1">{completedCount}</div>
                            <div className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('learn.correctHits')}</div>
                        </div>
                        <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5">
                            <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">{stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</div>
                            <div className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('learn.accuracy')}</div>
                        </div>
                    </div>

                    <div className="mb-8 md:mb-10 text-left">
                        <h3 className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-3 md:mb-4 text-center">{t('learn.vocabInSession')} ({studiedWords.length})</h3>
                        <div className="grid gap-2 md:grid-cols-1 max-h-[30vh] md:max-h-[40vh] overflow-y-auto pr-1 md:pr-2 no-scrollbar">
                            {studiedWords.map((word, idx) => {
                                const isMastered = masteredWords.some(m => m.id === word.id);
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${isMastered ? 'bg-success-500/20 text-success-400' : 'bg-primary-500/20 text-primary-400'} flex items-center justify-center text-[10px] font-bold shadow-inner shrink-0`}>
                                            {isMastered ? '✓' : idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className="font-black text-white uppercase group-hover:text-primary-400 transition-colors text-sm md:text-base truncate">{word.term}</div>
                                                {isMastered ? (
                                                    <span className="text-[7px] bg-success-500/20 px-1 py-0.5 rounded text-success-400 uppercase font-bold shrink-0">{t('vocabCard.mastered')}</span>
                                                ) : (
                                                    <span className="text-[7px] bg-primary-500/20 px-1 py-0.5 rounded text-primary-400 uppercase font-bold shrink-0">{t('vocabCard.learning')}</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-300 line-clamp-1">{word.definition}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <button
                            className="w-full py-4 md:py-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl font-bold text-base md:text-xl text-gray-300 hover:bg-white/10 transition-all"
                            onClick={onExit}
                        >
                            {t('learn.exit')}
                        </button>
                        <button
                            className={`w-full py-4 md:py-5 bg-gradient-primary rounded-xl md:rounded-2xl font-bold text-base md:text-xl text-white hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all`}
                            onClick={() => {
                                setStats({ correct: 0, total: 0 });
                                setCompletedCount(0);
                                setMasteredWords([]);
                                setStudiedWords([]);
                                setSessionStats({});
                                setShowSessionComplete(false);
                                setShowSetup(true); // Return to setup to get fresh words
                                setIsInitialized(false);
                            }}
                        >
                            {isReview ? t('learn.continueReviewing') : t('learn.continueLearning')}
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
                    <button onClick={() => setShowSetup(true)} className="w-full md:w-auto px-6 py-3 glass-effect rounded-xl font-bold text-gray-300">← {t('learn.reconfigure')}</button>
                    <div className="glass-effect px-6 py-3 rounded-xl border-primary-500/20 text-center">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1 font-bold">{isReview ? t('learn.reviewSession') : t('learn.todaySession')}</span>
                        <span className="text-xl font-black text-white">{queue.length} {t('learn.words_count')}</span>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto glass-effect rounded-[2rem] p-6 md:p-10 border border-white/5 animate-in slide-in-from-bottom-10">
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-6 text-center">{t('learn.vocabList')}</h2>
                    <div className="grid gap-3 mb-10 overflow-y-auto max-h-[40vh] pr-2 no-scrollbar">
                        {queue.map((word, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                <span className={`w-12 h-8 rounded-lg ${word.stage === 'recognition' ? 'bg-primary-500/20 text-primary-400' : 'bg-success-500/20 text-success-400'} flex items-center justify-center font-bold text-[8px]`}>
                                    {word.stage === 'recognition' ? 'MCQ' : 'WRITE'}
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
                        {t('learn.startNow')}! 🚀
                    </button>
                    <p className="text-center text-gray-500 text-[10px] mt-6 uppercase tracking-widest font-black">
                        {t('learn.learningPath')}
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
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8 font-sans flex flex-col">
            {/* Header */}
            <div className="max-w-4xl mx-auto w-full flex justify-between items-center mb-6 md:mb-12 gap-3">
                <button
                    onClick={onExit}
                    className="px-4 md:px-6 py-2 md:py-3 glass-effect rounded-lg md:rounded-xl font-semibold hover:bg-white/10 transition-all text-gray-300 text-sm md:text-base"
                >
                    ← <span className="hidden md:inline">{t('common.exit')}</span>
                </button>
                <div className="flex gap-2 md:gap-4 flex-1 justify-end max-w-full overflow-hidden">
                    <div className="glass-effect px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl border-primary-500/20 flex-1 md:min-w-[180px]">
                        <span className="text-gray-500 text-[7px] md:text-[10px] uppercase tracking-wider block mb-0.5 font-bold italic truncate">
                            {setupConfig.limitType === 'questions' ? t('learn.progressQ') : t('learn.progressW')}
                        </span>
                        <div className="flex items-center gap-2 md:gap-3">
                            <span className="text-sm md:text-xl font-black text-white shrink-0">
                                {setupConfig.limitType === 'questions' ? stats.total : completedCount}
                                <span className="text-gray-600 text-[10px] md:text-sm font-normal">/{setupConfig.batchSize}</span>
                            </span>
                            <div className="flex-1 h-1 md:h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-primary transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, (setupConfig.limitType === 'questions'
                                            ? (stats.total / setupConfig.batchSize)
                                            : ((completedCount * 2 + (queue.filter(w => w.stage === 'recall').length)) / (setupConfig.batchSize * 2))) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="glass-effect px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl border-success-500/20 text-center shrink-0">
                        <span className="text-gray-500 text-[7px] md:text-[10px] uppercase tracking-wider block mb-0.5 font-bold">{t('learn.type')}</span>
                        <span className={`text-xs md:text-xl font-black ${isMCQ ? 'text-primary-400' : 'text-success-400'}`}>{isMCQ ? t('learn.choose') : t('learn.write')}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto w-full">
                <div className="glass-effect rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 border-white/5 shadow-2xl relative overflow-hidden min-h-[350px] md:min-h-[500px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 blur-[120px] -z-10" />

                    <div className="text-center mb-6 md:mb-10">
                        <div className="flex flex-col items-center gap-2 mb-4 md:mb-6">
                            <span className={`inline-block px-4 py-1.5 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm transition-all ${isMCQ ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-success-500/10 text-success-400 border-success-500/20'}`}>
                                {isTermToDef ? t('learn.translateToVi') : t('learn.translateToEn')}
                            </span>
                            {currentWord.type && (
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    {t('learn.wordTypeLabel')}: {currentWord.type}
                                </span>
                            )}
                        </div>

                        {currentWord.image && (
                            <div className="flex justify-center mb-4 md:mb-6">
                                <img
                                    src={currentWord.image}
                                    alt={currentWord.term}
                                    className="w-24 h-24 md:w-48 md:h-48 object-cover rounded-[1.5rem] md:rounded-[2rem] border-4 border-white/5 shadow-2xl animate-in zoom-in duration-300"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-3 md:gap-4">
                            <h2 className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-4 tracking-tight leading-tight px-4 break-words">
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
                                        onClick={() => handleAnswer(option.id === currentWord.id, isReview ? 'review-mcq' : 'learn-mcq', option.id)}
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
                                    placeholder={isTermToDef ? t('learn.typeMeaning') : t('learn.typeEnglish')}
                                    className="w-full p-4 md:p-6 bg-gray-900 border border-white/10 rounded-2xl text-2xl md:text-3xl font-black text-white text-center focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-700 shadow-inner"
                                    autoFocus
                                />
                                <button
                                    onClick={() => userAnswer.trim() && processWrittenAnswer()}
                                    disabled={!userAnswer.trim()}
                                    className="w-full py-4 md:py-5 bg-gradient-primary rounded-2xl font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
                                >
                                    {t('learn.check')}
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
                                <div className={`p-6 md:p-10 rounded-3xl border mb-6 md:mb-10 flex flex-col items-center text-center shadow-2xl w-full max-w-md mx-auto ${isTypo ? 'bg-orange-500/10 border-orange-500/30' : isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl transform scale-110 ${isTypo ? 'bg-orange-500 text-white shadow-orange-500/50' : isCorrect ? 'bg-green-500 text-white shadow-green-500/50' : 'bg-red-500 text-white shadow-red-500/50'}`}>
                                        <span className="text-5xl">{isTypo ? '✍️' : isCorrect ? '✓' : '✕'}</span>
                                    </div>
                                    <h3 className={`text-3xl font-black mb-4 ${isTypo ? 'text-orange-400' : isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                        {isTypo ? t('learn.almost') : isCorrect ? t('learn.correct') : t('learn.incorrect')}
                                    </h3>
                                    {isTypo && <p className="text-orange-300/70 text-sm mb-4 font-medium italic">{t('learn.typoHint')}</p>}
                                    {isTypo && (
                                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                            {renderDiff(lastUserAnswer, isTermToDef ? currentWord.definition : currentWord.term)}
                                        </div>
                                    )}
                                    <div className="mt-4 p-6 bg-black/30 rounded-[1.5rem] w-full border border-white/5">
                                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-3">{t('learn.correctAnswer')}</p>
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
                                            {t('learn.override')}
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={nextQuestion}
                                className={`w-full py-6 rounded-2xl font-black text-2xl text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6 shadow-xl ${isTypo ? 'bg-orange-500 shadow-orange-500/30' : isCorrect ? 'bg-gradient-success shadow-green-500/30' : 'bg-gray-700'}`}
                            >
                                {isTypo ? t('learn.gotIt') : t('learn.continueNext')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
