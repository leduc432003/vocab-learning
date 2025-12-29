import { useState, useEffect } from 'react';

export default function WriteMode({ vocabulary, onUpdateStats, onExit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [cards, setCards] = useState([]);
    const [showFinalSummary, setShowFinalSummary] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (isInitialized || vocabulary.length === 0) return;
        const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setIsInitialized(true);
    }, [vocabulary, isInitialized]);

    if (cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-md glass-effect p-12 rounded-3xl animate-in zoom-in duration-500">
                    <div className="text-6xl mb-6">📝</div>
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
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-500/50">
                        <span className="text-5xl text-white">✍️</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2">Hoàn thành!</h2>
                    <p className="text-gray-400 text-lg mb-10 font-medium">Bạn đã luyện viết xong toàn bộ thẻ.</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-black text-gradient-success mb-1">{score.correct}/{score.total}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Viết đúng</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-black text-gradient-warning mb-1">{percentage}%</div>
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Độ chính xác</div>
                        </div>
                    </div>

                    <button
                        className="w-full py-5 bg-gradient-primary rounded-2xl font-bold text-xl text-white hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all"
                        onClick={onExit}
                    >
                        Trở về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

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

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
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
                    <div className="flex-1 px-4 md:px-6 py-3 glass-effect rounded-xl text-center md:text-left">
                        <span className="text-gray-500 text-[8px] md:text-[10px] uppercase font-black tracking-widest block mb-1">Đúng</span>
                        <span className="text-lg md:text-xl font-black text-gradient-success">{score.correct}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden mb-8 md:mb-12 shadow-inner">
                <div
                    className="h-full bg-gradient-primary transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="glass-effect rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center min-h-[400px] md:min-h-[500px]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 blur-[120px] -z-10" />

                    <div className="text-center mb-8 md:mb-12">
                        <span className="inline-block px-4 py-1.5 bg-secondary-500/10 text-secondary-400 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest mb-4 md:mb-6 border border-secondary-500/20 shadow-sm">
                            GÕ TỪ TIẾNG ANH CHO:
                        </span>
                        {currentCard.image && (
                            <div className="flex justify-center mb-4 md:mb-6">
                                <img
                                    src={currentCard.image}
                                    alt="Hint"
                                    className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-[1.5rem] md:rounded-[2rem] border-4 border-white/5 shadow-2xl animate-in zoom-in duration-300"
                                />
                            </div>
                        )}
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 md:mb-6 tracking-tighter leading-tight">
                            {currentCard.definition}
                        </h2>
                        {currentCard.type && (
                            <span className="inline-block px-3 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {currentCard.type}
                            </span>
                        )}
                    </div>

                    <div className="w-full max-w-md mx-auto">
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Gõ từ tại đây..."
                            disabled={showResult}
                            className={`w-full px-4 md:px-6 py-4 md:py-6 text-center text-2xl md:text-3xl font-black rounded-2xl border-2 transition-all focus:outline-none placeholder:text-gray-700 shadow-inner ${showResult
                                ? isCorrect
                                    ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                                    : 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                : 'bg-gray-900 border-white/10 text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20'
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
                                            <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Đáp án đúng:</p>
                                            <div className="flex items-center justify-center gap-4">
                                                <p className="text-3xl font-black text-white tracking-tight">{currentCard.term}</p>
                                                <button
                                                    onClick={() => speak(currentCard.term)}
                                                    className="p-2 glass-effect rounded-full hover:bg-white/10 text-primary-400 transition-all shadow-lg"
                                                    title="Nghe phát âm"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                </button>
                                            </div>
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
                                className="w-full py-5 bg-gradient-primary rounded-[1.5rem] font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
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
