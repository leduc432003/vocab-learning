import { useState, useEffect } from 'react';

export default function SpellMode({ vocabulary, onUpdateStats, onExit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [cards, setCards] = useState([]);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [showFinalSummary, setShowFinalSummary] = useState(false);

    useEffect(() => {
        const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
        setCards(shuffled);
    }, [vocabulary]);

    useEffect(() => {
        if (cards.length > 0 && !hasPlayed && !showFinalSummary) {
            playAudio();
            setHasPlayed(true);
        }
    }, [currentIndex, cards, showFinalSummary]);

    if (cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-md glass-effect p-12 rounded-3xl animate-in zoom-in duration-500">
                    <div className="text-6xl mb-6">🔊</div>
                    <h2 className="text-3xl font-black text-gradient-primary mb-4">Không có từ vựng</h2>
                    <button
                        onClick={onExit}
                        className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-white mt-4"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (showFinalSummary) {
        const percentage = Math.round((score.correct / score.total) * 100);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-lg w-full glass-effect p-12 rounded-[2.5rem] animate-in zoom-in duration-500 shadow-2xl border border-white/5">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-500/50">
                        <span className="text-5xl text-white">🔊</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2">Hoàn thành!</h2>
                    <p className="text-gray-400 text-lg mb-10 font-medium">Bạn đã hoàn thành phần luyện nghe viết.</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-black text-gradient-success mb-1">{score.correct}/{score.total}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Nghe đúng</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-black text-gradient-warning mb-1">{percentage}%</div>
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Độ chính xác</div>
                        </div>
                    </div>

                    <button
                        className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-xl text-white hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all"
                        onClick={onExit}
                    >
                        Trở về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    const playAudio = () => {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentCard.term);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    };

    const normalizeText = (text) => {
        return text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    };

    const checkAnswer = () => {
        const normalized = normalizeText(userAnswer);
        const correct = normalizeText(currentCard.term);
        const isMatch = normalized === correct;

        setIsCorrect(isMatch);
        setShowResult(true);

        if (isMatch) {
            setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
            onUpdateStats(currentCard.id, true);
        } else {
            setScore(prev => ({ ...prev, total: prev.total + 1 }));
            onUpdateStats(currentCard.id, false);
        }
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserAnswer('');
            setShowResult(false);
            setHasPlayed(false);
        } else {
            setShowFinalSummary(true);
        }
    };

    const handleOverride = () => {
        setIsCorrect(true);
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        onUpdateStats(currentCard.id, true);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (!showResult) {
                if (userAnswer.trim()) checkAnswer();
            } else {
                handleNext();
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-10">
                <button
                    onClick={onExit}
                    className="w-full md:w-auto px-6 py-3 glass-effect rounded-xl font-bold hover:bg-white/10 transition-all text-gray-300"
                >
                    ← Thoát
                </button>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 px-4 md:px-6 py-3 glass-effect rounded-xl text-center md:text-left">
                        <span className="text-gray-500 text-[8px] md:text-[10px] uppercase font-black tracking-widest block mb-1">Thẻ</span>
                        <span className="text-lg md:text-xl font-black text-white">{currentIndex + 1}<span className="text-gray-600 text-sm font-normal">/{cards.length}</span></span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden mb-8 md:mb-12 shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="glass-effect rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center min-h-[400px] md:min-h-[500px]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[120px] -z-10" />

                    <div className="text-center mb-6 md:mb-10 w-full">
                        {currentCard.image && (
                            <div className="flex justify-center mb-4 md:mb-8">
                                <img
                                    src={currentCard.image}
                                    alt="Hint"
                                    className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-[1.5rem] md:rounded-[2rem] border-4 border-white/5 shadow-2xl animate-in zoom-in duration-300"
                                />
                            </div>
                        )}
                        <h3 className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-8">
                            NGHE VÀ ĐÁNH VẦN:
                        </h3>

                        <button
                            onClick={playAudio}
                            className="group relative mx-auto mb-6 md:mb-10 transform hover:scale-105 active:scale-95 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                                <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                </svg>
                            </div>
                        </button>

                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6 md:mb-10">🔊 Nhấn để nghe lại</p>

                        {!showResult && (
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-4">
                                <p className="text-gray-500 text-[10px] uppercase font-black mb-2">Gợi ý:</p>
                                <p className="text-xl font-bold text-gray-300 leading-relaxed">{currentCard.definition}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full max-w-md mx-auto">
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Gõ những gì bạn nghe được..."
                            disabled={showResult}
                            className={`w-full px-4 md:px-6 py-4 md:py-6 text-center text-2xl md:text-3xl font-black rounded-2xl border-2 transition-all focus:outline-none placeholder:text-gray-700 shadow-inner ${showResult
                                ? isCorrect
                                    ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                                    : 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                : 'bg-gray-900 border-white/10 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20'
                                }`}
                            autoFocus
                        />

                        {showResult && (
                            <div className="mt-10 animate-in slide-in-from-bottom-5">
                                <div className={`flex flex-col items-center gap-4 p-8 rounded-3xl border-2 ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {isCorrect ? '✓' : '✕'}
                                    </div>
                                    <h3 className={`text-2xl font-black ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                        {isCorrect ? 'Tuyệt vời!' : 'Chưa chính xác'}
                                    </h3>
                                    {!isCorrect && (
                                        <div className="w-full mt-2 p-4 bg-black/30 rounded-2xl text-center border border-white/5">
                                            <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Từ đúng là:</p>
                                            <p className="text-4xl font-black text-white tracking-tight">{currentCard.term}</p>
                                            {currentCard.phonetic && <p className="text-gray-400 italic mt-1">{currentCard.phonetic}</p>}
                                        </div>
                                    )}
                                    {!isCorrect && (
                                        <button
                                            onClick={handleOverride}
                                            className="mt-4 text-gray-500 hover:text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                                        >
                                            <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black transition-all">✓</span>
                                            Tôi đã trả lời đúng
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full max-w-md mt-10">
                        {!showResult ? (
                            <button
                                onClick={checkAnswer}
                                disabled={!userAnswer.trim()}
                                className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-[1.5rem] font-black text-xl text-white hover:shadow-2xl hover:shadow-purple-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                            >
                                Xác nhận
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className={`w-full py-5 rounded-[1.5rem] font-black text-xl text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${isCorrect ? 'bg-gradient-success shadow-green-500/30' : 'bg-gray-700'}`}
                            >
                                {currentIndex < cards.length - 1 ? 'Tiếp tục →' : 'Xem kết quả'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
