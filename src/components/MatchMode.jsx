import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function MatchMode({ vocabulary, onExit }) {
    const { t } = useTranslation();
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617] p-8">
                <div className="text-center max-w-md card-hover p-12 rounded-3xl animate-fade-in">
                    <div className="text-6xl mb-6">🎮</div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{t('match.needMore')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">{t('match.atLeastTwo')}</p>
                    <button
                        onClick={onExit}
                        className="w-full py-4 btn-primary rounded-xl font-bold shadow-lg"
                    >
                        {t('match.back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] p-4 md:p-8 font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-10">
                <button
                    onClick={onExit}
                    className="w-full md:w-auto px-6 py-3 glass-effect rounded-xl font-bold hover:bg-white/10 dark:hover:bg-white/10 transition-all text-gray-600 dark:text-gray-300"
                >
                    ← {t('match.exit')}
                </button>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="px-6 py-3 glass-effect rounded-xl flex-1 md:min-w-[150px] text-center md:text-left">
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-black tracking-widest block mb-1">{t('match.time')}</span>
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{formatTime(time)}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-8 md:mb-12 shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
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
                                    ? 'bg-emerald-100 dark:bg-emerald-900/20 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-400 scale-90 opacity-40'
                                    : isSelected
                                        ? 'bg-indigo-100 dark:bg-indigo-900/20 border-2 border-indigo-500 dark:border-indigo-400 text-white scale-105 shadow-xl shadow-indigo-500/40 z-10'
                                        : 'glass-effect border-white dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-indigo-500 dark:hover:border-indigo-400 hover:-translate-y-1 hover:shadow-xl'
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
                        <div className="inline-block px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full backdrop-blur-md">
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{t('match.startHint')}</p>
                        </div>
                    </div>
                )}

                {isComplete && (
                    <div className="fixed inset-0 bg-gray-950/80 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                        <div className="card-hover rounded-[3rem] p-12 max-w-md w-full text-center border border-white dark:border-white/10 shadow-xl animate-fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/40">
                                <span className="text-5xl">⚡</span>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{t('match.completed')}</h2>
                            <div className="text-gray-500 dark:text-gray-400 font-medium mb-10">
                                <p className="mb-2">{t('match.yourTime')}</p>
                                <p className="text-5xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tighter">
                                    {formatTime(time)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={initializeGame}
                                    className="w-full py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                                >
                                    {t('match.playAgain')}
                                </button>
                                <button
                                    onClick={onExit}
                                    className="w-full py-5 bg-gradient-primary rounded-2xl font-black text-xl text-white hover:shadow-2xl hover:shadow-indigo-600/40 hover:-translate-y-1 transition-all"
                                >
                                    {t('match.exit')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isRunning && !isComplete && (
                    <div className="text-center">
                        <button
                            onClick={initializeGame}
                            className="px-8 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-all uppercase tracking-widest"
                        >
                            {t('match.refresh')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
