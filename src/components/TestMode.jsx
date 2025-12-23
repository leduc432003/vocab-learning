import { useState, useEffect } from 'react';

const TestMode = ({ vocabulary, onUpdateStats, onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [stats, setStats] = useState({ correct: 0, total: 0 });
    const [showFinalSummary, setShowFinalSummary] = useState(false);

    useEffect(() => {
        generateQuestions();
    }, [vocabulary]);

    const generateQuestions = () => {
        const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
        const quizQuestions = shuffled.map(word => {
            const wrongAnswers = vocabulary
                .filter(w => w.id !== word.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(w => w.definition);

            const allAnswers = [word.definition, ...wrongAnswers]
                .sort(() => Math.random() - 0.5);

            return {
                word,
                answers: allAnswers,
                correctAnswer: word.definition
            };
        });

        setQuestions(quizQuestions);
    };

    const handleAnswerSelect = (answer) => {
        if (showResult) return;
        setSelectedAnswer(answer);
    };

    const handleSubmit = () => {
        if (!selectedAnswer) return;

        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        setShowResult(true);
        onUpdateStats(currentQuestion.word.id, isCorrect);
        setStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setShowFinalSummary(true);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gray-950">
                <div className="text-center max-w-md glass-effect p-12 rounded-3xl animate-in zoom-in duration-500">
                    <h2 className="text-4xl font-black text-gradient-primary mb-4">
                        Thiếu từ vựng
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 font-medium">
                        Bạn cần ít nhất 4 từ để bắt đầu bài kiểm tra!
                    </p>
                    <button
                        className="px-8 py-4 bg-gradient-primary rounded-xl font-bold text-white hover:shadow-lg transition-all"
                        onClick={onExit}
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (showFinalSummary) {
        const percentage = Math.round((stats.correct / stats.total) * 100);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-lg w-full glass-effect p-12 rounded-[2.5rem] animate-in zoom-in duration-500 shadow-2xl border border-white/5">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-500/50">
                        <span className="text-5xl text-white">📋</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2">Bài thi hoàn tất!</h2>
                    <p className="text-gray-400 text-lg mb-10 font-medium">Kết quả đánh giá của bạn</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-black text-gradient-success mb-1">{stats.correct}/{stats.total}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Câu đúng</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="text-3xl font-black text-gradient-warning mb-1">{percentage}%</div>
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Điểm số</div>
                        </div>
                    </div>

                    <button
                        className="w-full py-5 bg-gradient-primary rounded-2xl font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all"
                        onClick={onExit}
                    >
                        Trở về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isAnswerCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-10">
                <button
                    className="w-full md:w-auto px-6 py-3 glass-effect rounded-xl font-bold hover:bg-white/10 transition-all text-gray-300"
                    onClick={onExit}
                >
                    ← Thoát thi
                </button>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 px-4 md:px-6 py-3 glass-effect rounded-xl">
                        <span className="text-gray-500 text-[8px] md:text-[10px] uppercase font-black tracking-widest block mb-1">Câu hỏi</span>
                        <span className="text-lg md:text-xl font-black text-white">{currentIndex + 1}<span className="text-gray-600 text-sm font-normal">/{questions.length}</span></span>
                    </div>
                    <div className="flex-1 px-4 md:px-6 py-3 glass-effect rounded-xl">
                        <span className="text-gray-500 text-[8px] md:text-[10px] uppercase font-black tracking-widest block mb-1">Đúng</span>
                        <span className="text-lg md:text-xl font-black text-gradient-success">{stats.correct}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden mb-8 md:mb-12 shadow-inner">
                <div
                    className="h-full bg-gradient-primary transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="w-full glass-effect rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 blur-[120px] -z-10" />

                    <div className="text-center mb-8 md:mb-12 pb-6 md:pb-10 border-b border-white/5">
                        {currentQuestion.word.image && (
                            <img
                                src={currentQuestion.word.image}
                                alt={currentQuestion.word.term}
                                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-8 border-4 border-white/5 mx-auto shadow-2xl"
                            />
                        )}
                        <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                                {currentQuestion.word.term}
                            </h2>
                            <button
                                onClick={() => speak(currentQuestion.word.term)}
                                className="p-2 md:p-3 glass-effect rounded-full hover:bg-white/10 text-primary-400 transition-all transform active:scale-90 shadow-lg"
                                title="Nghe phát âm"
                            >
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex justify-center flex-wrap gap-2 md:gap-3">
                            {currentQuestion.word.phonetic && (
                                <p className="text-lg md:text-xl text-gray-500 italic font-medium">
                                    {currentQuestion.word.phonetic}
                                </p>
                            )}
                            {currentQuestion.word.type && (
                                <span className="inline-block px-3 md:px-4 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold text-gray-400">
                                    {currentQuestion.word.type}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-center text-gray-500 text-sm font-black uppercase tracking-[0.2em] mb-8">
                            Chọn định nghĩa chính xác:
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.answers.map((answer, index) => {
                                let borderClass = 'border-white/5';
                                let bgClass = 'bg-white/5';
                                let textClass = 'text-gray-300';
                                let iconBg = 'bg-white/5';
                                let icon = String.fromCharCode(65 + index);

                                if (showResult) {
                                    if (answer === currentQuestion.correctAnswer) {
                                        borderClass = 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-[1.02]';
                                        bgClass = 'bg-green-500/10';
                                        textClass = 'text-green-400 font-bold';
                                        iconBg = 'bg-green-500 text-white';
                                        icon = '✓';
                                    } else if (answer === selectedAnswer) {
                                        borderClass = 'border-red-500/50 opacity-80';
                                        bgClass = 'bg-red-500/10';
                                        textClass = 'text-red-400';
                                        iconBg = 'bg-red-500 text-white';
                                        icon = '✕';
                                    }
                                } else if (answer === selectedAnswer) {
                                    borderClass = 'border-primary-500 shadow-lg';
                                    bgClass = 'bg-primary-500/10';
                                    textClass = 'text-white font-bold';
                                    iconBg = 'bg-primary-500 text-white';
                                } else {
                                    borderClass = 'border-white/5 hover:bg-white/[0.08] hover:border-primary-500/50 hover:translate-x-1';
                                }

                                return (
                                    <button
                                        key={index}
                                        className={`flex items-center gap-4 md:gap-6 p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all text-left w-full relative overflow-hidden group ${borderClass} ${bgClass}`}
                                        onClick={() => handleAnswerSelect(answer)}
                                        disabled={showResult}
                                    >
                                        <span className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl font-black text-xs md:text-sm flex-shrink-0 transition-all ${iconBg} ${!showResult && answer !== selectedAnswer ? 'text-gray-500 group-hover:bg-primary-500 group-hover:text-white' : 'text-white'}`}>
                                            {icon}
                                        </span>
                                        <span className={`flex-1 text-base md:text-lg leading-relaxed ${textClass} line-clamp-3`}>
                                            {answer}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-center mt-6">
                        {!showResult ? (
                            <button
                                className="w-full py-5 bg-gradient-primary rounded-[1.5rem] font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                                onClick={handleSubmit}
                                disabled={!selectedAnswer}
                            >
                                Xác nhận đáp án
                            </button>
                        ) : (
                            <div className="w-full flex flex-col items-center gap-8 animate-in slide-in-from-bottom-5">
                                <div className={`w-full py-6 rounded-2xl flex items-center justify-center gap-4 border-2 font-black text-2xl ${isAnswerCorrect
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                    }`}>
                                    <span>{isAnswerCorrect ? '✨ Chính xác!' : '😢 Chưa đúng rồi'}</span>
                                </div>
                                <button
                                    className="w-full py-6 bg-gradient-primary rounded-[1.5rem] font-black text-2xl text-white hover:shadow-2xl hover:shadow-primary-500/40 active:scale-95 transition-all shadow-xl"
                                    onClick={handleNext}
                                >
                                    {currentIndex < questions.length - 1 ? 'Câu kế tiếp →' : 'Xem kết quả'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestMode;
