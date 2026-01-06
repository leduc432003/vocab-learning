import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export default function FlashcardsMode({ vocabulary, onUpdateStats, onToggleStar, onExit, theme, toggleTheme }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [cards, setCards] = useState([]);
    const [sessionDone, setSessionDone] = useState(false);
    const [status, setStatus] = useState(null);
    const [isStudying, setIsStudying] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);

    const handleStart = () => {
        if (cards.length === 0) return;

        if (isShuffle) {
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            setCards(shuffled);
        }
        setIsStudying(true);
    };

    useEffect(() => {
        const loadStatus = async () => {
            const counts = await storage.getStatusCounts();
            setStatus(counts);
            const dueCards = await storage.getDueWords();
            setCards(dueCards);
        };
        loadStatus();
    }, [vocabulary]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    };

    const renderExampleWithBold = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part && part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-primary-400 font-black not-italic">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    useEffect(() => {
        if (isStudying && !isFlipped && cards[currentIndex]) {
            speak(cards[currentIndex].term);
        }
    }, [currentIndex, isStudying, isFlipped]);

    const handleRate = async (rating) => {
        const currentCard = cards[currentIndex];
        await storage.updateSRS(currentCard.id, rating);

        // Update stats immediately for visual feedback
        const counts = await storage.getStatusCounts();
        setStatus(counts);

        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300);
        } else {
            setSessionDone(true);
        }
    };

    const handleKeyPress = (e) => {
        if (!isStudying || sessionDone) return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsFlipped(!isFlipped);
        }
        if (isFlipped) {
            if (e.key === '1') handleRate('again');
            if (e.key === '2') handleRate('hard');
            if (e.key === '3') handleRate('good');
            if (e.key === '4') handleRate('easy');
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isFlipped, currentIndex, sessionDone, isStudying]);

    if (!isStudying) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex items-center justify-center p-4 font-sans transition-colors duration-300">
                <div className="max-w-md w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative glass-effect rounded-[2.5rem] p-10 border border-gray-200 dark:border-white/10 shadow-2xl animate-fade-in text-center bg-white/80 dark:bg-white/5">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">English Deck</h1>

                        <div className="grid grid-cols-1 gap-4 mb-12">
                            <div className="flex justify-between items-center p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                                <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-widest">Từ mới</span>
                                <span className="text-blue-600 dark:text-blue-400 text-3xl font-black">{status?.notLearned || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                                <span className="text-amber-600 dark:text-amber-500 font-bold uppercase text-[10px] tracking-widest">Đang học</span>
                                <span className="text-amber-600 dark:text-amber-500 text-3xl font-black">{status?.learning || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-emerald-600 dark:text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Đến hạn</span>
                                <span className="text-emerald-600 dark:text-emerald-500 text-3xl font-black">{status?.due || 0}</span>
                            </div>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
                                <button
                                    onClick={() => setIsShuffle(false)}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!isShuffle ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Thường
                                </button>
                                <button
                                    onClick={() => setIsShuffle(true)}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${isShuffle ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Trộn thẻ
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleStart}
                            className={`w-full py-6 rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl ${cards.length > 0 ? 'bg-white text-black shadow-white/10' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {cards.length > 0 ? 'Học ngay' : 'Hôm nay đã học xong!'}
                        </button>

                        <button onClick={onExit} className="mt-8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-bold">
                            Để sau
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (sessionDone) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex items-center justify-center transition-colors duration-300">
                <div className="text-center animate-slide-up">
                    <div className="text-9xl mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">🏅</div>
                    <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Hoàn thành phiên học!</h2>
                    <p className="text-gray-500 mb-10 text-lg">Bạn đã hoàn thành các từ cần học hôm nay.</p>
                    <button onClick={onExit} className="px-12 py-5 bg-gradient-primary rounded-3xl font-black text-white text-lg hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.4)] transition-all">
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="h-[100dvh] bg-gray-50 dark:bg-[#020617] flex flex-col p-2 md:p-8 font-sans overflow-hidden transition-colors duration-300">
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col h-full">
                {/* Minimal Header - More compact on mobile */}
                <div className="flex items-center justify-between mb-4 md:mb-8">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsStudying(false)} className="px-3 py-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-bold text-sm transition-colors">
                            ← Thoát
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all text-sm"
                            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                    <div className="flex gap-3 md:gap-8 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 scale-90 md:scale-100 shadow-sm dark:shadow-none">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-tighter">Mới</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{status?.notLearned}</span>
                        </div>
                        <div className="h-3 w-px bg-gray-200 dark:bg-white/10 self-center"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Đang học</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{status?.learning}</span>
                        </div>
                        <div className="h-3 w-px bg-gray-200 dark:bg-white/10 self-center"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Đến hạn</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{status?.due}</span>
                        </div>
                    </div>
                </div>

                {/* Main Study Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 relative min-h-0">
                    <div className={`absolute w-[300px] h-[300px] rounded-full blur-[80px] transition-all duration-1000 opacity-10 ${isFlipped ? 'bg-indigo-600' : 'bg-primary-600'}`}></div>

                    <div
                        className="relative w-full max-w-2xl md:max-w-4xl h-full max-h-[75vh] md:max-h-[85vh] perspective-2000 cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* FRONT SIDE */}
                            <div className="absolute inset-0 backface-hidden">
                                <div className="h-full glass-effect rounded-[2.5rem] md:rounded-[3.5rem] border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center p-6 md:p-10 shadow-2xl relative overflow-hidden group bg-white dark:bg-white/5">
                                    {currentCard.image && (
                                        <div className="mb-6 md:mb-10 relative group-hover:scale-105 transition-transform duration-500">
                                            <div className="absolute -inset-4 bg-primary-500/20 blur-2xl rounded-full"></div>
                                            <img src={currentCard.image} alt="" className="w-28 h-28 md:w-56 md:h-56 object-cover rounded-3xl relative shadow-2xl border-2 border-white/10" />
                                        </div>
                                    )}

                                    <div className="text-center w-full max-w-full px-2">
                                        <div className="flex items-center justify-center gap-4 flex-wrap">
                                            <h2 className={`font-black text-gray-900 dark:text-white tracking-tighter leading-tight break-words max-w-full ${currentCard.term.length > 15 ? 'text-3xl md:text-6xl' :
                                                currentCard.term.length > 10 ? 'text-4xl md:text-7xl' :
                                                    'text-5xl md:text-8xl'
                                                }`}>
                                                {currentCard.term}
                                            </h2>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); speak(currentCard.term); }}
                                                className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-full flex items-center justify-center text-2xl md:text-3xl border border-gray-200 dark:border-white/10 transition-all hover:scale-110 active:scale-90 shrink-0"
                                            >
                                                🔊
                                            </button>
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-center gap-3 opacity-70">
                                            {currentCard.phonetic && <span className="text-lg md:text-2xl text-primary-500 dark:text-primary-400 font-medium italic">{currentCard.phonetic}</span>}
                                            {currentCard.type && <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] font-black text-gray-500 dark:text-white/50 uppercase tracking-widest">{currentCard.type}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BACK SIDE (Optimized for no-scroll on mobile) */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180">
                                <div className="h-full bg-white dark:bg-[#0a0c16] rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-gray-200 dark:border-white/20 flex flex-col p-5 md:p-8 shadow-2xl overflow-y-auto md:overflow-hidden custom-scrollbar transition-colors">
                                    <div className="w-full h-full flex flex-col justify-between space-y-4 md:space-y-4">
                                        {/* Header - Compact */}
                                        <div className="text-center space-y-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="text-lg md:text-lg text-gray-600 dark:text-gray-500 font-black uppercase tracking-[0.2em]">{currentCard.term}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); speak(currentCard.term); }}
                                                    className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-sm md:text-lg border border-gray-200 dark:border-white/10 transition-all active:scale-90"
                                                >
                                                    🔊
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {currentCard.phonetic && <span className="text-primary-600 dark:text-primary-400 font-bold italic text-base md:text-base">{currentCard.phonetic}</span>}
                                                {currentCard.type && <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{currentCard.type}</span>}
                                                {currentCard.level && <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{currentCard.level}</span>}
                                                {currentCard.topic && <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">#{currentCard.topic}</span>}
                                            </div>
                                        </div>

                                        {/* Definition - Key info */}
                                        <div className="text-center px-2 w-full max-w-full overflow-hidden">
                                            <h3 className={`font-black text-gray-900 dark:text-white leading-tight tracking-tight break-words ${currentCard.definition.length > 40 ? 'text-2xl md:text-2xl' :
                                                currentCard.definition.length > 20 ? 'text-3xl md:text-3xl' :
                                                    'text-4xl md:text-4xl'
                                                }`}>
                                                {currentCard.definition}
                                            </h3>
                                        </div>

                                        {/* Details Area - Scrollable & Spacious */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1">
                                            {currentCard.example && (
                                                <div className="border-l-2 border-primary-500/30 pl-4 py-1 text-left">
                                                    <span className="block text-primary-600 dark:text-primary-500/40 text-[8px] font-black uppercase tracking-widest mb-1.5">Ngữ cảnh & Ví dụ</span>
                                                    <p className="text-gray-700 dark:text-gray-300 italic text-base md:text-base leading-relaxed font-serif">
                                                        "{renderExampleWithBold(currentCard.example)}"
                                                    </p>
                                                    {currentCard.exampleDefinition && (
                                                        <p className="text-primary-700/80 dark:text-primary-400/80 font-medium text-xs md:text-sm mt-2 italic">
                                                            → {renderExampleWithBold(currentCard.exampleDefinition)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {currentCard.synonym && (
                                                    <div className="text-left">
                                                        <span className="block text-emerald-600 dark:text-emerald-500/40 text-[8px] font-black uppercase tracking-widest mb-1 border-b border-emerald-500/10 pb-1">Từ đồng nghĩa</span>
                                                        <div className="text-emerald-700 dark:text-emerald-400 font-bold text-base md:text-sm leading-relaxed">{currentCard.synonym}</div>
                                                    </div>
                                                )}
                                                {currentCard.antonym && (
                                                    <div className="text-left">
                                                        <span className="block text-rose-600 dark:text-rose-500/40 text-[8px] font-black uppercase tracking-widest mb-1 border-b border-rose-500/10 pb-1">Trái nghĩa</span>
                                                        <div className="text-rose-700 dark:text-rose-400 font-bold text-base md:text-sm leading-relaxed">{currentCard.antonym}</div>
                                                    </div>
                                                )}
                                                {currentCard.collocation && (
                                                    <div className="text-left md:col-span-2">
                                                        <span className="block text-amber-600 dark:text-amber-500/40 text-[8px] font-black uppercase tracking-widest mb-1 border-b border-amber-500/10 pb-1">Cụm từ đi kèm</span>
                                                        <div className="text-amber-700 dark:text-amber-400 font-bold text-base md:text-sm leading-relaxed">{currentCard.collocation}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {currentCard.note && (
                                                <div className="text-left p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 shrink-0">
                                                    <span className="block text-blue-600 dark:text-blue-500/40 text-[7px] md:text-[8px] font-black uppercase tracking-widest mb-1">Ghi chú</span>
                                                    <p className="text-blue-800 dark:text-blue-200/80 text-[10px] md:text-sm leading-tight line-clamp-2">{currentCard.note}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EVALUATION BAR - Very compact on mobile */}
                    <div className={`w-full max-w-2xl transition-all duration-700 delay-100 ${isFlipped ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                        <div className="grid grid-cols-4 gap-2 md:gap-4 px-1">
                            {[
                                { id: 'again', label: 'Again', color: 'rose', time: '<10m', key: '1', classes: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500' },
                                { id: 'hard', label: 'Hard', color: 'amber', time: '1d', key: '2', classes: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500' },
                                { id: 'good', label: 'Good', color: 'indigo', time: '3d', key: '3', classes: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-500' },
                                { id: 'easy', label: 'Easy', color: 'emerald', time: '7d', key: '4', classes: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500' }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={(e) => { e.stopPropagation(); handleRate(btn.id); }}
                                    className="group flex flex-col items-center gap-1.5"
                                >
                                    <div className={`w-full py-2 md:py-6 ${btn.classes} border rounded-xl md:rounded-[2rem] transition-all flex flex-col items-center shadow-lg active:scale-90 hover:bg-opacity-20`}>
                                        <span className="font-black text-[10px] md:text-xl uppercase tracking-tighter">{btn.label}</span>
                                        <span className="text-[6px] md:text-[9px] opacity-60 font-black uppercase tracking-widest">{btn.time}</span>
                                    </div>
                                    <div className="hidden md:block text-[10px] text-gray-700 font-black font-mono">{btn.key}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .perspective-2000 { perspective: 2000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
                .truncate-multiline-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}} />
        </div>
    );
}
