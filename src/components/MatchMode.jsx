import { useState, useEffect } from 'react';

export default function MatchMode({ vocabulary, onExit }) {
    const [cards, setCards] = useState([]);
    const [selected, setSelected] = useState([]);
    const [matched, setMatched] = useState([]);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        initializeGame();
    }, [vocabulary]);

    useEffect(() => {
        let interval;
        if (isRunning && !isComplete) {
            interval = setInterval(() => {
                setTime(prev => prev + 10);
            }, 10);
        }
        return () => clearInterval(interval);
    }, [isRunning, isComplete]);

    const initializeGame = () => {
        const selectedWords = [...vocabulary]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(6, vocabulary.length));

        const terms = selectedWords.map((word, idx) => ({
            id: `term-${idx}`,
            content: word.term,
            pairId: idx,
            type: 'term'
        }));

        const definitions = selectedWords.map((word, idx) => ({
            id: `def-${idx}`,
            content: word.definition,
            pairId: idx,
            type: 'definition'
        }));

        const allCards = [...terms, ...definitions].sort(() => Math.random() - 0.5);
        setCards(allCards);
        setSelected([]);
        setMatched([]);
        setTime(0);
        setIsRunning(false);
        setIsComplete(false);
    };

    const handleCardClick = (card) => {
        if (!isRunning) {
            setIsRunning(true);
        }

        if (matched.includes(card.id) || selected.find(s => s.id === card.id)) {
            return;
        }

        const newSelected = [...selected, card];
        setSelected(newSelected);

        if (newSelected.length === 2) {
            const [first, second] = newSelected;

            if (first.pairId === second.pairId && first.type !== second.type) {
                setMatched([...matched, first.id, second.id]);
                setSelected([]);

                if (matched.length + 2 === cards.length) {
                    setIsComplete(true);
                    setIsRunning(false);
                }
            } else {
                setTimeout(() => {
                    setSelected([]);
                }, 800);
            }
        }
    };

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    if (vocabulary.length < 2) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
                <div className="text-center max-w-md glass-effect p-12 rounded-3xl animate-in zoom-in duration-500">
                    <div className="text-6xl mb-6">🎮</div>
                    <h2 className="text-3xl font-black text-gradient-primary mb-4">Cần thêm từ vựng</h2>
                    <p className="text-gray-400 font-medium mb-8">Bạn cần ít nhất 2 từ để chơi Ghép đôi</p>
                    <button
                        onClick={onExit}
                        className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-white shadow-lg"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-10">
                <button
                    onClick={onExit}
                    className="w-full md:w-auto px-6 py-3 glass-effect rounded-xl font-bold hover:bg-white/10 transition-all text-gray-300"
                >
                    ← Thoát
                </button>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="px-6 py-3 glass-effect rounded-xl flex-1 md:min-w-[150px] text-center md:text-left">
                        <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Thời gian</span>
                        <span className="text-2xl font-black text-gradient-warning font-mono">{formatTime(time)}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-8 md:mb-12 shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    style={{ width: `${(matched.length / cards.length) * 100}%` }}
                />
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
                    {cards.map(card => {
                        const isMatched = matched.includes(card.id);
                        const isSelected = selected.find(s => s.id === card.id);

                        return (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                disabled={isMatched}
                                className={`p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] font-bold text-center min-h-[120px] md:min-h-[160px] flex items-center justify-center transition-all transform duration-300 ${isMatched
                                    ? 'bg-green-500/10 border-2 border-green-500/50 text-green-400 scale-90 opacity-40 grayscale-[0.5]'
                                    : isSelected
                                        ? 'bg-primary-500/30 border-2 border-primary-500 text-white scale-105 shadow-2xl shadow-primary-500/40 z-10'
                                        : 'glass-effect border-white/5 text-gray-300 hover:bg-white/10 hover:border-primary-500/30 hover:-translate-y-1 hover:shadow-xl'
                                    }`}
                            >
                                <span className={`${card.type === 'term' ? 'text-lg md:text-xl font-black' : 'text-xs md:text-sm font-medium leading-relaxed'} line-clamp-4`}>
                                    {card.content}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {!isRunning && !isComplete && (
                    <div className="text-center animate-bounce mt-8">
                        <div className="inline-block px-8 py-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                            <p className="text-lg font-bold text-primary-400">👆 Chạm vào một thẻ để bắt đầu!</p>
                        </div>
                    </div>
                )}

                {isComplete && (
                    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                        <div className="glass-effect rounded-[3rem] p-12 max-w-md w-full text-center border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/50">
                                <span className="text-5xl">⚡</span>
                            </div>
                            <h2 className="text-4xl font-black text-white mb-2">Hoàn thành!</h2>
                            <div className="text-gray-400 font-medium mb-10">
                                <p className="mb-2">Thời gian của bạn:</p>
                                <p className="text-5xl font-black text-gradient-warning font-mono tracking-tighter">
                                    {formatTime(time)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={initializeGame}
                                    className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 transition-all"
                                >
                                    🔄 Chơi lại
                                </button>
                                <button
                                    onClick={onExit}
                                    className="w-full py-5 bg-gradient-primary rounded-2xl font-black text-xl text-white hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all"
                                >
                                    Thoát
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isRunning && !isComplete && (
                    <div className="text-center">
                        <button
                            onClick={initializeGame}
                            className="px-8 py-3 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-gray-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            🔄 Làm mới trò chơi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
